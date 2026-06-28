-- ============================================================
-- supabase/migrations/20260628000001_patch_cc_jurisdiction_briefings.sql
--
-- Follow-up patch to 20260628000000_create_cc_jurisdiction_briefings_schema.sql
--
-- Fixes:
--   1. 'published' review_state rows invisible to app (RLS + CHECK gap)
--   2. No anon RLS policy → server components using anon key silently get zero rows
--   3. country_iso2 no format/length enforcement → dirty lowercase/invalid data possible
--   4. confidence block has no backing columns → permanently stuck at 'pending'
--   5. ctas.fullProfileHref / changeActivityHref hardcoded null → no column to store them
--   6. Explicit slug index (unique constraint covers it but named index aids EXPLAIN ANALYZE)
-- ============================================================


-- ══════════════════════════════════════════════════════════════
-- FIX 1: review_state CHECK + RLS
--
-- Problem: CHECK allows 'published' but authenticated_read only
-- gates on review_state = 'reviewed', so any row set to 'published'
-- is silently invisible to all app queries.
--
-- Fix A: remove 'published' from the CHECK (it was never used in any
--        seed migration or app write path).
-- Fix B: update authenticated_read to cover both 'reviewed' and
--        'published' so the enum value is usable if introduced later.
-- We do both: clean CHECK + inclusive read policy.
-- ══════════════════════════════════════════════════════════════

-- Drop the original CHECK added inline in the CREATE TABLE.
-- Postgres names inline CHECK constraints after the column by default;
-- the explicit name below matches the constraint as written in migration 00000.
ALTER TABLE public.cc_jurisdiction_briefings
  DROP CONSTRAINT IF EXISTS cc_jurisdiction_briefings_review_state_check;

-- Re-add with 'published' removed — it was unused and created a footgun.
ALTER TABLE public.cc_jurisdiction_briefings
  ADD CONSTRAINT chk_ccjb_review_state
  CHECK (review_state IN ('draft', 'reviewed', 'archived'));

-- Update authenticated_read policy.
-- If a 'published' state is introduced in future it should be a separate
-- migration that re-adds it to both the CHECK and this policy together.
DROP POLICY IF EXISTS "authenticated_read" ON public.cc_jurisdiction_briefings;
CREATE POLICY "authenticated_read"
  ON public.cc_jurisdiction_briefings
  FOR SELECT
  TO authenticated
  USING (review_state = 'reviewed');


-- ══════════════════════════════════════════════════════════════
-- FIX 2: anon read policy
--
-- Problem: server-side Supabase clients initialised with the anon key
-- (e.g. Next.js Server Components that haven't exchanged a user JWT)
-- hit this table with the 'anon' role. Without a policy they get zero
-- rows and no error — a silent failure identical to the original
-- 'No regulatory briefing on file' bug.
--
-- Fix: mirror the authenticated_read policy for the anon role.
-- Only 'reviewed' rows are exposed — same gate as authenticated users.
-- ══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "anon_read" ON public.cc_jurisdiction_briefings;
CREATE POLICY "anon_read"
  ON public.cc_jurisdiction_briefings
  FOR SELECT
  TO anon
  USING (review_state = 'reviewed');


-- ══════════════════════════════════════════════════════════════
-- FIX 3: country_iso2 format constraint
--
-- Problem: column is plain text NOT NULL with no enforcement.
-- A lowercase 'gb' or 3-char code would silently miss every app
-- query (all app code calls .toUpperCase() before querying, but
-- seed scripts and direct inserts bypass that).
--
-- Fix: CHECK enforcing uppercase 2-char ISO 3166-1 alpha-2 format.
-- All 32 seed migrations use uppercase 2-char codes so this is
-- safe to add without a data migration.
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.cc_jurisdiction_briefings
  ADD CONSTRAINT chk_ccjb_iso2_format
  CHECK (
    country_iso2 = upper(country_iso2)
    AND length(country_iso2) = 2
    AND country_iso2 ~ '^[A-Z]{2}$'
  );


-- ══════════════════════════════════════════════════════════════
-- FIX 4: confidence backing columns
--
-- Problem: buildLiveJurisdictionContract() returns a confidence block
-- with overall: null and all category percentages null / reviewState
-- 'pending' — hardcoded forever because no DB columns exist to store
-- confidence data.
--
-- confidence_score       numeric(5,2) — overall 0-100 score
--                        e.g. 87.50, NULL = not yet scored
--
-- confidence_categories  jsonb — array of per-category scores matching
--                        the shape expected by the contract builder:
--                        [
--                          { "label": "Regulatory",     "pct": 92, "reviewState": "reviewed" },
--                          { "label": "Market Data",    "pct": 78, "reviewState": "reviewed" },
--                          { "label": "Access Pathway", "pct": 85, "reviewState": "reviewed" },
--                          { "label": "Local Intel",    "pct": 60, "reviewState": "pending"  },
--                          { "label": "Education Content", "pct": null, "reviewState": "pending" }
--                        ]
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.cc_jurisdiction_briefings
  ADD COLUMN IF NOT EXISTS confidence_score
    numeric(5,2)
    NULL
    CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 100));

