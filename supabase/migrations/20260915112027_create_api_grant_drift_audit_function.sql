-- Restored from production migration ledger on 2026-09-16.
create or replace function public.hv_audit_api_grant_drift()
returns table(api_view text, blocked_relation text, blocked_schema text, relation_kind text)
language sql
stable
security invoker
set search_path = 'public'
as $$
  with recursive api_views as (
    select c.oid, c.relname::text as name from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'api' and c.relkind = 'v'
  ),
  chain as (
    select av.name as api_view, av.oid as root_oid, dc.oid as dep_oid, dn.nspname as dep_schema, dc.relname::text as dep_name, dc.relkind as dep_kind,
           coalesce((dc.reloptions is not null and array_to_string(dc.reloptions,',') ilike '%security_invoker=true%'), false) as dep_is_invoker
    from api_views av join pg_rewrite r on r.ev_class = av.oid join pg_depend d on d.objid = r.oid and d.deptype = 'n' join pg_class dc on dc.oid = d.refobjid join pg_namespace dn on dn.oid = dc.relnamespace
    where dc.relkind in ('r','v','m','p') and dc.oid <> av.oid
    union
    select c.api_view, c.root_oid, dc.oid, dn.nspname, dc.relname::text, dc.relkind,
           coalesce((dc.reloptions is not null and array_to_string(dc.reloptions,',') ilike '%security_invoker=true%'), false)
    from chain c join pg_rewrite r on r.ev_class = c.dep_oid join pg_depend d on d.objid = r.oid and d.deptype = 'n' join pg_class dc on dc.oid = d.refobjid join pg_namespace dn on dn.oid = dc.relnamespace
    where c.dep_kind = 'v' and c.dep_is_invoker and dc.relkind in ('r','v','m','p') and dc.oid <> c.dep_oid
  ),
  leaves as (select distinct dep_schema, dep_name, dep_kind from chain c where dep_kind = 'r' or dep_is_invoker = false)
  select distinct c.api_view, c.dep_name, c.dep_schema, c.dep_kind
  from chain c join leaves l on l.dep_schema = c.dep_schema and l.dep_name = c.dep_name
  where not exists (
    select 1 from information_schema.role_table_grants g
    where g.table_schema = c.dep_schema and g.table_name = c.dep_name and g.privilege_type = 'SELECT' and g.grantee in ('anon','authenticated')
  )
  order by 1, 2;
$$;

comment on function public.hv_audit_api_grant_drift() is
  'Standing audit: flags api-schema views whose underlying relations have no anon/authenticated SELECT grant at all. Correctly stops at definer-mode views. Does not check RLS policy content or live behavior.';
