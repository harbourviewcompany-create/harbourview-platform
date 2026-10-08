-- Migration: 20260729000000_platform_optimizations.sql
-- Comprehensive schema improvements for scraper v2, data quality, and observability.

-- 1. Add snapshot_id FK to signals (enables backfills and audit trails)
ALTER TABLE signals ADD COLUMN IF NOT EXISTS snapshot_id UUID REFERENCES source_snapshots(id);
CREATE INDEX IF NOT EXISTS idx_signals_snapshot_id ON signals(snapshot_id);

-- 2. Add provenance columns to marketplace_candidates
ALTER TABLE marketplace_candidates ADD COLUMN IF NOT EXISTS raw_html_hash TEXT;
ALTER TABLE marketplace_candidates ADD COLUMN IF NOT EXISTS parser_version TEXT DEFAULT '1.0.0';
ALTER TABLE marketplace_candidates ADD COLUMN IF NOT EXISTS normaliser_model TEXT;
ALTER TABLE marketplace_candidates ADD COLUMN IF NOT EXISTS normaliser_prompt_version TEXT DEFAULT '1.0.0';
ALTER TABLE marketplace_candidates ADD COLUMN IF NOT EXISTS scrape_run_id TEXT;

-- 3. Index discovered_at for faster dedup queries
CREATE INDEX IF NOT EXISTS idx_marketplace_candidates_discovered_at ON marketplace_candidates(discovered_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_candidates_source_id ON marketplace_candidates(source_id);

-- 4. Add tier column to scraper_source_state for health alerting
ALTER TABLE scraper_source_state ADD COLUMN IF NOT EXISTS tier INT DEFAULT 3;

-- 5. Add last_embedded_at to hv_artifacts for embedding freshness tracking
ALTER TABLE hv_artifacts ADD COLUMN IF NOT EXISTS last_embedded_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_hv_artifacts_last_embedded_at ON hv_artifacts(last_embedded_at);

-- 6. Create ia_extraction_failures quarantine table
CREATE TABLE IF NOT EXISTS ia_extraction_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staging_id UUID REFERENCES hv_import_staging(id),
  raw_payload JSONB,
  error_reason TEXT NOT NULL,
  retry_count INT DEFAULT 0,
  model_used TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_ia_extraction_failures_retry ON ia_extraction_failures(retry_count, created_at)
  WHERE retry_count < 3 AND resolved_at IS NULL;

-- 7. (removed) `countries` reference table: a real, actively-used table
-- already exists under this name — 203 rows, columns iso_alpha2/iso_alpha3/
-- country_name/region/regulatory_tier/opportunity_score/etc., consumed by
-- lib/globe/supabaseGlobeData.ts, lib/dashboard/dashboardLiveData.ts, and
-- lib/dashboard/getCountryMarketSignals.ts. This migration's simplified
-- CREATE TABLE IF NOT EXISTS (iso2/iso3/name/region) correctly no-op'd
-- against it, but the seed INSERT below it referenced columns that don't
-- exist on the real table and would have failed outright. Confirmed no file
-- changed by this PR queries a `countries` table with these column names --
-- removed rather than fixed, since there's nothing here to reconcile with.

-- 8. Add RLS to ia_extraction_failures
ALTER TABLE ia_extraction_failures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view extraction failures"
  ON ia_extraction_failures FOR SELECT
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'));

CREATE POLICY "System can insert extraction failures"
  ON ia_extraction_failures FOR INSERT
  WITH CHECK (true);

-- 9. (removed) RLS for professional_service_providers/_applications: wrong
-- table names. The real table PR #1178 built is
-- professional_service_provider_listings (one table, not split into
-- providers/applications), which already has its own RLS enabled and two
-- policies ("Public can view approved listings", "Authenticated users can
-- apply to be listed") -- unrelated to and predating this migration.

-- 10. Update promote_snapshot_to_signals to populate snapshot_id
CREATE OR REPLACE FUNCTION public.promote_snapshot_to_signals(p_snapshot_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_snapshot  record;
  v_source    record;
  v_candidate jsonb;
  v_candidates_arr jsonb;
  v_scoring   jsonb;
  v_signal_id text;
  v_promoted  integer := 0;
  v_headline  text;
  v_summary   text;
  v_top_lane  text;
  v_text      text;
  v_lead_weeks integer;
BEGIN
  SELECT * INTO v_snapshot FROM public.source_snapshots WHERE id = p_snapshot_id;
  IF NOT FOUND THEN RETURN 0; END IF;
  IF v_snapshot.processing_status != 'extracted' THEN RETURN 0; END IF;
  IF v_snapshot.signal_candidates IS NULL THEN RETURN 0; END IF;

  SELECT sr.source_name, sr.tier, sr.iso, sr.country, sr.region,
         sr.jurisdiction_code, sr.source_url, sr.sub_region
  INTO v_source
  FROM public.source_registry sr WHERE id = v_snapshot.source_id;

  IF NOT FOUND OR v_source.source_name IS NULL THEN
    RETURN 0;
  END IF;

  v_lead_weeks := CASE
    WHEN v_source.tier = 1 THEN 12
    WHEN v_source.tier = 2 THEN 6
    ELSE 4
  END;

  IF jsonb_typeof(v_snapshot.signal_candidates) = 'array' THEN
    v_candidates_arr := v_snapshot.signal_candidates;
  ELSE
    v_candidates_arr := jsonb_build_array(v_snapshot.signal_candidates);
  END IF;

  FOR v_candidate IN
    SELECT value FROM jsonb_array_elements(v_candidates_arr)
  LOOP
    v_text := lower(coalesce(v_candidate->>'text', ''));

    IF v_candidate->>'keyword_count' IS NULL THEN
      CONTINUE WHEN (v_candidate->'matched_keywords' IS NULL
                     OR jsonb_array_length(coalesce(v_candidate->'matched_keywords','[]'::jsonb)) = 0);
    ELSE
      CONTINUE WHEN (v_candidate->>'keyword_count')::int < 2
        AND v_text !~ '\\m(cannabis|hemp|cannabinoid|cbd|thc|marijuana|chanvre|ca[nñ]amo|ganja|kannabis|bhang|marihuana|canabis)\\M';
    END IF;

    v_headline := left(coalesce(
      v_snapshot.captured_title,
      v_candidate->>'text',
      v_source.source_name
    ), 200);

    v_summary := coalesce(
      v_candidate->>'text',
      v_candidate->>'summary',
      v_snapshot.captured_title,
      v_source.source_name
    );

    CONTINUE WHEN v_headline ILIKE '%opens new tab%'
      OR v_headline ILIKE '%creative commons%'
      OR v_headline ILIKE '%code of conduct%'
      OR v_headline ILIKE '%hardware, software%'
      OR v_headline ILIKE '%covid-19%'
      OR length(trim(v_headline)) < 30;

    IF EXISTS (
      SELECT 1 FROM public.signals
      WHERE source = v_source.source_name
        AND headline = v_headline
        AND date > now() - interval '30 days'
    ) THEN CONTINUE; END IF;

    v_scoring := public.score_signal_from_snapshot(
      v_snapshot.intelligence_pass,
      v_lead_weeks,
      coalesce((v_candidate->>'keyword_count')::int,
               jsonb_array_length(coalesce(v_candidate->'matched_keywords','[]'::jsonb)))
    );

    v_top_lane := CASE
      WHEN (v_scoring->>'lane_r')::int >= (v_scoring->>'lane_e')::int
       AND (v_scoring->>'lane_r')::int >= (v_scoring->>'lane_t')::int THEN 'Regulatory'
      WHEN (v_scoring->>'lane_e')::int >= (v_scoring->>'lane_t')::int THEN 'Economic'
      ELSE 'Trade'
    END;

    v_signal_id := left(md5(v_source.source_name || v_headline || v_snapshot.captured_at::text), 20);

    INSERT INTO public.signals (
      id, date, cat, pri, score, headline, summary,
      source, url, verification, tier, lang,
      company, country, in_network,
      lane_r, lane_e, lane_t, top_lane,
      query_pack, commercial_impact,
      reviewed, action, created_at, snapshot_id
    ) VALUES (
      v_signal_id,
      COALESCE(v_snapshot.captured_at, now()),
      CASE v_snapshot.intelligence_pass
        WHEN 1 THEN 'GAZETTE' WHEN 2 THEN 'PARLIAMENTARY'
        WHEN 3 THEN 'PROCUREMENT' WHEN 4 THEN 'MDB_PROJECT'
        ELSE 'SOURCE_ENGINE'
      END,
      v_scoring->>'pri',
      (v_scoring->>'score')::int,
      v_headline, v_summary,
      v_source.source_name, v_source.source_url,
      'source_engine_v1',
      CASE v_snapshot.intelligence_pass
        WHEN 1 THEN 'Tier 1' WHEN 2 THEN 'Tier 1'
        WHEN 3 THEN 'Tier 2' WHEN 4 THEN 'Tier 2'
        ELSE 'Tier 3'
      END,
      COALESCE(v_snapshot.language_detected, 'en'),
      NULL, v_source.country, false,
      (v_scoring->>'lane_r')::int,
      (v_scoring->>'lane_e')::int,
      (v_scoring->>'lane_t')::int,
      v_top_lane,
      'SP-' || COALESCE(v_snapshot.intelligence_pass::text, 'X')
        || ' | ' || COALESCE(v_source.sub_region, v_source.country, 'Global'),
      CASE
        WHEN (v_scoring->>'score')::int >= 75 THEN 'Immediate trade or market-access relevance'
        WHEN (v_scoring->>'score')::int >= 50 THEN 'Likely trade or market-access relevance'
        ELSE 'Monitor for developing relevance'
      END,
      false, '', now(), p_snapshot_id
    )
    ON CONFLICT (id) DO NOTHING;

    v_promoted := v_promoted + 1;
  END LOOP;

  RETURN v_promoted;
END;
$function$;
