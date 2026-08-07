-- Extends schema_drift monitoring to public functions meant to be called via
-- supabase.rpc() (get_*/search_*/list_* naming) that lack an api-schema
-- wrapper. Excludes extension-owned functions (pgvector etc.) via pg_depend,
-- and excludes internal-only callers (run_*, hv_trigger_*, is_*, sync_*,
-- smoke_*) via naming filter since those are invoked by cron/service_role,
-- never by a browser client.

CREATE OR REPLACE FUNCTION public.get_functions_missing_from_api_schema()
RETURNS TABLE(function_name text, arg_types text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT p.proname, pg_get_function_identity_arguments(p.oid)
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  JOIN pg_language l ON l.oid = p.prolang
  WHERE n.nspname = 'public'
    AND p.prokind = 'f'
    AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e')
    AND l.lanname NOT IN ('c', 'internal')
    AND pg_get_function_result(p.oid) <> 'trigger'
    AND (p.proname LIKE 'get\_%' OR p.proname LIKE 'search\_%' OR p.proname LIKE 'list\_%')
    AND NOT EXISTS (SELECT 1 FROM public.schema_drift_allowlist al WHERE al.table_name = p.proname)
    AND NOT EXISTS (
      SELECT 1 FROM pg_proc a
      JOIN pg_namespace an ON an.oid = a.pronamespace
      WHERE an.nspname = 'api' AND a.proname = p.proname
    )
  ORDER BY p.proname;
$fn$;

CREATE OR REPLACE FUNCTION api.get_functions_missing_from_api_schema()
RETURNS TABLE(function_name text, arg_types text)
LANGUAGE sql STABLE
SET search_path = ''
AS $fn$ SELECT * FROM public.get_functions_missing_from_api_schema() $fn$;

GRANT EXECUTE ON FUNCTION public.get_functions_missing_from_api_schema() TO service_role;
GRANT EXECUTE ON FUNCTION api.get_functions_missing_from_api_schema() TO service_role;

INSERT INTO public.schema_drift_alerts (object_name, first_seen_at)
SELECT 'fn:' || function_name, now() FROM public.get_functions_missing_from_api_schema()
ON CONFLICT (object_name) DO NOTHING;

NOTIFY pgrst, 'reload schema';
