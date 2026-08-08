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

-- Assessment versions are append-only, including for privileged application paths.
create or replace function public.prevent_intel_assessment_version_mutation()
returns trigger
language plpgsql
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

-- Product-tier reads never surface rejected/superseded assertions or recommendations.
drop policy if exists intel_assertion_evidence_tier_read on public.intel_assertion_evidence;
create policy intel_assertion_evidence_tier_read on public.intel_assertion_evidence
for select to authenticated
using (
  exists (
    select 1 from public.intel_assertions ia
    where ia.id = assertion_id
      and ia.review_status in ('migrated_reviewed','verified')
  )
  and exists (
    select 1 from public.user_profiles up
    where up.id = auth.uid() and up.tier in ('intel','operator')
  )
);

drop policy if exists intel_recommendations_tier_read on public.intel_recommendations;
create policy intel_recommendations_tier_read on public.intel_recommendations
for select to authenticated
using (
  review_status in ('needs_review','migrated_reviewed','verified')
  and exists (
    select 1 from public.user_profiles up
    where up.id = auth.uid() and up.tier in ('intel','operator')
  )
);

-- Rebuild the dossier projection through displayable assertions only and preserve
-- evidence relationship semantics so contradictory evidence cannot be presented as support.
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
  e.source_count,
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
group by e.id, a.id, r.id;

create or replace view api.intel_event_dossiers
with (security_invoker = true)
as select * from public.intel_event_dossiers;
grant select on api.intel_event_dossiers to authenticated;
revoke all on api.intel_event_dossiers from anon;
