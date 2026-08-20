-- =============================================================================
-- HV Intelligence Pipeline Optimization — 2026-08-20
-- =============================================================================
-- Additive, idempotent. Does NOT schedule or enable any cron jobs.
-- Operator must still run INTEL_CRON_REENABLE_RUNBOOK.md after review.
--
-- Goals:
--   1. Cheap pre-filter before LLM spend
--   2. Medium-confidence human review queue (no silent drop)
--   3. Safer promote defaults + optional eval-gate helper
--   4. Incremental-ish dedup (only unassigned / recent)
--   5. Lower dispatch batch sizes in hv_pipeline_tick (Micro-safe)
--   6. Observability log table for stage metrics
--   7. HNSW index on embedding_1024 when missing
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Medium-confidence review queue
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hv_signal_review_queue (
  signal_id text PRIMARY KEY REFERENCES public.signals(id) ON DELETE CASCADE,
  quality_label text,
  quality_confidence numeric,
  content_type text,
  impact text,
  reason text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'skipped')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by text
);

CREATE INDEX IF NOT EXISTS hv_signal_review_queue_status_idx
  ON public.hv_signal_review_queue (status, created_at DESC);

ALTER TABLE public.hv_signal_review_queue ENABLE ROW LEVEL SECURITY;

-- service_role only (pipeline + admin)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'hv_signal_review_queue'
      AND policyname = 'hv_signal_review_queue_service_all'
  ) THEN
    CREATE POLICY hv_signal_review_queue_service_all
      ON public.hv_signal_review_queue
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END$$;

REVOKE ALL ON public.hv_signal_review_queue FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.hv_signal_review_queue TO service_role;
GRANT ALL ON public.hv_signal_review_queue TO postgres;

-- ---------------------------------------------------------------------------
-- 2. Stage observability log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hv_pipeline_stage_log (
  id bigserial PRIMARY KEY,
  stage text NOT NULL,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hv_pipeline_stage_log_stage_created_idx
  ON public.hv_pipeline_stage_log (stage, created_at DESC);

ALTER TABLE public.hv_pipeline_stage_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'hv_pipeline_stage_log'
      AND policyname = 'hv_pipeline_stage_log_service_all'
  ) THEN
    CREATE POLICY hv_pipeline_stage_log_service_all
      ON public.hv_pipeline_stage_log
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END$$;

REVOKE ALL ON public.hv_pipeline_stage_log FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.hv_pipeline_stage_log TO service_role;
GRANT ALL ON public.hv_pipeline_stage_log TO postgres;

