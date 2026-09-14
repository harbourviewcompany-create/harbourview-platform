-- Must return zero rows after the production security hardening migrations.

-- Every explicitly hardened view must execute with caller privileges.
with hardened_views(schema_name, view_name) as (
  values
    ('api','hv_artifacts'),
    ('api','hv_processing_jobs'),
    ('api','schema_drift_alerts'),
    ('api','scraper_source_state'),
    ('intelligence','public_country_intelligence'),
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
)
select h.schema_name, h.view_name, 'missing_security_invoker' as defect
from hardened_views h
join pg_namespace n on n.nspname = h.schema_name
join pg_class c on c.relnamespace = n.oid and c.relname = h.view_name and c.relkind = 'v'
where not coalesce((
  select bool_or(option_name = 'security_invoker' and option_value = 'true')
  from pg_options_to_table(c.reloptions)
), false);

-- Retained public projections must remain readable by guest and signed-in callers.
with public_views(schema_name, view_name) as (
  values
    ('intelligence','public_country_intelligence'),
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
    ('public','local_intel_jurisdiction_combined'),
    ('public','marketplace_public_listings_v1'),
    ('public','platform_coverage_summary'),
    ('public','public_country_profile_dto'),
    ('public','signals_intelligence_feed'),
    ('public','v_jurisdiction_unified'),
    ('regulatory_signals','public_signals'),
    ('regulatory_signals','public_source_status'),
    ('regulatory_signals','public_watchlist_collection_signals'),
    ('regulatory_signals','public_watchlist_collections')
)
select p.schema_name, p.view_name, 'public_read_contract_missing' as defect
from public_views p
where to_regclass(format('%I.%I', p.schema_name, p.view_name)) is not null
  and not (
    has_table_privilege('anon', format('%I.%I', p.schema_name, p.view_name), 'select')
    and has_table_privilege('authenticated', format('%I.%I', p.schema_name, p.view_name), 'select')
    and has_table_privilege('service_role', format('%I.%I', p.schema_name, p.view_name), 'select')
  );

-- Internal projections must remain closed to application roles.
with internal_views(schema_name, view_name) as (
  values
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
    ('public','source_domain_type'),
    ('public','source_yield_report')
)
select i.schema_name, i.view_name, 'internal_view_exposed' as defect
from internal_views i
where to_regclass(format('%I.%I', i.schema_name, i.view_name)) is not null
  and (
    has_table_privilege('anon', format('%I.%I', i.schema_name, i.view_name), 'select,insert,update,delete')
    or has_table_privilege('authenticated', format('%I.%I', i.schema_name, i.view_name), 'select,insert,update,delete')
  );

-- Authenticated-only projections: readable by a signed-in session, never by anon,
-- and never writable by either.
with authenticated_views(schema_name, view_name) as (
  values
    ('public','signals_quality')
)
select a.schema_name, a.view_name, 'authenticated_view_contract_broken' as defect
from authenticated_views a
where to_regclass(format('%I.%I', a.schema_name, a.view_name)) is not null
  and (
    has_table_privilege('anon', format('%I.%I', a.schema_name, a.view_name), 'select,insert,update,delete')
    or not has_table_privilege('authenticated', format('%I.%I', a.schema_name, a.view_name), 'select')
    or has_table_privilege('authenticated', format('%I.%I', a.schema_name, a.view_name), 'insert,update,delete')
    or not has_table_privilege('service_role', format('%I.%I', a.schema_name, a.view_name), 'select')
  );

-- Policyless RLS tables must expose no table privileges to application roles.
select n.nspname as schema_name, c.relname as table_name, 'policyless_rls_grant' as defect
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

-- No SECURITY DEFINER routine is executable by anon.
select n.nspname, p.proname, pg_get_function_identity_arguments(p.oid), 'anon_definer_execute' as defect
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where p.prosecdef
  and n.nspname in ('public','api','signals','regulatory_signals')
  and has_function_privilege('anon', p.oid, 'execute');

