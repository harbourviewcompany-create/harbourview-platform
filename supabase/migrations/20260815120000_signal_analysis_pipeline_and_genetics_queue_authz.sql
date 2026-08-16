-- Reconciliation migration: 2026-08-11 session
--
-- Every object below was applied live and independently verified working
-- during a single session on 2026-08-11 (grants confirmed via
-- has_function_privilege, RPC chains confirmed via real end-to-end calls
-- through the hv-signal-analysis edge function, not assumed). This file
-- exists solely to bring migration history in line with what production
-- already runs -- it is a catch-up, not new work. Applying it to an
-- environment that already has these objects should be a no-op (every
-- statement is CREATE OR REPLACE / idempotent GRANT).
--
-- Grouped by the problem each part fixes, in the order they were found.

-- ─── 1. hv-signal-analysis pipeline: dead since 2026-07-21 ─────────────────
-- Root cause was two stacked bugs: service_role had no EXECUTE grant on
-- either RPC (so the edge function's PostgREST calls always failed and
-- silently fell through to a stale env-var fallback), and the RPCs' own
-- internal authz check (is_genetics_admin_or_reviewer) requires a real
-- auth.uid(), which a service_role-only caller can never provide.

CREATE OR REPLACE FUNCTION public.is_service_role_or_signal_analyst()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
  select auth.role() = 'service_role' or public.is_genetics_admin_or_reviewer();
$function$;

CREATE OR REPLACE FUNCTION api.get_signals_pending_analysis(p_limit integer DEFAULT 20, p_signal_id text DEFAULT NULL::text)
 RETURNS TABLE(id text, date timestamp with time zone, cat text, headline text, summary text, source text, country text, score integer, verification text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'api', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
BEGIN
  if not public.is_service_role_or_signal_analyst() then
    raise exception 'insufficient privileges: admin/operator/analyst role required' using errcode = '42501';
  end if;
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

CREATE OR REPLACE FUNCTION api.save_signal_analysis(p_signal_id text, p_analysis jsonb, p_backend text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'api', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
BEGIN
  if not public.is_service_role_or_signal_analyst() then
    raise exception 'insufficient privileges: admin/operator/analyst role required' using errcode = '42501';
  end if;
  UPDATE public.signals
  SET analysis = p_analysis,
      analysis_generated_at = now(),
      analysis_backend = p_backend
  WHERE id = p_signal_id;
  RETURN FOUND;
END;
$function$;

GRANT EXECUTE ON FUNCTION api.get_signals_pending_analysis(integer, text) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION api.save_signal_analysis(text, jsonb, text) TO service_role, authenticated;

-- ─── 2. Genetics review queue: same authz gap, three more functions ───────
-- lib/signals-engine/admin.ts calls these with the raw service_role key too
-- -- same root cause as above. Fixed by reusing the helper from part 1
-- rather than broadening is_genetics_admin_or_reviewer() itself, since that
-- function also gates unrelated genetics-domain writes
-- (approve/reject/bulk-approve here are review-queue actions, not those).

CREATE OR REPLACE FUNCTION api.approve_engine_signal(p_id text, p_user_id text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'api', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
BEGIN
  if not public.is_service_role_or_signal_analyst() then
    raise exception 'insufficient privileges: admin/operator/analyst role required' using errcode = '42501';
  end if;
  UPDATE public.signals SET reviewed = true, action = 'approved', reviewed_by = p_user_id, reviewed_at = now() WHERE id = p_id;
  RETURN FOUND;
END;
$function$;

CREATE OR REPLACE FUNCTION api.reject_engine_signal(p_id text, p_user_id text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'api', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
BEGIN
  if not public.is_service_role_or_signal_analyst() then
    raise exception 'insufficient privileges: admin/operator/analyst role required' using errcode = '42501';
  end if;
  UPDATE public.signals SET reviewed = false, action = 'rejected', reviewed_by = p_user_id, reviewed_at = now() WHERE id = p_id;
  RETURN FOUND;
END;
$function$;

CREATE OR REPLACE FUNCTION api.bulk_approve_engine_queue(p_country text DEFAULT NULL::text, p_min_score integer DEFAULT 0, p_user_id text DEFAULT NULL::text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'api', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
DECLARE v_count INT;
BEGIN
  if not public.is_service_role_or_signal_analyst() then
    raise exception 'insufficient privileges: admin/operator/analyst role required' using errcode = '42501';
  end if;
  UPDATE public.signals s SET reviewed = true, action = 'approved', reviewed_by = p_user_id, reviewed_at = now()
  WHERE s.cat = 'SOURCE_ENGINE' AND s.reviewed IS NOT TRUE
    AND (s.action IS NULL OR s.action <> 'rejected')
    AND s.score >= p_min_score
    AND (p_country IS NULL OR s.country = p_country);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$function$;

GRANT EXECUTE ON FUNCTION api.approve_engine_signal(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION api.reject_engine_signal(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION api.bulk_approve_engine_queue(text, integer, text) TO service_role;