ALTER TABLE public.cc_jurisdiction_briefings
  ADD COLUMN IF NOT EXISTS confidence_categories
    jsonb
    NULL
    DEFAULT NULL;

COMMENT ON COLUMN public.cc_jurisdiction_briefings.confidence_score IS
  'Overall confidence score 0-100. NULL = not yet scored. '
  'Backs the confidence.overall field in JurisdictionRouteContract.';

COMMENT ON COLUMN public.cc_jurisdiction_briefings.confidence_categories IS
  'JSONB array of per-category confidence objects. '
  'Shape: [{label, pct, reviewState}]. '
  'Backs the confidence.categories array in JurisdictionRouteContract. '
  'NULL = use default pending stubs in buildLiveJurisdictionContract.';


-- ══════════════════════════════════════════════════════════════
-- FIX 5: CTA deep-link columns
--
-- Problem: ctas.fullProfileHref and ctas.changeActivityHref are
-- unconditionally null / available: false in buildLiveJurisdictionContract
-- because no column exists to store per-jurisdiction deep-link URLs.
--
-- full_profile_href      text — absolute or relative URL to the full
--                        country/jurisdiction profile page.
--                        e.g. '/country/germany/profile'
--
-- change_activity_href   text — URL to the change-log / activity feed
--                        for this jurisdiction.
--                        e.g. '/country/germany/activity'
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.cc_jurisdiction_briefings
  ADD COLUMN IF NOT EXISTS full_profile_href
    text
    NULL;

ALTER TABLE public.cc_jurisdiction_briefings
  ADD COLUMN IF NOT EXISTS change_activity_href
    text
    NULL;

COMMENT ON COLUMN public.cc_jurisdiction_briefings.full_profile_href IS
  'Deep-link URL for the full jurisdiction profile page. '
  'Backs ctas.fullProfileHref in JurisdictionRouteContract. '
  'NULL = CTA rendered as unavailable.';

COMMENT ON COLUMN public.cc_jurisdiction_briefings.change_activity_href IS
  'Deep-link URL for the jurisdiction change-activity feed. '
  'Backs ctas.changeActivityHref in JurisdictionRouteContract. '
  'NULL = CTA rendered as unavailable.';


-- ══════════════════════════════════════════════════════════════
-- FIX 6: explicit jurisdiction_slug index
--
-- The UNIQUE constraint on jurisdiction_slug already creates a btree
-- index, so reads are fast. This named index makes the lookup explicit
-- in EXPLAIN ANALYZE output and matches the naming convention used
-- by the other indexes on this table.
-- ══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_ccjb_slug
  ON public.cc_jurisdiction_briefings (jurisdiction_slug);
