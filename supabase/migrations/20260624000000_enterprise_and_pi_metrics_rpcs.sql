-- Enterprise dashboard metrics: computed counts from live tables
CREATE OR REPLACE FUNCTION get_enterprise_dashboard_metrics()
RETURNS TABLE (
  id       text,
  category text,
  label    text,
  value    numeric,
  unit     text,
  trend    text,
  target   numeric
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT 'ecosystem_coverage'::text, 'ecosystem_coverage'::text, 'Operators in network'::text,        COUNT(*)::numeric, 'operators'::text,  'up'::text,     100::numeric FROM cannabis_operators
  UNION ALL
  SELECT 'market_coverage',          'market_coverage',          'Markets with operators',              COUNT(DISTINCT country_iso2)::numeric, 'markets', 'up', 60 FROM operator_countries
  UNION ALL
  SELECT 'active_listings',          'deal_velocity',            'Approved marketplace listings',       COUNT(*)::numeric, 'listings',         'stable',       200 FROM listings WHERE status = 'approved'
  UNION ALL
  SELECT 'pending_review',           'operator_workload',        'Candidates pending review',           COUNT(*)::numeric, 'candidates',       'stable',       50  FROM marketplace_candidates WHERE status = 'pending_review'
  UNION ALL
  SELECT 'recent_signals',           'source_freshness',         'Signals ingested (30 days)',          COUNT(*)::numeric, 'signals',          'up',           500 FROM signals WHERE created_at > NOW() - INTERVAL '30 days'
  UNION ALL
  SELECT 'evidence_items',           'document_readiness',       'Evidence items in vault',             COUNT(*)::numeric, 'items',            'stable',       100 FROM ia_evidence_vault
  UNION ALL
  SELECT 'counterparty_count',       'network_growth',           'Counterparties tracked',              COUNT(*)::numeric, 'counterparties',   'up',           200 FROM ia_counterparties
  UNION ALL
  SELECT 'trust_scores',             'trust_reputation',         'Scored counterparties',               COUNT(*)::numeric, 'scores',           'stable',       50  FROM ia_scoring_records
  UNION ALL
  SELECT 'opportunities',            'revenue_opportunity',      'Active opportunities',                COUNT(*)::numeric, 'opportunities',    'stable',       25  FROM opportunities
  UNION ALL
  SELECT 'intro_packets',            'introduction_success',     'Approved candidates',                 COUNT(*)::numeric, 'packets',          'up',           100 FROM marketplace_candidates WHERE status IN ('approved', 'promoted')
$$;

-- Proprietary intelligence strategic metrics
CREATE OR REPLACE FUNCTION get_proprietary_strategic_metrics()
RETURNS TABLE (
  id          text,
  metric_type text,
  label       text,
  value       numeric,
  unit        text,
  trend       text,
  target      numeric,
  market      text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT 'source_coverage'::text,   'source_coverage'::text,         'Active intelligence sources'::text,   COUNT(*)::numeric, 'sources'::text,     'up'::text,    1000::numeric, null::text FROM source_registry WHERE is_active = true
  UNION ALL
  SELECT 'counterparty_coverage',   'counterparty_coverage',         'Counterparties in network',           COUNT(*)::numeric, 'counterparties',    'up',          500,  null FROM ia_counterparties
  UNION ALL
  SELECT 'signal_total',            'intelligence_freshness',        'Total signals ingested',              COUNT(*)::numeric, 'signals',           'up',          5000, null FROM signals
  UNION ALL
  SELECT 'scoring_records',         'relationship_strength',         'Counterparties scored',               COUNT(*)::numeric, 'records',           'stable',      200,  null FROM ia_scoring_records
  UNION ALL
  SELECT 'evidence_vault',          'documentation_readiness',       'Evidence items in vault',             COUNT(*)::numeric, 'items',             'stable',      500,  null FROM ia_evidence_vault
  UNION ALL
  SELECT 'agent_tasks',             'automation_throughput',         'AI agent tasks',                      COUNT(*)::numeric, 'tasks',             'stable',      1000, null FROM ia_agent_tasks
  UNION ALL
  SELECT 'feedback_events',         'response_rate',                 'Reinforcement events logged',         COUNT(*)::numeric, 'events',            'stable',      500,  null FROM ia_feedback_events
  UNION ALL
  SELECT 'market_metrics_count',    'market_coverage',               'Market metrics tracked',              COUNT(*)::numeric, 'metrics',           'up',          200,  null FROM market_metrics
  UNION ALL
  SELECT 'ia_signals_count',        'deal_velocity',                 'IA signal candidates',                COUNT(*)::numeric, 'candidates',        'up',          1000, null FROM ia_signals
  UNION ALL
  SELECT 'source_snapshots_count',  'intelligence_freshness',        'Source snapshots captured',           COUNT(*)::numeric, 'snapshots',         'up',          10000,null FROM source_snapshots
$$;

-- Proprietary dataset coverage: real row counts and market arrays per key intelligence table
CREATE OR REPLACE FUNCTION get_proprietary_datasets()
RETURNS TABLE (
  id                  text,
  name                text,
  category            text,
  record_count        bigint,
  freshness_days      int,
  coverage_markets    text[],
  coverage_categories text[],
  last_updated        timestamptz,
  completeness_pct    int,
  status              text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_count bigint;
  v_ts    timestamptz;
BEGIN
  SELECT COUNT(*), MAX(c.updated_at) INTO v_count, v_ts FROM ia_counterparties c;
  id := 'counterparty_network'; name := 'Counterparty Network'; category := 'counterparty';
  record_count := v_count; freshness_days := GREATEST(0, EXTRACT(DAY FROM NOW() - v_ts)::int);
  coverage_markets    := ARRAY(SELECT DISTINCT m FROM ia_counterparties cx, unnest(cx.markets) t(m) LIMIT 10);
  coverage_categories := ARRAY(SELECT DISTINCT m FROM ia_counterparties cx, unnest(cx.categories) t(m) LIMIT 10);
  last_updated := v_ts;
  completeness_pct := CASE WHEN v_count > 50 THEN 90 WHEN v_count > 10 THEN 65 ELSE 40 END;
  status := CASE WHEN v_count > 50 THEN 'active' WHEN v_count > 0 THEN 'building' ELSE 'gap' END;
  RETURN NEXT;

  SELECT COUNT(*), MAX(s.created_at) INTO v_count, v_ts FROM signals s;
  id := 'intelligence_signals'; name := 'Intelligence Signals Feed'; category := 'signals';
  record_count := v_count; freshness_days := GREATEST(0, EXTRACT(DAY FROM NOW() - v_ts)::int);
  coverage_markets    := ARRAY(SELECT DISTINCT sx.country FROM signals sx WHERE sx.country IS NOT NULL LIMIT 10);
  coverage_categories := ARRAY(SELECT DISTINCT sx.cat    FROM signals sx WHERE sx.cat    IS NOT NULL LIMIT 10);
  last_updated := v_ts;
  completeness_pct := CASE WHEN v_count > 500 THEN 85 WHEN v_count > 100 THEN 65 ELSE 40 END;
  status := CASE WHEN v_count > 500 THEN 'active' WHEN v_count > 0 THEN 'building' ELSE 'gap' END;
  RETURN NEXT;

  SELECT COUNT(*), MAX(sr.updated_at) INTO v_count, v_ts FROM source_registry sr;
  id := 'source_registry_ds'; name := 'Intelligence Source Registry'; category := 'source_reliability';
  record_count := v_count; freshness_days := 0;
  coverage_markets    := ARRAY(SELECT DISTINCT srx.country     FROM source_registry srx WHERE srx.country     IS NOT NULL LIMIT 10);
  coverage_categories := ARRAY(SELECT DISTINCT srx.source_type FROM source_registry srx WHERE srx.source_type IS NOT NULL LIMIT 10);
  last_updated := v_ts;
  completeness_pct := CASE WHEN v_count > 500 THEN 90 WHEN v_count > 100 THEN 70 ELSE 50 END;
  status := CASE WHEN v_count > 0 THEN 'active' ELSE 'gap' END;
  RETURN NEXT;

  SELECT COUNT(*), MAX(l.created_at) INTO v_count, v_ts FROM listings l;
  id := 'marketplace_listings'; name := 'Marketplace Supply & Demand'; category := 'seller_supply';
  record_count := v_count; freshness_days := GREATEST(0, EXTRACT(DAY FROM NOW() - v_ts)::int);
  coverage_markets    := ARRAY(SELECT DISTINCT lx.location_country FROM listings lx WHERE lx.location_country IS NOT NULL LIMIT 10);
  coverage_categories := ARRAY[]::text[];
  last_updated := v_ts;
  completeness_pct := CASE WHEN v_count > 100 THEN 80 WHEN v_count > 20 THEN 60 ELSE 35 END;
  status := CASE WHEN v_count > 0 THEN 'active' ELSE 'gap' END;
  RETURN NEXT;

  SELECT COUNT(*), MAX(ev.created_at) INTO v_count, v_ts FROM ia_evidence_vault ev;
  id := 'evidence_vault_ds'; name := 'Evidence & Document Vault'; category := 'documentation';
  record_count := v_count; freshness_days := GREATEST(0, EXTRACT(DAY FROM NOW() - v_ts)::int);
  coverage_markets := ARRAY[]::text[]; coverage_categories := ARRAY[]::text[];
  last_updated := v_ts;
  completeness_pct := CASE WHEN v_count > 100 THEN 80 WHEN v_count > 10 THEN 55 ELSE 30 END;
  status := CASE WHEN v_count > 50 THEN 'active' WHEN v_count > 0 THEN 'building' ELSE 'gap' END;
  RETURN NEXT;

  SELECT COUNT(*), MAX(sc.created_at) INTO v_count, v_ts FROM ia_scoring_records sc;
  id := 'scoring_records_ds'; name := 'Counterparty Scoring Records'; category := 'relationship_memory';
  record_count := v_count; freshness_days := GREATEST(0, EXTRACT(DAY FROM NOW() - v_ts)::int);
  coverage_markets    := ARRAY(SELECT DISTINCT m FROM ia_scoring_records scx, unnest(scx.market_access_relevance) t(m) LIMIT 10);
  coverage_categories := ARRAY[]::text[];
  last_updated := v_ts;
  completeness_pct := CASE WHEN v_count > 50 THEN 85 WHEN v_count > 10 THEN 60 ELSE 35 END;
  status := CASE WHEN v_count > 50 THEN 'active' WHEN v_count > 0 THEN 'building' ELSE 'gap' END;
  RETURN NEXT;

  SELECT COUNT(*), MAX(mm.created_at) INTO v_count, v_ts FROM market_metrics mm;
  id := 'market_pathways_ds'; name := 'Market Pathway Intelligence'; category := 'market_pathway';
  record_count := v_count; freshness_days := GREATEST(0, EXTRACT(DAY FROM NOW() - v_ts)::int);
  coverage_markets    := ARRAY(SELECT DISTINCT co.country_iso2 FROM countries co WHERE co.country_iso2 IS NOT NULL LIMIT 20);
  coverage_categories := ARRAY[]::text[];
  last_updated := v_ts;
  completeness_pct := CASE WHEN v_count > 50 THEN 80 WHEN v_count > 0 THEN 50 ELSE 20 END;
  status := CASE WHEN v_count > 0 THEN 'active' ELSE 'gap' END;
  RETURN NEXT;
END;
$$;
