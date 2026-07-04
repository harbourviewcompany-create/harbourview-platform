-- Fix mutable search_path in public.safe_to_jsonb (security advisory: function_search_path_mutable)
CREATE OR REPLACE FUNCTION public.safe_to_jsonb(t text)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path = ''
AS $function$
begin
  return t::jsonb;
exception when others then
  return '[]'::jsonb;
end $function$;