-- Authenticated execution is limited to the exact policy-aware audited allowlist.
with authenticated_allowlist(signature) as (
  values
    ('api.get_command_centre_stats()'),
    ('api.get_corridor_stats(text)'),
    ('api.get_source_registry_coverage(text)'),
    ('api.regulatory_pending_changes_feed()'),
    ('api.submit_signal_relevance_feedback(text,text,text,text)'),
    ('api.is_verified_clinician(uuid)'),
    ('api.clinical_has_active_consent(uuid,text)'),
    ('api.clinical_request_verification(text,text,text,uuid)'),
    ('public.clinical_evidence_has_review_role(text[])'),
    ('public.clinical_has_active_consent(uuid,text)'),
    ('public.education_can_manage()'),
    ('public.education_has_review_role(text[])'),
    ('public.harbourview_is_admin_or_operator()'),
    ('public.hv_has_transaction_role(text[])'),
    ('public.hv_is_specific_transaction_party(uuid)'),
    ('public.hv_is_transaction_participant(uuid)'),
    ('public.hv_network_active_workspace_member(uuid)'),
    ('public.hv_is_org_member(uuid)'),
    ('public.hv_is_platform_staff()'),
    ('public.is_genetics_admin_or_reviewer()'),
    ('public.is_harbourview_admin()'),
    ('public.is_hv_staff()'),
    ('public.current_user_tier()'),
    ('public.is_regulatory_tier_admin()'),
    ('public.is_verified_clinician(uuid)')
)
select n.nspname, p.proname, pg_get_function_identity_arguments(p.oid), 'authenticated_definer_execute' as defect
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where p.prosecdef
  and n.nspname in ('public','api','signals','regulatory_signals')
  and has_function_privilege('authenticated', p.oid, 'execute')
  and format('%s.%s(%s)', n.nspname, p.proname, replace(pg_catalog.oidvectortypes(p.proargtypes), ', ', ','))
    not in (select signature from authenticated_allowlist);

-- Every SECURITY DEFINER routine referenced by an RLS policy must remain
-- executable by authenticated; otherwise the policy errors instead of making
-- its authorization decision.
select distinct
  n.nspname,
  p.proname,
  pg_get_function_identity_arguments(p.oid),
  'rls_definer_dependency_missing_execute' as defect
from pg_policy policy
join pg_depend d
  on d.classid = 'pg_policy'::regclass
 and d.objid = policy.oid
 and d.refclassid = 'pg_proc'::regclass
join pg_proc p on p.oid = d.refobjid
join pg_namespace n on n.oid = p.pronamespace
where p.prosecdef
  and not has_function_privilege('authenticated', p.oid, 'execute');

-- Mutable-search-path advisor finding must remain closed.
select p.oid::regprocedure::text as signature, 'mutable_search_path' as defect
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'hv_truncate_at_word_boundary'
  and not coalesce(p.proconfig @> array['search_path=pg_catalog, public'], false);

-- pg_net is a Supabase platform-owned extension boundary. Its default grants
-- are owned by supabase_admin and cannot be revoked by the project postgres
-- migration role. The repository therefore verifies the enforceable boundary:
-- `net` must not be exposed through PostgREST. Direct database access by anon /
-- authenticated is not possible because those roles are NOLOGIN.
select 'net' as schema_name, 'browser_schema_exposed' as defect
where exists (select 1 from pg_namespace where nspname = 'net')
  and coalesce(current_setting('pgrst.db_schemas', true), '') ~ '(^|,)\s*net\s*(,|$)';

-- Foreign integration tables remain backend-only.
select foreign_table_schema, foreign_table_name, 'foreign_table_exposed' as defect
from information_schema.foreign_tables
where foreign_table_schema in ('public','api','signals','regulatory_signals')
  and (
    has_table_privilege('anon', format('%I.%I', foreign_table_schema, foreign_table_name), 'select')
    or has_table_privilege('authenticated', format('%I.%I', foreign_table_schema, foreign_table_name), 'select')
  );
