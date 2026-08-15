-- Harbourview Source Expansion — Wave 1 structured authoritative sources
-- Control artifact: Harbourview_Source_Expansion_Audit_2026-08-10.xlsx
-- Audit SHA-256: 8a3e2df8c9c6fc7a8afc593229c3ec3e2b3299fcae7e63f813ea13de3d17b000
--
-- Scope:
--   SX-0005 ClinicalTrials.gov API
--   SX-0056 Federal Register API
--   SX-0054 FDA recalls / enforcement reports (drug + food endpoints)
--
-- This migration only configures source_registry. It does not fetch sources,
-- execute extraction, or publish intelligence during migration execution.
--
-- SX-0005 and SX-0056 already exist in production under stable UUIDs, but their
-- original creation is not reconstructible from the repository's zero-state
-- migration history. Use idempotent UUID-bound upserts so a fresh replay creates
-- the same two source identities while an existing production row retains its
-- health/history fields (last_checked_at, failure state, locks, etc.).

-- SX-0005: replace the existing generic HTML treatment of the ClinicalTrials.gov
-- v2 endpoint with record-level structured JSON capture.
INSERT INTO public.source_registry (
  id, source_name, source_url, jurisdiction, country, iso, region,
  is_active, requires_translation, language, adapter, crawl_cadence,
  relevance_status, tier, requires_auth, source_type, crawl_allowed,
  content_type, metadata
)
VALUES (
  'f1eba08c-6704-484c-b6c4-d9d6a452e9c3'::uuid,
  'ClinicalTrials.gov — Cannabis Studies',
  'https://clinicaltrials.gov/api/v2/studies?query.term=%28cannabis%20OR%20cannabidiol%20OR%20cannabinoid%20OR%20marijuana%29&pageSize=100',
  'Global', 'USA', 'US', 'Global',
  true, false, 'en', 'api', 'daily',
  'active', 1, false, 'scientific', true,
  ARRAY['research']::text[],
  jsonb_build_object(
    'audit_source_id', 'SX-0005',
    'source_class', 'clinical_scientific_registry',
    'structured_fetch', true,
    'records_path', 'studies',
    'identity_path', 'protocolSection.identificationModule.nctId',
    'title_path', 'protocolSection.identificationModule.briefTitle',
    'record_url_template', 'https://clinicaltrials.gov/study/{id}',
    'max_records', 100,
    'event_types', jsonb_build_array('trial_start', 'trial_status_change', 'trial_completion', 'trial_results'),
    'evidence_authority', 'primary_registry',
    'refresh_expectation', 'weekday_daily'
  )
)
ON CONFLICT (id) DO UPDATE SET
  source_name = EXCLUDED.source_name,
  source_url = EXCLUDED.source_url,
  source_type = EXCLUDED.source_type,
  adapter = EXCLUDED.adapter,
  crawl_cadence = EXCLUDED.crawl_cadence,
  relevance_status = EXCLUDED.relevance_status,
  is_active = EXCLUDED.is_active,
  crawl_allowed = EXCLUDED.crawl_allowed,
  content_type = EXCLUDED.content_type,
  metadata = COALESCE(public.source_registry.metadata, '{}'::jsonb) || EXCLUDED.metadata,
  updated_at = now();

-- SX-0056: convert the dormant Federal Register HTML search into the JSON API.
-- FederalRegister.gov is used for monitoring/discovery; downstream legal evidence
-- should retain the document's official-PDF/govinfo provenance when available.
INSERT INTO public.source_registry (
  id, source_name, source_url, jurisdiction, country, iso, region,
  is_active, requires_translation, language, adapter, crawl_cadence,
  relevance_status, tier, requires_auth, source_type, crawl_allowed,
  content_type, metadata
)
VALUES (
  'ea49c5e6-5bb0-4080-a66e-fe42d1f7034f'::uuid,
  'Federal Register — Cannabis Rulemaking Pipeline',
  'https://www.federalregister.gov/api/v1/documents.json?per_page=100&order=newest&conditions%5Bterm%5D=cannabis',
  NULL, NULL, NULL, 'north_america',
  true, false, 'en', 'api', 'daily',
  'active', 2, false, 'government_official', true,
  ARRAY['regulatory']::text[],
  jsonb_build_object(
    'audit_source_id', 'SX-0056',
    'source_class', 'government_gazette_rulemaking',
    'structured_fetch', true,
    'records_path', 'results',
    'identity_path', 'document_number',
    'title_path', 'title',
    'url_path', 'html_url',
    'max_records', 100,
    'event_types', jsonb_build_array('proposed_rule', 'final_rule', 'notice', 'hearing', 'effective_date_change'),
    'evidence_authority', 'official_information_interface',
    'legal_verification_required', 'govinfo_official_edition'
  )
)
ON CONFLICT (id) DO UPDATE SET
  source_name = EXCLUDED.source_name,
  source_url = EXCLUDED.source_url,
  source_type = EXCLUDED.source_type,
  adapter = EXCLUDED.adapter,
  crawl_cadence = EXCLUDED.crawl_cadence,
  relevance_status = EXCLUDED.relevance_status,
  is_active = EXCLUDED.is_active,
  crawl_allowed = EXCLUDED.crawl_allowed,
  content_type = EXCLUDED.content_type,
  metadata = COALESCE(public.source_registry.metadata, '{}'::jsonb) || EXCLUDED.metadata,
  updated_at = now();

