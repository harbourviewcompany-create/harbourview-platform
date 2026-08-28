begin;

-- Network Command P0-P1 release hardening.
-- Production exposes both `public` and `api` through PostgREST. Harbourview
-- application clients are intentionally pinned to `api`, while base-table RLS
-- and grants remain authoritative for the exposed `public` schema.

-- Small API-schema bridge used by Network Command rendering so the UI can show
-- only lifecycle transitions that the current signed-in actor may actually use.
create or replace function api.hv_network_is_staff()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select
    auth.uid() is not null
    and public.hv_has_transaction_role(
      array['admin', 'operator', 'super_admin', 'compliance_reviewer']
    );
$$;

revoke all on function api.hv_network_is_staff() from public, anon;
grant execute on function api.hv_network_is_staff() to authenticated, service_role;

-- Keep the original P1 transition function authoritative. The app's Supabase
-- client is pinned to `api`, so this invoker wrapper only transports the call;
-- public.hv_network_advance_introduction still performs membership/staff checks,
-- transition validation, row locking, update, and audit-event creation.
create or replace function api.hv_network_advance_introduction(
  p_introduction_id uuid,
  p_to_status text,
  p_outcome text default null,
  p_detail jsonb default '{}'::jsonb
) returns public.network_introductions
language sql
security invoker
set search_path = ''
as $$
  select public.hv_network_advance_introduction(
    p_introduction_id,
    p_to_status,
    p_outcome,
    coalesce(p_detail, '{}'::jsonb)
  );
$$;

revoke all on function api.hv_network_advance_introduction(uuid, text, text, jsonb) from public, anon;
grant execute on function api.hv_network_advance_introduction(uuid, text, text, jsonb) to authenticated, service_role;

-- Atomic introduction request. This SECURITY DEFINER function intentionally
-- bypasses table RLS only after reproducing the authoritative authorization and
-- linkage checks inside the function. It inserts both the lifecycle object and
-- its immutable initial audit event in the same transaction.
create or replace function api.hv_network_request_introduction(
  p_workspace_id uuid,
  p_reason text,
  p_requested_disclosure_scope text default 'identity_and_business_context',
  p_mission_id uuid default null,
  p_target_entity_id uuid default null,
  p_target_source_kind text default null,
  p_target_source_id text default null
) returns public.network_introductions
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := auth.uid();
  cleaned_reason text := btrim(coalesce(p_reason, ''));
  cleaned_scope text := btrim(coalesce(p_requested_disclosure_scope, ''));
  cleaned_source_kind text := nullif(btrim(coalesce(p_target_source_kind, '')), '');
  cleaned_source_id text := nullif(btrim(coalesce(p_target_source_id, '')), '');
  rec public.network_introductions;
