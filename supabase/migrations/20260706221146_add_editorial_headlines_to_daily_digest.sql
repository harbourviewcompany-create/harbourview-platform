ALTER TABLE daily_digest
ADD COLUMN IF NOT EXISTS editorial_headlines jsonb;
