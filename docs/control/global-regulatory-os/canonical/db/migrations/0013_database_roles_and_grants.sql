BEGIN;
DO $roles$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'hv_context_owner') THEN CREATE ROLE hv_context_owner NOLOGIN NOINHERIT; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'hv_authenticator') THEN CREATE ROLE hv_authenticator NOLOGIN NOINHERIT; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'hv_public_runtime') THEN CREATE ROLE hv_public_runtime NOLOGIN NOINHERIT; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'hv_tenant_runtime') THEN CREATE ROLE hv_tenant_runtime NOLOGIN NOINHERIT; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'hv_analyst_runtime') THEN CREATE ROLE hv_analyst_runtime NOLOGIN NOINHERIT; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'hv_ingestion_runtime') THEN CREATE ROLE hv_ingestion_runtime NOLOGIN NOINHERIT; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'hv_governance_runtime') THEN CREATE ROLE hv_governance_runtime NOLOGIN NOINHERIT; END IF;
END $roles$;

-- Existing same-name roles are untrusted input during an upgrade. Reassert the
-- complete security-sensitive attribute contract instead of relying on CREATE
-- ROLE defaults that only apply to a clean install.
ALTER ROLE hv_context_owner NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION BYPASSRLS;
ALTER ROLE hv_authenticator NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
ALTER ROLE hv_public_runtime NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
ALTER ROLE hv_tenant_runtime NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
ALTER ROLE hv_analyst_runtime NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
ALTER ROLE hv_ingestion_runtime NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
ALTER ROLE hv_governance_runtime NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;

DO $role_contract$
DECLARE
  role_name name;
  role_record record;
BEGIN
  FOREACH role_name IN ARRAY ARRAY[
    'hv_authenticator'::name,
    'hv_public_runtime'::name,
    'hv_tenant_runtime'::name,
    'hv_analyst_runtime'::name,
    'hv_ingestion_runtime'::name,
    'hv_governance_runtime'::name
  ] LOOP
    SELECT rolcanlogin, rolinherit, rolsuper, rolcreatedb, rolcreaterole, rolreplication, rolbypassrls
      INTO STRICT role_record
      FROM pg_roles
      WHERE rolname = role_name;
    IF role_record.rolcanlogin OR role_record.rolinherit OR role_record.rolsuper OR
       role_record.rolcreatedb OR role_record.rolcreaterole OR role_record.rolreplication OR
       role_record.rolbypassrls THEN
      RAISE EXCEPTION 'security role % does not satisfy the fail-closed runtime attribute contract', role_name;
    END IF;
  END LOOP;

  SELECT rolcanlogin, rolinherit, rolsuper, rolcreatedb, rolcreaterole, rolreplication, rolbypassrls
    INTO STRICT role_record
    FROM pg_roles
    WHERE rolname = 'hv_context_owner';
  IF role_record.rolcanlogin OR role_record.rolinherit OR role_record.rolsuper OR
     role_record.rolcreatedb OR role_record.rolcreaterole OR role_record.rolreplication OR
     NOT role_record.rolbypassrls THEN
    RAISE EXCEPTION 'hv_context_owner does not satisfy the fail-closed owner attribute contract';
  END IF;
END $role_contract$;

GRANT USAGE,CREATE ON SCHEMA app TO hv_context_owner;

GRANT hv_public_runtime,hv_tenant_runtime,hv_analyst_runtime,hv_ingestion_runtime,hv_governance_runtime TO hv_authenticator;
GRANT USAGE ON SCHEMA app TO hv_authenticator,hv_public_runtime,hv_tenant_runtime,hv_analyst_runtime,hv_ingestion_runtime,hv_governance_runtime;

REVOKE ALL ON ALL TABLES IN SCHEMA iam,billing,geo,source_ops,evidence,ontology,regulatory,compliance,registry,trade,market,workflow,ai,governance,publication,public_api,tenant_api,internal_api FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA iam,billing,geo,source_ops,evidence,ontology,regulatory,compliance,registry,trade,market,workflow,ai,governance,publication FROM PUBLIC;

GRANT USAGE ON SCHEMA public_api TO hv_public_runtime;
GRANT SELECT ON ALL TABLES IN SCHEMA public_api TO hv_public_runtime;

