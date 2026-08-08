-- Expose the quality + routing columns through the PostgREST-visible views.
--
-- WHY — TWO SEPARATE PROBLEMS, ONE ROOT CAUSE
-- -------------------------------------------
-- `lib/supabase/server.ts` and `client.ts` pin `db: { schema: 'api' }`, so every
-- supabase-js read goes to `api.*`, not `public.*`. (Raw `fetch` calls to
-- /rest/v1 resolve to `public` instead, because `pgrst.db_schemas` is
-- "public, graphql_public, job_search, api" and `public` is first — which is why
-- `lib/regulatory-signals/public.ts` works while the dashboard does not.)
--
-- 1. PRE-EXISTING, LIVE, USER-VISIBLE (introduced by PR #1214, 2026-07-30)
--    `lib/dashboard/dashboardServerData.ts` selects `analysis` plus
--    SIGNAL_QUALITY_SELECT (quality_label, quality_confidence, content_type,
--    impact, title_en, summary_en, lang_detected, is_representative,
--    cluster_rep_id) from `signals_quality`, and orders by `quality_confidence`.
--    `api.signals_quality` carries none of them. Confirmed live:
--      select quality_confidence from api.signals_quality;  -- 42703 does not exist
--    PostgREST 400s, and the caller's `if (!error && data...)` falls through to
--    source #3, `listIaSignals()` — the `ia_signals` table, 641 rows, against the
--    12,465-row classified corpus. The Command Centre has been quietly serving
--    the wrong, much smaller source ever since, while every monitor stayed green.
--
-- 2. THIS PR's ROUTING COLUMNS
--    `role_families`, `routing_version`, `routed_at` (plus `geo_scope` /
--    `geo_region`, which `lib/signals/routing.ts` needs for regional and global
--    matching) would have been invisible to the same clients for the same
--    reason.
--
-- Same bug class and same fix pattern as
-- 20260713223057_fix_stale_regulatory_signals_signals_api_view.sql and
-- 20260715085610 — a base-table column was added and the exposed view was never
-- refreshed. That has now happened at least three times; see DATABASE_CONTROL.md
-- for the standing note about adding a view-drift check.
--
-- COLUMNS ARE APPENDED, NEVER REORDERED
-- -------------------------------------
-- `create or replace view` cannot drop or reorder columns ("cannot drop columns
-- from view") — the 20260715085540 stub is a migration that died on exactly that.
-- Every existing column below is reproduced in its current live order and the
-- new ones are added at the end.
--
-- DELIBERATELY NOT CHANGED — needs an explicit decision
-- ----------------------------------------------------
-- `public.signals_quality`'s WHERE clause still gates rows on `score`:
--   reviewed = true OR cat NOT IN ('SOURCE_ENGINE','GAZETTE')
--     OR (cat='SOURCE_ENGINE' AND score >= 50 AND score < 90)
--     OR (cat='GAZETTE' AND score >= 70)
-- `score` is the legacy keyword scorer documented as INVERTED in
-- INTELLIGENCE_ARCHITECTURE_SPEC.md §2.5 and retired as a promotion instrument —
-- so a view named `signals_quality` is selecting rows by the one number the
-- platform has agreed not to trust. Changing which rows the Command Centre shows
-- is a product decision, not a drift fix, so this migration only makes the
-- columns readable and leaves row selection exactly as-is. Flagged for Tyler.
--
-- REVERSIBILITY
-- -------------
-- Additive column exposure only. No base table touched, no row mutated, no
-- filter altered, no grant widened. Rollback block at the foot.

-- ON `NOTIFY pgrst, 'reload schema'`
-- ----------------------------------
-- Not issued here, deliberately. Supabase installs its own schema-cache watchers
-- in the database rather than in this repo's migrations, so grepping `supabase/`
-- suggests none exist. Confirmed live on `zvxdgdkukjrrwamdpqrg`:
--   pgrst_ddl_watch   | ddl_command_end | enabled
--   pgrst_drop_watch  | sql_drop        | enabled
-- Both fire the reload automatically after the DDL below, making a manual NOTIFY
-- redundant. Recorded so this is not re-raised on the next read.

-- ── public.signals_quality — add the columns the view never carried ──────────

create or replace view public.signals_quality as
  select
    id, date, cat, pri, score, headline, summary, source, url, verification,
    tier, lang, company, country, in_network, lane_r, lane_e, lane_t, top_lane,
    query_pack, commercial_impact, reviewed, action, created_at,
    embedding_1024, embedding_model, embedded_at,
    analysis, analysis_generated_at, analysis_backend,
    -- appended below this line
    quality_label, quality_confidence, content_type, impact, classifier_version,
    title_en, summary_en, lang_detected,
    is_representative, cluster_rep_id, corroborating_count,
    country_iso2, geo_scope, geo_region,
    role_families, routing_version, routed_at
  from public.signals
  where (action is null or action <> 'rejected')
    and (
      reviewed = true
      or (cat <> all (array['SOURCE_ENGINE'::text, 'GAZETTE'::text]))
      or (cat = 'SOURCE_ENGINE' and score >= 50 and score < 90)
      or (cat = 'GAZETTE' and score >= 70)
    );

-- ── api.signals_quality and api.signals — DELIBERATELY NOT CHANGED ───────────
--
-- NEUTRALISED 2026-08-08, BEFORE THIS MIGRATION WAS EVER APPLIED.
--
-- This migration has never run against production. It was written on 2026-08-01
-- and is still absent from `supabase_migrations.schema_migrations`. As drafted,
-- it did `create or replace view` on BOTH `api.signals_quality` and
-- `api.signals`, appending the ten Pipeline B classifier columns plus the
-- generated `analysis` payload to each.
--
-- Both of those views are granted SELECT to `anon`. Verified on production
-- 2026-08-08:
--
--   api.signals               anon, authenticated, postgres, service_role
--   api.signals_quality       anon, authenticated, postgres, service_role
--   api.signals_with_quality        authenticated, postgres, service_role
--
-- So applying this file as written would have published every internal
-- classifier verdict, confidence score and generated analysis blob to
-- unauthenticated callers — a data-exposure change, not the drift fix this
-- migration set out to be. Nothing in the sign-off for this work covered that.
--
-- The columns already have a correct home. `api.signals_with_quality`
-- (20260808120000, applied in production as 20260808112235) carries all ten
-- over the same base table, is `security_invoker`, and is granted to
-- `authenticated` and `service_role` only — never `anon`. Every consumer reads
-- it. There is no caller that needs these columns on an anon-readable view.
--
-- The two view definitions are removed rather than rewritten because
-- `create or replace view` cannot drop columns: had this ever been applied,
-- reverting it would have required dropping and recreating both views. Leaving
-- the statements here as a comment keeps the original intent legible without
-- leaving the exposure loaded in a file that any `supabase db push` would fire.
--
-- The routing columns this migration also intended (`role_families`,
-- `routing_version`, `routed_at`, `geo_scope`, `geo_region`) went unshipped with
-- them. `lib/signals/routing.ts` reads through the service client, so if it
-- needs them exposed they belong on the restricted view too — a separate,
-- deliberate change, not a side effect of this one.

-- ── api.cc_watch_rules — structured subscription fields ──────────────────────

create or replace view api.cc_watch_rules as
  select
    id, org_id, created_by, rule_type, keywords, is_active, created_at, updated_at,
    -- appended below this line
    country_iso2, role_families, min_impact
  from public.cc_watch_rules;

-- ── api.role_families — the vocabulary itself ────────────────────────────────
-- Read-only reference data. Clients need it to render subscription pickers.

create or replace view api.role_families as
  select key, label, is_routable, sort_order
  from public.role_families;

-- Least privilege: read-only to the browser roles, no write grant (guardrail #6).
--
-- BOTH grants are required. The `enforce_api_view_security_invoker_trigger`
-- event trigger (ddl_command_end) stamps every `api.*` view `security_invoker=on`
-- — confirmed live: 141 of 141 api views carry it. An invoker view executes with
-- the caller's privileges, so granting only the view yields
-- "permission denied for table role_families" at request time. The base-table
-- grant is what actually makes it readable; the RLS select policy added in
-- 20260731120000 is what keeps it read-only.
grant select on api.role_families to anon, authenticated;
grant select on public.role_families to anon, authenticated;

-- ── Rollback ─────────────────────────────────────────────────────────────────
-- `create or replace view` cannot drop columns, so a true revert means dropping
-- and recreating each view at its previous column list. Definitions as they
-- stood on 2026-08-01 are recorded in docs/control/DATABASE_CONTROL.md.
--
-- begin;
--   drop view if exists api.role_families;
--   drop view if exists api.cc_watch_rules;      -- then recreate at 8 columns
--   drop view if exists public.signals_quality;  -- then recreate at 30 columns
-- commit;
--
-- `api.signals` and `api.signals_quality` are no longer touched by this
-- migration (see the neutralisation note above), so they need no rollback.
