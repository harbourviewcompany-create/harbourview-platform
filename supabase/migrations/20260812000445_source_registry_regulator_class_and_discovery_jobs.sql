-- Adds a structured 7-class regulator taxonomy to source_registry so coverage
-- per (country, class) can be queried programmatically instead of inferred
-- from source_name text. Backfills the classes for sources added in the
-- 2026-08-11 chat sourcing pass. Also adds a job-log table for the new
-- automated source-discovery pipeline (mirrors the _digest_jobs / intelligence_jobs
-- pattern already used elsewhere in this schema).

ALTER TABLE public.source_registry
  ADD COLUMN IF NOT EXISTS regulator_class text
    CHECK (regulator_class IN (
      'health_authority','drug_control_authority','official_gazette',
      'legislature','customs_import_export','procurement',
      'medicine_license_registry','other'
    )) DEFAULT 'other';

CREATE INDEX IF NOT EXISTS idx_source_registry_iso_regclass
  ON public.source_registry (iso, regulator_class)
  WHERE regulator_class IS NOT NULL AND regulator_class <> 'other';

-- Backfill this session's health_authority additions
UPDATE public.source_registry SET regulator_class = 'health_authority'
WHERE iso IN ('IQ','BH','QA','OM','MN','BD','KG','TJ','SO','SS','SD','RU','PS','YE','XK','SY','KI')
  AND regulator_class = 'other'
  AND notes ILIKE '%chat sourcing pass%'
  AND source_name ILIKE '%health%' OR source_name ILIKE '%medical%' OR source_name ILIKE '%moh%';

-- Backfill Kuwait's drug control authority addition
UPDATE public.source_registry SET regulator_class = 'drug_control_authority'
WHERE iso = 'KW' AND source_url = 'https://www.moi.gov.kw/main/sections/anti-drug?culture=en';

CREATE TABLE IF NOT EXISTS public.source_discovery_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  provider_used text,
  pairs_attempted int DEFAULT 0,
  candidates_found int DEFAULT 0,
  candidates_verified_live int DEFAULT 0,
  sources_inserted int DEFAULT 0,
  errors jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'running',
  detail jsonb DEFAULT '{}'::jsonb
);

COMMENT ON TABLE public.source_discovery_jobs IS 'Job log for the automated source-discovery-engine edge function (fills remaining regulator_class gaps in source_registry via grounded LLM web search + live URL verification). Added 2026-08-11.';
COMMENT ON COLUMN public.source_registry.regulator_class IS '7-class official-source taxonomy matching source_expansion_coverage_queue.required_source_classes_next. Added 2026-08-11.';