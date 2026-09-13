-- CONCURRENTLY removed 2026-08-05 for zero-state replay. The Supabase CLI sends
-- a migration's statements as one pipeline, and Postgres refuses CREATE INDEX
-- CONCURRENTLY there:
--   ERROR: CREATE INDEX CONCURRENTLY cannot be executed within a pipeline
--   (SQLSTATE 25001)
-- Only the keyword is dropped; every index name, table and column list below is
-- unchanged, so the resulting schema is identical. CONCURRENTLY exists to avoid
-- locking a populated table, which is meaningless against the empty database a
-- replay builds, and production already carries these indexes -- this version is
-- recorded in supabase_migrations.schema_migrations, applied there as a single
-- statement, which is why the pipeline rule never bit in production.

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
--
-- TRANSACTION HANDLING
-- --------------------
-- No explicit begin/commit: the Supabase CLI wraps each migration file in its
-- own transaction, and only 14 of this repo's 764 migrations nest one manually.
-- The file is still atomic.
--
-- ON `CREATE INDEX` (SQLFluff PG01 / Squawk)
-- ------------------------------------------------------
-- Both linters want here. Deliberately not used: it cannot run
-- inside a transaction block, so adopting it means either giving up this
-- migration's atomicity or splitting the index builds into a separate
-- non-transactional file. `public.signals` holds ~12.5k rows, where a plain
-- index build is milliseconds — not worth either cost. Recorded here so the
-- next reader does not relitigate it.

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

-- No (country_iso2, date desc) index is created here. `idx_signals_iso_date`
-- from 20260716195743_signals_country_iso_resolution.sql is already byte-for-byte
-- what routed reads need — confirmed live:
--   CREATE INDEX idx_signals_iso_date ON public.signals
--     USING btree (country_iso2, date DESC) WHERE (country_iso2 IS NOT NULL)
-- Postgres does not deduplicate indexes by definition, and a different name
-- bypasses IF NOT EXISTS, so adding one would have meant two identical B-trees
-- maintained on every insert and country/date update for no query benefit.

-- Routed state is one fact, so the marker and the result cannot disagree:
-- `routing_version IS NULL` (never routed, matches on geography alone) must
-- exactly track `role_families IS NULL`. An empty array with a version set stays
-- valid — that is "routed, relevant to nobody". Without this, a partial
-- classifier or backfill write could set one and not the other and silently
-- widen or empty feeds.
alter table public.signals
  drop constraint if exists signals_routing_state_consistent;
-- Squawk flags NOT VALID + VALIDATE in one transaction as blocking reads. That
-- guidance exists for large tables; `public.signals` holds ~12.5k rows, where the
-- validation scan is milliseconds, so splitting this across two migration files
-- would add a moving part for no measurable lock benefit. Kept as one unit
-- deliberately — revisit if the table grows by orders of magnitude.
-- Blank counts as absent, matching `isRouted()` in lib/signals/routing.ts, which
-- requires a non-empty trimmed string. A bare NULL check accepted
-- `routing_version = ''` alongside a populated `role_families`, so the database
-- called the row routed while the read side called it unrouted and skipped
-- role-family filtering entirely — a malformed write could silently widen feeds.
alter table public.signals
  add constraint signals_routing_state_consistent
  check ((nullif(btrim(routing_version), '') is null) = (role_families is null)) not valid;
alter table public.signals validate constraint signals_routing_state_consistent;

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

-- ── Referential integrity for the text[] role-family columns ─────────────────
-- Without this the reference table above is decorative: Postgres will happily
-- accept an invented key, or the internal `harbourview_admin_operator` family,
-- into either array. The TypeScript resolver only protects callers that go
-- through it — direct SQL writes, the classifier harvest, and persisted watch
-- rules all bypass it.
--
-- A trigger rather than a CHECK because a CHECK constraint may not query another
-- table. Added to both columns; NULL and empty arrays remain valid (they mean
-- "no filter" / "not yet routed").

create or replace function public.hv_assert_routable_role_families()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare invalid text;
begin
  if new.role_families is null or cardinality(new.role_families) = 0 then
    return new;
  end if;

  -- A NULL element must be rejected explicitly. `string_agg` skips NULL inputs,
  -- so relying on the aggregate alone let `array['cultivation_production', NULL]`
  -- through with `invalid` still NULL — the check silently passing on exactly the
  -- malformed input it exists to catch.
  if exists (select 1 from unnest(new.role_families) as k where k is null) then
    raise exception 'role_families may not contain NULL elements'
      using errcode = '23514';
  end if;

  select string_agg(k, ', ')
    into invalid
  from unnest(new.role_families) as k
  where not exists (
    select 1 from public.role_families rf
    where rf.key = k and rf.is_routable
  );

  if invalid is not null then
    raise exception 'unknown or non-routable role_families: %', invalid
      using errcode = '23514';
  end if;

  return new;
end
$$;

revoke all on function public.hv_assert_routable_role_families() from public;

drop trigger if exists signals_role_families_check on public.signals;
create trigger signals_role_families_check
  before insert or update of role_families on public.signals
  for each row execute function public.hv_assert_routable_role_families();

drop trigger if exists cc_watch_rules_role_families_check on public.cc_watch_rules;
create trigger cc_watch_rules_role_families_check
  before insert or update of role_families on public.cc_watch_rules
  for each row execute function public.hv_assert_routable_role_families();

-- ── Rollback ─────────────────────────────────────────────────────────────────
-- begin;
--   drop trigger if exists signals_role_families_check on public.signals;
--   drop trigger if exists cc_watch_rules_role_families_check on public.cc_watch_rules;
--   drop function if exists public.hv_assert_routable_role_families();
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
