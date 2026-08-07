-- 1. Fix 40 null source_type entries (all are regulatory bodies)
UPDATE source_registry
SET source_type = 'regulator', updated_at = now()
WHERE source_type IS NULL;

-- 2. Marketplace scraper state table — tracks per-source cadence and failure streak
CREATE TABLE IF NOT EXISTS scraper_source_state (
  source_id            TEXT PRIMARY KEY,
  cadence_hours        INT  NOT NULL DEFAULT 24,
  last_run_at          TIMESTAMPTZ,
  last_success_at      TIMESTAMPTZ,
  consecutive_failures INT  NOT NULL DEFAULT 0,
  last_error           TEXT,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE scraper_source_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only" ON scraper_source_state
  FOR ALL USING (auth.role() = 'service_role');
