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

-- Foreign integration tables exposed to application roles.
select foreign_table_schema, foreign_table_name
from information_schema.foreign_tables
where foreign_table_schema in ('public','api','signals','regulatory_signals')
  and (
    has_table_privilege('anon', format('%I.%I', foreign_table_schema, foreign_table_name), 'select')
    or has_table_privilege('authenticated', format('%I.%I', foreign_table_schema, foreign_table_name), 'select')
  );
