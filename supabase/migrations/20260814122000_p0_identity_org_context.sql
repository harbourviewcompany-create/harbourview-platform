begin;

-- P0 identity / organization operating context.
-- workspaces + workspace_members remain the canonical organization/membership model.

alter table public.user_dashboard_preferences
  add column if not exists active_workspace_id uuid null references public.workspaces(id) on delete set null;

create index if not exists idx_user_dashboard_preferences_active_workspace
  on public.user_dashboard_preferences(active_workspace_id)
  where active_workspace_id is not null;

-- Preserve the legacy one-organization experience only when the sole active
-- membership belongs to an active workspace. New/explicit null values continue
-- to mean Personal operating mode.
with single_active_membership as (
  select wm.user_id, min(wm.workspace_id::text)::uuid as workspace_id
  from public.workspace_members wm
  join public.workspaces w on w.id = wm.workspace_id and w.status = 'active'
  where wm.status = 'active'
  group by wm.user_id
  having count(*) = 1
)
update public.user_dashboard_preferences p
set active_workspace_id = s.workspace_id,
    updated_at = now()
from single_active_membership s
where p.user_id = s.user_id
  and p.active_workspace_id is null;

-- Tighten direct preference writes so a user cannot select an organization
-- unless both the membership and the workspace itself are active. Null is the
-- explicit Personal state.
drop policy if exists "Users can insert their own dashboard preferences" on public.user_dashboard_preferences;
create policy "Users can insert their own dashboard preferences"
  on public.user_dashboard_preferences for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and (
      active_workspace_id is null
      or exists (
        select 1
        from public.workspace_members wm
        join public.workspaces w on w.id = wm.workspace_id
        where wm.workspace_id = active_workspace_id
          and wm.user_id = (select auth.uid())
          and wm.status = 'active'
          and w.status = 'active'
      )
    )
  );

drop policy if exists "Users can update their own dashboard preferences" on public.user_dashboard_preferences;
create policy "Users can update their own dashboard preferences"
  on public.user_dashboard_preferences for update
  to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (
      active_workspace_id is null
      or exists (
        select 1
        from public.workspace_members wm
        join public.workspaces w on w.id = wm.workspace_id
        where wm.workspace_id = active_workspace_id
          and wm.user_id = (select auth.uid())
          and wm.status = 'active'
          and w.status = 'active'
      )
    )
  );

-- CREATE OR REPLACE VIEW must preserve the ordinal/name contract of existing
-- columns. Append active_workspace_id after the existing seven columns so this
-- migration works both fresh and against the already-deployed API view.
create or replace view api.user_dashboard_preferences
with (security_invoker = true) as
select
  id,
  user_id,
  country_iso2,
  role_id,
  heatmap_layer,
  created_at,
  updated_at,
  active_workspace_id
from public.user_dashboard_preferences;

grant select, insert, update, delete on api.user_dashboard_preferences to authenticated;
grant select, insert, update, delete on api.user_dashboard_preferences to service_role;