begin
  if actor_user_id is null then
    raise exception 'NETWORK_INTRODUCTION_UNAUTHENTICATED';
  end if;

  if p_workspace_id is null
     or not public.hv_network_active_workspace_member(p_workspace_id) then
    raise exception 'NETWORK_INTRODUCTION_FORBIDDEN';
  end if;

  if length(cleaned_reason) < 1 or length(cleaned_reason) > 2000 then
    raise exception 'NETWORK_INTRODUCTION_INVALID_REASON';
  end if;

  if length(cleaned_scope) < 1 or length(cleaned_scope) > 160 then
    raise exception 'NETWORK_INTRODUCTION_INVALID_DISCLOSURE_SCOPE';
  end if;

  if cleaned_source_kind is not null and length(cleaned_source_kind) > 80 then
    raise exception 'NETWORK_INTRODUCTION_INVALID_SOURCE_KIND';
  end if;
  if cleaned_source_id is not null and length(cleaned_source_id) > 240 then
    raise exception 'NETWORK_INTRODUCTION_INVALID_SOURCE_ID';
  end if;
  if (cleaned_source_kind is null) <> (cleaned_source_id is null) then
    raise exception 'NETWORK_INTRODUCTION_INVALID_TARGET';
  end if;
  if p_target_entity_id is null and cleaned_source_kind is null then
    raise exception 'NETWORK_INTRODUCTION_INVALID_TARGET';
  end if;

  if p_mission_id is not null and not exists (
    select 1
    from public.network_missions m
    where m.id = p_mission_id
      and m.workspace_id = p_workspace_id
  ) then
    raise exception 'NETWORK_MISSION_WORKSPACE_MISMATCH';
  end if;

  if p_target_entity_id is not null and not exists (
    select 1 from public.entities e where e.id = p_target_entity_id
  ) then
    raise exception 'NETWORK_INTRODUCTION_TARGET_NOT_FOUND';
  end if;

  -- If the source record already has an authoritative resolved entity bridge,
  -- callers may not pair it with a conflicting canonical entity id.
  if p_target_entity_id is not null and cleaned_source_kind is not null and exists (
    select 1
    from public.network_source_entity_links l
    where l.source_kind = cleaned_source_kind
      and l.source_id = cleaned_source_id
      and l.resolution_status = 'resolved'
      and l.entity_id is distinct from p_target_entity_id
  ) then
    raise exception 'NETWORK_INTRODUCTION_TARGET_MISMATCH';
  end if;

  insert into public.network_introductions (
    workspace_id,
    mission_id,
    requester_user_id,
    target_entity_id,
    target_source_kind,
    target_source_id,
    reason,
    requested_disclosure_scope,
    status,
    consent_required
  ) values (
    p_workspace_id,
    p_mission_id,
    actor_user_id,
    p_target_entity_id,
    cleaned_source_kind,
    cleaned_source_id,
    cleaned_reason,
    cleaned_scope,
    'review',
    true
  )
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
    actor_user_id,
    'requested',
    null,
    'review',
    jsonb_build_object('requested_disclosure_scope', cleaned_scope)
  );

  return rec;
end;
$$;

revoke all on function api.hv_network_request_introduction(uuid, text, text, uuid, uuid, text, text) from public, anon;
grant execute on function api.hv_network_request_introduction(uuid, text, text, uuid, uuid, text, text) to authenticated, service_role;

-- Direct authenticated creation is removed from both exposed schemas. The only
-- authenticated creation path is the atomic RPC above; service_role remains
-- available for controlled server/admin operations.
revoke insert on table public.network_introductions from authenticated;
revoke insert on table public.network_introduction_events from authenticated;
revoke insert on api.network_introductions from authenticated;
revoke insert on api.network_introduction_events from authenticated;

drop policy if exists network_introductions_member_insert on public.network_introductions;
drop policy if exists network_introduction_events_member_insert on public.network_introduction_events;

-- Atomic mission + requirements creation. Direct mission editing remains under
-- its existing RLS contract, but the customer create flow can no longer leave
-- an archived partial mission when a requirement fails.
create or replace function api.hv_network_create_mission(
  p_workspace_id uuid,
  p_name text,
  p_objective text,
  p_country_iso2 text default null,
  p_target_country_iso2s text[] default '{}'::text[],
  p_target_date date default null,
  p_confidentiality text default 'workspace',
  p_requirements jsonb default '[]'::jsonb
) returns public.network_missions
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := auth.uid();
  cleaned_name text := btrim(coalesce(p_name, ''));
  cleaned_objective text := btrim(coalesce(p_objective, ''));
  cleaned_country text := nullif(upper(btrim(coalesce(p_country_iso2, ''))), '');
  cleaned_targets text[] := coalesce(p_target_country_iso2s, '{}'::text[]);
  cleaned_confidentiality text := btrim(coalesce(p_confidentiality, 'workspace'));
  rec public.network_missions;
  requirement jsonb;
  requirement_type text;
  requirement_label text;
  requirement_description text;
  capability_code text;
  licence_activity text;
  requirement_country text;
  expected_value jsonb;
  hard_requirement boolean;
  idx integer := 0;
