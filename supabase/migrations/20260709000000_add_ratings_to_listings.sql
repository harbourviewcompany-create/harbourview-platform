-- Add ratings support to unified marketplace listings
-- Aligns with review workflow and trust layer

ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS average_rating numeric(3,2) DEFAULT 0.0 CHECK (average_rating >= 0 AND average_rating <= 5.0),
ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 0 CHECK (review_count >= 0),
ADD COLUMN IF NOT EXISTS ratings_updated_at timestamptz DEFAULT now();

-- Trigger to update timestamp
CREATE OR REPLACE FUNCTION update_ratings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ratings_updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_ratings_updated 
BEFORE UPDATE ON listings 
FOR EACH ROW EXECUTE FUNCTION update_ratings_timestamp();

-- Indexes for sorting/filtering
CREATE INDEX IF NOT EXISTS idx_listings_avg_rating ON listings(average_rating DESC) WHERE average_rating > 0;
CREATE INDEX IF NOT EXISTS idx_listings_review_count ON listings(review_count DESC);

-- RLS: Public read, admin/service write (consistent with existing patterns)
COMMENT ON COLUMN listings.average_rating IS 'Average user rating (0-5)';