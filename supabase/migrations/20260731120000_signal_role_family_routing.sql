-- Signal → operator routing: role-family dimension
--
-- WHY
-- ---
-- Ingestion is healthy (~330 signals/day, 133 countries, feed fresh). The demand
-- side is not: 7 user_profiles, 0 subscriptions, 6 cc_watchlist_items,
-- 2 cc_watch_rules. The structural cause is that the only join key between a
-- signal and an operator was `country`, so "something happened in Germany" could
-- never become "your EU-GMP import lane is affected".
--
-- This migration adds the missing dimension using the role-family vocabulary
-- that already exists in `lib/roles/role-families.ts` and already drives
-- /country/[country]/role/[role]. Per INTELLIGENCE_ARCHITECTURE_SPEC.md §9
-- guardrail #10, a new parallel vocabulary was explicitly rejected.
--
-- REVERSIBILITY
-- -------------
-- Additive only. No existing column is altered, no row is mutated, no function
-- is replaced. Rollback is the `down` block at the foot of this file: drop the
-- three signals columns, the two cc_watch_rules columns, and the reference
-- table. Nothing reads these columns until a later change wires them up, so a
-- rollback at any point before that is a no-op for users.
--
-- NOT INCLUDED, DELIBERATELY
-- --------------------------
-- * No change to `hv_classify_corpus_harvest`. It is the live writer of
--   signals.quality_label on a pipeline that recovered on 2026-07-31; changing
--   it is a separate, individually reviewable step (guardrail #1, #8).
-- * No backfill. Populating ~5,853 rows is an LLM-spend decision with a cost
--   ceiling that belongs in the dispatch code (guardrail #9), not here.
-- * `cc_pathway_templates.role_id` uses an incompatible vocabulary
--   ('cultivator_producer' vs role-profiles.ts's 'licensed_cultivator'). That
--   drift is real and is NOT silently resolved here.

begin;

-- ── Canonical role-family vocabulary ─────────────────────────────────────────
-- Mirrors lib/roles/role-families.ts. That file stays the source of truth for
-- application behaviour (module ordering, CTAs); this table exists so the
-- database can enforce referential integrity on routed values and so the
-- vocabulary is queryable from SQL. `is_routable` marks the one internal family
-- that must never be a routing target or a subscribable audience.

create table if not exists public.role_families (
  key         text primary key,
  label       text not null,
  is_routable boolean not null default true,
  sort_order  integer not null,
  created_at  timestamptz not null default now()
);

comment on table public.role_families is
  'Canonical operator role-family vocabulary. Mirrors lib/roles/role-families.ts; that file remains source of truth for UI behaviour.';

insert into public.role_families (key, label, is_routable, sort_order) values
  ('genetics_breeding_ip',          'Genetics, breeding & IP',            true,   1),
  ('cultivation_production',        'Cultivation & production',           true,   2),
  ('processing_manufacturing',      'Processing & manufacturing',         true,   3),
  ('trade_distribution',            'Trade & distribution',               true,   4),
  ('buyers_procurement',            'Buyers & procurement',               true,   5),
  ('medical_clinical',              'Medical & clinical',                 true,   6),
  ('pharmacy_dispensing',           'Pharmacy & dispensing',              true,   7),
  ('labs_qa_verification',          'Labs, QA & verification',            true,   8),
  ('research_academia_trials',      'Research, academia & trials',        true,   9),
  ('regulators_policy_government',  'Regulators, policy & government',    true,  10),
  ('finance_investment_insurance',  'Finance, investment & insurance',    true,  11),
  ('equipment_facilities_services', 'Equipment, facilities & services',   true,  12),
  ('legal_compliance_professional', 'Legal, compliance & professional',   true,  13),
  ('data_intelligence_media',       'Data, intelligence & media',         true,  14),
  ('harbourview_admin_operator',    'Harbourview admin & operator',       false, 15)
on conflict (key) do update
  set label = excluded.label,
      is_routable = excluded.is_routable,
      sort_order = excluded.sort_order;

-- Least-privilege: the vocabulary is public reference data and is read by
-- customer-facing surfaces, so authenticated/anon may select. Nothing but the
-- service role may write it (guardrail #6).
alter table public.role_families enable row level security;

drop policy if exists role_families_read on public.role_families;
create policy role_families_read on public.role_families
  for select to anon, authenticated using (true);

-- ── Routing columns on signals ───────────────────────────────────────────────

alter table public.signals
  add column if not exists role_families   text[],
  add column if not exists routing_version text,
  add column if not exists routed_at       timestamptz;

comment on column public.signals.role_families is
  'Operator role families this signal is relevant to. NULL = not yet routed (matches on geography alone); empty array = routed and relevant to none.';
comment on column public.signals.routing_version is
  'Routing definition that produced role_families, e.g. hv-route/role-families/v1. NULL means unrouted — distinct from routed-to-nothing.';

-- GIN supports the `role_families && array[...]` overlap operator that every
-- routed read uses. Partial: unrouted rows are matched by geography and never
-- probe this index, and they are the majority until a backfill runs.
create index if not exists signals_role_families_gin
  on public.signals using gin (role_families)
  where role_families is not null;

-- Routed reads always filter geography alongside role family.
create index if not exists signals_country_iso2_date_idx
  on public.signals (country_iso2, date desc)
  where country_iso2 is not null;

-- ── Structured watch rules ───────────────────────────────────────────────────
-- cc_watch_rules was (rule_type, keywords) — substring matching only, which
-- cannot express "regulatory changes affecting cultivation in Lesotho". These
-- columns are additive; the existing keyword rule type keeps working unchanged.

alter table public.cc_watch_rules
  add column if not exists country_iso2  text[],
  add column if not exists role_families text[],
  add column if not exists min_impact    text;

alter table public.cc_watch_rules
  drop constraint if exists cc_watch_rules_min_impact_check;
alter table public.cc_watch_rules
  add constraint cc_watch_rules_min_impact_check
  check (min_impact is null or min_impact in ('low', 'medium', 'high'));

comment on column public.cc_watch_rules.role_families is
  'Role families this rule subscribes to. NULL/empty = no role-family filter, i.e. geography-only.';

commit;

-- ── Rollback ─────────────────────────────────────────────────────────────────
-- begin;
--   drop index if exists public.signals_role_families_gin;
--   drop index if exists public.signals_country_iso2_date_idx;
--   alter table public.signals
--     drop column if exists role_families,
--     drop column if exists routing_version,
--     drop column if exists routed_at;
--   alter table public.cc_watch_rules
--     drop constraint if exists cc_watch_rules_min_impact_check,
--     drop column if exists country_iso2,
--     drop column if exists role_families,
--     drop column if exists min_impact;
--   drop table if exists public.role_families;
-- commit;
