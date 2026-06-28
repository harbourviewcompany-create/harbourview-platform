-- ============================================================
-- Fix: cc_jurisdiction_briefings RLS — anon + authenticated read
--
-- Root cause of "No regulatory briefing on file" for ALL countries:
--
--   1. MarketOverviewSheet.tsx fetches via anon key (direct REST).
--      The table had zero anon SELECT policy → every fetch returned [].
--
--   2. authenticated_read policy gated on review_state = 'reviewed'.
--      Seeds inserted with review_state = 'reviewed' so this was OK,
--      but any draft rows were invisible to logged-in users too.
--
-- Fix:
--   - Add anon_read policy (briefings are public intelligence data)
--   - Replace authenticated_read — remove review_state gate so all
--     non-archived rows are readable by authenticated users
--   - Keep service_role write policy untouched
-- ============================================================

-- 1. Anon read — needed by MarketOverviewSheet direct REST fetch
DROP POLICY IF EXISTS "anon_read" ON public.cc_jurisdiction_briefings;
CREATE POLICY "anon_read"
  ON public.cc_jurisdiction_briefings
  FOR SELECT
  TO anon
  USING (review_state IN ('reviewed', 'published'));

-- 2. Authenticated read — drop review_state gate, show all non-archived
DROP POLICY IF EXISTS "authenticated_read" ON public.cc_jurisdiction_briefings;
CREATE POLICY "authenticated_read"
  ON public.cc_jurisdiction_briefings
  FOR SELECT
  TO authenticated
  USING (review_state != 'archived');
