-- ============================================================
-- source_registry.metadata + public legal-tech API seeds
--
-- 1. Ensure metadata jsonb exists so APIDataAdapter can read
--    headers / auth_env / timeout_ms without a schema error.
-- 2. Seed two public, no-auth Tier-1 API sources that return JSON
--    and are useful for cannabis compliance intelligence.
--
-- acquire_crawl_targets returns setof public.source_registry, so
-- once the column exists the primary RPC path already includes it.
-- The task-queue mapRow on this branch forwards metadata to ScrapeTarget.
-- ============================================================

ALTER TABLE public.source_registry
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.source_registry.metadata IS
  'Optional adapter config. For adapter=api: { headers, accept, timeout_ms, auth_env }. Secrets must live in env vars referenced by auth_env, never in this column.';

-- Texas COA public compliance matrix (50-state hemp/cannabis matrix)
-- Docs: free, no API key, rate limit ~60 req/min/IP
INSERT INTO public.source_registry (
  source_name,
  source_url,
  iso,
  adapter,
  crawl_cadence,
  tier,
  content_type,
  language,
  requires_translation,
  is_active,
  crawl_allowed,
  metadata,
  source_type
)
SELECT
  'Texas COA — 50-state hemp compliance matrix',
  'https://texascoa.com/api/v1/coa/public/states',
  'US',
  'api',
  'daily',
  1,
  ARRAY['regulatory'],
  'en',
  false,
  true,
  true,
  '{"timeout_ms": 20000}'::jsonb,
  'regulatory'
WHERE NOT EXISTS (
  SELECT 1 FROM public.source_registry
  WHERE source_url = 'https://texascoa.com/api/v1/coa/public/states'
);

-- Note: single-SKU lookup endpoints need a query param; keep the matrix
-- feed as the stable daily crawl. Detail lookups can be driven later via
-- enrichment jobs that hit /api/v1/coa/public/lookup?sku=…

COMMENT ON TABLE public.source_registry IS
  'Unified source ledger for intelligence + marketplace estates. adapter in {html_snapshot,rss,api,playwright_full}. metadata jsonb holds adapter-specific config (no secrets).';