GRANT USAGE ON SCHEMA public_api,tenant_api,iam,billing,compliance,registry,trade,workflow,publication TO hv_tenant_runtime;
GRANT SELECT ON ALL TABLES IN SCHEMA public_api,tenant_api TO hv_tenant_runtime;
GRANT SELECT ON iam.subjects,iam.memberships,billing.entitlements TO hv_tenant_runtime;
GRANT SELECT,INSERT,UPDATE,DELETE ON compliance.organization_profiles,compliance.applicability_evaluations,compliance.assessments,compliance.findings,compliance.controls TO hv_tenant_runtime;
GRANT SELECT,INSERT,UPDATE,DELETE ON registry.counterparty_profiles,trade.products,trade.corridors,trade.corridor_versions,trade.corridor_gates,trade.corridor_determinations,trade.market_entry_projects,trade.required_documents,workflow.cases,workflow.tasks,workflow.watchlists,workflow.alert_rules,workflow.alert_events,workflow.alert_deliveries TO hv_tenant_runtime;
GRANT SELECT ON trade.product_classifications TO hv_tenant_runtime;

GRANT USAGE ON SCHEMA geo,source_ops,evidence,ontology,regulatory,compliance,registry,trade,market,workflow,publication,internal_api TO hv_analyst_runtime;
GRANT SELECT ON ALL TABLES IN SCHEMA geo,source_ops,evidence,ontology,regulatory,compliance,registry,trade,market,workflow,publication,internal_api TO hv_analyst_runtime;
GRANT INSERT,UPDATE ON evidence.documents,evidence.document_versions,evidence.passages,evidence.translations,evidence.document_diffs,evidence.claims,evidence.claim_evidence,evidence.evidence_bundles TO hv_analyst_runtime;
GRANT INSERT,UPDATE ON ontology.concepts,ontology.term_mappings,regulatory.instruments,regulatory.instrument_versions,regulatory.provisions,regulatory.regulatory_changes,regulatory.change_provisions,regulatory.interpretations,regulatory.interpretation_evidence,compliance.obligations,compliance.applicability_rules,compliance.controls,compliance.obligation_controls,registry.entities,registry.entity_names,registry.people,registry.relationships,registry.facilities,registry.licence_classes,registry.licences,registry.certifications,registry.inspections,registry.enforcement_records,trade.product_classifications,trade.gate_definitions,trade.corridor_gates,trade.corridor_determinations,market.metric_definitions,market.datasets,market.observations,market.reconciliation_exceptions,market.forecasts,workflow.reviews,publication.releases TO hv_analyst_runtime;

GRANT USAGE ON SCHEMA source_ops,evidence TO hv_ingestion_runtime;
GRANT SELECT,INSERT,UPDATE ON source_ops.sources,source_ops.source_endpoints,source_ops.acquisition_runs,source_ops.source_health TO hv_ingestion_runtime;
GRANT SELECT,INSERT ON evidence.snapshots TO hv_ingestion_runtime;
GRANT SELECT,INSERT,UPDATE ON evidence.documents,evidence.document_versions,evidence.passages,evidence.document_diffs TO hv_ingestion_runtime;

GRANT USAGE ON SCHEMA governance,ai,workflow,publication,internal_api TO hv_governance_runtime;
GRANT SELECT,INSERT,UPDATE ON ALL TABLES IN SCHEMA governance,ai,workflow,publication TO hv_governance_runtime;
GRANT SELECT ON ALL TABLES IN SCHEMA internal_api TO hv_governance_runtime;

REVOKE ALL ON app.trusted_request_context FROM PUBLIC,hv_public_runtime,hv_tenant_runtime,hv_analyst_runtime,hv_ingestion_runtime,hv_governance_runtime;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA app FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.set_trusted_request_context(text, uuid),app.clear_trusted_request_context() TO hv_authenticator;
GRANT EXECUTE ON FUNCTION app.current_subject_id(),app.current_tenant_id(),app.has_platform_role(text),app.is_tenant_member(uuid),app.has_tenant_role(uuid,text[]),app.can_read_visibility(uuid,visibility_class),app.can_write_tenant(uuid)
  TO hv_authenticator,hv_public_runtime,hv_tenant_runtime,hv_analyst_runtime,hv_ingestion_runtime,hv_governance_runtime;

ALTER DEFAULT PRIVILEGES REVOKE ALL ON TABLES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES REVOKE ALL ON SEQUENCES FROM PUBLIC;
COMMENT ON ROLE hv_authenticator IS 'Trusted pool identity; establishes transaction context before switching to a runtime role.';
COMMENT ON ROLE hv_context_owner IS 'Non-login owner for trusted context storage and accessors.';
COMMENT ON ROLE hv_public_runtime IS 'Public API projection identity.';
COMMENT ON ROLE hv_tenant_runtime IS 'Authenticated tenant identity; transaction-local request context and RLS are mandatory.';
COMMENT ON ROLE hv_analyst_runtime IS 'Analyst-authoring identity; application reviewer-authority checks remain mandatory.';
COMMENT ON ROLE hv_ingestion_runtime IS 'Isolated source acquisition and document-processing identity.';
COMMENT ON ROLE hv_governance_runtime IS 'Governance, correction, model-risk and release-control identity.';
COMMIT;
