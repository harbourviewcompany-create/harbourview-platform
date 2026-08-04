-- Production security hardening for the Harbourview Supabase boundary.
-- This migration changes privileges and execution context only. It does not
-- delete application data or rewrite business records.

begin;

create schema if not exists extensions;
revoke create on schema extensions from public;
grant usage on schema extensions to postgres, service_role, authenticated, anon;

-- Relocate only extensions that PostgreSQL marks relocatable. pg_net is not
-- relocatable on this project; it is contained below through schema/function
-- privilege revocation and remains a documented platform exception.
do $$
declare
  ext record;
begin
  for ext in
    select e.extname, n.nspname as current_schema
    from pg_extension e
    join pg_namespace n on n.oid = e.extnamespace
    where e.extname in ('vector', 'pg_trgm')
      and e.extrelocatable
      and n.nspname <> 'extensions'
  loop
    execute format('alter extension %I set schema extensions', ext.extname);
  end loop;
end
$$;

-- Views in exposed application schemas must execute with caller privileges so
-- underlying RLS policies remain authoritative.
do $$
declare
  view_row record;
  anon_select boolean;
  authenticated_select boolean;
begin
  for view_row in
    select n.nspname as schema_name, c.relname as relation_name, c.oid
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where c.relkind = 'v'
      and n.nspname in ('public', 'api', 'signals', 'regulatory_signals')
  loop
    anon_select := has_table_privilege('anon', view_row.oid, 'select');
    authenticated_select := has_table_privilege('authenticated', view_row.oid, 'select');

    execute format('alter view %I.%I set (security_invoker = true)', view_row.schema_name, view_row.relation_name);
    execute format('revoke all privileges on table %I.%I from anon, authenticated', view_row.schema_name, view_row.relation_name);
    execute format('grant select on table %I.%I to service_role', view_row.schema_name, view_row.relation_name);

    if anon_select then
      execute format('grant select on table %I.%I to anon', view_row.schema_name, view_row.relation_name);
    end if;
    if authenticated_select then
      execute format('grant select on table %I.%I to authenticated', view_row.schema_name, view_row.relation_name);
    end if;
  end loop;
end
$$;

-- Internal/admin views are never direct application-role surfaces even when a
-- historical blanket grant exists.
do $$
declare
  relation_name text;
  schema_name text;
begin
  for schema_name, relation_name in
    select * from (values
      ('api','hv_artifacts'),
      ('api','hv_processing_jobs'),
      ('api','schema_drift_alerts'),
      ('api','scraper_source_state'),
      ('public','admin_active_matches'),
      ('public','admin_pending_buyer_requests'),
      ('public','admin_pending_listings'),
      ('public','content_coverage_queue'),
      ('public','jurisdiction_cross_table_conflicts'),
      ('public','local_intel_next_batch'),
      ('public','playbook_regulator_drift'),
      ('public','playbook_staleness_queue'),
      ('public','signals_for_digest'),
      ('public','signals_quality'),
      ('public','source_domain_type'),
      ('public','source_yield_report')
    ) as protected(schema_name, relation_name)
  loop
    if to_regclass(format('%I.%I', schema_name, relation_name)) is not null then
      execute format('revoke all privileges on table %I.%I from anon, authenticated', schema_name, relation_name);
      execute format('grant select on table %I.%I to service_role', schema_name, relation_name);
    end if;
  end loop;
end
$$;

-- RLS-enabled tables without policy remain explicitly unavailable to public
-- application roles. Service-role and owner paths continue to function.
do $$
declare
  table_row record;
begin
  for table_row in
    select n.nspname as schema_name, c.relname as relation_name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where c.relkind in ('r','p','f')
      and c.relrowsecurity
      and n.nspname in ('public', 'api', 'signals', 'regulatory_signals')
      and not exists (select 1 from pg_policy p where p.polrelid = c.oid)
  loop
    execute format('revoke all privileges on table %I.%I from anon, authenticated', table_row.schema_name, table_row.relation_name);
    execute format(
      'create policy deny_application_roles_until_reviewed on %I.%I as restrictive for all to anon, authenticated using (false) with check (false)',
      table_row.schema_name,
      table_row.relation_name
    );
  end loop;
