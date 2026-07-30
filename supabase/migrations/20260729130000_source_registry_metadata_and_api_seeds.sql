-- ============================================================
-- source_registry.metadata + public legal-tech API seeds
--
-- 1. Ensure metadata jsonb exists so APIDataAdapter can read
--    headers / auth_env / timeout_ms without a schema error.
-- 2. Seed public, no-auth Tier-1/2 API sources that return JSON
--    and are useful for cannabis compliance + market intelligence.
--
-- acquire_crawl_targets returns setof public.source_registry, so
-- once the column exists the primary RPC path already includes it.
-- The task-queue mapRow on this branch forwards metadata to ScrapeTarget.
-- ============================================================

ALTER TABLE public.source_registry
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.source_registry.metadata IS
  'Optional adapter config. For adapter=api: { headers, accept, timeout_ms, auth_env }. Secrets must live in env vars referenced by auth_env, never in this column.';

-- ---------------------------------------------------------------------------
-- Helper pattern: INSERT … SELECT … WHERE NOT EXISTS (by source_url)
-- ---------------------------------------------------------------------------

-- 1) Texas COA — 50-state + DC hemp compliance matrix (public, no key)
INSERT INTO public.source_registry (
  source_name, source_url, iso, adapter, crawl_cadence, tier,
  content_type, language, requires_translation, is_active, crawl_allowed,
  metadata, source_type
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

-- 2) Texas COA — live state-check sample (TX flower) for enforcement-window signals
INSERT INTO public.source_registry (
  source_name, source_url, iso, adapter, crawl_cadence, tier,
  content_type, language, requires_translation, is_active, crawl_allowed,
  metadata, source_type
)
SELECT
  'Texas COA — TX flower state-check',
  'https://texascoa.com/api/v1/compliance/state-check?state=TX&product_type=flower',
  'US',
  'api',
  'daily',
  1,
  ARRAY['regulatory'],
  'en',
  false,
  true,
  true,
  '{"timeout_ms": 15000}'::jsonb,
  'regulatory'
WHERE NOT EXISTS (
  SELECT 1 FROM public.source_registry
  WHERE source_url = 'https://texascoa.com/api/v1/compliance/state-check?state=TX&product_type=flower'
);

-- 3) Nabis Platform — Universal Cannabis API well-known discovery document
INSERT INTO public.source_registry (
  source_name, source_url, iso, adapter, crawl_cadence, tier,
  content_type, language, requires_translation, is_active, crawl_allowed,
  metadata, source_type
)
SELECT
  'Nabis UCAPI well-known (cannabis-api.json)',
  'https://platform-api.nabis.pro/ucapi/.well-known/cannabis-api.json',
  'US',
  'api',
  'weekly',
  2,
  ARRAY['commercial'],
  'en',
  false,
  true,
  true,
  '{"timeout_ms": 15000}'::jsonb,
  'commercial'
WHERE NOT EXISTS (
  SELECT 1 FROM public.source_registry
  WHERE source_url = 'https://platform-api.nabis.pro/ucapi/.well-known/cannabis-api.json'
);

-- 4) Colorado open data — Marijuana Sales Revenue (Socrata SODA, public domain)
--    https://data.colorado.gov/resource/j7a3-jgd3.json
INSERT INTO public.source_registry (
  source_name, source_url, iso, adapter, crawl_cadence, tier,
  content_type, language, requires_translation, is_active, crawl_allowed,
  metadata, source_type
)
SELECT
  'Colorado CIM — Marijuana Sales Revenue (Socrata)',
  'https://data.colorado.gov/resource/j7a3-jgd3.json?$limit=5000',
  'US',
  'api',
  'weekly',
  1,
  ARRAY['regulatory', 'commercial'],
  'en',
  false,
  true,
  true,
  '{"timeout_ms": 30000}'::jsonb,
  'regulatory'
WHERE NOT EXISTS (
  SELECT 1 FROM public.source_registry
  WHERE source_url = 'https://data.colorado.gov/resource/j7a3-jgd3.json?$limit=5000'
);

-- 5) Colorado open data — Marijuana tax / retained revenue series (Socrata)
INSERT INTO public.source_registry (
  source_name, source_url, iso, adapter, crawl_cadence, tier,
  content_type, language, requires_translation, is_active, crawl_allowed,
  metadata, source_type
)
SELECT
  'Colorado CIM — Marijuana tax retained-by-state (Socrata)',
  'https://data.colorado.gov/resource/v9m8-x8dh.json?$limit=5000',
  'US',
  'api',
  'weekly',
  1,
  ARRAY['regulatory', 'commercial'],
  'en',
  false,
  true,
  true,
  '{"timeout_ms": 30000}'::jsonb,
  'regulatory'
WHERE NOT EXISTS (
  SELECT 1 FROM public.source_registry
  WHERE source_url = 'https://data.colorado.gov/resource/v9m8-x8dh.json?$limit=5000'
);

-- 6) Open Definition licenses catalog (open-data / compliance reference JSON)
--    Useful for provenance language on downstream products; not cannabis-specific
--    but supports “open data license” intelligence in market-entry materials.
INSERT INTO public.source_registry (
  source_name, source_url, iso, adapter, crawl_cadence, tier,
  content_type, language, requires_translation, is_active, crawl_allowed,
  metadata, source_type
)
SELECT
  'Open Definition — open licenses catalog (JSON)',
  'https://licenses.opendefinition.org/licenses/groups/all.json',
  'GLB',
  'api',
  'monthly',
  3,
  ARRAY['scientific'],
  'en',
  false,
  true,
  true,
  '{"timeout_ms": 15000}'::jsonb,
  'scientific'
WHERE NOT EXISTS (
  SELECT 1 FROM public.source_registry
  WHERE source_url = 'https://licenses.opendefinition.org/licenses/groups/all.json'
);

COMMENT ON TABLE public.source_registry IS
  'Unified source ledger for intelligence + marketplace estates. adapter in {html_snapshot,rss,api,playwright_full}. metadata jsonb holds adapter-specific config (no secrets).';
