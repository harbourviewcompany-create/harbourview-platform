-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260705101219.
--
-- Rewriting this file cannot affect production: 20260705101219 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- The api.* wrapper unmasked a pre-existing bug in the underlying function
-- itself: it referenced countries.country_iso2, which has never existed
-- (real column is iso_alpha2). This would have thrown the same error even
-- via direct public-schema access -- the 404 just hid it until now.
create or replace function public.get_proprietary_datasets()
 RETURNS TABLE(id text, name text, category text, record_count bigint, freshness_days integer, coverage_markets text[], coverage_categories text[], last_updated timestamp with time zone, completeness_pct integer, status text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  coverage_markets    := ARRAY(SELECT DISTINCT co.iso_alpha2 FROM countries co WHERE co.iso_alpha2 IS NOT NULL LIMIT 20);
  coverage_categories := ARRAY[]::text[];
  last_updated := v_ts;
  completeness_pct := CASE WHEN v_count > 50 THEN 80 WHEN v_count > 0 THEN 50 ELSE 20 END;
  status := CASE WHEN v_count > 0 THEN 'active' ELSE 'gap' END;
  RETURN NEXT;
END;
$function$;

notify pgrst, 'reload schema';
