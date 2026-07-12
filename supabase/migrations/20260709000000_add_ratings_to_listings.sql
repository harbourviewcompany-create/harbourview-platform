-- Add ratings support to unified marketplace listings
-- Aligns with review workflow and trust layer
--
-- Fixes applied on review of PR #1000:
--  1. Trigger is scoped to UPDATE OF the ratings columns (+ a WHEN guard) so
--     editing unrelated listing fields (title/price/status/etc.) no longer
--     bumps ratings_updated_at.
--  2. Trigger function pins search_path, matching the hardening already
--     applied to the sibling updated_at trigger in
--     20260501000002_set_marketplace_inquiries_updated_at_search_path.sql.
--  3. Trigger creation is idempotent (DROP IF EXISTS) like every other
--     statement in this file, so the migration can be re-run safely.
--  4. Replaced the RLS comment with an accurate note: no new policy is
--     added here because listings RLS is row-level, not column-scoped, so
--     these columns inherit existing access rules automatically.
--
-- Fixes applied on second review (this PR, #1004):
--  5. review_count is now bigint instead of integer -- avoids overflow risk
--     under real load (int tops out at ~2.1B, and this column is written by
--     automated review-ingestion paths, not just direct user action).
--  6. average_rating no longer defaults to 0.0. NULL is the correct "no
--     ratings yet" value -- 0.0 is indistinguishable from a real rock-bottom
--     rating. This is a low-risk change: every consumer already treats these
--     columns as nullable (see lib/server/listingsQuery.ts's
--     `average_rating: number | string | null` type and its
--     `average_rating.desc.nullslast` sort key, plus the `Number(x) || 0` /
--     `Number(x) > 0` defensive coercion in app/marketplace/listings/page.tsx,
--     app/dashboard/page.tsx, and app/country/[country]/role/[role]/page.tsx),
--     so no application-code changes are required. The CHECK constraint is
--     unaffected -- Postgres CHECK constraints pass automatically when the
--     expression evaluates to NULL.
--  7. The two CREATE INDEX statements that lived here were split out into
--     their own migration, 20260710160000_add_ratings_indexes_concurrently.sql,
--     so they can use CREATE INDEX CONCURRENTLY without a table lock.
--     CONCURRENTLY cannot run inside a transaction block, and this file also
--     contains transactional DDL (ALTER TABLE, CREATE FUNCTION, CREATE
--     TRIGGER) that must not be split across transactions -- so the indexes
--     need a dedicated file, matching the precedent already set by
--     20260622130000_add_missing_fk_indexes_jun22.sql.

ALTER TABLE listings
ADD COLUMN IF NOT EXISTS average_rating numeric(3,2) CHECK (average_rating >= 0 AND average_rating <= 5.0),
ADD COLUMN IF NOT EXISTS review_count bigint DEFAULT 0 CHECK (review_count >= 0),
ADD COLUMN IF NOT EXISTS ratings_updated_at timestamptz DEFAULT now();

-- Trigger to update timestamp only when ratings actually change
CREATE OR REPLACE FUNCTION update_ratings_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.ratings_updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_ratings_updated ON listings;

CREATE TRIGGER trigger_ratings_updated
BEFORE UPDATE OF average_rating, review_count ON listings
FOR EACH ROW
WHEN (
  NEW.average_rating IS DISTINCT FROM OLD.average_rating
  OR NEW.review_count IS DISTINCT FROM OLD.review_count
)
EXECUTE FUNCTION update_ratings_timestamp();

-- Indexes for sorting/filtering on average_rating/review_count are created
-- CONCURRENTLY in 20260710160000_add_ratings_indexes_concurrently.sql (see
-- fix #7 above) rather than here, since CONCURRENTLY cannot run inside a
-- transaction block alongside this file's other DDL.

-- No new RLS policy needed: existing listings RLS policies are row-level
-- (not column-enumerated), so these new columns inherit current read/write
-- access rules automatically. Run `get_advisors` post-deploy to confirm no
-- unintended column-level exposure was introduced.
COMMENT ON COLUMN listings.average_rating IS 'Average user rating (0-5)';
