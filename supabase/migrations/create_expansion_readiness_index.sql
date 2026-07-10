-- Expansion Readiness Index — data model
-- NOT YET APPLIED — review and apply via the normal migration protocol.
--
-- Design decisions, and why:
--
-- 1. Naming: "expansion_readiness_*", not "passport" or "readiness_score" —
--    `hv_passports` / `hv_passport_scores` already exist and score an
--    operator's OWN compliance/export-readiness (completeness, export/import
--    readiness). This is a different concept (jurisdiction market
--    readiness) and needs distinct vocabulary so it isn't conflated with
--    that system by the next person who touches either.
--
-- 2. FK target is countries.id (uuid), not iso_alpha2 — confirmed via
--    information_schema that iso_alpha2 has no unique constraint on
--    `countries`; only `id` (PK) and `country_slug` (unique) do.
--
-- 3. No new jurisdiction table — reuses the live, populated `countries`
--    table (203 rows) rather than the two empty parallel tables already
--    sitting in this schema (`jurisdictions`, `country_coverage_matrix`).
--    Do not build against those without first confirming with the team
--    whether they're meant to replace `countries` — as of this migration
--    they are unused, 0-row tables.
--
-- 4. No separate score-history table — every score is inserted, never
--    updated in place, so `computed_at` ordering IS the history. Simpler
--    than maintaining two tables in sync.
--
-- 5. `data_completeness` is a first-class column, not an afterthought.
--    `economic_viability` and `competitive_intensity` currently have NO
--    real data source anywhere in this schema (confirmed: no competitor
--    table, no cost/tax/margin data). Rather than let the composite view
--    silently average in a fabricated number, those pillars are seeded
--    with data_completeness = 'insufficient' and EXCLUDED from the
--    composite calculation until a real source exists. See the view at
--    the bottom for how exclusion works.
--
-- 6. Weight profiles are a real table, not hardcoded, but v1 seeds ONLY
--    an operator profile — per the decision to build for operators first,
--    not the full multi-persona system (that stays Phase 2 as the
--    original spec already said).
--
-- 7. Evidence links to EXISTING tables (signals, jurisdiction_briefings,
--    jurisdiction_playbooks) rather than duplicating their content — this
--    is what makes "show score explanations, not just totals" possible
--    without a second copy of the same facts.

-- ============================================================
-- 1. Pillar definitions
-- ============================================================
create table public.expansion_readiness_pillars (
  id text primary key,             -- e.g. 'regulatory_access'
  label text not null,             -- e.g. 'Regulatory Access'
  description text not null,
  display_order int not null,
  created_at timestamptz not null default now()
);

insert into public.expansion_readiness_pillars (id, label, description, display_order) values
  ('regulatory_access',     'Regulatory Access',     'Legal status, license availability, foreign ownership rules, channel access, municipal openness.', 1),
  ('market_demand',         'Market Demand',         'Size, growth, demand profile, price realization, category depth.', 2),
  ('economic_viability',    'Economic Viability',    'Startup cost, compliance cost, tax burden, margin potential, capital intensity.', 3),
  ('competitive_intensity', 'Competitive Intensity',  'Market concentration, incumbent strength, whitespace opportunity, saturation.', 4),
  ('operational_feasibility','Operational Feasibility','Labor, logistics, local partners, import/export complexity, supply chain readiness.', 5),
  ('strategic_fit',         'Strategic Fit',         'Match to operator model, timeline, capabilities, risk appetite.', 6);

-- ============================================================
-- 2. Weight profiles (operator-only for v1 — see note 6 above)
-- ============================================================
create table public.expansion_weight_profiles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,        -- e.g. 'operator_default'
  name text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.expansion_weight_profile_pillars (
  profile_id uuid not null references public.expansion_weight_profiles(id) on delete cascade,
  pillar_id text not null references public.expansion_readiness_pillars(id),
  weight numeric not null check (weight >= 0 and weight <= 1),
  primary key (profile_id, pillar_id)
);

insert into public.expansion_weight_profiles (slug, name, is_default)
values ('operator_default', 'Operator — Default', true);

-- Operator-tuned weights: economics and operational feasibility weighted
-- higher than the original 4-persona-average spec, per the decision to
-- build for operators specifically. Adjust once real usage data exists.
insert into public.expansion_weight_profile_pillars (profile_id, pillar_id, weight)
select id, pillar_id, weight from (
  select
    (select id from public.expansion_weight_profiles where slug = 'operator_default') as id,
    unnest(array['regulatory_access','market_demand','economic_viability',
                 'competitive_intensity','operational_feasibility','strategic_fit']) as pillar_id,
    unnest(array[0.25, 0.15, 0.20, 0.15, 0.15, 0.10]) as weight
) w;

-- ============================================================
-- 3. Scores — one row per (country, pillar, computed_at)
-- ============================================================
create type public.expansion_data_completeness as enum ('real', 'partial', 'insufficient');

create table public.expansion_readiness_scores (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries(id),
  pillar_id text not null references public.expansion_readiness_pillars(id),
  score numeric not null check (score >= 0 and score <= 100),
  data_completeness public.expansion_data_completeness not null default 'partial',
  confidence_note text, -- e.g. "based on 2 of 6 expected source types"
  computed_at timestamptz not null default now(),
  computed_by text not null default 'manual' -- 'manual' | 'scoring_engine_v1' | etc — tracks provenance
);

