-- Fix: promote_snapshot_to_signals() built the headline from the keyword-matched\n-- candidate snippet first, falling back to the real page <title> (captured_title)\n-- only if the candidate text was null (which it almost never is). For several\n-- source templates (Wikipedia navboxes, related-articles sidebars, menu widgets),\n-- the keyword scanner matches page chrome rather than the article itself, so the\n-- exact same boilerplate string got promoted as "the headline" for many unrelated\n-- countries at once. Verified directly: for every affected row checked,\n-- source_snapshots.captured_title held the correct real title.\n--\n-- Fix: prefer captured_title, fall back to candidate text only if the title is\n-- missing. Summary is unchanged (still prefers candidate text -- no better\n-- body-text alternative exists at this point in the pipeline).\n--\n-- Historical backfill considered and abandoned: there is no snapshot_id FK on\n-- signals, and the best available join (captured_at + source name) produces\n-- false matches whenever a source's crawl batch shares one captured_at across\n-- many snapshots -- sampled 12 "matches" before running anything and found both\n-- old and new headlines were legitimate but unrelated articles, i.e. the backfill\n-- would have silently replaced correct headlines with wrong ones. Forward-only fix.\n--\n-- Applied directly to production via Supabase MCP; committed here per\n-- docs/control/CONCURRENT_SESSION_COORDINATION.md (same-turn convention).\n\nCREATE OR REPLACE FUNCTION public.promote_snapshot_to_signals(p_snapshot_id uuid)
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
        AND v_text !~ '\m(cannabis|hemp|cannabinoid|cbd|thc|marijuana|chanvre|ca[nñ]amo|ganja|kannabis|bhang|marihuana|canabis)\M';
    END IF;

    -- Fix: prefer the real page <title> (captured_title) over the keyword-matched
    -- candidate snippet for the headline. The candidate snippet is scanned from
    -- whatever text on the page contains cannabis keywords, which for several
    -- source templates (Wikipedia navboxes, related-articles sidebars, menu
    -- widgets) is page chrome, not the actual article -- causing the exact same
    -- boilerplate string to get promoted as "the headline" for many unrelated
    -- countries at once. captured_title (the real <title> tag) does not have
    -- this failure mode. Candidate text remains the summary's first choice,
    -- since no better body-text alternative exists at this point in the pipeline.
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

  RETURN v_promoted;
END;
$function$
