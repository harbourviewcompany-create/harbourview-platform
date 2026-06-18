-- supabase/migrations/20260618190000_fix_jurisdiction_briefings_write_policy.sql
--
-- Patch A: Fix jurisdiction_briefings RLS service_write policy.
--
-- Bug confirmed Jun 18 2026 via pg_policies query:
--   policyname=service_write | roles={public} | cmd=ALL
--   USING (true) | WITH CHECK (true)
-- A policy with roles={public} and no TO restriction applies to ALL roles,
-- including `authenticated` and `anon`. Any user could INSERT/UPDATE/DELETE
-- jurisdiction briefings, including setting status='published'.
--
-- Fix: restrict service_write to service_role only.
--
-- Manual application required until Supabase preview pipeline is unblocked.
-- Run this SQL in the Supabase SQL editor for zvxdgdkukjrrwamdpqrg.
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "service_write" ON public.jurisdiction_briefings;

CREATE POLICY "service_write"
  ON public.jurisdiction_briefings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Verify
-- SELECT policyname, roles, cmd FROM pg_policies WHERE tablename = 'jurisdiction_briefings';
-- Expected: service_write | {service_role} | ALL
