-- Replay repair for production migration 20260701180751 (corridor_intelligence_tables).
--
-- The repository previously kept this applied production version as a SELECT 1
-- parity stub. Fresh read-only production migration-ledger evidence proves the
-- original migration created public.get_corridor_stats(text). Fresh live catalog
-- metadata also proves the API wrapper api.get_corridor_stats(text) exists in
-- production, although its creation is not represented by any recorded migration
-- statement. Later July 13 migrations revoke EXECUTE from both signatures, so a
-- zero-state replay must reconstruct both functions before those grants can be
-- replayed faithfully.
--
-- The corridor tables themselves are reconstructed separately by
-- 20260701230000_corridor_intelligence_tables_stub.sql; this repair restores only
-- the reproduced missing function contracts. Production is unaffected because
-- version 20260701180751 is already recorded remotely.

-- Original production-ledger function body.
CREATE OR REPLACE FUNCTION public.get_corridor_stats(p_key text)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(json_build_object(
    'count',       COUNT(*),
    'avg_days',    ROUND(AVG(days_taken))::int,
    'median_days', PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_taken)::int,
    'min_days',    MIN(days_taken),
    'max_days',    MAX(days_taken),
    'p90_days',    PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY days_taken)::int
  ), '{}'::json)
  FROM public.corridor_processing_times
  WHERE corridor_key = p_key;
$$;

-- Current production API wrapper, reconstructed from pg_get_functiondef().
CREATE OR REPLACE FUNCTION api.get_corridor_stats(p_key text)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO pg_catalog, api, public, signals, regulatory_signals, auth, storage, vault, extensions, net, cron
AS $$
  SELECT public.get_corridor_stats(p_key);
$$;
