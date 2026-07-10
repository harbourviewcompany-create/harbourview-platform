
-- Fix mutable search_path on api.get_functions_missing_from_api_schema.
-- Adds SET search_path = '' and fully qualifies the delegated call.
CREATE OR REPLACE FUNCTION api.get_functions_missing_from_api_schema()
  RETURNS TABLE(function_name text, arg_types text)
  LANGUAGE sql
  STABLE
  SET search_path = ''
AS $function$
  SELECT * FROM public.get_functions_missing_from_api_schema()
$function$;
