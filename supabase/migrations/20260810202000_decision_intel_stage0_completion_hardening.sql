-- Decision Intelligence Stage 0 completion hardening for PR #1309.
-- First-slice only: publication boundary, upstream withdrawal propagation,
-- dashboard route eligibility, canonical jurisdiction navigation, and complete initial assessment history.

-- Verification and customer publication are separate decisions. Backfilled events were
-- already customer-surfaceable Pipeline-B signals, so they receive the first-slice
-- customer classification explicitly. Future events default to internal.
alter table public.intel_events
  add column if not exists customer_visibility text not null default 'internal';

alter table public.intel_events
  drop constraint if exists intel_events_customer_visibility_chk,
  add constraint intel_events_customer_visibility_chk
    check (customer_visibility in ('internal','intel'));

update public.intel_events e
set customer_visibility = 'intel'
where customer_visibility = 'internal'
  and exists (
    select 1
    from public.signals s
    where s.id = e.canonical_signal_id
      and s.reviewed = true
      and (s.action is null or s.action <> 'rejected')
      and coalesce(s.quality_label,'') not in ('spam','boilerplate','nav','duplicate')
      and (s.content_type is null or s.content_type not in ('story','research','noise'))
  );

-- Append stable canonical jurisdiction navigation metadata to the already allowlisted
-- dossier projection. The ISO-2 value comes only from the authoritative cross-reference
-- attached to the event's canonical jurisdiction ID; unresolved events remain unlinked.
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
  case
    when e.review_status = 'needs_review' or a.review_status = 'needs_review' or r.review_status = 'needs_review' then 'needs_review'
    when e.review_status = 'migrated_reviewed' or a.review_status = 'migrated_reviewed' or r.review_status = 'migrated_reviewed' then 'migrated_reviewed'
    when e.review_status = 'verified' and a.review_status = 'verified' and r.review_status = 'verified' then 'verified'
    else 'needs_review'
  end as review_status,
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
    'relationship', case when ea.role = 'contradicting' then 'contradicts' else ae.relationship end
  )) filter (
    where er.id is not null
      and er.access_classification = 'intel'
      and ia.review_status in ('migrated_reviewed','verified')
  ), '[]'::jsonb) as evidence,
  e.jurisdiction_id,
  max(jx.canonical_iso2) as jurisdiction_iso2
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
left join public.jurisdiction_crossref jx on jx.jurisdictions_id = e.jurisdiction_id
where e.review_status in ('migrated_reviewed','verified')
  and e.consolidation_status <> 'superseded'
group by e.id, a.id, r.id;

-- Customer-safe dossiers are an explicit publication projection over the already
-- allowlisted dossier shape. Verified internal analysis remains internal. A customer
-- dossier must also retain at least one accepted factual assertion; publication and
-- verification never substitute for an accepted factual basis.
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

-- Product dossier reads now use the explicit customer-publication projection.
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
    select d.* from public.intel_customer_event_dossiers d where d.id = p_event_id;
end;
$$;

revoke all on function api.get_intel_event_dossier(text) from public, anon;
grant execute on function api.get_intel_event_dossier(text) to authenticated;

-- Dashboard route hydration runs only on the server. Return canonical ownership,
-- customer displayability and the current canonical recommendation posture. No evidence,
-- assessment prose, private notes or canonical review metadata cross this boundary.
drop function if exists api.resolve_intel_dashboard_routes(text[]);
create function api.resolve_intel_dashboard_routes(p_signal_ids text[])
returns table(signal_id text, event_id text, displayable boolean, recommendation_state text)
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

-- The immutable assessment ledger is written only by the controlled assessment trigger.
-- Browser-authenticated staff may read history but cannot forge/reserve arbitrary version
-- rows. SECURITY DEFINER is restricted to trigger/service execution.
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

-- Upstream surfaceability is authoritative for migrated lineage. If a source signal is
-- withdrawn/rejected/unreviewed/reclassified out of the first-slice corpus, suppress
-- the entire affected canonical decision chain and require explicit review/publication
-- before it can ever be customer-visible again.
create or replace function public.suppress_intel_chain_for_withdrawn_signal()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_signal_id text;
  v_withdrawn boolean := false;
