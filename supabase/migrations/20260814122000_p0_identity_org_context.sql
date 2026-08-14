begin;

-- P0 identity / organization operating context.
-- workspaces + workspace_members remain the canonical organization/membership model.

alter table public.user_dashboard_preferences
  add column if not exists active_workspace_id uuid null references public.workspaces(id) on delete set null;

create index if not exists idx_user_dashboard_preferences_active_workspace
  on public.user_dashboard_preferences(active_workspace_id)
  where active_workspace_id is not null;

-- Preserve the legacy one-organization experience for existing preference rows.
-- New/explicit null values continue to mean Personal operating mode.
with single_active_membership as (
  select user_id, min(workspace_id::text)::uuid as workspace_id
  from public.workspace_members
  where status = 'active'
  group by user_id
  having count(*) = 1
)
update public.user_dashboard_preferences p
set active_workspace_id = s.workspace_id,
    updated_at = now()
from single_active_membership s
where p.user_id = s.user_id
  and p.active_workspace_id is null;

-- Tighten direct preference writes so a user cannot select an organization
-- unless they are an active member. Null is the explicit Personal state.
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
        where wm.workspace_id = active_workspace_id
          and wm.user_id = (select auth.uid())
          and wm.status = 'active'
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
        where wm.workspace_id = active_workspace_id
          and wm.user_id = (select auth.uid())
          and wm.status = 'active'
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

commit;
