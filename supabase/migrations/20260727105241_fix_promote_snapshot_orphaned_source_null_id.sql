-- Fix: promote_snapshot_to_signals() had no guard for an orphaned source_id\n-- (snapshot references a source_registry row that no longer exists). When that\n-- happened, v_source came back entirely NULL, the md5() concatenation for\n-- v_signal_id collapsed to NULL, and the INSERT into signals failed its NOT NULL\n-- id constraint -- which aborted the ENTIRE daily promote_all_extracted_snapshots()\n-- batch, not just the one bad snapshot. This had been silently failing the whole\n-- batch daily; ~4,100 legitimate snapshots were backlogged behind ~21 orphaned ones\n-- in the captured_at-ordered queue.\n--\n-- Fix: (1) skip snapshots with a missing/orphaned source instead of erroring, and\n-- (2) wrap the per-snapshot call in the batch loop with its own exception handler\n-- so any future unknown failure degrades to skipping one row, not aborting the run.\n--\n-- Applied directly to production via Supabase MCP; committed here per\n-- docs/control/CONCURRENT_SESSION_COORDINATION.md (same-turn convention).\n\nCREATE OR REPLACE FUNCTION public.promote_snapshot_to_signals(p_snapshot_id uuid)
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

  -- Fix: source_id can be orphaned (source deleted from source_registry after the
  -- snapshot was captured). Without this guard, v_source is entirely NULL, the
  -- md5() concatenation below collapses to NULL, and the INSERT fails the
  -- signals.id NOT NULL constraint -- which previously aborted the ENTIRE daily
  -- batch in promote_all_extracted_snapshots(), not just this one snapshot.
  IF NOT FOUND OR v_source.source_name IS NULL THEN
    RETURN 0;
  END IF;

  -- Derive lead_weeks from tier (column removed from source_registry)
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
        AND v_text !~ '\m(cannabis|hemp|cannabinoid|cbd|thc|marijuana|chanvre|ca[nñ]amo|ganja|kannabis|bhang|marihuana|canabis)\M';
    END IF;

    v_headline := left(coalesce(
      v_candidate->>'text',
      v_snapshot.captured_title,
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
      reviewed, action, created_at
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
      false, '', now()
    )
    ON CONFLICT (id) DO NOTHING;

    v_promoted := v_promoted + 1;
  END LOOP;

  -- No self-referential UPDATE here — status is already 'extracted' when called
  RETURN v_promoted;
END;
$function$


CREATE OR REPLACE FUNCTION public.promote_all_extracted_snapshots()
 RETURNS TABLE(snapshot_id uuid, signals_promoted integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_snap record;
  v_count integer;
BEGIN
  FOR v_snap IN
    SELECT id FROM public.source_snapshots
    WHERE processing_status = 'extracted'
      AND signal_candidates IS NOT NULL
    ORDER BY captured_at DESC
  LOOP
    -- Defense in depth: one bad snapshot must never abort the whole daily batch
    -- again (this is exactly what happened before promote_snapshot_to_signals's
    -- orphaned-source guard was added -- one poison row silently failed the
    -- entire run, and everything queued behind it in captured_at order never
    -- got a chance to process).
    BEGIN
      SELECT public.promote_snapshot_to_signals(v_snap.id) INTO v_count;
    EXCEPTION WHEN OTHERS THEN
      v_count := -1; -- signal "this one errored" to the caller without aborting the batch
    END;
    snapshot_id      := v_snap.id;
    signals_promoted := v_count;
    RETURN NEXT;
  END LOOP;
END;
$function$
