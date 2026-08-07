-- Fix mutable search_path security advisories captured from production.
-- Production contained all five functions when this snapshot was generated;
-- repository zero-state creates several API wrappers later. Harden each exact
-- signature when present without fabricating or reordering API functions.
do $pin_mutable_search_path_functions$
declare
  function_oid regprocedure;
begin
  function_oid := to_regprocedure('public.is_boilerplate_signal(text)');
  if function_oid is not null then
    execute format('alter function %s set search_path = public', function_oid);
  end if;

  function_oid := to_regprocedure('api.get_regulatory_calendar(text,integer)');
  if function_oid is not null then
    execute format('alter function %s set search_path = public, api', function_oid);
  end if;

  function_oid := to_regprocedure('api.get_field_changes_for_country(text,integer)');
  if function_oid is not null then
    execute format('alter function %s set search_path = public, api', function_oid);
  end if;

  function_oid := to_regprocedure('api.get_tables_missing_from_api_schema()');
  if function_oid is not null then
    execute format('alter function %s set search_path = public, api', function_oid);
  end if;

  function_oid := to_regprocedure('api.get_functions_missing_from_api_schema()');
  if function_oid is not null then
    execute format('alter function %s set search_path = public, api', function_oid);
  end if;
end
$pin_mutable_search_path_functions$;
