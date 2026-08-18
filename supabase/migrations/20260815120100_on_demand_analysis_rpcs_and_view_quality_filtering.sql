-- ─── 3. On-demand single-signal analysis (new capability) ─────────────────
-- Backs the admin dashboard's Analyze button (app/admin/(protected)/signals
-- /analysis). Requires two Vault secrets NOT created by this migration --
-- vault.create_secret() takes a real value and does not belong in a
-- git-committed file. Whoever applies this migration to a fresh environment
-- must separately run:
--   select vault.create_secret('<edge-functions-base-url>', 'hv_edge_function_base_url', '...');
--   select vault.create_secret('<random-secret>', 'hv_signal_analysis_manual_trigger_secret', '...');
-- The second one also needs setting as an Edge Function secret
-- (HV_SIGNAL_ANALYSIS_MANUAL_TRIGGER_SECRET) with the same value for the
-- edge function's x-hv-manual-trigger caller path to activate -- until then
-- api.request_signal_analysis below authenticates via the cron-caller
-- header instead, which works but blurs the audit trail (see the edge
-- function's own comments).

CREATE OR REPLACE FUNCTION api.request_signal_analysis(p_signal_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'api', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
DECLARE
  v_req_id bigint;
  v_status int;
  v_body jsonb;
  v_waited numeric := 0;
BEGIN
  if not public.is_service_role_or_signal_analyst() then
    raise exception 'insufficient privileges: admin/operator/analyst role required' using errcode = '42501';
  end if;

  IF NOT EXISTS (SELECT 1 FROM public.signals WHERE id = p_signal_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'signal_not_found');
  END IF;

  IF EXISTS (SELECT 1 FROM public.signals WHERE id = p_signal_id AND analysis IS NOT NULL) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_analyzed');
  END IF;

  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'hv_edge_function_base_url') ||
           '/hv-signal-analysis?signal_id=' || p_signal_id,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'hv_edge_anon_key'),
      'x-harbourview-cron-caller', 'pg_cron_hv_signal_analysis'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 28000
  ) INTO v_req_id;

  LOOP
    PERFORM pg_sleep(0.5);
    v_waited := v_waited + 0.5;
    SELECT status_code, content::jsonb INTO v_status, v_body
    FROM net._http_response WHERE id = v_req_id;
    EXIT WHEN v_status IS NOT NULL OR v_waited >= 30;
  END LOOP;

  IF v_status IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'timed_out', 'request_id', v_req_id);
  END IF;

  IF v_status <> 200 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'edge_function_error', 'status', v_status, 'detail', v_body);
  END IF;

  RETURN v_body;
END;
$function$;

CREATE OR REPLACE FUNCTION api.get_recently_analyzed_signals(p_limit integer DEFAULT 10)
 RETURNS TABLE(id text, headline text, summary text, country text, score integer,
   analysis jsonb, analysis_backend text, analysis_generated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'api', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
BEGIN
  if not public.is_service_role_or_signal_analyst() then
    raise exception 'insufficient privileges: admin/operator/analyst role required' using errcode = '42501';
  end if;
  RETURN QUERY
  SELECT s.id, s.headline, s.summary, s.country, s.score, s.analysis, s.analysis_backend, s.analysis_generated_at
  FROM public.signals s
  WHERE s.analysis IS NOT NULL
  ORDER BY s.analysis_generated_at DESC NULLS LAST
  LIMIT LEAST(p_limit, 25);
END;
$function$;

GRANT EXECUTE ON FUNCTION api.request_signal_analysis(text) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION api.get_recently_analyzed_signals(integer) TO service_role, authenticated;

-- ─── 5. Dashboard-facing views: wire in quality_label ──────────────────────
-- quality_label (spam/boilerplate/nav/duplicate/signal) was already being
-- computed correctly by the classification pipeline but never checked by
-- the views that actually gate what the dashboard and digest surface --
-- roughly 15% of what signals_quality returned was already-flagged garbage.

CREATE OR REPLACE VIEW public.signals_quality AS
 SELECT id, date, cat, pri, score, headline, summary, source, url, verification,
    tier, lang, company, country, in_network, lane_r, lane_e, lane_t, top_lane,
    query_pack, commercial_impact, reviewed, action, created_at,
    embedding_1024, embedding_model, embedded_at,
    analysis, analysis_generated_at, analysis_backend
   FROM signals
  WHERE (((action IS NULL) OR (action <> 'rejected'::text))
    AND ((reviewed = true) OR (cat <> ALL (ARRAY['SOURCE_ENGINE'::text, 'GAZETTE'::text]))
         OR ((cat = 'SOURCE_ENGINE'::text) AND (score >= 50) AND (score < 90))
         OR ((cat = 'GAZETTE'::text) AND (score >= 70)))
    AND (quality_label IS NULL OR quality_label NOT IN ('spam','boilerplate','nav','duplicate')));

CREATE OR REPLACE VIEW public.signals_intelligence_feed AS
 SELECT s.id AS signal_id, s.headline AS title, s.summary, s.cat AS category,
    s.country, s.date AS signal_date, s.score, s.pri AS priority,
    s.commercial_impact, s.url, s.source, s.reviewed, s.created_at,
    'signals'::text AS source_table
   FROM signals s
  WHERE ((s.reviewed = true)
    AND (((s.cat = 'SOURCE_ENGINE'::text) AND (s.score >= 60)) OR ((s.cat <> 'SOURCE_ENGINE'::text) AND (s.score >= 6)))
    AND (s.headline !~~ '-->%'::text)
    AND (s.headline !~~ '%STATUS AS AT%'::text)
    AND (s.headline ~ '[a-z]'::text)
    AND (s.quality_label IS NULL OR s.quality_label NOT IN ('spam','boilerplate','nav','duplicate')))
UNION ALL
 SELECT ia.id AS signal_id, ia.title, ia.summary, ia.category, ia.market AS country,
    ia.detected_at AS signal_date, ((ia.confidence / 10))::numeric AS score,
    ia.commercial_impact AS priority, ia.commercial_impact, NULL::text AS url,
    ia.source_name AS source, true AS reviewed, ia.created_at,
    'ia_signals'::text AS source_table
   FROM ia_signals ia
  WHERE ((ia.stage = ANY (ARRAY['qualified'::text, 'converted_to_opportunity'::text])) AND (ia.id !~~ 's-%'::text));

-- ─── 6. One-time backfill: existing rows affected by parts 4 and 5 ─────────
-- Naturally idempotent -- after running once, no row still matches
-- length(headline)=200 / length(summary)=500 (the fixed text is shorter),
-- and quality_label='duplicate' rows stay flagged, so a second run is a
-- no-op rather than a re-trim or re-flag.

UPDATE public.signals
SET headline = coalesce(nullif(regexp_replace(headline, '\s+\S*$', ''), ''), headline) || '…'
WHERE length(headline) = 200;

UPDATE public.signals
SET summary = coalesce(nullif(regexp_replace(summary, '\s+\S*$', ''), ''), summary) || '…'
WHERE length(summary) = 500;

WITH ranked AS (
  SELECT id,
    row_number() OVER (PARTITION BY trim(headline) ORDER BY date ASC NULLS LAST, id ASC) AS rn
  FROM public.signals
  WHERE cat = 'SOURCE_ENGINE'
)
UPDATE public.signals s
SET quality_label = 'duplicate'
FROM ranked r
WHERE s.id = r.id AND r.rn > 1 AND s.quality_label IS DISTINCT FROM 'duplicate';
