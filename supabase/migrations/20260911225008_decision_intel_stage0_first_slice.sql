-- Harbourview Decision Intelligence OS — Stage 0 / first production slice
-- Additive only. Existing signals/Pipeline B remain upstream.

create extension if not exists pgcrypto;

create table if not exists public.intel_evidence_refs (
  id uuid primary key default gen_random_uuid(),
  source_signal_id text references public.signals(id) on delete set null,
  source_snapshot_id uuid references public.source_snapshots(id) on delete restrict,
  hv_evidence_id uuid references public.hv_evidence(id) on delete restrict,
  source_registry_id uuid references public.source_registry(id) on delete set null,
  source_label text,
  source_url text,
  evidence_kind text not null default 'source_snapshot' check (evidence_kind in ('source_snapshot','hv_evidence','legacy_signal')),
  evidence_status text not null default 'needs_review' check (evidence_status in ('needs_review','partially_verified','verified','conflicting','stale')),
  access_classification text not null default 'internal' check (access_classification in ('internal','intel')),
  observed_at timestamptz,
  created_at timestamptz not null default now(),
  check (source_signal_id is not null or source_snapshot_id is not null or hv_evidence_id is not null)
);
-- Snapshot identity is deliberately not unique: one acquisition snapshot may yield
-- multiple reviewed signals. Signal identity is the one-to-one legacy lineage key.
create unique index if not exists intel_evidence_refs_signal_uq on public.intel_evidence_refs(source_signal_id) where source_signal_id is not null;