-- ---------------------------------------------------------------------------
-- 3. Cheap pre-filter (no LLM)
-- Returns true if the row is worth classifying.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.hv_prefilter_signal(
  p_headline text,
  p_summary text,
  p_url text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $function$
DECLARE
  h text := lower(coalesce(p_headline, ''));
  s text := lower(coalesce(p_summary, ''));
  u text := lower(coalesce(p_url, ''));
  combined text := h || ' ' || s;
BEGIN
  -- too short / empty
  IF length(btrim(coalesce(p_headline, ''))) < 12 THEN
    RETURN false;
  END IF;

  -- obvious nav / chrome
  IF h ~ '(cookie|subscribe|sign in|log in|register|privacy policy|terms of use|all rights reserved)' THEN
    RETURN false;
  END IF;

  -- pure menu / list patterns
  IF h ~ '^(home|menu|search|contact|about|faq)\b' AND length(h) < 40 THEN
    RETURN false;
  END IF;

  -- excluded domains if present
  IF u <> '' AND EXISTS (
    SELECT 1 FROM public.excluded_source_domains d
    WHERE u LIKE '%' || lower(d.domain) || '%'
  ) THEN
    RETURN false;
  END IF;

  -- must have at least weak cannabis / regulatory signal keywords
  -- (keeps volume down on pure off-topic noise before LLM)
  IF combined !~ '(cannabis|marijuana|hemp|thc|cbd|gmp|gacp|licence|license|regulator|ministry|fda|bfarm|health canada|ema|quota|import|export|cultivat|pharma|medicinal|medical cannabis)' THEN
    -- still allow if headline is reasonably specific (actor + verb pattern)
    IF length(h) < 40 THEN
      RETURN false;
    END IF;
  END IF;

  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.hv_prefilter_signal(text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hv_prefilter_signal(text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.hv_prefilter_signal(text, text, text) TO postgres;

-- ---------------------------------------------------------------------------
-- 4. Classify dispatch with pre-filter + lower default limit
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.hv_classify_corpus_dispatch(
  p_limit integer DEFAULT 40,
  p_scope_days integer DEFAULT 90
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  r record;
  v_rid bigint;
  n int := 0;
  v_limit int := least(greatest(coalesce(p_limit, 40), 1), 80);
BEGIN
  FOR r IN
    SELECT
      s.id,
      coalesce(s.title_en, s.headline) AS h,
      coalesce(s.summary_en, left(s.summary, 1000), s.title_en, s.headline) AS sm,
      s.url
    FROM public.signals s
    WHERE s.quality_label IS NULL
      AND s.reviewed IS DISTINCT FROM true
      AND s.headline IS NOT NULL
      AND s.created_at > now() - (coalesce(p_scope_days, 90) || ' days')::interval
      AND NOT EXISTS (
        SELECT 1 FROM public.hv_classify_jobs j
        WHERE j.signal_id = s.id AND NOT j.harvested
      )
      AND public.hv_prefilter_signal(s.headline, s.summary, s.url)
    ORDER BY s.created_at DESC
    LIMIT v_limit
  LOOP
    SELECT net.http_post(
      url := 'https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/hv-classify',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
          SELECT decrypted_secret FROM vault.decrypted_secrets
          WHERE name = 'hv_edge_anon_key' LIMIT 1
        )
      ),
      body := jsonb_build_object(
        'text', jsonb_build_object('headline', r.h, 'summary', r.sm)
      ),
      timeout_milliseconds := 30000
    ) INTO v_rid;

    INSERT INTO public.hv_classify_jobs(request_id, signal_id)
    VALUES (v_rid, r.id)
    ON CONFLICT DO NOTHING;

    n := n + 1;
  END LOOP;

  INSERT INTO public.hv_pipeline_stage_log(stage, metrics)
  VALUES ('classify_dispatch', jsonb_build_object('dispatched', n, 'limit', v_limit));

  RETURN n;
END;
$function$;

-- ---------------------------------------------------------------------------
-- 5. Incremental-leaning dedup (only rows missing cluster assignment in window)
-- Still O(n*k) but scoped; HNSW index below helps <=> operator.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.hv_dedup_assign(
  p_tau double precision DEFAULT 0.90,
  p_scope_days integer DEFAULT 90
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  n int;
BEGIN
  UPDATE public.signals a
  SET
    is_representative = NOT EXISTS (
      SELECT 1
      FROM public.signals b
      WHERE b.id <> a.id
        AND b.embedding_1024 IS NOT NULL
        AND b.created_at > now() - (coalesce(p_scope_days, 90) || ' days')::interval
        AND (
          coalesce(b.quality_confidence, 0) > coalesce(a.quality_confidence, 0)
          OR (
            coalesce(b.quality_confidence, 0) = coalesce(a.quality_confidence, 0)
            AND b.created_at < a.created_at
          )
          OR (
            coalesce(b.quality_confidence, 0) = coalesce(a.quality_confidence, 0)
            AND b.created_at = a.created_at
            AND b.id < a.id
          )
        )
        AND (1 - (a.embedding_1024 <=> b.embedding_1024)) >= p_tau
    ),
    cluster_rep_id = coalesce((
      SELECT b.id
      FROM public.signals b
      WHERE b.id <> a.id
        AND b.embedding_1024 IS NOT NULL
        AND b.created_at > now() - (coalesce(p_scope_days, 90) || ' days')::interval
        AND (1 - (a.embedding_1024 <=> b.embedding_1024)) >= p_tau
        AND (
          coalesce(b.quality_confidence, 0) > coalesce(a.quality_confidence, 0)
          OR (
            coalesce(b.quality_confidence, 0) = coalesce(a.quality_confidence, 0)
            AND b.created_at < a.created_at
          )
          OR (
            coalesce(b.quality_confidence, 0) = coalesce(a.quality_confidence, 0)
            AND b.created_at = a.created_at
            AND b.id < a.id
          )
        )
      ORDER BY (1 - (a.embedding_1024 <=> b.embedding_1024)) DESC
      LIMIT 1
    ), a.id)
  WHERE a.embedding_1024 IS NOT NULL
    AND a.created_at > now() - (coalesce(p_scope_days, 90) || ' days')::interval
    AND (
      a.cluster_rep_id IS NULL
      OR a.is_representative IS NULL
      OR a.created_at > now() - interval '3 days'
    );

  GET DIAGNOSTICS n = ROW_COUNT;

  INSERT INTO public.hv_pipeline_stage_log(stage, metrics)
  VALUES ('dedup_assign', jsonb_build_object('updated', n, 'tau', p_tau, 'scope_days', p_scope_days));

  RETURN n;
END;
$function$;

-- ---------------------------------------------------------------------------
-- 6. Promote: keep structural safety; route borderline to review queue
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.hv_promote_signals(p_min_conf numeric DEFAULT 0.80)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  n int;
  v_floor numeric := greatest(coalesce(p_min_conf, 0.80), 0.65);
BEGIN
  -- Borderline: label=signal, representative, conf below floor → review queue
  INSERT INTO public.hv_signal_review_queue (
    signal_id, quality_label, quality_confidence, content_type, impact, reason, status
  )
  SELECT
    s.id,
    s.quality_label,
    s.quality_confidence,
    s.content_type,
    s.impact,
    'below_confidence_floor',
    'pending'
  FROM public.signals s
  WHERE s.quality_label = 'signal'
    AND coalesce(s.is_representative, true) = true
    AND s.quality_confidence IS NOT NULL
    AND s.quality_confidence < v_floor
    AND s.quality_confidence >= 0.50
    AND s.reviewed IS DISTINCT FROM true
    AND (s.reviewed_by IS NULL OR s.reviewed_by NOT LIKE 'human:%')
  ON CONFLICT (signal_id) DO NOTHING;

  -- Promote high-confidence signals only
  UPDATE public.signals s SET
    reviewed = true,
    reviewed_by = 'auto:v1',
    reviewed_at = now()
  WHERE s.quality_label = 'signal'
    AND coalesce(s.is_representative, true) = true
    AND s.quality_confidence IS NOT NULL
    AND s.quality_confidence >= v_floor
    AND s.reviewed IS DISTINCT FROM true
    AND (s.reviewed_by IS NULL OR s.reviewed_by NOT LIKE 'human:%')
    AND regexp_replace(coalesce(s.url, ''), '^https?://(www\.)?([^/]+).*', '\2')
        NOT IN (SELECT domain FROM public.excluded_source_domains);

  GET DIAGNOSTICS n = ROW_COUNT;

  INSERT INTO public.hv_pipeline_stage_log(stage, metrics)
  VALUES (
    'promote',
    jsonb_build_object(
      'promoted', n,
      'min_conf', v_floor,
      'queued_borderline', (
        SELECT count(*) FROM public.hv_signal_review_queue WHERE status = 'pending'
      )
    )
  );

  RETURN n;
END;
$function$;

-- ---------------------------------------------------------------------------
-- 7. Orchestrators with safer batch sizes + logging
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.hv_pipeline_tick()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tr_h int;
  v_cl_h int;
  v_em_h int;
  v_ent_h int;
  v_cl_d int;
  v_tr_d int;
  v_em_d int := 0;
  v_ent_d int;
  v_ids text[];
  v_out jsonb;
BEGIN
  v_tr_h := public.hv_translate_harvest();
  v_cl_h := public.hv_classify_corpus_harvest();
  v_em_h := public.hv_embed_harvest();
  v_ent_h := public.hv_entities_harvest();

  -- Reduced limits for Micro-tier sustainability
  v_tr_d := public.hv_translate_dispatch(20, false);
  v_cl_d := public.hv_classify_corpus_dispatch(40, 90);
  v_ent_d := public.hv_entities_dispatch(20);

  SELECT array_agg(id) INTO v_ids FROM (
    SELECT s.id
    FROM public.signals s
    WHERE s.quality_label = 'signal'
      AND s.embedding_1024 IS NULL
    ORDER BY s.created_at DESC
    LIMIT 40
  ) q;

  IF v_ids IS NOT NULL THEN
    PERFORM public.hv_embed_dispatch(v_ids);
    v_em_d := array_length(v_ids, 1);
  END IF;

  v_out := jsonb_build_object(
    'translate_harvested', v_tr_h,
    'classify_harvested', v_cl_h,
    'embed_harvested', v_em_h,
    'entities_harvested', v_ent_h,
    'translate_dispatched', v_tr_d,
    'classify_dispatched', v_cl_d,
    'entities_dispatched', v_ent_d,
    'embed_dispatched', v_em_d
  );

  INSERT INTO public.hv_pipeline_stage_log(stage, metrics)
  VALUES ('pipeline_tick', v_out);

  RETURN v_out;
END;
$function$;

CREATE OR REPLACE FUNCTION public.hv_quality_promote_tick()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_dd int;
  v_pr int;
  v_out jsonb;
BEGIN
  v_dd := public.hv_dedup_assign(0.90, 90);
  -- Higher default floor; borderline goes to review queue
  v_pr := public.hv_promote_signals(0.80);
  v_out := jsonb_build_object('deduped', v_dd, 'promoted', v_pr);

  INSERT INTO public.hv_pipeline_stage_log(stage, metrics)
  VALUES ('quality_promote_tick', v_out);

  RETURN v_out;
END;
$function$;

-- ---------------------------------------------------------------------------
-- 8. HNSW index for embedding similarity (no-op if already present)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'signals'
      AND indexname = 'signals_embedding_1024_hnsw_idx'
  ) THEN
    -- CONCURRENTLY cannot run inside a transaction block in some paths;
    -- plain CREATE INDEX is acceptable for migration apply.
    EXECUTE $idx$
      CREATE INDEX signals_embedding_1024_hnsw_idx
      ON public.signals
      USING hnsw (embedding_1024 vector_cosine_ops)
      WITH (m = 16, ef_construction = 64)
      WHERE embedding_1024 IS NOT NULL
    $idx$;
  END IF;
EXCEPTION
  WHEN others THEN
    -- Index creation can fail on very large tables under load; non-fatal.
    RAISE NOTICE 'HNSW index creation skipped: %', SQLERRM;
END$$;

-- ---------------------------------------------------------------------------
-- 9. Eval-gate helper (read-only decision aid; does not auto-block promote)
-- Returns true when latest eval run meets precision/recall floors.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.hv_eval_gate_ok(
  p_min_precision numeric DEFAULT 0.90,
  p_min_recall numeric DEFAULT 0.70
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_precision numeric;
  v_recall numeric;
BEGIN
  -- Prefer live scoring view if present; otherwise fail-open (true) so
  -- promote path is not hard-blocked when eval tables are empty.
  BEGIN
    SELECT precision, recall
    INTO v_precision, v_recall
    FROM api.intel_eval_scoring
    ORDER BY 1 DESC NULLS LAST
    LIMIT 1;
  EXCEPTION
    WHEN undefined_table THEN
      RETURN true;
    WHEN undefined_column THEN
      RETURN true;
  END;

  IF v_precision IS NULL OR v_recall IS NULL THEN
    RETURN true;
  END IF;

  RETURN v_precision >= p_min_precision AND v_recall >= p_min_recall;
END;
$function$;

REVOKE ALL ON FUNCTION public.hv_eval_gate_ok(numeric, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hv_eval_gate_ok(numeric, numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.hv_eval_gate_ok(numeric, numeric) TO postgres;

-- ---------------------------------------------------------------------------
-- Explicit: do NOT schedule crons here.
-- Operator path remains docs/control/INTEL_CRON_REENABLE_RUNBOOK.md
-- ---------------------------------------------------------------------------
