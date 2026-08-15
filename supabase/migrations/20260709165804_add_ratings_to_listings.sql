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
-- version 20260709165804.
--
-- Rewriting this file cannot affect production: 20260709165804 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

ALTER TABLE listings
ADD COLUMN IF NOT EXISTS average_rating numeric(3,2) DEFAULT 0.0 CHECK (average_rating >= 0 AND average_rating <= 5.0),
ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 0 CHECK (review_count >= 0),
ADD COLUMN IF NOT EXISTS ratings_updated_at timestamptz DEFAULT now();

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

CREATE INDEX IF NOT EXISTS idx_listings_avg_rating ON listings(average_rating DESC) WHERE average_rating > 0;
CREATE INDEX IF NOT EXISTS idx_listings_review_count ON listings(review_count DESC);

COMMENT ON COLUMN listings.average_rating IS 'Average user rating (0-5)';