create table if not exists public.intel_assertions (
  id uuid primary key default gen_random_uuid(),
  assertion_type text not null default 'development',
  statement text not null,
  jurisdiction_id text references public.jurisdictions(jurisdiction_id) on delete set null,
  source_signal_id text references public.signals(id) on delete set null,
  confidence numeric(5,4),
  review_status text not null default 'needs_review' check (review_status in ('needs_review','migrated_reviewed','verified','rejected','superseded')),
  valid_from timestamptz,
  valid_to timestamptz,
  observed_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists intel_assertions_source_signal_uq on public.intel_assertions(source_signal_id) where source_signal_id is not null;

create table if not exists public.intel_assertion_evidence (
  assertion_id uuid not null references public.intel_assertions(id) on delete cascade,
  evidence_ref_id uuid not null references public.intel_evidence_refs(id) on delete restrict,
  relationship text not null default 'supports' check (relationship in ('supports','contradicts','clarifies','supersedes','background')),
  created_at timestamptz not null default now(),
  primary key (assertion_id, evidence_ref_id, relationship)
);

create table if not exists public.intel_events (
  id text primary key,
  canonical_signal_id text references public.signals(id) on delete set null,
  event_type text not null default 'development',
  headline text not null,
  summary text,
  jurisdiction_id text references public.jurisdictions(jurisdiction_id) on delete set null,
  jurisdiction_label text,
  occurred_at timestamptz,
  detected_at timestamptz,
  effective_at timestamptz,
  last_verified_at timestamptz,
  materiality text not null default 'medium' check (materiality in ('low','medium','high','critical')),
  consolidation_status text not null default 'candidate' check (consolidation_status in ('candidate','reviewed','confirmed','split','superseded')),
  review_status text not null default 'migrated_reviewed' check (review_status in ('needs_review','migrated_reviewed','verified','rejected','superseded')),
  source_count integer not null default 1 check (source_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.intel_event_assertions (
  event_id text not null references public.intel_events(id) on delete cascade,
  assertion_id uuid not null references public.intel_assertions(id) on delete restrict,
  role text not null default 'core' check (role in ('core','supporting','contradicting','context')),
  created_at timestamptz not null default now(),
  primary key (event_id, assertion_id)
);

create table if not exists public.intel_assessments (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique references public.intel_events(id) on delete cascade,
  what_happened text not null,
  what_changed text,
  why_it_matters text,
  commercial_implications text,
  regulatory_implications text,
  affected_entities text[] not null default '{}',
  affected_markets text[] not null default '{}',
  affected_products text[] not null default '{}',
  why_now text,
  confidence numeric(5,4),
  confidence_rationale text,
  contradictions text[] not null default '{}',
  unknowns text[] not null default '{}',
  review_status text not null default 'needs_review' check (review_status in ('needs_review','migrated_reviewed','verified','rejected','superseded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.intel_assessment_versions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.intel_assessments(id) on delete cascade,
  version integer not null,
  snapshot jsonb not null,
  change_reason text,
  created_at timestamptz not null default now(),
  unique (assessment_id, version)
);

create table if not exists public.intel_recommendations (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null unique references public.intel_assessments(id) on delete cascade,
  recommendation_state text not null check (recommendation_state in ('act_now','investigate','monitor','no_action')),
  reasoning text not null,
  why_now text,
  action_summary text,
  urgency text not null default 'normal' check (urgency in ('low','normal','high','urgent')),
  review_status text not null default 'needs_review' check (review_status in ('needs_review','migrated_reviewed','verified','rejected','superseded')),
  review_due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Canonical base objects remain internal/staff-readable. Product users consume the allowlisted projection below.
alter table public.intel_evidence_refs enable row level security;
alter table public.intel_assertions enable row level security;
alter table public.intel_assertion_evidence enable row level security;
alter table public.intel_events enable row level security;
alter table public.intel_event_assertions enable row level security;
alter table public.intel_assessments enable row level security;
alter table public.intel_assessment_versions enable row level security;
alter table public.intel_recommendations enable row level security;

do $$
declare t text;
begin
  foreach t in array array['intel_evidence_refs','intel_assertions','intel_assertion_evidence','intel_events','intel_event_assertions','intel_assessments','intel_assessment_versions','intel_recommendations'] loop
    execute format('drop policy if exists %I_staff_all on public.%I', t, t);
    execute format($p$
      create policy %I_staff_all on public.%I for all
      using (exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role in ('admin','operator','analyst')))
      with check (exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role in ('admin','operator','analyst')))
    $p$, t, t);
  end loop;
end $$;

-- Seed a thin evidence reference from the existing acquisition estate. No raw evidence is copied.
-- source_signal_id is retained even when there is no snapshot so legacy provenance cannot cross-link
-- unrelated signals that happen to share a publisher or a null URL.
insert into public.intel_evidence_refs (source_signal_id, source_snapshot_id, source_registry_id, source_label, source_url, evidence_kind, evidence_status, access_classification, observed_at)
select
  s.id,
  s.snapshot_id,
  ss.source_id,
  nullif(s.source,''),
  nullif(s.url,''),
  case when s.snapshot_id is null then 'legacy_signal' else 'source_snapshot' end,
  'needs_review',
  'intel',
  coalesce(s.date, s.created_at)
from public.signals s
left join public.source_snapshots ss on ss.id = s.snapshot_id
where s.reviewed = true
  and (s.action is null or s.action <> 'rejected')
  and coalesce(s.quality_label,'') not in ('spam','boilerplate','nav','duplicate')
  and (s.content_type is null or s.content_type not in ('story','research','noise'))
on conflict (source_signal_id) where source_signal_id is not null do nothing;

-- One migrated assertion per reviewed surfaceable upstream signal. Review != verified.
insert into public.intel_assertions (assertion_type, statement, source_signal_id, confidence, review_status, valid_from, observed_at)
select
  coalesce(nullif(s.content_type,''), nullif(s.cat,''), 'development'),
  coalesce(nullif(s.summary_en,''), nullif(s.summary,''), nullif(s.editorial_blurb,''), nullif(s.headline,''), 'Development under review'),
  s.id,
  case when s.quality_confidence between 0 and 1 then s.quality_confidence else null end,
  'migrated_reviewed',
  s.date,
  coalesce(s.date, s.created_at)
from public.signals s
where s.reviewed = true
  and (s.action is null or s.action <> 'rejected')
  and coalesce(s.quality_label,'') not in ('spam','boilerplate','nav','duplicate')
  and (s.content_type is null or s.content_type not in ('story','research','noise'))
on conflict do nothing;

insert into public.intel_assertion_evidence (assertion_id, evidence_ref_id, relationship)
select a.id, e.id, 'supports'
from public.intel_assertions a
join public.intel_evidence_refs e on e.source_signal_id = a.source_signal_id
on conflict do nothing;

-- Candidate event identity is deterministic and cluster-aware. source_count counts distinct
-- source references, not raw rows, so repeated observations from one URL/publisher do not
-- masquerade as independent corroboration.
with surfaceable as (
  select s.*, coalesce(nullif(s.cluster_rep_id,''), s.id) as event_seed
  from public.signals s
  where s.reviewed = true
    and (s.action is null or s.action <> 'rejected')
    and coalesce(s.quality_label,'') not in ('spam','boilerplate','nav','duplicate')
    and (s.content_type is null or s.content_type not in ('story','research','noise'))
), source_counts as (
  select event_seed,
         count(distinct coalesce(nullif(url,''), nullif(source,''), id)) as source_count_calc
  from surfaceable
  group by event_seed
), ranked as (
  select s.*, sc.source_count_calc,
         row_number() over (partition by s.event_seed order by s.quality_confidence desc nulls last, s.date desc nulls last, s.created_at desc) as rn
  from surfaceable s
  join source_counts sc using (event_seed)
)
insert into public.intel_events (id, canonical_signal_id, event_type, headline, summary, jurisdiction_label, occurred_at, detected_at, materiality, source_count)
select
  'event:' || event_seed,
  id,
  coalesce(nullif(content_type,''), nullif(cat,''), 'development'),
  coalesce(nullif(title_en,''), nullif(editorial_title,''), nullif(headline,''), 'Intelligence event'),
  coalesce(nullif(summary_en,''), nullif(summary,''), nullif(editorial_blurb,'')),
  nullif(country,''),
  date,
  created_at,
  case lower(coalesce(impact, pri, commercial_impact, '')) when 'critical' then 'critical' when 'high' then 'high' when 'urgent' then 'high' when 'low' then 'low' else 'medium' end,
  source_count_calc
from ranked where rn = 1
on conflict (id) do nothing;

insert into public.intel_event_assertions (event_id, assertion_id, role)
select 'event:' || coalesce(nullif(s.cluster_rep_id,''), s.id), a.id,
       case when coalesce(nullif(s.cluster_rep_id,''), s.id) = s.id then 'core' else 'supporting' end
from public.intel_assertions a
join public.signals s on s.id = a.source_signal_id
on conflict do nothing;

-- Reuse defensible analysis fields, but preserve migrated-review status and explicit unknowns.
insert into public.intel_assessments (
  event_id, what_happened, what_changed, why_it_matters, commercial_implications,
  affected_entities, affected_markets, why_now, confidence, confidence_rationale,
  unknowns, review_status
)
select
  e.id,
  coalesce(nullif(s.summary_en,''), nullif(s.summary,''), e.summary, e.headline),
  nullif(s.analysis->>'what_changed',''),
  coalesce(nullif(s.commercial_impact,''), 'Commercial relevance requires contextual review.'),
  nullif(s.commercial_impact,''),
  case when nullif(s.analysis->>'who_is_affected','') is null then '{}'::text[] else array[s.analysis->>'who_is_affected'] end,
  case when nullif(s.country,'') is null then '{}'::text[] else array[s.country] end,
  case when e.source_count > 1 then e.source_count || ' distinct source references are associated with this event candidate.' else 'A reviewed upstream signal triggered this event candidate.' end,
  case when s.quality_confidence between 0 and 1 then s.quality_confidence else null end,
  nullif(s.analysis->>'confidence_rationale',''),
  case when s.snapshot_id is null then array['Direct source snapshot lineage is not available for the canonical upstream signal.'] else '{}'::text[] end,
  'migrated_reviewed'
from public.intel_events e
join public.signals s on s.id = e.canonical_signal_id
on conflict (event_id) do nothing;

insert into public.intel_assessment_versions (assessment_id, version, snapshot, change_reason)
select a.id, 1, jsonb_build_object(
  'what_happened',a.what_happened,'what_changed',a.what_changed,'why_it_matters',a.why_it_matters,
  'commercial_implications',a.commercial_implications,'affected_entities',a.affected_entities,
  'affected_markets',a.affected_markets,'why_now',a.why_now,'confidence',a.confidence,
  'confidence_rationale',a.confidence_rationale,'unknowns',a.unknowns,'review_status',a.review_status
), 'Stage 0 migration from reviewed/surfaceable Pipeline B signal'
from public.intel_assessments a
on conflict do nothing;

insert into public.intel_recommendations (assessment_id, recommendation_state, reasoning, why_now, action_summary, urgency, review_status)
select
  a.id,
  case
    when nullif(s.analysis->>'recommended_action','') is not null then 'investigate'
    when lower(coalesce(e.materiality,'')) in ('high','critical') then 'investigate'
    else 'monitor'
  end,
  case
    when nullif(s.analysis->>'recommended_action','') is not null then 'An upstream analysis proposes an action, but the migrated record is not independently verified; investigate before acting.'
    else 'The event is surfaceable but the first-slice migration does not contain enough verified decision evidence for immediate action.'
  end,
  a.why_now,
  nullif(s.analysis->>'recommended_action',''),
  case when e.materiality in ('critical','high') then 'high' else 'normal' end,
  'needs_review'
from public.intel_assessments a
join public.intel_events e on e.id = a.event_id
join public.signals s on s.id = e.canonical_signal_id
on conflict (assessment_id) do nothing;

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
    'observedAt', er.observed_at
  )) filter (where er.id is not null and er.access_classification = 'intel'), '[]'::jsonb) as evidence
from public.intel_events e
join public.intel_assessments a on a.event_id = e.id
join public.intel_recommendations r on r.assessment_id = a.id
left join public.intel_event_assertions ea on ea.event_id = e.id
left join public.intel_assertion_evidence ae on ae.assertion_id = ea.assertion_id
left join public.intel_evidence_refs er on er.id = ae.evidence_ref_id
group by e.id, a.id, r.id;

-- Product read is tier-scoped. security_invoker means the public view still obeys
-- underlying RLS. Explicit SELECT grants are required because production's postgres
-- default privileges grant new public tables only to postgres/service_role.
create policy intel_events_tier_read on public.intel_events for select to authenticated
using (review_status in ('migrated_reviewed','verified') and exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.tier in ('intel','operator')));
create policy intel_event_assertions_tier_read on public.intel_event_assertions for select to authenticated
using (exists (select 1 from public.intel_events e where e.id = event_id and e.review_status in ('migrated_reviewed','verified')) and exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.tier in ('intel','operator')));
create policy intel_assertions_tier_read on public.intel_assertions for select to authenticated
using (review_status in ('migrated_reviewed','verified') and exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.tier in ('intel','operator')));
create policy intel_assertion_evidence_tier_read on public.intel_assertion_evidence for select to authenticated
using (exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.tier in ('intel','operator')));
create policy intel_evidence_refs_tier_read on public.intel_evidence_refs for select to authenticated
using (access_classification = 'intel' and exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.tier in ('intel','operator')));
create policy intel_assessments_tier_read on public.intel_assessments for select to authenticated
using (review_status in ('migrated_reviewed','verified') and exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.tier in ('intel','operator')));
create policy intel_recommendations_tier_read on public.intel_recommendations for select to authenticated
using (exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.tier in ('intel','operator')));

grant select on public.intel_events, public.intel_event_assertions, public.intel_assertions,
  public.intel_assertion_evidence, public.intel_evidence_refs, public.intel_assessments,
  public.intel_recommendations to authenticated;
grant select on public.intel_event_dossiers to authenticated;
revoke all on public.intel_event_dossiers from anon;

-- Production Data API exposes only `api`, not `public`. Publish only the allowlisted
-- dossier projection through the exposed schema; canonical base tables stay unexposed.
create or replace view api.intel_event_dossiers
with (security_invoker = true)
as select * from public.intel_event_dossiers;
grant select on api.intel_event_dossiers to authenticated;
revoke all on api.intel_event_dossiers from anon;
