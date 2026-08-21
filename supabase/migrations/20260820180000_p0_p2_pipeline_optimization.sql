-- P0–P2 intelligence pipeline optimization (2026-08-20)
-- Additive only. Does not schedule crons (operator apply via runbook).
-- Goals:
--   P0  Eval gate helper + promote floor 0.80 + cron schedule SQL (docs)
--   P1  Single conductor tick with cost budget + reduced dispatch ceilings
--   P2  Pre-filter before LLM stages, HNSW ensure, incremental dedup retained,
--       medium-confidence review queue

CREATE TABLE IF NOT EXISTS public.hv_pipeline_stage_metrics (
  id bigserial PRIMARY KEY,
  stage text NOT NULL,
  tick_at timestamptz NOT NULL DEFAULT now(),
  counts jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text
);

CREATE TABLE IF NOT EXISTS public.hv_pipeline_cost_budget (
  day date PRIMARY KEY DEFAULT (CURRENT_DATE),
  llm_calls int NOT NULL DEFAULT 0,
  hard_cap int NOT NULL DEFAULT 8000,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.hv_pipeline_budget_remaining()
RETURNS int
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT GREATEST(
    0,
    COALESCE((SELECT hard_cap - llm_calls FROM public.hv_pipeline_cost_budget WHERE day = CURRENT_DATE), 8000)
  );
$$;

CREATE OR REPLACE FUNCTION public.hv_pipeline_budget_consume(p_calls int)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_cap int;
  v_used int;
BEGIN
  p_calls := GREATEST(COALESCE(p_calls, 0), 0);
  INSERT INTO public.hv_pipeline_cost_budget (day, llm_calls, hard_cap)
  VALUES (CURRENT_DATE, 0, 8000)
  ON CONFLICT (day) DO NOTHING;

  SELECT hard_cap, llm_calls INTO v_cap, v_used
  FROM public.hv_pipeline_cost_budget
  WHERE day = CURRENT_DATE
  FOR UPDATE;

  IF v_used + p_calls > v_cap THEN
    RETURN false;
  END IF;

  UPDATE public.hv_pipeline_cost_budget
     SET llm_calls = llm_calls + p_calls,
         updated_at = now()
   WHERE day = CURRENT_DATE;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.hv_pre_filter_documents(p_limit int DEFAULT 500)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  n int;
BEGIN
  p_limit := LEAST(GREATEST(COALESCE(p_limit, 500), 1), 2000);

  WITH candidates AS (
    SELECT s.id
    FROM public.signals s
    WHERE s.reviewed IS DISTINCT FROM true
      AND (s.quality_label IS NULL OR s.quality_label = '')
      AND (
        length(coalesce(s.headline, s.title_en, '')) < 12
        OR coalesce(s.headline, s.title_en, '') ~* '(cookie|privacy policy|terms of use|subscribe|newsletter|log in|sign up|javascript required)'
        OR coalesce(s.summary, '') ~* '^(home|menu|navigation|skip to content)'
      )
    ORDER BY s.created_at DESC
    LIMIT p_limit
  )
  UPDATE public.signals s
     SET quality_label = 'noise',
         content_type = COALESCE(NULLIF(s.content_type, ''), 'noise'),
         quality_confidence = COALESCE(s.quality_confidence, 0.95),
         classifier_version = COALESCE(s.classifier_version, 'prefilter:v1')
    FROM candidates c
   WHERE s.id = c.id
     AND (s.reviewed_by IS NULL OR s.reviewed_by NOT LIKE 'human:%');

  GET DIAGNOSTICS n = ROW_COUNT;
  INSERT INTO public.hv_pipeline_stage_metrics (stage, counts)
  VALUES ('pre_filter', jsonb_build_object('marked_noise', n));
  RETURN n;
END;
$$;

COMMENT ON FUNCTION public.hv_pre_filter_documents(int) IS
  'P2 pre-LLM filter: marks obvious nav/boilerplate as noise so translate/classify/embed skip them.';

CREATE TABLE IF NOT EXISTS public.hv_signal_review_queue (
  signal_id text PRIMARY KEY REFERENCES public.signals(id) ON DELETE CASCADE,
  queued_at timestamptz NOT NULL DEFAULT now(),
  quality_confidence numeric,
  quality_label text,
  reason text NOT NULL DEFAULT 'medium_confidence',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  resolved_at timestamptz,
  resolved_by text
);

CREATE INDEX IF NOT EXISTS idx_hv_signal_review_queue_pending
  ON public.hv_signal_review_queue (queued_at DESC)
  WHERE status = 'pending';

CREATE OR REPLACE FUNCTION public.hv_review_queue_enqueue_medium(
  p_min numeric DEFAULT 0.65,
  p_max numeric DEFAULT 0.80,
  p_limit int DEFAULT 200
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  n int;
BEGIN
  p_limit := LEAST(GREATEST(COALESCE(p_limit, 200), 1), 1000);
  INSERT INTO public.hv_signal_review_queue (signal_id, quality_confidence, quality_label, reason)
  SELECT s.id, s.quality_confidence, s.quality_label, 'medium_confidence'
  FROM public.signals s
  WHERE s.quality_label = 'signal'
    AND s.quality_confidence IS NOT NULL
    AND s.quality_confidence >= p_min
    AND s.quality_confidence < p_max
    AND s.reviewed IS DISTINCT FROM true
    AND coalesce(s.is_representative, true) = true
    AND (s.reviewed_by IS NULL OR s.reviewed_by NOT LIKE 'human:%')
  ORDER BY s.quality_confidence DESC, s.created_at DESC
  LIMIT p_limit
  ON CONFLICT (signal_id) DO NOTHING;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

CREATE OR REPLACE FUNCTION public.hv_review_queue_list_pending(p_limit int DEFAULT 50)
RETURNS TABLE (
  signal_id text,
  queued_at timestamptz,
  quality_confidence numeric,
  quality_label text,
  reason text,
  headline text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT q.signal_id, q.queued_at, q.quality_confidence, q.quality_label, q.reason,
         coalesce(s.title_en, s.headline, s.id) AS headline
  FROM public.hv_signal_review_queue q
  JOIN public.signals s ON s.id = q.signal_id
  WHERE q.status = 'pending'
  ORDER BY q.queued_at ASC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 50), 1), 200);
