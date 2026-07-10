-- Split out of 20260709000000_add_ratings_to_listings.sql on second review
-- (PR #1004): the original migration created these indexes with a plain
-- CREATE INDEX, which takes a lock that blocks writes to `listings` for the
-- duration of the build -- risky on a live table.
--
-- CREATE INDEX CONCURRENTLY cannot run inside a transaction block, and this
-- would be split across a transaction if it stayed in the same file as the
-- ALTER TABLE / CREATE FUNCTION / CREATE TRIGGER statements there. So, per
-- the precedent already set by 20260622130000_add_missing_fk_indexes_jun22.sql,
-- these two indexes get their own migration file.
--
-- Do NOT wrap this file in BEGIN/COMMIT -- CONCURRENTLY cannot run inside a
-- transaction block.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_avg_rating ON listings(average_rating DESC) WHERE average_rating > 0;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_review_count ON listings(review_count DESC);
