\set ON_ERROR_STOP on
DO $$
DECLARE
  role_name name;
  role_record record;
BEGIN
  IF (SELECT count(*) FROM public.profiles WHERE id='10000000-0000-0000-0000-000000000001') <> 1 THEN
    RAISE EXCEPTION 'existing profiles row was not preserved';
  END IF;
  IF (SELECT count(*) FROM public.user_roles WHERE user_id='10000000-0000-0000-0000-000000000001' AND role='admin') <> 1 THEN
    RAISE EXCEPTION 'existing user_roles row was not preserved';
  END IF;
  IF to_regclass('app.trusted_request_context') IS NULL THEN
    RAISE EXCEPTION 'trusted context table missing after simulated upgrade';
  END IF;

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
      RAISE EXCEPTION 'unsafe pre-existing role % was not normalized', role_name;
    END IF;
  END LOOP;

  SELECT rolcanlogin, rolinherit, rolsuper, rolcreatedb, rolcreaterole, rolreplication, rolbypassrls
    INTO STRICT role_record
    FROM pg_roles
    WHERE rolname = 'hv_context_owner';
  IF role_record.rolcanlogin OR role_record.rolinherit OR role_record.rolsuper OR
     role_record.rolcreatedb OR role_record.rolcreaterole OR role_record.rolreplication OR
     NOT role_record.rolbypassrls THEN
    RAISE EXCEPTION 'unsafe pre-existing hv_context_owner role was not normalized';
  END IF;
END $$;