-- SX-0054: drug enforcement/recall records from FDA RES via openFDA.
INSERT INTO public.source_registry (
  source_name, source_url, jurisdiction, country, iso, region,
  is_active, requires_translation, language, adapter, crawl_cadence,
  relevance_status, tier, requires_auth, source_type, crawl_allowed,
  content_type, metadata, last_checked_at, consecutive_failures
)
VALUES (
  'openFDA — Cannabis Drug Recall Enforcement',
  'https://api.fda.gov/drug/enforcement.json?search=cannabis&limit=100',
  'USA', 'United States', 'US', 'North America',
  true, false, 'en', 'api', 'weekly',
  'active', 1, false, 'regulator_official', true,
  ARRAY['regulatory']::text[],
  jsonb_build_object(
    'audit_source_id', 'SX-0054',
    'audit_child', 'drug_enforcement',
    'source_class', 'recall_enforcement',
    'structured_fetch', true,
    'records_path', 'results',
    'identity_path', 'recall_number',
    'title_path', 'product_description',
    'max_records', 100,
    'event_types', jsonb_build_array('recall', 'market_withdrawal', 'quality_defect', 'enforcement'),
    'evidence_authority', 'primary_regulator_dataset',
    'dataset', 'FDA Recall Enterprise System'
  ),
  NULL, 0
)
ON CONFLICT (source_url) DO UPDATE SET
  source_name = EXCLUDED.source_name,
  jurisdiction = EXCLUDED.jurisdiction,
  country = EXCLUDED.country,
  iso = EXCLUDED.iso,
  region = EXCLUDED.region,
  is_active = EXCLUDED.is_active,
  language = EXCLUDED.language,
  adapter = EXCLUDED.adapter,
  crawl_cadence = EXCLUDED.crawl_cadence,
  relevance_status = EXCLUDED.relevance_status,
  tier = EXCLUDED.tier,
  requires_auth = EXCLUDED.requires_auth,
  source_type = EXCLUDED.source_type,
  crawl_allowed = EXCLUDED.crawl_allowed,
  content_type = EXCLUDED.content_type,
  metadata = COALESCE(public.source_registry.metadata, '{}'::jsonb) || EXCLUDED.metadata,
  updated_at = now();

-- SX-0054 child endpoint: FDA RES food recalls captures cannabis/CBD ingestible
-- products that do not belong in the drug endpoint.
INSERT INTO public.source_registry (
  source_name, source_url, jurisdiction, country, iso, region,
  is_active, requires_translation, language, adapter, crawl_cadence,
  relevance_status, tier, requires_auth, source_type, crawl_allowed,
  content_type, metadata, last_checked_at, consecutive_failures
)
VALUES (
  'openFDA — Cannabis Food Recall Enforcement',
  'https://api.fda.gov/food/enforcement.json?search=cannabis&limit=100',
  'USA', 'United States', 'US', 'North America',
  true, false, 'en', 'api', 'weekly',
  'active', 1, false, 'regulator_official', true,
  ARRAY['regulatory']::text[],
  jsonb_build_object(
    'audit_source_id', 'SX-0054',
    'audit_child', 'food_enforcement',
    'source_class', 'recall_enforcement',
    'structured_fetch', true,
    'records_path', 'results',
    'identity_path', 'recall_number',
    'title_path', 'product_description',
    'max_records', 100,
    'event_types', jsonb_build_array('recall', 'market_withdrawal', 'quality_defect', 'enforcement'),
    'evidence_authority', 'primary_regulator_dataset',
    'dataset', 'FDA Recall Enterprise System'
  ),
  NULL, 0
)
ON CONFLICT (source_url) DO UPDATE SET
  source_name = EXCLUDED.source_name,
  jurisdiction = EXCLUDED.jurisdiction,
  country = EXCLUDED.country,
  iso = EXCLUDED.iso,
  region = EXCLUDED.region,
  is_active = EXCLUDED.is_active,
  language = EXCLUDED.language,
  adapter = EXCLUDED.adapter,
  crawl_cadence = EXCLUDED.crawl_cadence,
  relevance_status = EXCLUDED.relevance_status,
  tier = EXCLUDED.tier,
  requires_auth = EXCLUDED.requires_auth,
  source_type = EXCLUDED.source_type,
  crawl_allowed = EXCLUDED.crawl_allowed,
  content_type = EXCLUDED.content_type,
  metadata = COALESCE(public.source_registry.metadata, '{}'::jsonb) || EXCLUDED.metadata,
  updated_at = now();

-- Migration-local assertions: fail rather than silently claiming Wave 1 coverage.
DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*) INTO v_count
  FROM public.source_registry
  WHERE metadata->>'audit_source_id' IN ('SX-0005', 'SX-0054', 'SX-0056')
    AND is_active = true
    AND relevance_status = 'active'
    AND adapter = 'api'
    AND crawl_allowed = true
    AND COALESCE((metadata->>'structured_fetch')::boolean, false) = true;

  IF v_count <> 4 THEN
    RAISE EXCEPTION 'Wave 1 source assertion failed: expected 4 active structured API rows, found %', v_count;
  END IF;

  IF EXISTS (
    SELECT source_url
    FROM public.source_registry
    GROUP BY source_url
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Wave 1 source assertion failed: duplicate source_url detected';
  END IF;
END;
$$;
