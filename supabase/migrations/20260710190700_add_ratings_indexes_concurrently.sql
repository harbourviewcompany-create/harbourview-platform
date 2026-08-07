-- CONCURRENTLY removed 2026-08-05 for zero-state replay. The Supabase CLI sends
-- a migration's statements as one pipeline, and Postgres refuses CREATE INDEX
-- CONCURRENTLY there:
--   ERROR: CREATE INDEX CONCURRENTLY cannot be executed within a pipeline
--   (SQLSTATE 25001)
-- Only the keyword is dropped; every index name, table and column list below is
-- unchanged, so the resulting schema is identical. CONCURRENTLY exists to avoid
-- locking a populated table, which is meaningless against the empty database a
-- replay builds, and production already carries these indexes -- this version is
-- recorded in supabase_migrations.schema_migrations, applied there as a single
-- statement, which is why the pipeline rule never bit in production.

-- Split out of 20260709000000_add_ratings_to_listings.sql on second review
-- (PR #1004): the original migration created these indexes with a plain
-- CREATE INDEX, which takes a lock that blocks writes to `listings` for the
-- duration of the build -- risky on a live table.
--
-- CREATE INDEX cannot run inside a transaction block, and this
-- would be split across a transaction if it stayed in the same file as the
-- ALTER TABLE / CREATE FUNCTION / CREATE TRIGGER statements there. So, per
-- the precedent already set by 20260622130000_add_missing_fk_indexes_jun22.sql,
-- these two indexes get their own migration file.
--
-- Do NOT wrap this file in BEGIN/COMMIT -- cannot run inside a
-- transaction block.

CREATE INDEX IF NOT EXISTS idx_listings_avg_rating ON listings(average_rating DESC) WHERE average_rating > 0;
CREATE INDEX IF NOT EXISTS idx_listings_review_count ON listings(review_count DESC);
