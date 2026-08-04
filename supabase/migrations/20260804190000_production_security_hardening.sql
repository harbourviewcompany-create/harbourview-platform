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
-- Each literal ALTER VIEW is paired with its own existence guard.
do $$
begin
  if public.view_exists('api', 'hv_artifacts') then
    alter view api.hv_artifacts set (security_invoker = true);
    revoke all privileges on table api.hv_artifacts from public, anon, authenticated;
    grant select on table api.hv_artifacts to service_role;
  end if;
  if public.view_exists('api', 'hv_processing_jobs') then
    alter view api.hv_processing_jobs set (security_invoker = true);
    revoke all privileges on table api.hv_processing_jobs from public, anon, authenticated;
    grant select on table api.hv_processing_jobs to service_role;
  end if;
  if public.view_exists('api', 'schema_drift_alerts') then
    alter view api.schema_drift_alerts set (security_invoker = true);
    revoke all privileges on table api.schema_drift_alerts from public, anon, authenticated;
    grant select on table api.schema_drift_alerts to service_role;
  end if;
  if public.view_exists('api', 'scraper_source_state') then
    alter view api.scraper_source_state set (security_invoker = true);
    revoke all privileges on table api.scraper_source_state from public, anon, authenticated;
    grant select on table api.scraper_source_state to service_role;
  end if;
  if public.view_exists('public', 'admin_active_matches') then
    alter view public.admin_active_matches set (security_invoker = true);
    revoke all privileges on table public.admin_active_matches from public, anon, authenticated;
    grant select on table public.admin_active_matches to service_role;
  end if;
  if public.view_exists('public', 'admin_pending_buyer_requests') then
    alter view public.admin_pending_buyer_requests set (security_invoker = true);
    revoke all privileges on table public.admin_pending_buyer_requests from public, anon, authenticated;
    grant select on table public.admin_pending_buyer_requests to service_role;
  end if;
  if public.view_exists('public', 'admin_pending_listings') then
    alter view public.admin_pending_listings set (security_invoker = true);
    revoke all privileges on table public.admin_pending_listings from public, anon, authenticated;
    grant select on table public.admin_pending_listings to service_role;
  end if;
  if public.view_exists('public', 'content_coverage_queue') then
    alter view public.content_coverage_queue set (security_invoker = true);
    revoke all privileges on table public.content_coverage_queue from public, anon, authenticated;
    grant select on table public.content_coverage_queue to service_role;
  end if;
  if public.view_exists('public', 'country_intel_public') then
    alter view public.country_intel_public set (security_invoker = true);
    revoke all privileges on table public.country_intel_public from public, anon, authenticated;
    grant select on table public.country_intel_public to service_role;
  end if;
  if public.view_exists('public', 'genetics_public_claims') then
    alter view public.genetics_public_claims set (security_invoker = true);
    revoke all privileges on table public.genetics_public_claims from public, anon, authenticated;
    grant select on table public.genetics_public_claims to service_role;
  end if;
  if public.view_exists('public', 'genetics_public_collaboration_projects') then
    alter view public.genetics_public_collaboration_projects set (security_invoker = true);
    revoke all privileges on table public.genetics_public_collaboration_projects from public, anon, authenticated;
    grant select on table public.genetics_public_collaboration_projects to service_role;
  end if;
  if public.view_exists('public', 'genetics_public_country_opportunities') then
    alter view public.genetics_public_country_opportunities set (security_invoker = true);
    revoke all privileges on table public.genetics_public_country_opportunities from public, anon, authenticated;
    grant select on table public.genetics_public_country_opportunities to service_role;
  end if;
  if public.view_exists('public', 'genetics_public_cultivar_aliases') then
    alter view public.genetics_public_cultivar_aliases set (security_invoker = true);
    revoke all privileges on table public.genetics_public_cultivar_aliases from public, anon, authenticated;
    grant select on table public.genetics_public_cultivar_aliases to service_role;
  end if;
  if public.view_exists('public', 'genetics_public_cultivar_passports') then
    alter view public.genetics_public_cultivar_passports set (security_invoker = true);
    revoke all privileges on table public.genetics_public_cultivar_passports from public, anon, authenticated;
    grant select on table public.genetics_public_cultivar_passports to service_role;
  end if;
  if public.view_exists('public', 'genetics_public_evidence_summaries') then
    alter view public.genetics_public_evidence_summaries set (security_invoker = true);
    revoke all privileges on table public.genetics_public_evidence_summaries from public, anon, authenticated;
    grant select on table public.genetics_public_evidence_summaries to service_role;
  end if;
  if public.view_exists('public', 'genetics_public_profiles') then
    alter view public.genetics_public_profiles set (security_invoker = true);
    revoke all privileges on table public.genetics_public_profiles from public, anon, authenticated;
    grant select on table public.genetics_public_profiles to service_role;
  end if;
  if public.view_exists('public', 'genetics_public_service_providers') then
    alter view public.genetics_public_service_providers set (security_invoker = true);
    revoke all privileges on table public.genetics_public_service_providers from public, anon, authenticated;
    grant select on table public.genetics_public_service_providers to service_role;
  end if;
  if public.view_exists('public', 'ia_sources_live') then
    alter view public.ia_sources_live set (security_invoker = true);
    revoke all privileges on table public.ia_sources_live from public, anon, authenticated;
    grant select on table public.ia_sources_live to service_role;
  end if;
  if public.view_exists('public', 'jurisdiction_cross_table_conflicts') then
    alter view public.jurisdiction_cross_table_conflicts set (security_invoker = true);
    revoke all privileges on table public.jurisdiction_cross_table_conflicts from public, anon, authenticated;
    grant select on table public.jurisdiction_cross_table_conflicts to service_role;
  end if;
  if public.view_exists('public', 'local_intel_jurisdiction_combined') then
    alter view public.local_intel_jurisdiction_combined set (security_invoker = true);
    revoke all privileges on table public.local_intel_jurisdiction_combined from public, anon, authenticated;
    grant select on table public.local_intel_jurisdiction_combined to service_role;
  end if;
  if public.view_exists('public', 'local_intel_next_batch') then
    alter view public.local_intel_next_batch set (security_invoker = true);
    revoke all privileges on table public.local_intel_next_batch from public, anon, authenticated;
    grant select on table public.local_intel_next_batch to service_role;
  end if;
  if public.view_exists('public', 'marketplace_public_listings_v1') then
    alter view public.marketplace_public_listings_v1 set (security_invoker = true);
    revoke all privileges on table public.marketplace_public_listings_v1 from public, anon, authenticated;
    grant select on table public.marketplace_public_listings_v1 to service_role;
  end if;
  if public.view_exists('public', 'platform_coverage_summary') then
    alter view public.platform_coverage_summary set (security_invoker = true);
    revoke all privileges on table public.platform_coverage_summary from public, anon, authenticated;
    grant select on table public.platform_coverage_summary to service_role;
  end if;
  if public.view_exists('public', 'playbook_regulator_drift') then
    alter view public.playbook_regulator_drift set (security_invoker = true);
    revoke all privileges on table public.playbook_regulator_drift from public, anon, authenticated;
    grant select on table public.playbook_regulator_drift to service_role;
  end if;
  if public.view_exists('public', 'playbook_staleness_queue') then
    alter view public.playbook_staleness_queue set (security_invoker = true);
    revoke all privileges on table public.playbook_staleness_queue from public, anon, authenticated;
    grant select on table public.playbook_staleness_queue to service_role;
  end if;
  if public.view_exists('public', 'public_country_profile_dto') then
    alter view public.public_country_profile_dto set (security_invoker = true);
    revoke all privileges on table public.public_country_profile_dto from public, anon, authenticated;
    grant select on table public.public_country_profile_dto to service_role;
  end if;
  if public.view_exists('public', 'signals_for_digest') then
    alter view public.signals_for_digest set (security_invoker = true);
    revoke all privileges on table public.signals_for_digest from public, anon, authenticated;
    grant select on table public.signals_for_digest to service_role;
  end if;
  if public.view_exists('public', 'signals_intelligence_feed') then
    alter view public.signals_intelligence_feed set (security_invoker = true);
    revoke all privileges on table public.signals_intelligence_feed from public, anon, authenticated;
    grant select on table public.signals_intelligence_feed to service_role;
  end if;
  if public.view_exists('public', 'signals_quality') then
    alter view public.signals_quality set (security_invoker = true);
    revoke all privileges on table public.signals_quality from public, anon, authenticated;
    grant select on table public.signals_quality to service_role;
  end if;
  if public.view_exists('public', 'source_domain_type') then
    alter view public.source_domain_type set (security_invoker = true);
    revoke all privileges on table public.source_domain_type from public, anon, authenticated;
    grant select on table public.source_domain_type to service_role;
  end if;
  if public.view_exists('public', 'source_yield_report') then
    alter view public.source_yield_report set (security_invoker = true);
    revoke all privileges on table public.source_yield_report from public, anon, authenticated;
    grant select on table public.source_yield_report to service_role;
  end if;
  if public.view_exists('public', 'v_jurisdiction_unified') then
    alter view public.v_jurisdiction_unified set (security_invoker = true);
    revoke all privileges on table public.v_jurisdiction_unified from public, anon, authenticated;
    grant select on table public.v_jurisdiction_unified to service_role;
  end if;
  if public.view_exists('regulatory_signals', 'public_signals') then
    alter view regulatory_signals.public_signals set (security_invoker = true);
    revoke all privileges on table regulatory_signals.public_signals from public, anon, authenticated;
    grant select on table regulatory_signals.public_signals to service_role;
  end if;
  if public.view_exists('regulatory_signals', 'public_source_status') then
    alter view regulatory_signals.public_source_status set (security_invoker = true);
    revoke all privileges on table regulatory_signals.public_source_status from public, anon, authenticated;
    grant select on table regulatory_signals.public_source_status to service_role;
  end if;
  if public.view_exists('regulatory_signals', 'public_watchlist_collection_signals') then
    alter view regulatory_signals.public_watchlist_collection_signals set (security_invoker = true);
    revoke all privileges on table regulatory_signals.public_watchlist_collection_signals from public, anon, authenticated;
    grant select on table regulatory_signals.public_watchlist_collection_signals to service_role;
  end if;
  if public.view_exists('regulatory_signals', 'public_watchlist_collections') then
    alter view regulatory_signals.public_watchlist_collections set (security_invoker = true);
    revoke all privileges on table regulatory_signals.public_watchlist_collections from public, anon, authenticated;
    grant select on table regulatory_signals.public_watchlist_collections to service_role;
  end if;
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

drop function public.view_exists(text, text);
