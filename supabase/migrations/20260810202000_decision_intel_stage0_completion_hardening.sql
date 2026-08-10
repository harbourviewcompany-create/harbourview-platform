-- Decision Intelligence Stage 0 completion hardening for PR #1309.
-- First-slice only: publication boundary, upstream withdrawal propagation,
-- dashboard route eligibility, and complete initial assessment history.

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

-- Customer-safe dossiers are an explicit publication projection over the already
-- allowlisted dossier shape. Verified internal analysis remains internal.
create or replace view public.intel_customer_event_dossiers
with (security_invoker = true)
as
select d.*
from public.intel_event_dossiers d
join public.intel_events e on e.id = d.id
where e.customer_visibility = 'intel';

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

-- Dashboard route hydration runs only on the server. Return canonical ownership plus
-- whether that owned event is currently customer-displayable. This lets the UI keep
-- legacy/IA compatibility for unowned rows without resurrecting suppressed canonical
-- intelligence as a synthetic event:<signal-id> link.
create or replace function api.resolve_intel_dashboard_routes(p_signal_ids text[])
returns table(signal_id text, event_id text, displayable boolean)
language sql
stable
security definer
set search_path = pg_catalog, public, api
as $$
  select
    m.signal_id,
    m.event_id,
    exists (
      select 1 from public.intel_customer_event_dossiers d where d.id = m.event_id
    ) as displayable
  from public.intel_event_route_map m
  where m.signal_id = any(coalesce(p_signal_ids, '{}'::text[]));
$$;

revoke all on function api.resolve_intel_dashboard_routes(text[]) from public, anon, authenticated;
grant execute on function api.resolve_intel_dashboard_routes(text[]) to service_role;

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
