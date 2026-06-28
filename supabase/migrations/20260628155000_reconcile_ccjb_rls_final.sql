-- ============================================================
-- Reconcile cc_jurisdiction_briefings RLS — canonical final state
--
-- Migration chain so far:
--   20260628000000  CREATE TABLE — authenticated_read (review_state='reviewed' only)
--   20260628000001  patch        — re-creates authenticated_read (same narrow gate)
--                                  adds anon_read (review_state='reviewed')
--   20260628154000  our fix      — broadens authenticated_read (!=archived)
--                                  broadens anon_read (reviewed OR published)
--
-- Problem: 000001 removed 'published' from the CHECK constraint but
-- 154000 wrote an anon_read policy gating on 'published' — a value
-- the constraint no longer allows. That policy clause is harmless
-- (no row can ever have review_state='published') but it is misleading.
--
-- This migration is the canonical final state. Run after all prior
-- migrations. Safe to run multiple times (all DROP IF EXISTS).
--
-- Final rules:
--   anon        → SELECT where review_state = 'reviewed'
--   authenticated → SELECT where review_state IN ('draft','reviewed')
--                   (draft visible to logged-in users for admin preview)
--   service_role  → ALL (unchanged)
-- ============================================================

-- Anon: reviewed rows only (public intelligence, no draft leakage)
DROP POLICY IF EXISTS "anon_read" ON public.cc_jurisdiction_briefings;
CREATE POLICY "anon_read"
  ON public.cc_jurisdiction_briefings
  FOR SELECT
  TO anon
  USING (review_state = 'reviewed');

-- Authenticated: draft + reviewed (enables admin preview of draft rows)
DROP POLICY IF EXISTS "authenticated_read" ON public.cc_jurisdiction_briefings;
CREATE POLICY "authenticated_read"
  ON public.cc_jurisdiction_briefings
  FOR SELECT
  TO authenticated
  USING (review_state IN ('draft', 'reviewed'));
