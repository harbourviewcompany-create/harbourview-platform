-- Reconstructed from production by auto-reconcile-migration-drift.mjs.
-- This version was applied directly against production (outside
-- apply_migration) and had no corresponding repository file, which is
-- exactly what "Compare repository and live migration ledgers" checks for.
-- Statements below are verbatim from supabase_migrations.schema_migrations
-- for version 20260915112027. Adding this file cannot affect production: the
-- version is already applied, so a future `supabase db push` skips it.
-- Auto-generated -- review before merging, same as any other PR.

-- Standing diagnostic: for every view in the api schema, walk its actual
-- dependency chain and report any leaf table/relation that neither anon nor
-- authenticated can SELECT. Correctly stops recursing at any definer-mode
-- view (permissions beyond that point are checked against the view owner,
-- not the caller) and only continues through invoker-mode views, which is
-- what the earlier manual check got wrong on the first pass (api.listings
-- false-positived because it resolves through a view that is now definer).
--
-- This does NOT replace live testing -- it can't see RLS policy *content*,
-- only whether the baseline grant exists at all. But it catches exactly the
-- failure mode that took marketplace_public_listings_v1 12 days to surface,
-- in a single query.
create or replace function public.hv_audit_api_grant_drift()
returns table(api_view text, blocked_relation text, blocked_schema text, relation_kind text)
language sql
stable
security invoker
set search_path = 'public'
as $$
  with recursive api_views as (
    select c.oid, c.relname::text as name
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'api' and c.relkind = 'v'
  ),
  chain as (
    -- seed: direct dependencies of each api view
    select av.name as api_view, av.oid as root_oid, dc.oid as dep_oid,
           dn.nspname as dep_schema, dc.relname::text as dep_name, dc.relkind as dep_kind,
           coalesce((dc.reloptions is not null and array_to_string(dc.reloptions,',') ilike '%security_invoker=true%'), false) as dep_is_invoker
    from api_views av
    join pg_rewrite r on r.ev_class = av.oid
    join pg_depend d on d.objid = r.oid and d.deptype = 'n'
    join pg_class dc on dc.oid = d.refobjid
    join pg_namespace dn on dn.oid = dc.relnamespace
    where dc.relkind in ('r','v','m','p') and dc.oid <> av.oid

    union

    -- recurse only through invoker-mode views; stop at tables and definer views
    select c.api_view, c.root_oid, dc.oid, dn.nspname, dc.relname::text, dc.relkind,
           coalesce((dc.reloptions is not null and array_to_string(dc.reloptions,',') ilike '%security_invoker=true%'), false)
    from chain c
    join pg_rewrite r on r.ev_class = c.dep_oid
    join pg_depend d on d.objid = r.oid and d.deptype = 'n'
    join pg_class dc on dc.oid = d.refobjid
    join pg_namespace dn on dn.oid = dc.relnamespace
    where c.dep_kind = 'v' and c.dep_is_invoker
      and dc.relkind in ('r','v','m','p') and dc.oid <> c.dep_oid
  ),
  leaves as (
    -- a leaf is a table, or a view we stopped at (definer-mode, or no further deps)
    select distinct dep_schema, dep_name, dep_kind
    from chain c
    where dep_kind = 'r' or dep_is_invoker = false
  )
  select distinct c.api_view, c.dep_name, c.dep_schema, c.dep_kind
  from chain c
  join leaves l on l.dep_schema = c.dep_schema and l.dep_name = c.dep_name
  where not exists (
    select 1 from information_schema.role_table_grants g
    where g.table_schema = c.dep_schema and g.table_name = c.dep_name
      and g.privilege_type = 'SELECT'
      and g.grantee in ('anon','authenticated')
  )
  order by 1, 2;
$$;

comment on function public.hv_audit_api_grant_drift() is
  'Standing audit: flags api-schema views whose underlying relations have no anon/authenticated SELECT grant at all -- the exact failure mode that broke marketplace_public_listings_v1 for 12 days undetected. Correctly stops at definer-mode views (permission checks stop applying to the caller beyond that point). Does not check RLS policy content or live behavior -- pair with a real request test for full confidence. Added 2026-09-12 after a session-long audit found 10 tables broken this way.';
