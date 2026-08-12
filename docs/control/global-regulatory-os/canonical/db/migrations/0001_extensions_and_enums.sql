BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE SCHEMA IF NOT EXISTS app;

CREATE TYPE record_status AS ENUM ('draft','candidate','under_review','approved','published','superseded','corrected','retracted','archived','rejected');
CREATE TYPE visibility_class AS ENUM ('public','registered','tenant','restricted','privileged');
CREATE TYPE data_classification AS ENUM ('public','registered_user','customer_confidential','commercially_restricted','personal','sensitive_personal','legal_privileged','regulatory_restricted','licensed_third_party','security_sensitive','transaction_restricted');
CREATE TYPE truth_class AS ENUM ('source_fact','normalized_fact','interpretation','estimate','forecast','recommendation');
CREATE TYPE freshness_state AS ENUM ('current','review_due','stale','source_unavailable','superseded','historical');
CREATE TYPE review_decision AS ENUM ('approved','approved_with_conditions','rejected','changes_requested','escalated');
CREATE TYPE risk_tier AS ENUM ('low','moderate','high','critical');
CREATE TYPE ai_risk_class AS ENUM ('A','B','C','D','E','F');
CREATE TYPE applicability_result AS ENUM ('applies','does_not_apply','potentially_applies','insufficient_information','conflicting_evidence','review_required','historical_only');
CREATE TYPE obligation_modality AS ENUM ('required','prohibited','permitted','conditional','exempted');
CREATE TYPE legal_effect AS ENUM ('binding','quasi_binding','interpretive','advisory','historical','unknown');
CREATE TYPE jurisdiction_kind AS ENUM ('international','standards_body','supranational','customs_bloc','country','federal','state_province','territory','region','county_district','municipality','tribal_indigenous','autonomous','special_zone','court_district','regulatory_programme','market_programme');
CREATE TYPE source_access_method AS ENUM ('official_api','official_bulk','official_feed','webhook','sftp','official_html','official_pdf','official_email','licensed_feed','public_records','partner_submission','manual_capture','secondary_lead');
CREATE TYPE acquisition_status AS ENUM ('scheduled','running','succeeded','partial','failed','cancelled','blocked_rights','blocked_security');
CREATE TYPE document_kind AS ENUM ('treaty','constitution','statute','bill','amendment','regulation','gazette','order','guidance','faq','court_decision','tribunal_decision','licence_condition','permit_condition','application_form','register','inspection_record','enforcement_notice','recall','market_dataset','company_filing','tender','academic','news_lead','other');
CREATE TYPE change_kind AS ENUM ('created','modified','repealed','superseded','effective_date_changed','status_changed','corrected','metadata_only');
CREATE TYPE entity_kind AS ENUM ('legal_entity','government_entity','nonprofit','partnership','sole_proprietor','trust','person','unknown');
CREATE TYPE relationship_kind AS ENUM ('owns','controls','parent_of','subsidiary_of','affiliate_of','directs','invests_in','shares_address_with','operates','holds_licence','authorized_for','manufactures','tests','supplies','imports','exports','distributes','acquired','formerly_known_as','subject_to_enforcement','certified_by','inspected_by','contracted_with','transaction_party');
CREATE TYPE licence_status AS ENUM ('pending','active','conditional','suspended','expired','revoked','withdrawn','denied','unknown');
CREATE TYPE certification_status AS ENUM ('pending','active','suspended','expired','withdrawn','non_compliant','unknown');
CREATE TYPE corridor_determination AS ENUM ('go','conditional_go','hold','insufficient_information','expired');
CREATE TYPE gate_status AS ENUM ('not_started','unknown','not_applicable','satisfied','conditionally_satisfied','failed','expired','review_required');
CREATE TYPE observation_state AS ENUM ('reported_actual','revised_actual','preliminary_actual','modeled_estimate','imputed','forecast','scenario','analyst_assumption');
CREATE TYPE task_status AS ENUM ('open','in_progress','blocked','awaiting_review','completed','cancelled');
CREATE TYPE alert_delivery_status AS ENUM ('queued','sent','delivered','failed','acknowledged','suppressed');
CREATE TYPE model_status AS ENUM ('draft','evaluation','approved','suspended','retired');
CREATE TYPE correction_materiality AS ENUM ('minor','material','critical');

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

-- Normalize security-sensitive same-name roles before any later migration can
-- transfer ownership to them or grant them access. This closes the upgrade
-- window where a hostile pre-existing role could otherwise remain privileged
-- until the final grants migration.
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
      RAISE EXCEPTION 'security role % does not satisfy the fail-closed bootstrap attribute contract', role_name;
    END IF;
  END LOOP;

  SELECT rolcanlogin, rolinherit, rolsuper, rolcreatedb, rolcreaterole, rolreplication, rolbypassrls
    INTO STRICT role_record
    FROM pg_roles
    WHERE rolname = 'hv_context_owner';
  IF role_record.rolcanlogin OR role_record.rolinherit OR role_record.rolsuper OR
     role_record.rolcreatedb OR role_record.rolcreaterole OR role_record.rolreplication OR
     NOT role_record.rolbypassrls THEN
    RAISE EXCEPTION 'hv_context_owner does not satisfy the fail-closed bootstrap owner attribute contract';
  END IF;
END $role_contract$;

COMMENT ON ROLE hv_context_owner IS 'Owns trusted request-context storage and SECURITY DEFINER accessors; never used as a login.';
COMMENT ON ROLE hv_authenticator IS 'Trusted connection-pool role. It establishes verified identity context, then SET LOCAL ROLE to a NOLOGIN runtime role.';
COMMIT;