$$;

CREATE OR REPLACE FUNCTION public.hv_review_queue_approve(p_signal_id text, p_by text DEFAULT 'operator')
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.signals
     SET reviewed = true,
         reviewed_by = 'human:' || coalesce(nullif(trim(p_by), ''), 'operator'),
         reviewed_at = now()
   WHERE id = p_signal_id
     AND (reviewed_by IS NULL OR reviewed_by NOT LIKE 'human:%' OR reviewed IS DISTINCT FROM true);

  UPDATE public.hv_signal_review_queue
     SET status = 'approved',
         resolved_at = now(),
         resolved_by = coalesce(nullif(trim(p_by), ''), 'operator')
   WHERE signal_id = p_signal_id
     AND status = 'pending';

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.hv_review_queue_reject(p_signal_id text, p_by text DEFAULT 'operator')
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.hv_signal_review_queue
     SET status = 'rejected',
         resolved_at = now(),
         resolved_by = coalesce(nullif(trim(p_by), ''), 'operator')
   WHERE signal_id = p_signal_id
     AND status = 'pending';
  RETURN FOUND;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'signals'
      AND indexname = 'idx_signals_embedding_1024_hnsw'
  ) THEN
    EXECUTE $idx$
      CREATE INDEX idx_signals_embedding_1024_hnsw
        ON public.signals
        USING hnsw (embedding_1024 vector_cosine_ops)
        WITH (m = 16, ef_construction = 64)
    $idx$;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'HNSW index create skipped: %', SQLERRM;
END $$;

CREATE OR REPLACE FUNCTION public.hv_promote_signals(p_min_conf numeric DEFAULT 0.80)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  n int;
  v_floor numeric;
BEGIN
  v_floor := GREATEST(COALESCE(p_min_conf, 0.80), 0.80);

  UPDATE public.signals s
     SET reviewed = true,
         reviewed_by = 'auto:v1',
         reviewed_at = now()
   WHERE s.quality_label = 'signal'
     AND COALESCE(s.is_representative, true) = true
     AND s.quality_confidence IS NOT NULL
     AND s.quality_confidence >= v_floor
     AND s.reviewed IS DISTINCT FROM true
     AND (s.reviewed_by IS NULL OR s.reviewed_by NOT LIKE 'human:%')
     AND regexp_replace(COALESCE(s.url, ''), '^https?://(www\.)?([^/]+).*', '\2')
         NOT IN (SELECT domain FROM public.excluded_source_domains);

  GET DIAGNOSTICS n = ROW_COUNT;
  INSERT INTO public.hv_pipeline_stage_metrics (stage, counts)
  VALUES ('promote', jsonb_build_object('promoted', n, 'floor', v_floor));
  RETURN n;
END;
$$;

COMMENT ON FUNCTION public.hv_promote_signals(numeric) IS
  'Promotes representative signal-labelled rows with quality_confidence >= max(arg, 0.80). Never demotes. Never touches reviewed_by human:%.';

CREATE OR REPLACE FUNCTION public.hv_quality_promote_tick()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_dd int;
  v_pr int;
  v_rq int;