create index idx_expansion_scores_country_pillar_computed
  on public.expansion_readiness_scores (country_id, pillar_id, computed_at desc);

-- ============================================================
-- 4. Evidence — links a score to the real source rows behind it,
--    instead of duplicating their content
-- ============================================================
-- NOTE: as of this migration, this project has TWO tables named `signals` in
-- different schemas: `public.signals` (raw pipeline/scoring output, no
-- review gate, 4700+ rows) and `regulatory_signals.signals` (analyst-
-- reviewed, publish-gated, 0 rows as of this writing). Evidence rows here
-- must record which one with an explicit schema-qualified value
-- ('public.signals'), never the bare, ambiguous 'signals'.
create table public.expansion_readiness_score_evidence (
  id uuid primary key default gen_random_uuid(),
  score_id uuid not null references public.expansion_readiness_scores(id) on delete cascade,
  evidence_table text not null check (evidence_table in
    ('public.signals', 'jurisdiction_briefings', 'jurisdiction_playbooks', 'source_registry')),
  evidence_id uuid not null, -- polymorphic ref, no FK constraint since target table varies
  note text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 5. Hard blockers — penalty/veto layer, separate from pillar scores
--    (a market can score well but still be non-enterable)
-- ============================================================
create type public.expansion_blocker_type as enum (
  'municipal_ban', 'closed_licensing', 'foreign_ownership_restricted',
  'vertical_integration_cap', 'plant_count_cap', 'moratorium', 'other'
);

create table public.expansion_hard_blockers (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries(id),
  blocker_type public.expansion_blocker_type not null,
  severity text not null check (severity in ('hard', 'soft')), -- hard = zero out composite, soft = cap it
  description text not null,
  evidence_table text check (evidence_table in
    ('public.signals', 'jurisdiction_briefings', 'jurisdiction_playbooks', 'source_registry')),
  evidence_id uuid,
  active boolean not null default true,
  detected_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index idx_expansion_blockers_country_active
  on public.expansion_hard_blockers (country_id) where active;

-- ============================================================
-- 6. Composite view — latest score per pillar per country, weighted by
--    the operator profile, EXCLUDING pillars marked 'insufficient' from
--    the weighted average (re-normalizes remaining weights) rather than
--    silently treating a missing pillar as a zero or an average.
-- ===========================================================
create view public.v_expansion_readiness_composite as
with latest_scores as (
  select distinct on (country_id, pillar_id)
    country_id, pillar_id, score, data_completeness, computed_at
  from public.expansion_readiness_scores
  order by country_id, pillar_id, computed_at desc
),
usable_scores as (
  select ls.*, wpp.weight
  from latest_scores ls
  join public.expansion_weight_profile_pillars wpp
    on wpp.pillar_id = ls.pillar_id
  join public.expansion_weight_profiles wp
    on wp.id = wpp.profile_id and wp.slug = 'operator_default'
  where ls.data_completeness != 'insufficient'
),
weighted as (
  select
    country_id,
    sum(score * weight) / nullif(sum(weight), 0) as composite_score,
    sum(weight) as total_weight_used,
    count(*) as pillars_used,
    array_agg(pillar_id) filter (where true) as pillars_included
  from usable_scores
  group by country_id
),
blockers as (
  select country_id,
    bool_or(severity = 'hard') as has_hard_blocker,
    array_agg(blocker_type) as active_blocker_types
  from public.expansion_hard_blockers
  where active
  group by country_id
)
select
  c.id as country_id,
  c.country_name,
  c.iso_alpha2,
  w.composite_score,
  w.pillars_used,
  w.pillars_included,
  (6 - coalesce(w.pillars_used, 0)) as pillars_missing,
  coalesce(b.has_hard_blocker, false) as has_hard_blocker,
  b.active_blocker_types,
  case
    when coalesce(b.has_hard_blocker, false) then 'not_enterable'
    when w.pillars_used < 4 then 'insufficient_data'
    else 'scored'
  end as status
from public.countries c
left join weighted w on w.country_id = c.id
left join blockers b on b.country_id = c.id;

-- ============================================================
-- RLS — read-only for authenticated/anon by default, matching the
-- existing pattern on `countries`/`signals`. Writes restricted to
-- service_role (scoring engine writes, not client-side).
-- ============================================================
alter table public.expansion_readiness_pillars enable row level security;
alter table public.expansion_weight_profiles enable row level security;
alter table public.expansion_weight_profile_pillars enable row level security;
alter table public.expansion_readiness_scores enable row level security;
alter table public.expansion_readiness_score_evidence enable row level security;
alter table public.expansion_hard_blockers enable row level security;

create policy expansion_pillars_public_read on public.expansion_readiness_pillars for select using (true);
create policy expansion_profiles_public_read on public.expansion_weight_profiles for select using (true);
create policy expansion_profile_pillars_public_read on public.expansion_weight_profile_pillars for select using (true);
create policy expansion_scores_public_read on public.expansion_readiness_scores for select using (true);
create policy expansion_evidence_public_read on public.expansion_readiness_score_evidence for select using (true);
create policy expansion_blockers_public_read on public.expansion_hard_blockers for select using (true);

-- No insert/update/delete policies for anon/authenticated — writes go
-- through service_role only (scoring engine, admin tooling).
