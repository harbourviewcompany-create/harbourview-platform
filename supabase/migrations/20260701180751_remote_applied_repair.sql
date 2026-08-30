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
--
-- Filename order note: this file's timestamp (20260701180751) sorts BEFORE the
-- stub's (20260701230000), so a zero-state replay driven purely by migration
-- filename order (e.g. Supabase's native preview-branch integration, which does
-- not run prepare-production-faithful-migration-replay.mjs) applies this file
-- first and fails with "relation public.corridor_processing_times does not
-- exist" when creating get_corridor_stats(), since Postgres validates
-- referenced relations for LANGUAGE sql functions at CREATE time. The table
-- create below is copied verbatim (schema only, no seed rows) from the stub so
-- this file is self-contained regardless of which migration runs first; the
-- stub's own `create table if not exists` then no-ops harmlessly.

CREATE TABLE IF NOT EXISTS public.corridor_processing_times (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corridor_key text NOT NULL,
  permit_type text,
  days_taken integer NOT NULL,
  submitter_role text,
  verified boolean DEFAULT false,
  submitted_at timestamptz DEFAULT now(),
  CONSTRAINT corridor_processing_times_days_taken_check
    CHECK (days_taken > 0 AND days_taken < 1000)
);

CREATE INDEX IF NOT EXISTS idx_cpt_key
  ON public.corridor_processing_times (corridor_key);

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
