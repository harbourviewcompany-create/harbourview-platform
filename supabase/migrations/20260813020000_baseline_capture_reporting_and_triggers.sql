-- Baseline capture: 12 more untracked-origin functions from the same
-- 48-function audit (see docs/control/EVIDENCE_LOG.md). Bodies and
-- search_path verbatim from live pg_get_functiondef; grants below match
-- current live proacl exactly (checked via pg_proc.proacl before writing,
-- not assumed) -- some of these genuinely are anon/authenticated-executable
-- in production today and that's preserved as-is, since changing it would
-- be an unrequested behavior change, not a restoration.
--
-- is_service_role_or_signal_analyst included here as a dependency of
-- api.get_recently_analyzed_signals below, not because it's a reporting or
-- trigger function itself -- found while checking that function's
-- dependencies actually exist, same as the pipeline_tasks/dead_letter_tasks
-- discovery in the previous batch.

CREATE OR REPLACE FUNCTION public.is_service_role_or_signal_analyst()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
  select auth.role() = 'service_role' or public.is_genetics_admin_or_reviewer();
$function$;

CREATE OR REPLACE FUNCTION api.get_recently_analyzed_signals(p_limit integer DEFAULT 10)
 RETURNS TABLE(id text, headline text, summary text, country text, score integer, analysis jsonb, analysis_backend text, analysis_generated_at timestamp with time zone)
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
-- Matches live: PUBLIC and authenticated both currently have execute.
-- The function gates on caller role internally (raises 42501 otherwise),
-- so the grant alone doesn't expose the data -- preserved as-is.
GRANT EXECUTE ON FUNCTION api.get_recently_analyzed_signals(integer) TO PUBLIC;
GRANT EXECUTE ON FUNCTION api.get_recently_analyzed_signals(integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.countries_set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;
GRANT EXECUTE ON FUNCTION public.countries_set_updated_at() TO PUBLIC;

CREATE OR REPLACE FUNCTION public.get_country_status(p_iso2 text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'country_name',           country_name,
    'iso_alpha2',             iso_alpha2,
    'region',                 region,
    'subregion',              subregion,
    'market_access_status',   market_access_status::text,
    'medical_status',         medical_status::text,
    'adult_use_status',       adult_use_status::text,
    'import_status',          import_status::text,
    'export_status',          export_status::text,
    'signals_status',         signals_status::text,
    'opportunity_score',      opportunity_score,
    'data_completeness',      data_completeness::text,
    'public_summary',         public_summary,
    'trade_roles',            trade_roles,
    'opportunity_categories', opportunity_categories,
    'regulator_label',        regulator_label,
    'last_updated_label',     last_updated_label
  )
  INTO v_result
  FROM countries
  WHERE iso_alpha2 = UPPER(p_iso2)
  LIMIT 1;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_watchlist_items(p_org_id uuid, p_type text DEFAULT NULL::text, p_limit integer DEFAULT 25, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, item_type text, ref_id text, title text, subtitle text, tags text[], jurisdiction text, confidence_pct integer, latest_change_at timestamp with time zone, latest_change_note text, next_action text, watch_status text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
BEGIN
  -- Verify caller is a member of this org
  IF NOT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = p_org_id AND user_id = (SELECT auth.uid())
  ) THEN
    RAISE EXCEPTION 'not_a_member';
  END IF;

  RETURN QUERY
  SELECT
    w.id, w.item_type, w.ref_id, w.title, w.subtitle,
    w.tags, w.jurisdiction, w.confidence_pct,
    w.latest_change_at, w.latest_change_note, w.next_action,
    w.watch_status, w.created_at, w.updated_at
  FROM cc_watchlist_items w
  WHERE w.org_id      = p_org_id
    AND w.watch_status = 'active'
    AND (p_type IS NULL OR w.item_type = p_type)
  ORDER BY w.latest_change_at DESC NULLS LAST, w.created_at DESC
  LIMIT  p_limit
  OFFSET p_offset;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_watchlist_notification_summary(p_org_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
  v_result  JSON;
BEGIN
  -- Verify caller is a member of this org
  IF NOT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = p_org_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'not_a_member';
  END IF;

  SELECT json_build_object(
    'total_alerts',     COUNT(*) FILTER (WHERE NOT is_read AND NOT is_snoozed),
    'awaiting_review',  COUNT(*) FILTER (WHERE NOT is_read AND NOT is_snoozed AND notification_type = 'alert'),
    'resolved',         COUNT(*) FILTER (WHERE is_read AND created_at > now() - INTERVAL '7 days'),
    'snoozed',          COUNT(*) FILTER (WHERE is_snoozed AND (snoozed_until IS NULL OR snoozed_until > now()))
  )
  INTO v_result
  FROM cc_watchlist_notifications
  WHERE user_id = v_user_id
    AND org_id  = p_org_id;

  RETURN v_result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.search_signals_semantic(p_query_embedding vector, p_match_count integer DEFAULT 20, p_country text DEFAULT NULL::text, p_category text DEFAULT NULL::text, p_min_similarity double precision DEFAULT 0.0)
 RETURNS TABLE(id text, headline text, summary text, country text, cat text, pri text, score integer, source text, url text, date timestamp with time zone, similarity double precision)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
BEGIN
  RETURN QUERY
    SELECT
      s.id,
      s.headline,
      s.summary,
      s.country,
      s.cat,
      s.pri,
      s.score,
      s.source,
      s.url,
      s.date,
      (1 - (s.embedding_1024 <=> p_query_embedding))::double precision AS similarity
    FROM public.signals s
    WHERE
      s.embedding_1024 IS NOT NULL
      AND (p_country  IS NULL OR s.country = p_country)
      AND (p_category IS NULL OR s.cat     = p_category)
      AND (1 - (s.embedding_1024 <=> p_query_embedding)) >= p_min_similarity
    ORDER BY s.embedding_1024 <=> p_query_embedding
    LIMIT p_match_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_deal_rooms_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $function$;
GRANT EXECUTE ON FUNCTION public.set_deal_rooms_updated_at() TO PUBLIC;

CREATE OR REPLACE FUNCTION public.set_hv_professionals_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $function$;
GRANT EXECUTE ON FUNCTION public.set_hv_professionals_updated_at() TO PUBLIC;

CREATE OR REPLACE FUNCTION public.set_jurisdiction_playbooks_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $function$;
GRANT EXECUTE ON FUNCTION public.set_jurisdiction_playbooks_updated_at() TO PUBLIC;

CREATE OR REPLACE FUNCTION public.sync_ia_market_graph()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
declare
  v_markets int := 0;
  v_sources int := 0;
  v_edges int := 0;
begin
  -- Market entities
  with agg as (
    select market,
           count(distinct source_name) as connections,
           count(*) as signals,
           max(detected_at) as last_seen
    from ia_signals
    where stage <> 'archived' and coalesce(market,'') <> ''
    group by market
  )
  insert into ia_graph_entities (id, type, label, market, category, connection_count, signal_count, last_activity)
  select 'gr-ent-' || md5('market:' || market), 'market', market, market, null, connections, signals, last_seen::date
  from agg
  on conflict (id) do update set
    connection_count = excluded.connection_count,
    signal_count      = excluded.signal_count,
    last_activity     = excluded.last_activity,
    updated_at        = now();
  get diagnostics v_markets = row_count;

  -- Source entities (only sources that have produced at least one signal)
  with agg as (
    select source_name,
           count(distinct market) as connections,
           count(*) as signals,
           max(detected_at) as last_seen
    from ia_signals
    where coalesce(source_name,'') <> ''
    group by source_name
  )
  insert into ia_graph_entities (id, type, label, market, category, connection_count, signal_count, last_activity)
  select 'gr-ent-' || md5('source:' || source_name), 'source', source_name, null, null, connections, signals, last_seen::date
  from agg
  on conflict (id) do update set
    connection_count = excluded.connection_count,
    signal_count      = excluded.signal_count,
    last_activity     = excluded.last_activity,
    updated_at        = now();
  get diagnostics v_sources = row_count;

  -- Edges: source generated_signal -> market
  with agg as (
    select source_name, market, count(*) as n, min(detected_at) as first_seen
    from ia_signals
    where coalesce(source_name,'') <> '' and coalesce(market,'') <> ''
    group by source_name, market
  )
  insert into ia_graph_edges (id, type, from_label, to_label, strength, evidenced, created_at)
  select 'gr-edge-' || md5(source_name || '->' || market),
         'generated_signal', source_name, market,
         case when n >= 5 then 'strong' when n >= 2 then 'medium' else 'weak' end,
         true, first_seen
  from agg
  on conflict (id) do update set
    strength = excluded.strength;
  get diagnostics v_edges = row_count;

  return jsonb_build_object('ok', true, 'markets', v_markets, 'sources', v_sources, 'edges', v_edges);
end;
$function$;

CREATE OR REPLACE FUNCTION public.trg_auto_promote_snapshot()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
DECLARE
  v_promoted integer;
BEGIN
  IF NEW.processing_status = 'extracted'
    AND (OLD.processing_status IS DISTINCT FROM 'extracted')
    AND NEW.signal_candidates IS NOT NULL
  THEN
    SELECT public.promote_snapshot_to_signals(NEW.id) INTO v_promoted;
    RAISE LOG 'Auto-promoted % signals from snapshot %', v_promoted, NEW.id;
  END IF;
  RETURN NEW;
END;
$function$;
