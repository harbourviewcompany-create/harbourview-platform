-- Decision Intelligence Stage 0 review hardening.
-- Corrective additive migration for PR #1309; no later-stage schema is introduced.

-- One acquisition snapshot may legitimately yield multiple signals. Signal identity,
-- not snapshot identity, is the one-to-one legacy lineage key in slice 1.
drop index if exists public.intel_evidence_refs_snapshot_uq;

-- Preserve the upstream signal identifier as a durable tombstone key even if the
-- legacy signal is later deleted. The evidence reference remains linked to the
-- canonical assertion through intel_assertion_evidence.
alter table public.intel_evidence_refs
  drop constraint if exists intel_evidence_refs_source_signal_id_fkey;

-- Confidence values are probabilities at the canonical boundary.
alter table public.intel_assertions
  drop constraint if exists intel_assertions_confidence_probability_chk,
  add constraint intel_assertions_confidence_probability_chk
    check (confidence is null or (confidence >= 0 and confidence <= 1));

alter table public.intel_assessments
  drop constraint if exists intel_assessments_confidence_probability_chk,
  add constraint intel_assessments_confidence_probability_chk
    check (confidence is null or (confidence >= 0 and confidence <= 1));

-- migrated_reviewed is a backfill-only state, never a default for future events.
alter table public.intel_events alter column review_status set default 'needs_review';

-- One source-backed assertion has exactly one canonical event in slice 1. This makes
-- source-signal -> assertion -> event routing deterministic rather than relying on
-- arbitrary LIMIT 1 selection if an assertion is accidentally linked twice.
create unique index if not exists intel_event_assertions_assertion_uq
  on public.intel_event_assertions(assertion_id);

-- Mutable canonical records must advance their recency timestamp on staff edits.
-- public.set_updated_at() is the repository-wide trigger function established by the
-- dashboard-preferences foundation migration and present before this Stage-0 slice.
drop trigger if exists intel_assertions_updated_at on public.intel_assertions;
create trigger intel_assertions_updated_at
before update on public.intel_assertions
for each row execute function public.set_updated_at();

drop trigger if exists intel_events_updated_at on public.intel_events;
create trigger intel_events_updated_at
before update on public.intel_events
for each row execute function public.set_updated_at();

drop trigger if exists intel_assessments_updated_at on public.intel_assessments;
create trigger intel_assessments_updated_at
before update on public.intel_assessments
for each row execute function public.set_updated_at();

drop trigger if exists intel_recommendations_updated_at on public.intel_recommendations;
create trigger intel_recommendations_updated_at
before update on public.intel_recommendations
for each row execute function public.set_updated_at();

-- Recover canonical jurisdiction identity from Pipeline-B country_iso2 whenever
-- the canonical jurisdictions registry contains the corresponding identity. The
-- production registry may be temporarily empty; in that case this is deliberately
-- a no-op rather than fabricating jurisdiction rows or weakening the FK.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'signals' and column_name = 'country_iso2'
  ) then
    execute $sql$
      update public.intel_assertions a
      set jurisdiction_id = j.jurisdiction_id
      from public.signals s
      join public.jurisdictions j
        on upper(j.jurisdiction_id) = upper(nullif(s.country_iso2, ''))
      where a.source_signal_id = s.id
        and a.jurisdiction_id is null
    $sql$;

    update public.intel_events e
    set jurisdiction_id = x.jurisdiction_id
    from (
      select ea.event_id, min(a.jurisdiction_id) as jurisdiction_id
      from public.intel_event_assertions ea
      join public.intel_assertions a on a.id = ea.assertion_id
      where a.jurisdiction_id is not null
      group by ea.event_id
      having count(distinct a.jurisdiction_id) = 1
    ) x
    where x.event_id = e.id
      and e.jurisdiction_id is null;
  end if;
end $$;

-- Assessment versions are append-only, including for privileged application paths.
create or replace function public.prevent_intel_assessment_version_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  raise exception 'intel_assessment_versions is append-only';
end;
$$;

drop trigger if exists intel_assessment_versions_immutable on public.intel_assessment_versions;
create trigger intel_assessment_versions_immutable
before update or delete on public.intel_assessment_versions
for each row execute function public.prevent_intel_assessment_version_mutation();

drop policy if exists intel_assessment_versions_staff_all on public.intel_assessment_versions;
drop policy if exists intel_assessment_versions_staff_select on public.intel_assessment_versions;
drop policy if exists intel_assessment_versions_staff_insert on public.intel_assessment_versions;
create policy intel_assessment_versions_staff_select on public.intel_assessment_versions
for select to authenticated
using (exists (
  select 1 from public.user_roles ur
  where ur.user_id = auth.uid() and ur.role in ('admin','operator','analyst')
));
create policy intel_assessment_versions_staff_insert on public.intel_assessment_versions
for insert to authenticated
with check (exists (
  select 1 from public.user_roles ur
  where ur.user_id = auth.uid() and ur.role in ('admin','operator','analyst')
));
grant select, insert on public.intel_assessment_versions to authenticated;
revoke update, delete on public.intel_assessment_versions from authenticated;