begin
  if actor_user_id is null then
    raise exception 'NETWORK_MISSION_UNAUTHENTICATED';
  end if;

  if p_workspace_id is null
     or not public.hv_network_active_workspace_member(p_workspace_id) then
    raise exception 'NETWORK_MISSION_FORBIDDEN';
  end if;

  if length(cleaned_name) < 1 or length(cleaned_name) > 160 then
    raise exception 'NETWORK_MISSION_INVALID_NAME';
  end if;
  if length(cleaned_objective) < 1 or length(cleaned_objective) > 2000 then
    raise exception 'NETWORK_MISSION_INVALID_OBJECTIVE';
  end if;
  if cleaned_country is not null and cleaned_country !~ '^[A-Z]{2}$' then
    raise exception 'NETWORK_MISSION_INVALID_COUNTRY';
  end if;
  if cardinality(cleaned_targets) > 30
     or exists (select 1 from unnest(cleaned_targets) value where upper(btrim(value)) !~ '^[A-Z]{2}$') then
    raise exception 'NETWORK_MISSION_INVALID_TARGET_COUNTRY';
  end if;
  cleaned_targets := array(
    select upper(btrim(value)) from unnest(cleaned_targets) value
  );
  if cleaned_confidentiality not in ('workspace', 'restricted') then
    raise exception 'NETWORK_MISSION_INVALID_CONFIDENTIALITY';
  end if;
  if p_requirements is null or jsonb_typeof(p_requirements) <> 'array'
     or jsonb_array_length(p_requirements) > 50 then
    raise exception 'NETWORK_MISSION_INVALID_REQUIREMENTS';
  end if;

  insert into public.network_missions (
    workspace_id,
    created_by,
    name,
    objective,
    status,
    country_iso2,
    target_country_iso2s,
    target_date,
    confidentiality
  ) values (
    p_workspace_id,
    actor_user_id,
    cleaned_name,
    cleaned_objective,
    'active',
    cleaned_country,
    cleaned_targets,
    p_target_date,
    cleaned_confidentiality
  )
  returning * into rec;

  for requirement in select value from jsonb_array_elements(p_requirements)
  loop
    if jsonb_typeof(requirement) <> 'object' then
      raise exception 'NETWORK_MISSION_INVALID_REQUIREMENT';
    end if;

    requirement_type := btrim(coalesce(requirement->>'requirementType', ''));
    requirement_label := btrim(coalesce(requirement->>'label', ''));
    requirement_description := nullif(btrim(coalesce(requirement->>'description', '')), '');
    capability_code := nullif(btrim(coalesce(requirement->>'capabilityCode', '')), '');
    licence_activity := nullif(btrim(coalesce(requirement->>'licenceActivity', '')), '');
    requirement_country := nullif(upper(btrim(coalesce(requirement->>'countryIso2', ''))), '');
    expected_value := coalesce(requirement->'expectedValue', '{}'::jsonb);
    hard_requirement := case
      when requirement ? 'hardRequirement' then (requirement->>'hardRequirement')::boolean
      else true
    end;

    if length(requirement_type) < 1 or length(requirement_type) > 80
       or length(requirement_label) < 1 or length(requirement_label) > 240
       or (requirement_description is not null and length(requirement_description) > 2000)
       or (capability_code is not null and length(capability_code) > 120)
       or (licence_activity is not null and length(licence_activity) > 160)
       or (requirement_country is not null and requirement_country !~ '^[A-Z]{2}$')
       or jsonb_typeof(expected_value) <> 'object' then
      raise exception 'NETWORK_MISSION_INVALID_REQUIREMENT';
    end if;

    insert into public.network_mission_requirements (
      mission_id,
      created_by,
      requirement_type,
      label,
      description,
      hard_requirement,
      capability_code,
      licence_activity,
      country_iso2,
      expected_value,
      status,
      sort_order
    ) values (
      rec.id,
      actor_user_id,
      requirement_type,
      requirement_label,
      requirement_description,
      hard_requirement,
      capability_code,
      licence_activity,
      requirement_country,
      expected_value,
      'active',
      idx
    );

    idx := idx + 1;
  end loop;

  return rec;
end;
$$;

revoke all on function api.hv_network_create_mission(uuid, text, text, text, text[], date, text, jsonb) from public, anon;
grant execute on function api.hv_network_create_mission(uuid, text, text, text, text[], date, text, jsonb) to authenticated, service_role;

comment on function api.hv_network_request_introduction(uuid, text, text, uuid, uuid, text, text) is
  'Atomic authenticated Network introduction request. Enforces active workspace membership, validates linked mission/target, writes one review-state introduction and its requested event together.';
comment on function api.hv_network_create_mission(uuid, text, text, text, text[], date, text, jsonb) is
  'Atomic authenticated Network mission plus requirement creation with active-workspace authorization.';

commit;
