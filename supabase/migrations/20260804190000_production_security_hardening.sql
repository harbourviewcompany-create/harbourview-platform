-- Production security hardening for the Harbourview Supabase boundary.
-- This migration changes privileges and execution context only. It does not
-- delete application data or rewrite business records.

create schema if not exists extensions;
revoke create on schema extensions from public;
grant usage on schema extensions to postgres, service_role, authenticated, anon;

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

-- Explicit grant matrix for every advisor-identified view.
-- public: documented guest projections; anon/authenticated SELECT is explicit.
-- preserve: application projections with existing read contracts; writes are removed
--           without widening or removing the current SELECT ACL.
-- internal: admin/operator projections; browser roles receive no privileges.
do $$
declare
  view_row record;
  anon_can_select boolean;
  authenticated_can_select boolean;
begin
  for view_row in
    select * from (values
      ('api','hv_artifacts','internal'),
      ('api','hv_processing_jobs','internal'),
      ('api','schema_drift_alerts','internal'),
      ('api','scraper_source_state','internal'),
      ('public','admin_active_matches','internal'),
      ('public','admin_pending_buyer_requests','internal'),
      ('public','admin_pending_listings','internal'),
      ('public','content_coverage_queue','internal'),
      ('public','country_intel_public','public'),
      ('public','genetics_public_claims','public'),
      ('public','genetics_public_collaboration_projects','public'),
      ('public','genetics_public_country_opportunities','public'),
      ('public','genetics_public_cultivar_aliases','public'),
      ('public','genetics_public_cultivar_passports','public'),
      ('public','genetics_public_evidence_summaries','public'),
      ('public','genetics_public_profiles','public'),
      ('public','genetics_public_service_providers','public'),
      ('public','ia_sources_live','preserve'),
      ('public','jurisdiction_cross_table_conflicts','internal'),
      ('public','local_intel_jurisdiction_combined','preserve'),
      ('public','local_intel_next_batch','internal'),
      ('public','marketplace_public_listings_v1','public'),
      ('public','platform_coverage_summary','preserve'),
      ('public','playbook_regulator_drift','internal'),
      ('public','playbook_staleness_queue','internal'),
      ('public','public_country_profile_dto','public'),
      ('public','signals_for_digest','internal'),
      ('public','signals_intelligence_feed','preserve'),
      ('public','signals_quality','internal'),
      ('public','source_domain_type','internal'),
      ('public','source_yield_report','internal'),
      ('public','v_jurisdiction_unified','preserve'),
      ('regulatory_signals','public_signals','public'),
      ('regulatory_signals','public_source_status','public'),
      ('regulatory_signals','public_watchlist_collection_signals','public'),
      ('regulatory_signals','public_watchlist_collections','public')
    ) as inventory(schema_name, relation_name, access_policy)
  loop
    if exists (
      select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = view_row.schema_name
        and c.relname = view_row.relation_name
        and c.relkind = 'v'
    ) then
      execute format(
        'alter view %I.%I set (security_invoker = true)',
        view_row.schema_name,
        view_row.relation_name
      );

      if view_row.access_policy = 'public' then
        execute format(
          'revoke all privileges on table %I.%I from public, anon, authenticated',
          view_row.schema_name,
          view_row.relation_name
        );
        execute format(
          'grant select on table %I.%I to anon, authenticated, service_role',
          view_row.schema_name,
          view_row.relation_name
        );
      elsif view_row.access_policy = 'preserve' then
        -- Preserve the effective browser-role SELECT contract without retaining
        -- historical write grants or widening access for a role that did not
        -- already have read permission.
        anon_can_select := has_table_privilege(
          'anon',
          format('%I.%I', view_row.schema_name, view_row.relation_name),
          'select'
        );
        authenticated_can_select := has_table_privilege(
          'authenticated',
          format('%I.%I', view_row.schema_name, view_row.relation_name),
          'select'
        );
        execute format(
          'revoke all privileges on table %I.%I from public, anon, authenticated',
          view_row.schema_name,
          view_row.relation_name
        );
        if anon_can_select then
          execute format(
            'grant select on table %I.%I to anon',
            view_row.schema_name,
            view_row.relation_name
          );
        end if;
        if authenticated_can_select then
          execute format(
            'grant select on table %I.%I to authenticated',
            view_row.schema_name,
            view_row.relation_name
          );
        end if;
        execute format(
          'grant select on table %I.%I to service_role',
          view_row.schema_name,
          view_row.relation_name
        );
      else
        execute format(
          'revoke all privileges on table %I.%I from public, anon, authenticated',
          view_row.schema_name,
          view_row.relation_name
        );
        execute format(
          'grant select on table %I.%I to service_role',
          view_row.schema_name,
          view_row.relation_name
        );
      end if;
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
-- pg_net is optional in isolated/local environments, so guard the schema.
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'net') then
    execute 'revoke usage on schema net from public, anon, authenticated';
    execute 'grant usage on schema net to service_role';
  end if;
