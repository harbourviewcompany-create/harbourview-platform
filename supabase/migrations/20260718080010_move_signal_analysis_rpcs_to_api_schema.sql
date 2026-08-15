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
-- version 20260718080010.
--
-- Rewriting this file cannot affect production: 20260718080010 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Root cause finally found: this project's PostgREST only exposes the
-- 'api' and 'graphql_public' schemas (confirmed directly: "Only the
-- following schemas are exposed: api, graphql_public"). public is NOT
-- reachable via REST at all, under any header combination. This matches
-- and explains the api-schema-views architecture found and fixed for RLS
-- earlier this session -- the whole app's REST surface goes through api,
-- never public directly.
--
-- Moving these RPC functions into api (rather than public) so they're
-- actually callable via PostgREST. The function bodies still reach
-- public.signals via schema-qualified SQL internally.

DROP FUNCTION IF EXISTS public.get_signals_pending_analysis(INT, TEXT);
DROP FUNCTION IF EXISTS public.save_signal_analysis(TEXT, JSONB, TEXT);

CREATE OR REPLACE FUNCTION api.get_signals_pending_analysis(p_limit INT DEFAULT 20, p_signal_id TEXT DEFAULT NULL)
RETURNS TABLE(id TEXT, date TIMESTAMPTZ, cat TEXT, headline TEXT, summary TEXT, source TEXT, country TEXT, score INT, verification TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT s.id, s.date, s.cat, s.headline, s.summary, s.source, s.country, s.score, s.verification
  FROM public.signals s
  WHERE s.reviewed = true
    AND s.analysis IS NULL
    AND s.headline IS NOT NULL
    AND (p_signal_id IS NULL OR s.id = p_signal_id)
  ORDER BY s.date DESC NULLS LAST
  LIMIT p_limit;
END;
$function$;

CREATE OR REPLACE FUNCTION api.save_signal_analysis(p_signal_id TEXT, p_analysis JSONB, p_backend TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.signals
  SET analysis = p_analysis,
      analysis_generated_at = now(),
      analysis_backend = p_backend
  WHERE id = p_signal_id;
  RETURN FOUND;
END;
$function$;

GRANT EXECUTE ON FUNCTION api.get_signals_pending_analysis TO service_role;
GRANT EXECUTE ON FUNCTION api.save_signal_analysis TO service_role;
