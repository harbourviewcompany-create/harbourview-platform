-- Fix mutable search_path on api.get_functions_missing_from_api_schema when
-- its public delegate already exists. In repository zero-state, the delegate
-- is created by 20260710140000_schema_drift_monitor_functions.sql, so defer
-- this repair until that creator while preserving direct-state production
-- behavior at this chronology point.
DO $guard_get_functions_missing_wrapper$
BEGIN
  IF to_regprocedure('public.get_functions_missing_from_api_schema()') IS NOT NULL THEN
    EXECUTE $function_sql$
      CREATE OR REPLACE FUNCTION api.get_functions_missing_from_api_schema()
        RETURNS TABLE(function_name text, arg_types text)
        LANGUAGE sql
        STABLE
        SET search_path = ''
      AS $function$
        SELECT * FROM public.get_functions_missing_from_api_schema()
      $function$
    $function_sql$;
  END IF;
END
$guard_get_functions_missing_wrapper$;
