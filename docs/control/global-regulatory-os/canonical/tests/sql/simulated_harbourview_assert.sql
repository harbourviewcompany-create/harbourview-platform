\set ON_ERROR_STOP on
DO $$ BEGIN
  IF (SELECT count(*) FROM public.profiles WHERE id='10000000-0000-0000-0000-000000000001') <> 1 THEN
    RAISE EXCEPTION 'existing profiles row was not preserved';
  END IF;
  IF (SELECT count(*) FROM public.user_roles WHERE user_id='10000000-0000-0000-0000-000000000001' AND role='admin') <> 1 THEN
    RAISE EXCEPTION 'existing user_roles row was not preserved';
  END IF;
  IF to_regclass('app.trusted_request_context') IS NULL THEN
    RAISE EXCEPTION 'trusted context table missing after simulated upgrade';
  END IF;
END $$;
