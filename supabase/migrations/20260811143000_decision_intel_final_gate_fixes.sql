-- PR #1309 final Stage 0 first-slice gate fixes.
-- Additive correction only; no later Decision Intelligence stage is introduced.

-- A customer dossier must retain at least one accepted factual assertion. Verification,
-- publication classification, assessment and recommendation are insufficient when the
-- factual layer has been wholly rejected or superseded.
create or replace view public.intel_customer_event_dossiers
with (security_invoker = true)
as
select d.*
from public.intel_event_dossiers d
join public.intel_events e on e.id = d.id
where e.customer_visibility = 'intel'
  and exists (
    select 1
    from public.intel_event_assertions ea
    join public.intel_assertions ia on ia.id = ea.assertion_id
    where ea.event_id = e.id
      and ia.review_status in ('migrated_reviewed','verified')
  );

revoke all on public.intel_customer_event_dossiers from authenticated, anon;

-- The immutable assessment ledger is written only by the controlled assessment trigger.
-- The trigger function runs with owner privileges, while browser-authenticated staff may
-- read history but cannot forge/reserve arbitrary version rows.
create or replace function public.append_intel_assessment_version_on_write()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  next_version integer;
begin
  select coalesce(max(v.version), 0) + 1
    into next_version
    from public.intel_assessment_versions v
    where v.assessment_id = new.id;

  insert into public.intel_assessment_versions (assessment_id, version, snapshot, change_reason)
  values (
    new.id,
    next_version,
    jsonb_build_object(
      'what_happened', new.what_happened,
      'what_changed', new.what_changed,
      'why_it_matters', new.why_it_matters,
      'commercial_implications', new.commercial_implications,
      'regulatory_implications', new.regulatory_implications,
      'affected_entities', new.affected_entities,
      'affected_markets', new.affected_markets,
      'affected_products', new.affected_products,
      'why_now', new.why_now,
      'confidence', new.confidence,
      'confidence_rationale', new.confidence_rationale,
      'contradictions', new.contradictions,
      'unknowns', new.unknowns,
      'review_status', new.review_status,
      'updated_at', new.updated_at
    ),
    case when tg_op = 'INSERT' then 'Canonical assessment created' else 'Canonical assessment update' end
  );
  return new;
end;
$$;

revoke all on function public.append_intel_assessment_version_on_write() from public, anon, authenticated;
grant execute on function public.append_intel_assessment_version_on_write() to service_role;

drop policy if exists intel_assessment_versions_staff_insert on public.intel_assessment_versions;
revoke insert, update, delete on public.intel_assessment_versions from authenticated;
grant select on public.intel_assessment_versions to authenticated;

-- Route hydration returns only customer-safe routing metadata plus the canonical decision
-- posture required by scan-list cards. It remains service-role-only and never returns
-- evidence, assessment text, private review metadata, notes or storage paths.
drop function if exists api.resolve_intel_dashboard_routes(text[]);
create function api.resolve_intel_dashboard_routes(p_signal_ids text[])
returns table(
  signal_id text,
  event_id text,
  displayable boolean,
  recommendation_state text
)
language sql
stable
security definer
set search_path = pg_catalog, public, api
as $$
  select
    m.signal_id,
    m.event_id,
    d.id is not null as displayable,
    d.recommendation_state
  from public.intel_event_route_map m
  left join public.intel_customer_event_dossiers d on d.id = m.event_id
  where m.signal_id = any(coalesce(p_signal_ids, '{}'::text[]));
$$;

revoke all on function api.resolve_intel_dashboard_routes(text[]) from public, anon, authenticated;
grant execute on function api.resolve_intel_dashboard_routes(text[]) to service_role;