end
$$;

-- pg_net routines are extension-owned and therefore excluded from the generic
-- custom-routine loop below. Close their routine ACLs explicitly while keeping
-- the service-role integration path available.
do $$
declare
  routine record;
  routine_kind text;
begin
  for routine in
    select p.oid::regprocedure as signature, p.prokind
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'net'
      and p.prokind in ('f','p')
  loop
    routine_kind := case when routine.prokind = 'p' then 'procedure' else 'function' end;
    execute format(
      'revoke all privileges on %s %s from public, anon, authenticated',
      routine_kind,
      routine.signature
    );
    execute format(
      'grant execute on %s %s to service_role',
      routine_kind,
      routine.signature
    );
  end loop;
end
$$;

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

-- Audited service-role RPC allowlist. Every grant names one exact signature.
do $$
begin
  if to_regprocedure('api.acquire_crawl_targets(integer,text)') is not null then
    grant execute on function api.acquire_crawl_targets(integer,text) to service_role;
  end if;
  if to_regprocedure('api.apply_airtable_tier(text,text,text)') is not null then
    grant execute on function api.apply_airtable_tier(text,text,text) to service_role;
  end if;
  if to_regprocedure('api.apply_editorial_title(text,text,text)') is not null then
    grant execute on function api.apply_editorial_title(text,text,text) to service_role;
  end if;
  if to_regprocedure('api.check_and_increment_llm_rate_limit(uuid,timestamptz,integer)') is not null then
    grant execute on function api.check_and_increment_llm_rate_limit(uuid,timestamptz,integer) to service_role;
  end if;
  if to_regprocedure('api.claim_intelligence_job(text,text)') is not null then
    grant execute on function api.claim_intelligence_job(text,text) to service_role;
  end if;
  if to_regprocedure('api.enqueue_regulatory_enrichment()') is not null then
    grant execute on function api.enqueue_regulatory_enrichment() to service_role;
  end if;
  if to_regprocedure('api.get_airtable_sync_config()') is not null then
    grant execute on function api.get_airtable_sync_config() to service_role;
  end if;
  if to_regprocedure('api.get_command_centre_stats()') is not null then
    grant execute on function api.get_command_centre_stats() to service_role;
  end if;
  if to_regprocedure('api.get_corridor_stats(text)') is not null then
    grant execute on function api.get_corridor_stats(text) to service_role;
  end if;
  if to_regprocedure('api.get_github_pat()') is not null then
    grant execute on function api.get_github_pat() to service_role;
  end if;
  if to_regprocedure('api.get_source_registry_coverage(text)') is not null then
    grant execute on function api.get_source_registry_coverage(text) to service_role;
  end if;
  if to_regprocedure('api.hv_bridge_key_matches(text)') is not null then
    grant execute on function api.hv_bridge_key_matches(text) to service_role;
  end if;
  if to_regprocedure('api.hv_extract_signals_from_captured_text(integer)') is not null then
    grant execute on function api.hv_extract_signals_from_captured_text(integer) to service_role;
  end if;
  if to_regprocedure('api.hv_ingest_snapshot_to_staging(integer,uuid)') is not null then
    grant execute on function api.hv_ingest_snapshot_to_staging(integer,uuid) to service_role;
  end if;
  if to_regprocedure('api.intel_eval_rows_needing_prediction(text,integer)') is not null then
    grant execute on function api.intel_eval_rows_needing_prediction(text,integer) to service_role;
  end if;
  if to_regprocedure('api.pool_rows_needing_classification(integer)') is not null then
    grant execute on function api.pool_rows_needing_classification(integer) to service_role;
  end if;
  if to_regprocedure('api.promote_all_extracted_snapshots()') is not null then
    grant execute on function api.promote_all_extracted_snapshots() to service_role;
  end if;
  if to_regprocedure('api.reconcile_airtable_tiers(jsonb)') is not null then
    grant execute on function api.reconcile_airtable_tiers(jsonb) to service_role;
  end if;
  if to_regprocedure('api.regulatory_pending_changes_feed()') is not null then
    grant execute on function api.regulatory_pending_changes_feed() to service_role;
  end if;
  if to_regprocedure('api.rows_needing_titles(integer)') is not null then
    grant execute on function api.rows_needing_titles(integer) to service_role;
  end if;
  if to_regprocedure('api.search_public_signals(extensions.vector,integer,text,text)') is not null then
    grant execute on function api.search_public_signals(extensions.vector,integer,text,text) to service_role;
  end if;
  if to_regprocedure('api.signal_relevance_feedback_for_ranking(text[],timestamptz)') is not null then
    grant execute on function api.signal_relevance_feedback_for_ranking(text[],timestamptz) to service_role;
  end if;
  if to_regprocedure('api.submit_signal_relevance_feedback(text,text,text,text)') is not null then
    grant execute on function api.submit_signal_relevance_feedback(text,text,text,text) to service_role;
  end if;
  if to_regprocedure('api.is_verified_clinician(uuid)') is not null then
    grant execute on function api.is_verified_clinician(uuid) to service_role;
  end if;
  if to_regprocedure('api.clinical_has_active_consent(uuid,text)') is not null then
    grant execute on function api.clinical_has_active_consent(uuid,text) to service_role;
  end if;
  if to_regprocedure('api.clinical_request_verification(text,text,text,uuid)') is not null then
    grant execute on function api.clinical_request_verification(text,text,text,uuid) to service_role;
  end if;
  if to_regprocedure('api.clinical_admin_verify_professional(uuid,boolean,text)') is not null then
    grant execute on function api.clinical_admin_verify_professional(uuid,boolean,text) to service_role;
  end if;
  if to_regprocedure('public.acquire_crawl_targets(integer,text)') is not null then
    grant execute on function public.acquire_crawl_targets(integer,text) to service_role;
  end if;
  if to_regprocedure('public.check_and_increment_llm_rate_limit(uuid,timestamptz,integer)') is not null then
    grant execute on function public.check_and_increment_llm_rate_limit(uuid,timestamptz,integer) to service_role;
  end if;
  if to_regprocedure('public.claim_intelligence_job(text,text)') is not null then
    grant execute on function public.claim_intelligence_job(text,text) to service_role;
  end if;
  if to_regprocedure('public.enqueue_regulatory_enrichment()') is not null then
    grant execute on function public.enqueue_regulatory_enrichment() to service_role;
  end if;
  if to_regprocedure('public.get_command_centre_stats()') is not null then
    grant execute on function public.get_command_centre_stats() to service_role;
  end if;
  if to_regprocedure('public.get_corridor_stats(text)') is not null then
    grant execute on function public.get_corridor_stats(text) to service_role;
  end if;
  if to_regprocedure('public.get_github_pat()') is not null then
    grant execute on function public.get_github_pat() to service_role;
  end if;
  if to_regprocedure('public.hv_extract_signals_from_captured_text(integer)') is not null then
    grant execute on function public.hv_extract_signals_from_captured_text(integer) to service_role;
  end if;
  if to_regprocedure('public.hv_ingest_snapshot_to_staging(integer,uuid)') is not null then
    grant execute on function public.hv_ingest_snapshot_to_staging(integer,uuid) to service_role;
  end if;
  if to_regprocedure('public.hv_intelligence_outcome_check()') is not null then
    grant execute on function public.hv_intelligence_outcome_check() to service_role;
  end if;
  if to_regprocedure('public.promote_all_extracted_snapshots()') is not null then
    grant execute on function public.promote_all_extracted_snapshots() to service_role;
  end if;
  if to_regprocedure('public.hv_is_org_member(uuid)') is not null then
    grant execute on function public.hv_is_org_member(uuid) to service_role;
  end if;
  if to_regprocedure('public.hv_is_platform_staff()') is not null then
    grant execute on function public.hv_is_platform_staff() to service_role;
  end if;
  if to_regprocedure('public.is_genetics_admin_or_reviewer()') is not null then
    grant execute on function public.is_genetics_admin_or_reviewer() to service_role;
  end if;
  if to_regprocedure('public.is_hv_staff()') is not null then
    grant execute on function public.is_hv_staff() to service_role;
  end if;
  if to_regprocedure('public.current_user_tier()') is not null then
    grant execute on function public.current_user_tier() to service_role;
  end if;
  if to_regprocedure('public.is_regulatory_tier_admin()') is not null then
    grant execute on function public.is_regulatory_tier_admin() to service_role;
  end if;