-- Canonical base tables are staff objects. Remove the product-tier SELECT policies
-- from the original migration so Intel/operator customers cannot query canonical
-- rows directly through an exposed public schema. Staff keep the existing *_staff_all
-- RLS policies and receive the DML privileges those policies are intended to govern.
drop policy if exists intel_events_tier_read on public.intel_events;
drop policy if exists intel_event_assertions_tier_read on public.intel_event_assertions;
drop policy if exists intel_assertions_tier_read on public.intel_assertions;
drop policy if exists intel_assertion_evidence_tier_read on public.intel_assertion_evidence;
drop policy if exists intel_evidence_refs_tier_read on public.intel_evidence_refs;
drop policy if exists intel_assessments_tier_read on public.intel_assessments;
drop policy if exists intel_recommendations_tier_read on public.intel_recommendations;

grant select, insert, update, delete on
  public.intel_evidence_refs,
  public.intel_assertions,
  public.intel_assertion_evidence,
  public.intel_events,
  public.intel_event_assertions,
  public.intel_assessments,
  public.intel_recommendations
  to authenticated;

-- Rebuild the dossier projection through displayable event/assessment/recommendation
-- states and displayable assertions only. source_count is derived from that same
-- eligible evidence set so suppression cannot leave a stale corroboration count.
create or replace view public.intel_event_dossiers
with (security_invoker = true)
as
select
  e.id,
  e.headline,
  e.summary,
  e.event_type,
  e.jurisdiction_label,
  e.occurred_at,
  e.detected_at,
  e.effective_at,
  e.last_verified_at,
  e.materiality,
  e.consolidation_status,
  e.review_status,
  count(distinct coalesce(nullif(er.source_url,''), nullif(er.source_label,''), er.id::text))
    filter (
      where er.id is not null
        and er.access_classification = 'intel'
        and ia.review_status in ('migrated_reviewed','verified')
    )::integer as source_count,
  a.what_happened,
  a.what_changed,
  a.why_it_matters,
  a.commercial_implications,
  a.regulatory_implications,
  a.affected_entities,
  a.affected_markets,
  a.affected_products,
  a.why_now,
  a.confidence,
  a.confidence_rationale,
  a.contradictions,
  a.unknowns,
  r.recommendation_state,
  r.reasoning as recommendation_reasoning,
  r.action_summary,
  r.urgency,
  coalesce(jsonb_agg(distinct jsonb_build_object(
    'sourceLabel', er.source_label,
    'sourceUrl', er.source_url,
    'status', er.evidence_status,
    'observedAt', er.observed_at,
    'relationship', ae.relationship
  )) filter (
    where er.id is not null
      and er.access_classification = 'intel'
      and ia.review_status in ('migrated_reviewed','verified')
  ), '[]'::jsonb) as evidence
from public.intel_events e
join public.intel_assessments a
  on a.event_id = e.id
  and a.review_status in ('migrated_reviewed','verified')
join public.intel_recommendations r
  on r.assessment_id = a.id
  and r.review_status in ('needs_review','migrated_reviewed','verified')
left join public.intel_event_assertions ea on ea.event_id = e.id
left join public.intel_assertions ia on ia.id = ea.assertion_id
left join public.intel_assertion_evidence ae on ae.assertion_id = ia.id
left join public.intel_evidence_refs er on er.id = ae.evidence_ref_id
where e.review_status in ('migrated_reviewed','verified')
group by e.id, a.id, r.id;

-- The route map is canonical ownership, not a display-state projection. The unique
-- assertion constraint above guarantees one route per source-backed assertion.
create or replace view public.intel_event_route_map
with (security_invoker = true)
as
select distinct ia.source_signal_id as signal_id, ea.event_id
from public.intel_event_assertions ea
join public.intel_assertions ia on ia.id = ea.assertion_id
join public.intel_events e on e.id = ea.event_id
where ia.source_signal_id is not null;

-- Direct relation reads are not the customer execution boundary. Revoke the views
-- created by the original migration and expose narrowly-scoped SECURITY DEFINER RPCs
-- that enforce the existing Intel/operator product-tier check before returning only
-- the allowlisted dossier/route projection. Base-table RLS remains staff-only.
revoke all on public.intel_event_dossiers from authenticated, anon;
revoke all on public.intel_event_route_map from authenticated, anon;
revoke all on api.intel_event_dossiers from authenticated, anon;

create or replace view api.intel_event_route_map
with (security_invoker = true)
as select * from public.intel_event_route_map;
revoke all on api.intel_event_route_map from authenticated, anon;

create or replace function api.get_intel_event_dossier(p_event_id text)
returns setof public.intel_event_dossiers
language plpgsql
stable
security definer
set search_path = pg_catalog, public, api, auth
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.user_profiles up
    where up.id = auth.uid() and up.tier in ('intel','operator')
  ) then
    return;
  end if;

  return query
    select d.* from public.intel_event_dossiers d where d.id = p_event_id;
end;
$$;

create or replace function api.resolve_intel_event_route(p_signal_id text)
returns table(event_id text)
language plpgsql
stable
security definer
set search_path = pg_catalog, public, api, auth
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.user_profiles up
    where up.id = auth.uid() and up.tier in ('intel','operator')
  ) then
    return;
  end if;

  return query
    select m.event_id
    from public.intel_event_route_map m
    where m.signal_id = p_signal_id
       or (p_signal_id not like 'rs-%' and m.signal_id = 'rs-' || p_signal_id)
    order by case when m.signal_id = p_signal_id then 0 else 1 end
    limit 1;
end;
$$;

revoke all on function api.get_intel_event_dossier(text) from public, anon;
revoke all on function api.resolve_intel_event_route(text) from public, anon;
grant execute on function api.get_intel_event_dossier(text) to authenticated;
grant execute on function api.resolve_intel_event_route(text) to authenticated;
