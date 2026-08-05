-- Must return zero rows after 20260804190000_production_security_hardening.sql.

-- Every advisor-identified view that exists must run with caller privileges.
with inventory(schema_name, relation_name) as (
  values
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
), existing as (
  select i.*, c.oid, c.reloptions
  from inventory i
  join pg_namespace n on n.nspname = i.schema_name
  join pg_class c on c.relnamespace = n.oid
    and c.relname = i.relation_name
    and c.relkind = 'v'
)
select schema_name, relation_name, 'security_invoker_missing' as defect
from existing
where not coalesce(
  (select bool_or(option_name = 'security_invoker' and option_value = 'true')
   from pg_options_to_table(reloptions)),
  false
);

-- Documented public projections must remain readable to guest and signed-in
-- browser roles, while browser write privileges stay closed.
with public_projection(schema_name, relation_name) as (
  values
    ('public','country_intel_public'),
    ('public','genetics_public_claims'),
    ('public','genetics_public_collaboration_projects'),
    ('public','genetics_public_country_opportunities'),
    ('public','genetics_public_cultivar_aliases'),
    ('public','genetics_public_cultivar_passports'),
    ('public','genetics_public_evidence_summaries'),
    ('public','genetics_public_profiles'),
    ('public','genetics_public_service_providers'),
    ('public','marketplace_public_listings_v1'),
    ('public','public_country_profile_dto'),
    ('regulatory_signals','public_signals'),
    ('regulatory_signals','public_source_status'),
    ('regulatory_signals','public_watchlist_collection_signals'),
    ('regulatory_signals','public_watchlist_collections')
), existing as (
  select p.*, c.oid
  from public_projection p
  join pg_namespace n on n.nspname = p.schema_name
  join pg_class c on c.relnamespace = n.oid
    and c.relname = p.relation_name
    and c.relkind = 'v'
)
select schema_name, relation_name, defect
from existing
cross join lateral (
  values
    (case when not has_table_privilege('anon', oid, 'select') then 'anon_select_missing' end),
    (case when not has_table_privilege('authenticated', oid, 'select') then 'authenticated_select_missing' end),
    (case when not has_table_privilege('service_role', oid, 'select') then 'service_role_select_missing' end),
    (case when has_table_privilege('anon', oid, 'insert')
            or has_table_privilege('anon', oid, 'update')
            or has_table_privilege('anon', oid, 'delete')
           then 'anon_write_exposed' end),
    (case when has_table_privilege('authenticated', oid, 'insert')
            or has_table_privilege('authenticated', oid, 'update')
            or has_table_privilege('authenticated', oid, 'delete')
           then 'authenticated_write_exposed' end)
) as defects(defect)
where defect is not null;

-- Internal/admin projections are unavailable to browser roles and readable by
-- service_role only.
with internal_projection(schema_name, relation_name) as (
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
    ('public','signals_quality'),
    ('public','source_domain_type'),
    ('public','source_yield_report')
), existing as (
  select p.*, c.oid
  from internal_projection p
  join pg_namespace n on n.nspname = p.schema_name
  join pg_class c on c.relnamespace = n.oid
    and c.relname = p.relation_name
    and c.relkind = 'v'
)
select schema_name, relation_name, defect
from existing
cross join lateral (
  values
    (case when has_table_privilege('anon', oid, 'select')
            or has_table_privilege('anon', oid, 'insert')
            or has_table_privilege('anon', oid, 'update')
            or has_table_privilege('anon', oid, 'delete')
           then 'anon_internal_access' end),
    (case when has_table_privilege('authenticated', oid, 'select')
            or has_table_privilege('authenticated', oid, 'insert')
            or has_table_privilege('authenticated', oid, 'update')
            or has_table_privilege('authenticated', oid, 'delete')
           then 'authenticated_internal_access' end),
    (case when not has_table_privilege('service_role', oid, 'select') then 'service_role_select_missing' end)
) as defects(defect)
where defect is not null;

-- Policyless RLS tables must not expose application-role table privileges.
select n.nspname as schema_name, c.relname as table_name, 'policyless_rls_grant' as defect
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where c.relkind in ('r','p','f')
  and c.relrowsecurity
  and n.nspname in ('public','api','signals','regulatory_signals')
  and not exists (select 1 from pg_policy p where p.polrelid = c.oid)
  and (
    has_table_privilege('anon', c.oid, 'select')
    or has_table_privilege('anon', c.oid, 'insert')
    or has_table_privilege('anon', c.oid, 'update')
    or has_table_privilege('anon', c.oid, 'delete')
    or has_table_privilege('authenticated', c.oid, 'select')
    or has_table_privilege('authenticated', c.oid, 'insert')
    or has_table_privilege('authenticated', c.oid, 'update')
    or has_table_privilege('authenticated', c.oid, 'delete')
  );

-- No SECURITY DEFINER routine is executable by anon.
select n.nspname as schema_name, p.proname, pg_get_function_identity_arguments(p.oid), 'anon_security_definer_execute' as defect
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where p.prosecdef
  and n.nspname in ('public','api','signals','regulatory_signals','net')
  and has_schema_privilege('anon', n.oid, 'usage')
  and has_function_privilege('anon', p.oid, 'execute');

-- Authenticated execution is limited to the audited allowlist.
with approved(signature) as (
  values
    ('api.get_command_centre_stats()'),
    ('api.get_corridor_stats(text)'),
    ('api.get_source_registry_coverage(text)'),
    ('api.regulatory_pending_changes_feed()'),
    ('api.submit_signal_relevance_feedback(text,text,text,text)'),
    ('api.is_verified_clinician(uuid)'),
    ('api.clinical_has_active_consent(uuid,text)'),
    ('api.clinical_request_verification(text,text,text,uuid)'),
    ('public.hv_is_org_member(uuid)'),
    ('public.hv_is_platform_staff()'),
    ('public.is_genetics_admin_or_reviewer()'),
    ('public.is_hv_staff()'),
    ('public.current_user_tier()'),
    ('public.is_regulatory_tier_admin()')
)
select n.nspname as schema_name, p.proname, pg_get_function_identity_arguments(p.oid), 'unauthorized_authenticated_execute' as defect
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where p.prosecdef
  and n.nspname in ('public','api','signals','regulatory_signals','net')
  and has_schema_privilege('authenticated', n.oid, 'usage')
  and has_function_privilege('authenticated', p.oid, 'execute')
  and not exists (
    select 1
    from approved a
    where to_regprocedure(a.signature) = p.oid
  );

-- Foreign integration tables are not browser-readable.
select foreign_table_schema, foreign_table_name, 'foreign_table_browser_access' as defect
from information_schema.foreign_tables
where foreign_table_schema in ('public','api','signals','regulatory_signals')
  and (
    has_table_privilege('anon', format('%I.%I', foreign_table_schema, foreign_table_name), 'select')
    or has_table_privilege('authenticated', format('%I.%I', foreign_table_schema, foreign_table_name), 'select')
  );