-- Invitation transport only. workspace_members remains canonical after acceptance.
create table if not exists public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin','operator','analyst','viewer')),
  token_hash text not null unique,
  invited_by uuid not null references auth.users(id),
  status text not null default 'pending' check (status in ('pending','accepted','declined','revoked','expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create unique index if not exists workspace_invitations_one_pending_per_email
  on public.workspace_invitations(workspace_id, lower(email))
  where status = 'pending';

create index if not exists idx_workspace_invitations_email_status
  on public.workspace_invitations(lower(email), status, expires_at);

alter table public.workspace_invitations enable row level security;
revoke all on table public.workspace_invitations from public, anon, authenticated;
grant all on table public.workspace_invitations to service_role;

-- The production Data API exposes `api`, not `public`. Keep invitation transport
-- reachable only to the server-side service role through an invoker view; the
-- raw token hash is never granted to browser roles.
create or replace view api.workspace_invitations
with (security_invoker = true) as
select
  id,
  workspace_id,
  email,
  role,
  token_hash,
  invited_by,
  status,
  created_at,
  expires_at,
  accepted_at,
  accepted_by,
  updated_at
from public.workspace_invitations;

revoke all on api.workspace_invitations from public, anon, authenticated;
grant select, insert, update, delete on api.workspace_invitations to service_role;

-- Atomic invitation consumption. The invitation row is locked before any
-- membership mutation. Existing canonical membership roles are never replaced.
-- Inactive memberships require an explicit administrative reactivation path.
create or replace function api.accept_workspace_invitation(
  p_token_hash text,
  p_user_id uuid,
  p_user_email text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation record;
  existing_membership record;
  v_now timestamptz := now();
  normalized_email text := lower(trim(p_user_email));
begin
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' or normalized_email = '' then
    return jsonb_build_object('outcome', 'not_found');
  end if;

  select
    wi.id,
    wi.workspace_id,
    wi.email,
    wi.role,
    wi.status,
    wi.invited_by,
    wi.created_at,
    wi.expires_at,
    wi.accepted_by,
    w.status as workspace_status
  into invitation
  from public.workspace_invitations wi
  join public.workspaces w on w.id = wi.workspace_id
  where wi.token_hash = lower(p_token_hash)
  for update of wi;

  if not found then
    return jsonb_build_object('outcome', 'not_found');
  end if;

  if lower(trim(invitation.email)) <> normalized_email then
    return jsonb_build_object('outcome', 'email_mismatch');
  end if;

  if invitation.status = 'accepted' then
    select wm.role, wm.status
    into existing_membership
    from public.workspace_members wm
    where wm.workspace_id = invitation.workspace_id
      and wm.user_id = p_user_id;

    if invitation.accepted_by = p_user_id
       and existing_membership.status = 'active' then
      return jsonb_build_object(
        'outcome', 'already_accepted',
        'workspace_id', invitation.workspace_id,
        'role', existing_membership.role
      );
    end if;

    return jsonb_build_object('outcome', 'already_used');
  end if;

  if invitation.status <> 'pending' then
    return jsonb_build_object('outcome', invitation.status);
  end if;

  if invitation.expires_at <= v_now then
    update public.workspace_invitations
    set status = 'expired', updated_at = v_now
    where id = invitation.id and status = 'pending';
    return jsonb_build_object('outcome', 'expired');
  end if;

  if invitation.workspace_status <> 'active' then
    return jsonb_build_object('outcome', 'workspace_unavailable');
  end if;

  select wm.role, wm.status
  into existing_membership
  from public.workspace_members wm
  where wm.workspace_id = invitation.workspace_id
    and wm.user_id = p_user_id
  for update;

  if found then
    if existing_membership.status <> 'active' then
      return jsonb_build_object('outcome', 'existing_membership_inactive');
    end if;

    update public.workspace_invitations
    set status = 'accepted',
        accepted_at = v_now,
        accepted_by = p_user_id,
        updated_at = v_now
    where id = invitation.id and status = 'pending';

    if not found then
      return jsonb_build_object('outcome', 'already_used');
    end if;

    return jsonb_build_object(
      'outcome', 'already_member',
      'workspace_id', invitation.workspace_id,
      'role', existing_membership.role
    );
  end if;

  insert into public.workspace_members (
    workspace_id,
    user_id,
    role,
    status,
    invited_by,
    invited_at,
    joined_at
  ) values (
    invitation.workspace_id,
    p_user_id,
    invitation.role,
    'active',
    invitation.invited_by,
    invitation.created_at,
    v_now
  );

  update public.workspace_invitations
  set status = 'accepted',
      accepted_at = v_now,
      accepted_by = p_user_id,
      updated_at = v_now
  where id = invitation.id and status = 'pending';

  if not found then
    raise exception 'INVITATION_CONSUME_RACE';
  end if;

  return jsonb_build_object(
    'outcome', 'accepted',
    'workspace_id', invitation.workspace_id,
    'role', invitation.role
  );
end;
$$;

revoke all on function api.accept_workspace_invitation(text, uuid, text) from public, anon, authenticated;
grant execute on function api.accept_workspace_invitation(text, uuid, text) to service_role;

commit;
