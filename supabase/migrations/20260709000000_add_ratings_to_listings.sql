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

ALTER TABLE listings
ADD COLUMN IF NOT EXISTS average_rating numeric(3,2) DEFAULT 0.0 CHECK (average_rating >= 0 AND average_rating <= 5.0),
ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 0 CHECK (review_count >= 0),
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

-- Indexes for sorting/filtering
CREATE INDEX IF NOT EXISTS idx_listings_avg_rating ON listings(average_rating DESC) WHERE average_rating > 0;
CREATE INDEX IF NOT EXISTS idx_listings_review_count ON listings(review_count DESC);

-- No new RLS policy needed: existing listings RLS policies are row-level
-- (not column-enumerated), so these new columns inherit current read/write
-- access rules automatically. Run `get_advisors` post-deploy to confirm no
-- unintended column-level exposure was introduced.
COMMENT ON COLUMN listings.average_rating IS 'Average user rating (0-5)';
