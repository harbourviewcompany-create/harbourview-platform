-- Must return zero rows after 20260804190000_production_security_hardening.sql.

-- Exposed views still running with owner privileges.
select n.nspname as schema_name, c.relname as view_name
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where c.relkind = 'v'
  and n.nspname in ('public','api','signals','regulatory_signals')
  and not coalesce((select bool_or(option_name = 'security_invoker' and option_value = 'true') from pg_options_to_table(c.reloptions)), false);

-- Policyless RLS tables that still expose table privileges to application roles.
select n.nspname as schema_name, c.relname as table_name
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where c.relkind in ('r','p','f')
  and c.relrowsecurity
  and n.nspname in ('public','api','signals','regulatory_signals')
  and not exists (select 1 from pg_policy p where p.polrelid = c.oid)
  and (
    has_table_privilege('anon', c.oid, 'select,insert,update,delete')
    or has_table_privilege('authenticated', c.oid, 'select,insert,update,delete')
  );

-- SECURITY DEFINER routines executable by anon.
select n.nspname, p.proname, pg_get_function_identity_arguments(p.oid)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where p.prosecdef
  and n.nspname in ('public','api','signals','regulatory_signals','net')
  and has_function_privilege('anon', p.oid, 'execute');

-- External-network digest and country-enrichment routines must exist, remain
-- unavailable to browser roles, and be executable only through service_role.
with expected_privileges(role_name, routine_signature, should_execute) as (
  values
    ('anon', 'public.run_editorial_digest()', false),
    ('authenticated', 'public.run_editorial_digest()', false),
    ('service_role', 'public.run_editorial_digest()', true),
    ('anon', 'public.run_country_intel_enrichment()', false),
    ('authenticated', 'public.run_country_intel_enrichment()', false),
    ('service_role', 'public.run_country_intel_enrichment()', true)
), resolved as (
  select
    role_name,
    routine_signature,
    should_execute,
    to_regprocedure(routine_signature) as routine_oid
  from expected_privileges
)
select role_name, routine_signature, should_execute, routine_oid
from resolved
where case
  when routine_oid is null then true
  else has_function_privilege(role_name, routine_oid, 'execute') is distinct from should_execute
end;

-- Foreign integration tables exposed to application roles.
select foreign_table_schema, foreign_table_name
from information_schema.foreign_tables
where foreign_table_schema in ('public','api','signals','regulatory_signals')
  and (
    has_table_privilege('anon', format('%I.%I', foreign_table_schema, foreign_table_name), 'select')
    or has_table_privilege('authenticated', format('%I.%I', foreign_table_schema, foreign_table_name), 'select')
  );