-- Harbourview structured tabular authority sources
--
-- Adds record-level source-engine capture for authoritative HTML tables that were
-- previously reduced to one opaque page snapshot or handled through manual workbook
-- acquisition. This migration configures source_registry only. It does not fetch,
-- promote, publish, or mutate downstream intelligence during migration execution.
--
-- Verified source scope as of 2026-08-12:
--   Health Canada: complete published cultivator/processor/medical-seller table.
--   ODC cultivators/producers: consent-based public list, not the full licence universe.
--   ODC manufacturers/importers: consent-based public lists, not the full licence universe.
--   TGA product list: products supplied through SAS/AP 2025-07-01..2025-12-31 and
--                     reported by sponsors within the required reporting window;
--                     inclusion does not guarantee current availability.

INSERT INTO public.source_registry (
  source_name, source_url, jurisdiction, country, iso, region,
  is_active, requires_translation, language, adapter, crawl_cadence,
  relevance_status, tier, requires_auth, source_type, crawl_allowed,
  content_type, metadata, last_checked_at, consecutive_failures
)
VALUES
(
  'Health Canada — Licensed Cannabis Cultivators, Processors and Medical Sellers',
  'https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/industry-licensees-applicants/licensed-cultivators-processors-sellers.html',
  'Canada', 'Canada', 'CA', 'North America',
  true, false, 'en', 'html_snapshot', 'daily',
  'active', 1, false, 'regulator_official', true,
  ARRAY['regulatory']::text[],
  jsonb_build_object(
    'source_class', 'cannabis_licence_registry',
    'structured_fetch', true,
    'structured_format', 'html_table',
    'table_index', 0,
    'header_rows', 2,
    'columns', jsonb_build_array(
      'licence_holder', 'province_territory', 'licences',
      'authorized_sale_provincial_territorial', 'authorized_sale_registered_patients',
      'client_care_phone', 'initial_licensing_date'
    ),
    'identity_columns', jsonb_build_array('licence_holder', 'province_territory', 'initial_licensing_date'),
    'title_column', 'licence_holder',
    'max_records', 2500,
    'event_types', jsonb_build_array('licence_added', 'licence_changed', 'sale_authorization_changed', 'licence_removed'),
    'evidence_authority', 'primary_regulator_registry',
    'coverage_claim', 'all_current_cultivators_processors_and_sellers_in_published_table',
    'export_capability_inference_allowed', false
  ),
  NULL, 0
),
(
  'Australia ODC — Medicinal Cannabis Cultivators and Producers',
  'https://www.odc.gov.au/medicinal-cannabis/list-approved-medicinal-cannabis-cultivators-and-producers-australia',
  'Australia', 'Australia', 'AU', 'Oceania',
  true, false, 'en', 'html_snapshot', 'weekly',
  'active', 1, false, 'regulator_official', true,
  ARRAY['regulatory']::text[],
  jsonb_build_object(
    'source_class', 'medicinal_cannabis_licence_registry',
    'structured_fetch', true,
    'structured_format', 'html_table',
    'table_index', 0,
    'identity_columns', jsonb_build_array('licence_holder'),
    'title_column', 'licence_holder',
    'max_records', 500,
    'event_types', jsonb_build_array('public_licence_holder_added', 'licensed_activity_changed', 'public_licence_holder_removed'),
    'evidence_authority', 'primary_regulator_public_disclosure',
    'coverage_claim', 'consent_based_public_subset_only',
    'full_licence_universe', false
  ),
  NULL, 0
),
(
  'Australia ODC — Medicinal Cannabis Manufacturers and Importers',
  'https://www.odc.gov.au/medicinal-cannabis/list-approved-manufacturers-and-suppliers-medicinal-cannabis-products',
  'Australia', 'Australia', 'AU', 'Oceania',
  true, false, 'en', 'html_snapshot', 'weekly',
  'active', 1, false, 'regulator_official', true,
  ARRAY['regulatory']::text[],
  jsonb_build_object(
    'source_class', 'medicinal_cannabis_manufacturer_importer_registry',
    'structured_fetch', true,
    'structured_format', 'html_table',
    'columns', jsonb_build_array('name', 'contact_details'),
    'identity_columns', jsonb_build_array('_table_label', 'name'),
    'title_column', 'name',
    'max_records', 500,
    'event_types', jsonb_build_array('public_manufacturer_added', 'public_importer_added', 'public_supplier_removed'),
    'evidence_authority', 'primary_regulator_public_disclosure',
    'table_roles', jsonb_build_object('Manufacturers', 'manufacturer', 'Importers', 'importer'),
    'coverage_claim', 'consent_based_public_subset_only',
    'full_licence_universe', false
  ),
  NULL, 0
),
(
  'Australia TGA — Medicinal Cannabis SAS/AP Product and Sponsor List',
  'https://www.tga.gov.au/resources/explore-topic/medicinal-cannabis-hub/medicinal-cannabis-product-list',
  'Australia', 'Australia', 'AU', 'Oceania',
  true, false, 'en', 'html_snapshot', 'weekly',
  'active', 1, false, 'regulator_official', true,
  ARRAY['regulatory']::text[],
  jsonb_build_object(
    'source_class', 'medicinal_cannabis_product_sponsor_registry',
    'structured_fetch', true,
    'structured_format', 'html_table',
    'columns', jsonb_build_array('dosage_form', 'active_ingredients', 'qty_per_dosage_unit', 'name_of_sponsor'),
    'identity_columns', jsonb_build_array('_table_label', 'dosage_form', 'active_ingredients', 'qty_per_dosage_unit', 'name_of_sponsor'),
    'title_column', 'name_of_sponsor',
    'max_records', 2500,
    'event_types', jsonb_build_array('product_reported', 'product_removed_from_reporting_window', 'sponsor_changed'),
    'evidence_authority', 'primary_regulator_sponsor_reporting',
    'reporting_window_start', '2025-07-01',
    'reporting_window_end', '2025-12-31',
    'published_updated_at', '2026-03-25',
    'availability_guaranteed', false,
    'coverage_claim', 'sas_ap_supplied_and_timely_sponsor_reported_products_only'
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
  requires_translation = EXCLUDED.requires_translation,
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

DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*) INTO v_count
  FROM public.source_registry
  WHERE source_url IN (
    'https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/industry-licensees-applicants/licensed-cultivators-processors-sellers.html',
    'https://www.odc.gov.au/medicinal-cannabis/list-approved-medicinal-cannabis-cultivators-and-producers-australia',
    'https://www.odc.gov.au/medicinal-cannabis/list-approved-manufacturers-and-suppliers-medicinal-cannabis-products',
    'https://www.tga.gov.au/resources/explore-topic/medicinal-cannabis-hub/medicinal-cannabis-product-list'
  )
    AND is_active = true
    AND relevance_status = 'active'
    AND crawl_allowed = true
    AND COALESCE((metadata->>'structured_fetch')::boolean, false) = true
    AND metadata->>'structured_format' = 'html_table'
    AND jsonb_array_length(COALESCE(metadata->'identity_columns', '[]'::jsonb)) > 0;

  IF v_count <> 4 THEN
    RAISE EXCEPTION 'Structured authority source assertion failed: expected 4 active tabular sources, found %', v_count;
  END IF;

  IF EXISTS (
    SELECT source_url
    FROM public.source_registry
    GROUP BY source_url
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Structured authority source assertion failed: duplicate source_url detected';
  END IF;
END;
$$;
