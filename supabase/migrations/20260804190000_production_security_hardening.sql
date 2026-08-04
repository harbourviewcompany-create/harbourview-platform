-- Production security hardening for the Harbourview Supabase boundary.
-- This migration changes privileges and execution context only. It does not
-- delete application data or rewrite business records.

create schema if not exists extensions;
revoke create on schema extensions from public;
grant usage on schema extensions to postgres, service_role, authenticated, anon;

-- Migration-local existence helper required by the repository SQL safety gate.
create or replace function public.view_exists(p_schema text, p_view text)
returns boolean
language sql
stable
set search_path = pg_catalog
as $function$
  select exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = p_schema
      and c.relname = p_view
      and c.relkind = 'v'
  );
$function$;
revoke all on function public.view_exists(text, text) from public, anon, authenticated;

-- Relocate only extensions PostgreSQL marks relocatable. pg_net is not
-- relocatable on this project; it is contained through schema/function grants.
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

-- Explicit inventory of exposed views identified by the production advisor.
-- Each change is guarded so a clean-history or environment-specific absence is
-- safe and deterministic.
do $$
declare
  view_row record;
  anon_select boolean;
  authenticated_select boolean;
begin
  for view_row in
    select * from (values
      ('api','hv_artifacts'),
      ('api','hv_processing_jobs'),
      ('api','schema_drift_alerts'),
      ('api','scraper_source_state'),
      ('public','admin_active_matches'),
      ('public','admin_pending_buyer_requests'),
      ('public','admin_pending_listings'),
      ('public','content_coverage_queue'),
      ('public','country_intel_public'),
      ('public','genetics_public_claims'),
      ('public','genetics_public_collaboration_projects'),
      ('public','genetics_public_country_opportunities'),
      ('public','genetics_public_cultivar_aliases'),
      ('public','genetics_public_cultivar_passports'),
      ('public','genetics_public_evidence_summaries'),
      ('public','genetics_public_profiles'),
      ('public','genetics_public_service_providers'),
      ('public','ia_sources_live'),
      ('public','jurisdiction_cross_table_conflicts'),
      ('public','local_intel_jurisdiction_combined'),
      ('public','local_intel_next_batch'),
      ('public','marketplace_public_listings_v1'),
      ('public','platform_coverage_summary'),
      ('public','playbook_regulator_drift'),
      ('public','playbook_staleness_queue'),
      ('public','public_country_profile_dto'),
      ('public','signals_for_digest'),
      ('public','signals_intelligence_feed'),
      ('public','signals_quality'),
      ('public','source_domain_type'),
      ('public','source_yield_report'),
      ('public','v_jurisdiction_unified'),
      ('regulatory_signals','public_signals'),
      ('regulatory_signals','public_source_status'),
      ('regulatory_signals','public_watchlist_collection_signals'),
      ('regulatory_signals','public_watchlist_collections')
    ) as exposed(schema_name, relation_name)
  loop
    if public.view_exists(view_row.schema_name, view_row.relation_name) then
      anon_select := has_table_privilege('anon', format('%I.%I', view_row.schema_name, view_row.relation_name), 'select');
      authenticated_select := has_table_privilege('authenticated', format('%I.%I', view_row.schema_name, view_row.relation_name), 'select');

      execute format('alter view %I.%I set (security_invoker = true)', view_row.schema_name, view_row.relation_name);
      execute format('revoke all privileges on table %I.%I from public, anon, authenticated', view_row.schema_name, view_row.relation_name);
      execute format('grant select on table %I.%I to service_role', view_row.schema_name, view_row.relation_name);

      if anon_select then
        execute format('grant select on table %I.%I to anon', view_row.schema_name, view_row.relation_name);
      end if;
      if authenticated_select then
        execute format('grant select on table %I.%I to authenticated', view_row.schema_name, view_row.relation_name);
      end if;
    end if;
  end loop;
end
$$;

-- Internal/admin projections are never direct application-role surfaces.
do $$
declare
  protected_row record;
begin
  for protected_row in
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
    if public.view_exists(protected_row.schema_name, protected_row.relation_name) then
      execute format('revoke all privileges on table %I.%I from public, anon, authenticated', protected_row.schema_name, protected_row.relation_name);
      execute format('grant select on table %I.%I to service_role', protected_row.schema_name, protected_row.relation_name);
    end if;
  end loop;
