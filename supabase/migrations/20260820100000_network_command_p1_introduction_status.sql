begin;

-- Network Command P1-A: controlled introduction status advancement.
-- P0 left status updates off the authenticated role on purpose.
-- This migration adds a security-definer advance function + transition matrix.
-- Members: limited early transitions only.
-- Staff (admin/operator/super_admin/compliance_reviewer): full pipeline.
-- No broad UPDATE grant is added for authenticated on network_introductions.

create or replace function public.hv_network_introduction_transition_allowed(
  p_from text,
  p_to text,
  p_is_staff boolean
) returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when p_from is null or p_to is null then false
    when p_from = p_to then false
    when p_from in ('converted', 'declined', 'expired', 'closed') then false
    when p_from = 'draft' and p_to in ('review', 'closed') then true
    when p_from = 'draft' and p_is_staff and p_to = 'declined' then true
    when p_from = 'review' and p_to = 'closed' then true
    when p_from = 'review' and p_is_staff and p_to in ('disclosure_pending', 'declined', 'closed') then true
    when p_from = 'disclosure_pending' and p_is_staff and p_to in ('consent_pending', 'declined', 'closed') then true
    when p_from = 'consent_pending' and p_is_staff and p_to in ('approved', 'declined', 'closed') then true
    when p_from = 'approved' and p_is_staff and p_to in ('introduced', 'declined', 'closed') then true
    when p_from = 'introduced' and p_is_staff and p_to in ('converted', 'closed') then true
    else false
  end;
$$;

revoke all on function public.hv_network_introduction_transition_allowed(text, text, boolean) from public, anon;
grant execute on function public.hv_network_introduction_transition_allowed(text, text, boolean) to authenticated, service_role;

create or replace function public.hv_network_advance_introduction(
  p_introduction_id uuid,
  p_to_status text,
  p_outcome text default null,
  p_detail jsonb default '{}'::jsonb
) returns public.network_introductions
language plpgsql
security definer
set search_path = ''
as $$
declare
  rec public.network_introductions;
  prior_status text;
  is_staff boolean;
  is_member boolean;
  cleaned_outcome text;
begin
  if p_to_status is null or length(btrim(p_to_status)) = 0 then
    raise exception 'NETWORK_INTRODUCTION_INVALID_STATUS';
  end if;

  select * into rec
  from public.network_introductions
  where id = p_introduction_id
  for update;

  if not found then
    raise exception 'NETWORK_INTRODUCTION_NOT_FOUND';
  end if;

  prior_status := rec.status;
  is_member := public.hv_network_active_workspace_member(rec.workspace_id);
  is_staff := public.hv_has_transaction_role(
    array['admin', 'operator', 'super_admin', 'compliance_reviewer']
  );

  if not (is_member or is_staff) then
    raise exception 'NETWORK_INTRODUCTION_FORBIDDEN';
  end if;

  if not public.hv_network_introduction_transition_allowed(prior_status, p_to_status, is_staff) then
    raise exception 'NETWORK_INTRODUCTION_INVALID_TRANSITION';
  end if;

  cleaned_outcome := nullif(btrim(coalesce(p_outcome, '')), '');
  if cleaned_outcome is not null and length(cleaned_outcome) > 1000 then
    raise exception 'NETWORK_INTRODUCTION_OUTCOME_TOO_LONG';
  end if;

  update public.network_introductions set
    status = p_to_status,
    outcome = coalesce(cleaned_outcome, outcome),
    introduced_at = case
      when p_to_status = 'introduced' and introduced_at is null then now()
      else introduced_at
    end,
    updated_at = now()
  where id = p_introduction_id
  returning * into rec;

  insert into public.network_introduction_events (
    introduction_id,
    workspace_id,
    actor_user_id,
    event_type,
    from_status,
    to_status,
    detail
  ) values (
    rec.id,
    rec.workspace_id,
    auth.uid(),
    'status_advanced',
    prior_status,
    p_to_status,
    coalesce(p_detail, '{}'::jsonb) || jsonb_build_object(
      'outcome', cleaned_outcome,
      'is_staff', is_staff
    )
  );

  return rec;
end;
$$;

revoke all on function public.hv_network_advance_introduction(uuid, text, text, jsonb) from public, anon;
grant execute on function public.hv_network_advance_introduction(uuid, text, text, jsonb) to authenticated, service_role;

comment on function public.hv_network_advance_introduction(uuid, text, text, jsonb) is
  'Controlled Network introduction status advancement. Validates membership or staff role, enforces transition matrix, writes audit event. Does not grant broad UPDATE on network_introductions.';

commit;