begin
  if tg_op = 'DELETE' then
    v_signal_id := old.id;
    v_withdrawn := true;
  else
    v_signal_id := new.id;
    v_withdrawn := not (
      new.reviewed = true
      and (new.action is null or new.action <> 'rejected')
      and coalesce(new.quality_label,'') not in ('spam','boilerplate','nav','duplicate')
      and (new.content_type is null or new.content_type not in ('story','research','noise'))
    );
  end if;

  if not v_withdrawn then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  update public.intel_assertions a
  set review_status = 'needs_review'
  where a.source_signal_id = v_signal_id
    and a.review_status in ('migrated_reviewed','verified');

  update public.intel_events e
  set review_status = 'needs_review',
      customer_visibility = 'internal'
  where e.id in (
    select ea.event_id
    from public.intel_event_assertions ea
    join public.intel_assertions a on a.id = ea.assertion_id
    where a.source_signal_id = v_signal_id
  )
    and (e.review_status in ('migrated_reviewed','verified') or e.customer_visibility <> 'internal');

  update public.intel_assessments a
  set review_status = 'needs_review'
  where a.event_id in (
    select ea.event_id
    from public.intel_event_assertions ea
    join public.intel_assertions ia on ia.id = ea.assertion_id
    where ia.source_signal_id = v_signal_id
  )
    and a.review_status in ('migrated_reviewed','verified');

  update public.intel_recommendations r
  set review_status = 'needs_review'
  where r.assessment_id in (
    select a.id
    from public.intel_assessments a
    where a.event_id in (
      select ea.event_id
      from public.intel_event_assertions ea
      join public.intel_assertions ia on ia.id = ea.assertion_id
      where ia.source_signal_id = v_signal_id
    )
  )
    and r.review_status in ('migrated_reviewed','verified');

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function public.suppress_intel_chain_for_withdrawn_signal() from public, anon, authenticated;
grant execute on function public.suppress_intel_chain_for_withdrawn_signal() to service_role;

-- AFTER triggers ensure the public signal transition succeeds first; canonical
-- suppression then happens in the same transaction.
drop trigger if exists signals_decision_intel_withdrawal_update on public.signals;
create trigger signals_decision_intel_withdrawal_update
after update of reviewed, action, quality_label, content_type on public.signals
for each row execute function public.suppress_intel_chain_for_withdrawn_signal();

drop trigger if exists signals_decision_intel_withdrawal_delete on public.signals;
create trigger signals_decision_intel_withdrawal_delete
after delete on public.signals
for each row execute function public.suppress_intel_chain_for_withdrawn_signal();

-- Repair migration-created version 1 snapshots to the same complete canonical field
-- contract used by every subsequent version. Because this PR has not been activated in
-- production, the migration chain reaches a complete immutable ledger before release.
drop trigger if exists intel_assessment_versions_immutable on public.intel_assessment_versions;

update public.intel_assessment_versions v
set snapshot = jsonb_build_object(
  'what_happened', a.what_happened,
  'what_changed', a.what_changed,
  'why_it_matters', a.why_it_matters,
  'commercial_implications', a.commercial_implications,
  'regulatory_implications', a.regulatory_implications,
  'affected_entities', a.affected_entities,
  'affected_markets', a.affected_markets,
  'affected_products', a.affected_products,
  'why_now', a.why_now,
  'confidence', a.confidence,
  'confidence_rationale', a.confidence_rationale,
  'contradictions', a.contradictions,
  'unknowns', a.unknowns,
  'review_status', a.review_status,
  'updated_at', a.updated_at
)
from public.intel_assessments a
where v.assessment_id = a.id
  and v.version = 1
  and v.change_reason = 'Stage 0 migration from reviewed/surfaceable Pipeline B signal';

create trigger intel_assessment_versions_immutable
before update or delete on public.intel_assessment_versions
for each row execute function public.prevent_intel_assessment_version_mutation();