end
$$;

-- RLS-enabled tables without policies already deny every row. Remove any table
-- grants inherited from historical blanket grants without adding synthetic RLS
-- policies that could conceal the missing review decision.
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
    execute format('revoke all privileges on table %I.%I from public, anon, authenticated', table_row.schema_name, table_row.relation_name);
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
    execute format('revoke all privileges on table %I.%I from public, anon, authenticated', foreign_row.schema_name, foreign_row.relation_name);
    execute format('grant select on table %I.%I to service_role', foreign_row.schema_name, foreign_row.relation_name);
  end loop;
end
$$;

-- Remove direct access to asynchronous network internals from browser roles.
revoke usage on schema net from public, anon, authenticated;
grant usage on schema net to service_role;

-- SECURITY DEFINER routines default closed. Catalog-wide revocation is safe;
-- execution is restored only through the explicit allowlists below.
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
    execute format('revoke all privileges on %s %s from public, anon, authenticated, service_role', routine_kind, routine.signature);
  end loop;
end
$$;

-- Audited service-role RPC allowlist. Missing signatures are ignored so this
-- migration remains replayable across local and hosted extension variants.
do $$
declare
  signature text;
  routine regprocedure;
begin
  foreach signature in array array[
    'api.acquire_crawl_targets(integer,text)',
    'api.apply_airtable_tier(text,text,text)',
    'api.apply_editorial_title(text,text,text)',
    'api.check_and_increment_llm_rate_limit(uuid,timestamptz,integer)',
    'api.claim_intelligence_job(text,text)',
    'api.enqueue_regulatory_enrichment()',
    'api.get_airtable_sync_config()',
    'api.get_command_centre_stats()',
    'api.get_corridor_stats(text)',
    'api.get_github_pat()',
    'api.get_source_registry_coverage(text)',
    'api.hv_bridge_key_matches(text)',
    'api.hv_extract_signals_from_captured_text(integer)',
    'api.hv_ingest_snapshot_to_staging(integer,uuid)',
    'api.intel_eval_rows_needing_prediction(text,integer)',
    'api.pool_rows_needing_classification(integer)',
    'api.promote_all_extracted_snapshots()',
    'api.reconcile_airtable_tiers(jsonb)',
    'api.regulatory_pending_changes_feed()',
    'api.rows_needing_titles(integer)',
    'api.search_public_signals(extensions.vector,integer,text,text)',
    'api.signal_relevance_feedback_for_ranking(text[],timestamptz)',
    'api.submit_signal_relevance_feedback(text,text,text,text)',
    'api.is_verified_clinician(uuid)',
    'api.clinical_has_active_consent(uuid,text)',
    'api.clinical_request_verification(text,text,text,uuid)',
    'api.clinical_admin_verify_professional(uuid,boolean,text)',
    'public.acquire_crawl_targets(integer,text)',
    'public.check_and_increment_llm_rate_limit(uuid,timestamptz,integer)',
    'public.claim_intelligence_job(text,text)',
    'public.enqueue_regulatory_enrichment()',
    'public.get_command_centre_stats()',
    'public.get_corridor_stats(text)',
    'public.get_github_pat()',
    'public.hv_extract_signals_from_captured_text(integer)',
    'public.hv_ingest_snapshot_to_staging(integer,uuid)',
    'public.hv_intelligence_outcome_check()',
    'public.promote_all_extracted_snapshots()',
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
      execute format('grant execute on function %s to service_role', routine);
    end if;
  end loop;
end
$$;

-- Audited authenticated RPC/policy-helper allowlist.
do $$
declare
  signature text;
  routine regprocedure;
begin
  foreach signature in array array[
    'api.get_command_centre_stats()',
    'api.get_corridor_stats(text)',
    'api.get_source_registry_coverage(text)',
    'api.regulatory_pending_changes_feed()',
    'api.submit_signal_relevance_feedback(text,text,text,text)',
    'api.is_verified_clinician(uuid)',
    'api.clinical_has_active_consent(uuid,text)',
    'api.clinical_request_verification(text,text,text,uuid)',
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
alter default privileges for role postgres in schema public revoke all on tables from public, anon, authenticated;
alter default privileges for role postgres in schema api revoke all on tables from public, anon, authenticated;

notify pgrst, 'reload schema';

drop function public.view_exists(text, text);
