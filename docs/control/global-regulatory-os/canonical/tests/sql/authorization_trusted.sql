\set ON_ERROR_STOP on
BEGIN;
SET LOCAL ROLE hv_authenticator;
SELECT app.set_trusted_request_context('verified|alice','00000000-0000-0000-0000-000000000101');
SET LOCAL ROLE hv_tenant_runtime;
DO $$
DECLARE profile_count integer;
BEGIN
  IF app.current_subject_id() <> '00000000-0000-0000-0000-000000000011'::uuid THEN
    RAISE EXCEPTION 'trusted subject context missing';
  END IF;
  IF app.current_tenant_id() <> '00000000-0000-0000-0000-000000000101'::uuid THEN
    RAISE EXCEPTION 'trusted tenant context missing';
  END IF;
  IF NOT app.has_platform_role('data_governance_lead') THEN
    RAISE EXCEPTION 'database-derived platform role missing';
  END IF;
  IF app.has_platform_role('platform_super_administrator') THEN
    RAISE EXCEPTION 'unassigned platform role granted';
  END IF;
  SELECT count(*) INTO profile_count FROM compliance.organization_profiles;
  IF profile_count <> 1 THEN
    RAISE EXCEPTION 'RLS tenant isolation failed, visible profiles=%', profile_count;
  END IF;
END $$;
COMMIT;

BEGIN;
SET LOCAL ROLE hv_authenticator;
DO $$
BEGIN
  BEGIN
    PERFORM app.set_trusted_request_context('verified|alice','00000000-0000-0000-0000-000000000202');
    RAISE EXCEPTION 'cross-tenant context was accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
ROLLBACK;
