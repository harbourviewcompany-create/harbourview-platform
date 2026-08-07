-- SECURITY FIX: API-schema views must enforce RLS as the querying role rather
-- than as their postgres owner. Production contained a static snapshot of all
-- API views and their companion underlying-table grants. Repository zero-state
-- history can omit optional production-only relations, so replay applies the
-- same grant map only where the target exists and hardens every API view that is
-- actually present.

do $api_underlying_select_grants$
declare
  grant_target record;
begin
  for grant_target in
    select *
    from (values
      ('public', 'canadian_operator_conflicts', 'authenticated'),
      ('public', 'canadian_operator_exclusions', 'authenticated'),
      ('public', 'canadian_operator_individual_holds', 'authenticated'),
      ('public', 'canadian_operator_licence_sites', 'authenticated'),
      ('public', 'canadian_operator_outreach_queue', 'authenticated'),
      ('public', 'candidate_review_events', 'authenticated'),
      ('public', 'cannabis_operators', 'authenticated'),
      ('public', 'cultivar_country_opportunities', 'authenticated'),
      ('public', 'cultivar_passports', 'authenticated'),
      ('public', 'deal_rooms', 'authenticated'),
      ('public', 'genetics_routing_events', 'authenticated'),
      ('public', 'genetics_routing_records', 'authenticated'),
      ('public', 'hv_import_staging', 'authenticated'),
      ('public', 'hv_professionals', 'anon'),
      ('public', 'hv_professionals', 'authenticated'),
      ('public', 'hv_public_feed', 'anon'),
      ('public', 'hv_public_feed', 'authenticated'),
      ('public', 'ia_agent_tasks', 'authenticated'),
      ('public', 'ia_counterparties', 'authenticated'),
      ('public', 'ia_evidence_vault', 'authenticated'),
      ('public', 'ia_feedback_events', 'authenticated'),
      ('public', 'ia_graph_edges', 'authenticated'),
      ('public', 'ia_graph_entities', 'authenticated'),
      ('public', 'ia_scoring_records', 'authenticated'),
      ('public', 'ia_signals', 'authenticated'),
      ('public', 'ia_sources', 'authenticated'),
      ('public', 'marketplace_candidates', 'authenticated'),
      ('public', 'marketplace_inquiries', 'authenticated'),
      ('public', 'marketplace_public_listings_v1', 'anon'),
      ('public', 'marketplace_public_listings_v1', 'authenticated'),
      ('public', 'network_public_projections', 'authenticated'),
      ('public', 'network_review_items', 'authenticated'),
      ('public', 'opportunities', 'authenticated'),
      ('public', 'signal_candidates', 'authenticated'),
      ('public', 'signals', 'anon'),
      ('public', 'signals', 'authenticated'),
      ('public', 'source_registry', 'anon'),
      ('public', 'source_registry', 'authenticated'),
      ('public', 'source_snapshots', 'authenticated'),
      ('public', 'supplier_profiles', 'anon'),
      ('public', 'supplier_profiles', 'authenticated'),
      ('public', 'user_profiles', 'authenticated'),
      ('public', 'user_roles', 'authenticated')
    ) as mapped(schema_name, relation_name, role_name)
  loop
    if to_regclass(format('%I.%I', grant_target.schema_name, grant_target.relation_name)) is not null then
      execute format(
        'grant select on %I.%I to %I',
        grant_target.schema_name,
        grant_target.relation_name,
        grant_target.role_name
      );
    end if;
  end loop;
end
$api_underlying_select_grants$;

do $api_views_security_invoker$
declare
  api_view record;
begin
  if to_regnamespace('api') is null then
    raise exception 'API schema must exist before API view RLS hardening';
  end if;

  for api_view in
    select relation.relname as view_name
    from pg_class relation
    join pg_namespace namespace
      on namespace.oid = relation.relnamespace
    where namespace.nspname = 'api'
      and relation.relkind = 'v'
    order by relation.relname
  loop
    execute format(
      'alter view api.%I set (security_invoker = true)',
      api_view.view_name
    );
  end loop;
end
$api_views_security_invoker$;

notify pgrst, 'reload schema';
