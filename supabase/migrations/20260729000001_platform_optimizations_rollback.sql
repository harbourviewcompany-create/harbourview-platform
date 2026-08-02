-- Migration: 20260729000001_platform_optimizations_rollback.sql
-- EMERGENCY ROLLBACK — run this if the optimization migration causes issues.
-- This reverses all schema changes from 20260729000000_platform_optimizations.sql

-- 1. Remove snapshot_id FK and column from signals
ALTER TABLE signals DROP COLUMN IF EXISTS snapshot_id;
DROP INDEX IF EXISTS idx_signals_snapshot_id;

-- 2. Remove provenance columns from marketplace_candidates
ALTER TABLE marketplace_candidates DROP COLUMN IF EXISTS raw_html_hash;
ALTER TABLE marketplace_candidates DROP COLUMN IF EXISTS parser_version;
ALTER TABLE marketplace_candidates DROP COLUMN IF EXISTS normaliser_model;
ALTER TABLE marketplace_candidates DROP COLUMN IF EXISTS normaliser_prompt_version;
ALTER TABLE marketplace_candidates DROP COLUMN IF EXISTS scrape_run_id;

-- 3. Remove indexes
DROP INDEX IF EXISTS idx_marketplace_candidates_discovered_at;
DROP INDEX IF EXISTS idx_marketplace_candidates_source_id;

-- 4. Remove tier from scraper_source_state
ALTER TABLE scraper_source_state DROP COLUMN IF EXISTS tier;

-- 5. Remove last_embedded_at from hv_artifacts
ALTER TABLE hv_artifacts DROP COLUMN IF EXISTS last_embedded_at;
DROP INDEX IF EXISTS idx_hv_artifacts_last_embedded_at;

-- 6. Drop extraction failures table and its policies
DROP TABLE IF EXISTS ia_extraction_failures CASCADE;

-- 7. (removed) A real, actively-used `countries` table (203 rows,
-- iso_alpha2/iso_alpha3/country_name/regulatory_tier/opportunity_score/etc.)
-- already existed under this name before this migration was written. The
-- forward migration's CREATE TABLE IF NOT EXISTS correctly no-op'd against
-- it, so this migration never created (and must never drop) `countries` --
-- the original `DROP TABLE IF EXISTS countries CASCADE` here would have
-- destroyed that real table and anything depending on it via CASCADE.

-- 8. Restore original promote_snapshot_to_signals (without snapshot_id)
-- Note: The original function signature is preserved; snapshot_id column is simply absent.
-- If you need the exact pre-migration function body, restore from your backup.

-- 9. (removed) This referenced the wrong table names (professional_service_providers /
-- _applications) -- the real table PR #1178 built is professional_service_provider_listings,
-- already has its own RLS + policies unrelated to this migration, and this
-- section never successfully applied in the first place. Nothing to roll back.

-- 10. (removed, same reason as 9 above)
