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

-- ── api.signals_quality — the view the dashboard actually reads ──────────────

create or replace view api.signals_quality as
  select
    id, date, cat, pri, score, headline, summary, source, url, verification,
    tier, lang, company, country, in_network, lane_r, lane_e, lane_t, top_lane,
    query_pack, commercial_impact, reviewed, action, created_at,
    embedding_1024, embedding_model, embedded_at,
    -- appended below this line
    analysis, analysis_generated_at, analysis_backend,
    quality_label, quality_confidence, content_type, impact, classifier_version,
    title_en, summary_en, lang_detected,
    is_representative, cluster_rep_id, corroborating_count,
    country_iso2, geo_scope, geo_region,
    role_families, routing_version, routed_at
  from public.signals_quality;

-- ── api.signals ──────────────────────────────────────────────────────────────

create or replace view api.signals as
  select
    id, date, cat, pri, score, headline, summary, source, url, verification,
    tier, lang, company, country, in_network, lane_r, lane_e, lane_t, top_lane,
    query_pack, commercial_impact, reviewed, action, created_at,
    embedding_1024, embedding_model, embedded_at, reviewed_by, reviewed_at,
    editorial_title, editorial_blurb, country_iso2,
    -- appended below this line
    quality_label, quality_confidence, content_type, impact, classifier_version,
    title_en, summary_en, lang_detected,
    is_representative, cluster_rep_id, corroborating_count,
    geo_scope, geo_region,
    role_families, routing_version, routed_at
  from public.signals;

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
grant select on api.role_families to anon, authenticated;

-- ── Rollback ─────────────────────────────────────────────────────────────────
-- `create or replace view` cannot drop columns, so a true revert means dropping
-- and recreating each view at its previous column list. Definitions as they
-- stood on 2026-08-01 are recorded in docs/control/DATABASE_CONTROL.md.
--
-- begin;
--   drop view if exists api.role_families;
--   drop view if exists api.cc_watch_rules;      -- then recreate at 8 columns
--   drop view if exists api.signals;             -- then recreate at 32 columns
--   drop view if exists api.signals_quality;     -- then recreate at 27 columns
--   drop view if exists public.signals_quality;  -- then recreate at 30 columns
-- commit;
