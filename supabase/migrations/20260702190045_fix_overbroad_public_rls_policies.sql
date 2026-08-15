-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260702190045.
--
-- Rewriting this file cannot affect production: 20260702190045 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- SECURITY FIX: hv_entity_mentions and hv_regulatory_trajectory had
-- service_role_full_access policies scoped to {public} (all roles), not
-- {service_role}. This granted anon and authenticated users full INSERT,
-- UPDATE, DELETE, and TRUNCATE access.

DROP POLICY IF EXISTS "service_role_full_access" ON public.hv_entity_mentions;
CREATE POLICY "service_role_all_hv_entity_mentions"
  ON public.hv_entity_mentions
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_full_access" ON public.hv_regulatory_trajectory;
CREATE POLICY "service_role_all_hv_regulatory_trajectory"
  ON public.hv_regulatory_trajectory
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);