BEGIN
  v_dd := public.hv_dedup_assign(0.90, 400);
  v_pr := public.hv_promote_signals(0.80);
  v_rq := public.hv_review_queue_enqueue_medium(0.65, 0.80, 200);

  RETURN jsonb_build_object(
    'deduped', v_dd,
    'promoted', v_pr,
    'review_queued', v_rq,
    'promote_floor', 0.80
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.hv_pipeline_tick()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pf int := 0;
  v_tr_h int := 0;
  v_cl_h int := 0;
  v_em_h int := 0;
  v_ent_h int := 0;
  v_tr_d int := 0;
  v_cl_d int := 0;
  v_em_d int := 0;
  v_ent_d int := 0;
  v_ids text[];
  v_budget int;
  v_skip text := null;
BEGIN
  v_budget := public.hv_pipeline_budget_remaining();
  IF v_budget < 20 THEN
    INSERT INTO public.hv_pipeline_stage_metrics (stage, counts, notes)
    VALUES ('pipeline_tick', jsonb_build_object('skipped', true, 'budget', v_budget), 'daily LLM budget exhausted');
    RETURN jsonb_build_object('skipped', true, 'reason', 'budget', 'budget_remaining', v_budget);
  END IF;

  v_pf := public.hv_pre_filter_documents(500);

  v_tr_h := public.hv_translate_harvest();
  v_cl_h := public.hv_classify_corpus_harvest();
  v_em_h := public.hv_embed_harvest();
  v_ent_h := public.hv_entities_harvest();

  IF public.hv_pipeline_budget_consume(30) THEN
    v_tr_d := public.hv_translate_dispatch(30, false);
  ELSE
    v_skip := 'translate';
  END IF;

  IF public.hv_pipeline_budget_consume(80) THEN
    v_cl_d := public.hv_classify_corpus_dispatch(80, 400);
  ELSE
    v_skip := coalesce(v_skip || '+', '') || 'classify';
  END IF;

  IF public.hv_pipeline_budget_consume(30) THEN
    v_ent_d := public.hv_entities_dispatch(30);
  ELSE
    v_skip := coalesce(v_skip || '+', '') || 'entities';
  END IF;

  SELECT array_agg(id) INTO v_ids FROM (
    SELECT s.id
    FROM public.signals s
    WHERE s.quality_label = 'signal'
      AND s.embedding_1024 IS NULL
    ORDER BY s.created_at DESC
    LIMIT 60
  ) q;

  IF v_ids IS NOT NULL AND public.hv_pipeline_budget_consume(array_length(v_ids, 1)) THEN
    PERFORM public.hv_embed_dispatch(v_ids);
    v_em_d := array_length(v_ids, 1);
  END IF;

  INSERT INTO public.hv_pipeline_stage_metrics (stage, counts, notes)
  VALUES (
    'pipeline_tick',
    jsonb_build_object(
      'pre_filtered', v_pf,
      'translate_harvested', v_tr_h,
      'classify_harvested', v_cl_h,
      'embed_harvested', v_em_h,
      'entities_harvested', v_ent_h,
      'translate_dispatched', v_tr_d,
      'classify_dispatched', v_cl_d,
      'embed_dispatched', v_em_d,
      'entities_dispatched', v_ent_d,
      'budget_remaining', public.hv_pipeline_budget_remaining()
    ),
    v_skip
  );

  RETURN jsonb_build_object(
    'pre_filtered', v_pf,
    'translate_harvested', v_tr_h,
    'classify_harvested', v_cl_h,
    'embed_harvested', v_em_h,
    'entities_harvested', v_ent_h,
    'translate_dispatched', v_tr_d,
    'classify_dispatched', v_cl_d,
    'embed_dispatched', v_em_d,
    'entities_dispatched', v_ent_d,
    'budget_remaining', public.hv_pipeline_budget_remaining(),
    'dispatch_skipped', v_skip
  );
END;
$$;

COMMENT ON FUNCTION public.hv_pipeline_tick() IS
  'P1 conductor: pre-filter → harvest → budget-gated reduced dispatch. Cron runbook owns cadence.';

CREATE OR REPLACE FUNCTION public.hv_eval_gate_snapshot()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_exists boolean;
  v_n int;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'intel_eval_set'
  ) INTO v_exists;

  IF NOT v_exists THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'intel_eval_set_missing');
  END IF;

  SELECT count(*) INTO v_n FROM public.intel_eval_set;
  RETURN jsonb_build_object(
    'ok', true,
    'eval_rows', v_n,
    'note', 'Validate classifier offline against intel_eval_set before raising volume. Target: signal precision ≥ 0.90, recall ≥ 0.70.',
    'promote_floor', 0.80,
    'budget_remaining_today', public.hv_pipeline_budget_remaining()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.hv_pre_filter_documents(int) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.hv_pipeline_tick() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.hv_quality_promote_tick() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.hv_promote_signals(numeric) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.hv_pipeline_budget_remaining() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.hv_pipeline_budget_consume(int) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.hv_review_queue_enqueue_medium(numeric, numeric, int) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.hv_eval_gate_snapshot() FROM PUBLIC, anon, authenticated;
