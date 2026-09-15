-- Reconstructed from production by auto-reconcile-migration-drift.mjs.
-- This version was applied directly against production (outside
-- apply_migration) and had no corresponding repository file, which is
-- exactly what "Compare repository and live migration ledgers" checks for.
-- Statements below are verbatim from supabase_migrations.schema_migrations
-- for version 20260915111407. Adding this file cannot affect production: the
-- version is already applied, so a future `supabase db push` skips it.
-- Auto-generated -- review before merging, same as any other PR.

-- country_cannabis_legal_status: plain reference table, RLS not even enabled,
-- no row-level distinction needed. Missing grant only -- safe to expose broadly.
grant select on public.country_cannabis_legal_status to anon, authenticated;

-- intel_events/intel_assessments/intel_recommendations/intel_evidence_refs/intel_assertions:
-- every one already has a correct staff_all RLS policy (admin/operator/analyst via
-- user_roles), but with zero baseline GRANT for `authenticated`, that policy never
-- gets evaluated -- Postgres denies at the grant-check step before RLS even runs.
-- This was blocking genuine staff members, not just anon. Granting to `authenticated`
-- only (never anon) lets the existing, already-correct RLS policy do the actual
-- gating, exactly as it was designed to.
grant select on public.intel_events, public.intel_assessments, public.intel_recommendations,
  public.intel_evidence_refs, public.intel_assertions to authenticated;
