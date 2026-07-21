-- ============================================================
-- supabase/migrations/20260721140000_repair_cc_jurisdiction_briefings_api_exposure.sql
--
-- DRAFT FOR REVIEW - NOT YET APPLIED TO PRODUCTION.
-- Apply only via mcp__Supabase__apply_migration after Tyler's explicit
-- go-ahead (see docs/control/DATABASE_CONTROL.md: production apply is a
-- separate approved step).
--
-- Purpose
-- -------
-- Restore the market-overview data path. MarketOverviewSheet reads
-- api.cc_jurisdiction_briefings (PostgREST only exposes the `api` schema).
-- Production is returning "Could not load regulatory data" on every market.
-- This reasserts the api-schema exposure + the anon/authenticated read
-- grants + RLS read policies, idempotently, without dropping data or
-- broadening the existing read gate.
--
-- Confirmed NOT the cause (already ruled out this session):
--   * PR #1109 (client singleton + AbortController) - reverted, no fix.
--   * PR #1107 (review-queue RPC authz) - touches api.*_review_queue over
--     public.signals only; does not touch cc_jurisdiction_briefings.
--
-- Likely failure modes this repairs:
--   1. api.cc_jurisdiction_briefings view missing/stale in prod (PGRST205).
--   2. GRANT SELECT to anon/authenticated missing.
--   3. anon_read / authenticated_read RLS policy missing or not matching
--      current review_state gate (silent zero-rows / error).
--   4. `SELECT *` view frozen before confidence_score/confidence_categories
--      were added -> client BRIEFING_SELECT requests columns the view does
--      not expose (400). Fixed here by an EXPLICIT column list (also avoids
--      leaking any future private columns per DATABASE_CONTROL view rules).
--
-- RLS impact: RE-ASSERTS existing read policies at their current gate
--   (review_state = 'reviewed') for anon and authenticated. Does NOT
--   disable RLS and does NOT broaden the public select gate.
-- Data impact: none (no INSERT/UPDATE/DELETE; no DROP of tables/columns).
-- Rollback: `drop view if exists api.cc_jurisdiction_briefings;` (restores
--   prior state). Forward-fix preferred.
-- ============================================================

-- 1. Base-table read policies (idempotent re-assert; same gate, no broadening)
alter table public.cc_jurisdiction_briefings enable row level security;

drop policy if exists "authenticated_read" on public.cc_jurisdiction_briefings;
create policy "authenticated_read"
  on public.cc_jurisdiction_briefings
  for select
  to authenticated
  using (review_state = 'reviewed');

drop policy if exists "anon_read" on public.cc_jurisdiction_briefings;
create policy "anon_read"
  on public.cc_jurisdiction_briefings
  for select
  to anon
  using (review_state = 'reviewed');

-- 2. Explicit-column passthrough view in the api schema.
--    Explicit columns (not SELECT *) so the view never goes stale on new
--    base columns and never leaks future private columns. This set mirrors
--    BRIEFING_SELECT plus the columns the client filters on
--    (country_iso2, state_iso2, jurisdiction_type) and the RLS gate column.
create or replace view api.cc_jurisdiction_briefings as
select
  jurisdiction_slug,
  jurisdiction_type,
  country_iso2,
  state_iso2,
  review_state,
  program_status,
  public_summary,
  patient_access,
  physician_access,
  market_dynamics,
  regulatory_outlook,
  regulatory_body,
  last_reviewed_date,
  confidence_score,
  confidence_categories
from public.cc_jurisdiction_briefings;

-- 3. Grants for the browser-facing roles.
grant select on api.cc_jurisdiction_briefings to anon, authenticated;

-- 4. Force PostgREST to refresh its schema cache (clears PGRST205).
notify pgrst, 'reload schema';

