-- Repaired 2026-08-05. The comment block below was committed as one physical
-- line carrying literal backslash-n escapes instead of real newlines, and the
-- last thing on that line was this migration's first statement, the
-- DROP CONSTRAINT. The leading `--` commented it out, so replay went straight
-- to the ADD CONSTRAINT on the next line and collided with the constraint the
-- DROP was supposed to have removed:
--   ERROR: constraint "source_snapshots_processing_status_check" for relation
--   "source_snapshots" already exists (SQLSTATE 42710)
--
-- Fourth and last instance of this defect on this branch, after 20260727105241,
-- 20260727212340 and 20260728201438. Only the escapes were expanded; both
-- statements are unchanged and still match the live ledger row exactly:
--   ALTER TABLE ... DROP/ADD CONSTRAINT   383 chars, md5 5fc1cb510e7dae52b6ba1baa6e9be9d6
--   promote_snapshot_to_signals          5726 chars, md5 13f508342c5b724d44ffb380bb82322f
-- The ledger records the DROP and ADD as one statement, which is why the two
-- together hash as a single 383-character entry.

-- Fix: processing_status never advanced past 'extracted' after a snapshot was
-- promoted to signals, so promote_all_extracted_snapshots() (the daily catch-up
-- cron) re-scanned the entire historical pool of extracted snapshots every run,
-- forever -- not a shrinking backlog. Harmless (signal_id is a deterministic hash
-- and the INSERT uses ON CONFLICT DO NOTHING, so no duplicate signals could ever
-- result) but wasteful, and made "backlog remaining" a meaningless metric.
--
-- Also explains why snapshots could sit unpromoted for a while even with
-- trg_promote_snapshot (AFTER INSERT OR UPDATE OF processing_status) in place:
-- that trigger only fires on a transition INTO 'extracted'. If signal_candidates
-- gets populated by a later UPDATE that does not touch processing_status (already
-- 'extracted'), the trigger never fires, and only the daily cron would ever catch
-- it -- which is why the fix here matters for both paths, not just the cron one.
--
-- Fix: widen the processing_status CHECK constraint to allow a new terminal
-- 'promoted' value, and have promote_snapshot_to_signals() set it (or 'skipped'/
-- 'failed' for its early-exit paths) once a snapshot has actually been considered.
-- Verified end-to-end: ran the daily batch twice after this change -- first run
-- cleared the full backlog (4,140 snapshots, 1,685 additional signals promoted
-- beyond what an earlier manual run under the previous code already added),
-- second run processed exactly 0, confirming re-scanning has stopped.
--
-- Applied directly to production via Supabase MCP; committed here per
-- docs/control/CONCURRENT_SESSION_COORDINATION.md (same-turn convention).

ALTER TABLE public.source_snapshots DROP CONSTRAINT source_snapshots_processing_status_check;
ALTER TABLE public.source_snapshots ADD CONSTRAINT source_snapshots_processing_status_check
  CHECK (processing_status = ANY (ARRAY['pending'::text, 'pending_extraction'::text, 'processing'::text, 'extracted'::text, 'translated'::text, 'promoted'::text, 'failed'::text, 'skipped'::text]));

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

  -- Fix: mark a terminal status once this snapshot has been considered, so it
  -- stops being picked up by promote_all_extracted_snapshots() forever. Previously
  -- processing_status never advanced past 'extracted', so the daily batch re-scanned
  -- the entire historical pool every run (harmless -- signal_id is deterministic and
  -- INSERT uses ON CONFLICT DO NOTHING -- but wasteful, and "backlog remaining" was a
  -- meaningless metric as a result).
  IF v_snapshot.signal_candidates IS NULL THEN
    UPDATE public.source_snapshots SET processing_status = 'skipped' WHERE id = p_snapshot_id;
    RETURN 0;
  END IF;

  SELECT sr.source_name, sr.tier, sr.iso, sr.country, sr.region,
         sr.jurisdiction_code, sr.source_url, sr.sub_region
  INTO v_source
  FROM public.source_registry sr WHERE id = v_snapshot.source_id;

  IF NOT FOUND OR v_source.source_name IS NULL THEN
    UPDATE public.source_snapshots SET processing_status = 'failed' WHERE id = p_snapshot_id;
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

  UPDATE public.source_snapshots SET processing_status = 'promoted' WHERE id = p_snapshot_id;

  RETURN v_promoted;
END;
$function$
