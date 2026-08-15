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
-- version 20260718191722.
--
-- Rewriting this file cannot affect production: 20260718191722 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Fixes the same root-cause bug found in hv-signal-analysis: the engine
-- review queue (lib/signals-engine/admin.ts, built earlier this session)
-- makes raw REST calls to /rest/v1/signals with no schema qualification.
-- Since public is not an exposed PostgREST schema for this project (only
-- api and graphql_public are), those calls have been silently failing in
-- production the whole time -- the queue page has never actually worked.
-- These RPC functions, in the api schema, are the fix.

CREATE OR REPLACE FUNCTION api.list_engine_review_queue(p_country TEXT DEFAULT NULL, p_min_score INT DEFAULT 0, p_limit INT DEFAULT 50)
RETURNS TABLE(id TEXT, date TIMESTAMPTZ, cat TEXT, headline TEXT, summary TEXT, source TEXT, url TEXT, verification TEXT, tier TEXT, lang TEXT, country TEXT, score INT, reviewed BOOLEAN, action TEXT, reviewed_by TEXT, reviewed_at TIMESTAMPTZ, created_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT s.id, s.date, s.cat, s.headline, s.summary, s.source, s.url, s.verification, s.tier, s.lang, s.country, s.score, s.reviewed, s.action, s.reviewed_by, s.reviewed_at, s.created_at
  FROM public.signals s
  WHERE s.cat = 'SOURCE_ENGINE'
    AND s.reviewed IS NOT TRUE
    AND (s.action IS NULL OR s.action <> 'rejected')
    AND s.score >= p_min_score
    AND (p_country IS NULL OR s.country = p_country)
  ORDER BY s.score DESC NULLS LAST, s.date DESC NULLS LAST
  LIMIT p_limit;
END;
$function$;

CREATE OR REPLACE FUNCTION api.count_engine_review_queue(p_country TEXT DEFAULT NULL, p_min_score INT DEFAULT 0)
RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE v_count INT;
BEGIN
  SELECT count(*) INTO v_count
  FROM public.signals s
  WHERE s.cat = 'SOURCE_ENGINE'
    AND s.reviewed IS NOT TRUE
    AND (s.action IS NULL OR s.action <> 'rejected')
    AND s.score >= p_min_score
    AND (p_country IS NULL OR s.country = p_country);
  RETURN v_count;
END;
$function$;

CREATE OR REPLACE FUNCTION api.list_engine_review_countries()
RETURNS TABLE(country TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT DISTINCT s.country FROM public.signals s
  WHERE s.cat = 'SOURCE_ENGINE' AND s.reviewed IS NOT TRUE
    AND (s.action IS NULL OR s.action <> 'rejected')
    AND s.country IS NOT NULL
  ORDER BY s.country ASC;
END;
$function$;

CREATE OR REPLACE FUNCTION api.approve_engine_signal(p_id TEXT, p_user_id TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
  UPDATE public.signals SET reviewed = true, action = 'approved', reviewed_by = p_user_id, reviewed_at = now() WHERE id = p_id;
  RETURN FOUND;
END;
$function$;

CREATE OR REPLACE FUNCTION api.reject_engine_signal(p_id TEXT, p_user_id TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
  UPDATE public.signals SET reviewed = false, action = 'rejected', reviewed_by = p_user_id, reviewed_at = now() WHERE id = p_id;
  RETURN FOUND;
END;
$function$;

CREATE OR REPLACE FUNCTION api.bulk_approve_engine_queue(p_country TEXT DEFAULT NULL, p_min_score INT DEFAULT 0, p_user_id TEXT DEFAULT NULL)
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE v_count INT;
BEGIN
  UPDATE public.signals s SET reviewed = true, action = 'approved', reviewed_by = p_user_id, reviewed_at = now()
  WHERE s.cat = 'SOURCE_ENGINE' AND s.reviewed IS NOT TRUE
    AND (s.action IS NULL OR s.action <> 'rejected')
    AND s.score >= p_min_score
    AND (p_country IS NULL OR s.country = p_country);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$function$;

GRANT EXECUTE ON FUNCTION api.list_engine_review_queue TO service_role;
GRANT EXECUTE ON FUNCTION api.count_engine_review_queue TO service_role;
GRANT EXECUTE ON FUNCTION api.list_engine_review_countries TO service_role;
GRANT EXECUTE ON FUNCTION api.approve_engine_signal TO service_role;
GRANT EXECUTE ON FUNCTION api.reject_engine_signal TO service_role;
GRANT EXECUTE ON FUNCTION api.bulk_approve_engine_queue TO service_role;
