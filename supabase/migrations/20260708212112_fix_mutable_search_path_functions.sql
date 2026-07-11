-- Fix mutable search_path security advisory on 5 functions
ALTER FUNCTION public.is_boilerplate_signal(text) SET search_path = public;
ALTER FUNCTION api.get_regulatory_calendar(text, integer) SET search_path = public, api;
ALTER FUNCTION api.get_field_changes_for_country(text, integer) SET search_path = public, api;
ALTER FUNCTION api.get_tables_missing_from_api_schema() SET search_path = public, api;
ALTER FUNCTION api.get_functions_missing_from_api_schema() SET search_path = public, api;