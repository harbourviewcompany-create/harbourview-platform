\set ON_ERROR_STOP on
SET ROLE hv_tenant_runtime;
SELECT set_config('app.subject_id','00000000-0000-0000-0000-000000000011',true);
SELECT set_config('app.tenant_id','00000000-0000-0000-0000-000000000101',true);
SELECT set_config('app.platform_roles','platform_super_administrator,data_governance_lead',true);

DO $$
BEGIN
  IF app.current_subject_id() IS NOT NULL THEN
    RAISE EXCEPTION 'custom GUC forged subject identity';
  END IF;
  IF app.current_tenant_id() IS NOT NULL THEN
    RAISE EXCEPTION 'custom GUC forged tenant identity';
  END IF;
  IF app.has_platform_role('platform_super_administrator') THEN
    RAISE EXCEPTION 'custom GUC forged platform role';
  END IF;

  BEGIN
    PERFORM app.set_trusted_request_context('verified|alice','00000000-0000-0000-0000-000000000101');
    RAISE EXCEPTION 'runtime role executed trusted context setter';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  BEGIN
    EXECUTE 'SELECT count(*) FROM app.trusted_request_context';
    RAISE EXCEPTION 'runtime role read trusted context table';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  BEGIN
    EXECUTE 'INSERT INTO app.trusted_request_context VALUES (pg_backend_pid(),pg_current_xact_id(),''00000000-0000-0000-0000-000000000011'',NULL,current_user,clock_timestamp())';
    RAISE EXCEPTION 'runtime role wrote trusted context table';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  BEGIN
    EXECUTE 'SET ROLE hv_authenticator';
    RAISE EXCEPTION 'runtime login assumed authenticator role';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