end
$$;

-- Audited authenticated RPC/policy-helper allowlist.
do $$
begin
  if to_regprocedure('api.get_command_centre_stats()') is not null then
    grant execute on function api.get_command_centre_stats() to authenticated;
  end if;
  if to_regprocedure('api.get_corridor_stats(text)') is not null then
    grant execute on function api.get_corridor_stats(text) to authenticated;
  end if;
  if to_regprocedure('api.get_source_registry_coverage(text)') is not null then
    grant execute on function api.get_source_registry_coverage(text) to authenticated;
  end if;
  if to_regprocedure('api.regulatory_pending_changes_feed()') is not null then
    grant execute on function api.regulatory_pending_changes_feed() to authenticated;
  end if;
  if to_regprocedure('api.submit_signal_relevance_feedback(text,text,text,text)') is not null then
    grant execute on function api.submit_signal_relevance_feedback(text,text,text,text) to authenticated;
  end if;
  if to_regprocedure('api.is_verified_clinician(uuid)') is not null then
    grant execute on function api.is_verified_clinician(uuid) to authenticated;
  end if;
  if to_regprocedure('api.clinical_has_active_consent(uuid,text)') is not null then
    grant execute on function api.clinical_has_active_consent(uuid,text) to authenticated;
  end if;
  if to_regprocedure('api.clinical_request_verification(text,text,text,uuid)') is not null then
    grant execute on function api.clinical_request_verification(text,text,text,uuid) to authenticated;
  end if;
  if to_regprocedure('public.hv_is_org_member(uuid)') is not null then
    grant execute on function public.hv_is_org_member(uuid) to authenticated;
  end if;
  if to_regprocedure('public.hv_is_platform_staff()') is not null then
    grant execute on function public.hv_is_platform_staff() to authenticated;
  end if;
  if to_regprocedure('public.is_genetics_admin_or_reviewer()') is not null then
    grant execute on function public.is_genetics_admin_or_reviewer() to authenticated;
  end if;
  if to_regprocedure('public.is_hv_staff()') is not null then
    grant execute on function public.is_hv_staff() to authenticated;
  end if;
  if to_regprocedure('public.current_user_tier()') is not null then
    grant execute on function public.current_user_tier() to authenticated;
  end if;
  if to_regprocedure('public.is_regulatory_tier_admin()') is not null then
    grant execute on function public.is_regulatory_tier_admin() to authenticated;
  end if;
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