end
$$;

-- Foreign tables are backend integration surfaces, not browser API surfaces.
do $$
declare
  foreign_row record;
begin
  for foreign_row in
    select foreign_table_schema as schema_name, foreign_table_name as relation_name
    from information_schema.foreign_tables
    where foreign_table_schema in ('public', 'api', 'signals', 'regulatory_signals')
  loop
    execute format('revoke all privileges on table %I.%I from anon, authenticated', foreign_row.schema_name, foreign_row.relation_name);
    execute format('grant select on table %I.%I to service_role', foreign_row.schema_name, foreign_row.relation_name);
  end loop;
end
$$;

-- Remove direct access to asynchronous network internals from browser roles.
revoke usage on schema net from anon, authenticated;
grant usage on schema net to service_role;

-- SECURITY DEFINER routines default to service-role only. The authenticated
-- allowlist below contains only audited end-user/policy-helper contracts.
do $$
declare
  routine record;
  routine_kind text;
begin
  for routine in
    select p.oid::regprocedure as signature, p.prokind
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where p.prosecdef
      and n.nspname in ('public', 'api', 'signals', 'regulatory_signals', 'net')
      and not exists (
        select 1 from pg_depend d
        where d.classid = 'pg_proc'::regclass
          and d.objid = p.oid
          and d.deptype = 'e'
      )
  loop
    routine_kind := case when routine.prokind = 'p' then 'procedure' else 'function' end;
    execute format('revoke all privileges on %s %s from public, anon, authenticated', routine_kind, routine.signature);
    execute format('grant execute on %s %s to service_role', routine_kind, routine.signature);
  end loop;
end
$$;

-- Audited authenticated RPC and policy-helper allowlist.
do $$
declare
  signature text;
  routine regprocedure;
begin
  foreach signature in array array[
    'api.get_command_centre_stats()',
    'api.get_source_registry_coverage(text)',
    'api.regulatory_pending_changes_feed()',
    'api.is_verified_clinician(uuid)',
    'api.clinical_has_active_consent(uuid,text)',
    'api.clinical_request_verification(text,text,text,uuid)',
    'api.clinical_admin_verify_professional(uuid,boolean,text)',
    'api.submit_signal_relevance_feedback(text,text,text,text)',
    'public.hv_is_org_member(uuid)',
    'public.hv_is_platform_staff()',
    'public.is_genetics_admin_or_reviewer()',
    'public.is_hv_staff()',
    'public.current_user_tier()',
    'public.is_regulatory_tier_admin()'
  ]
  loop
    routine := to_regprocedure(signature);
    if routine is not null then
      execute format('grant execute on function %s to authenticated', routine);
    end if;
  end loop;
end
$$;

-- Pin search_path for every custom application routine. Extension-owned
-- routines are excluded so extension upgrades remain vendor-controlled.
do $$
declare
  routine record;
  routine_kind text;
  safe_path text;
begin
  for routine in
    select p.oid::regprocedure as signature, p.prokind, n.nspname as schema_name
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'api', 'signals', 'regulatory_signals')
      and p.prokind in ('f','p')
      and not exists (
        select 1 from pg_depend d
        where d.classid = 'pg_proc'::regclass
          and d.objid = p.oid
          and d.deptype = 'e'
      )
  loop
    routine_kind := case when routine.prokind = 'p' then 'procedure' else 'function' end;
    safe_path := format('pg_catalog, %I, public, api, signals, regulatory_signals, auth, storage, vault, extensions, net, cron', routine.schema_name);
    execute format('alter %s %s set search_path = %s', routine_kind, routine.signature, safe_path);
  end loop;
end
$$;

-- Future objects start closed and must be granted intentionally by their own
-- migration.
alter default privileges for role postgres in schema public revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema api revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema signals revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema regulatory_signals revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema api revoke all on tables from anon, authenticated;

notify pgrst, 'reload schema';

commit;
