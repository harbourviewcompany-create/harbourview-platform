\set ON_ERROR_STOP on
DO $$
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
      RAISE EXCEPTION 'bootstrap failed to normalize unsafe pre-existing role % before later migrations', role_name;
    END IF;
  END LOOP;

  SELECT rolcanlogin, rolinherit, rolsuper, rolcreatedb, rolcreaterole, rolreplication, rolbypassrls
    INTO STRICT role_record
    FROM pg_roles
    WHERE rolname = 'hv_context_owner';
  IF role_record.rolcanlogin OR role_record.rolinherit OR role_record.rolsuper OR
     role_record.rolcreatedb OR role_record.rolcreaterole OR role_record.rolreplication OR
     NOT role_record.rolbypassrls THEN
    RAISE EXCEPTION 'bootstrap failed to normalize hv_context_owner before later migrations';
  END IF;

  IF to_regclass('app.trusted_request_context') IS NOT NULL THEN
    RAISE EXCEPTION 'bootstrap assertion must execute before trusted context ownership is introduced';
  END IF;
END $$;
