-- RLS hardening: cultivar_passport_network_p0
-- Ensures only authenticated users can read passport data.
-- Write operations restricted to service_role (worker/admin only).

-- Enable RLS on all cultivar passport tables (idempotent)
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename ILIKE 'cultivar_%'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY',  tbl);
  END LOOP;
END;
$$;

-- Drop any existing policies before recreating (idempotent)
DO $$
DECLARE
  tbl text;
  pol text;
BEGIN
  FOR tbl, pol IN
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename ILIKE 'cultivar_%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol, tbl);
  END LOOP;
END;
$$;

-- Authenticated read on all cultivar tables
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename ILIKE 'cultivar_%'
  LOOP
    EXECUTE format(
      $policy$
        CREATE POLICY "cultivar_authenticated_read" ON public.%I
        FOR SELECT TO authenticated
        USING (true)
      $policy$,
      tbl
    );
  END LOOP;
END;
$$;

-- No direct INSERT/UPDATE/DELETE for authenticated users — service_role only
-- (service_role bypasses RLS by default in Supabase)

-- Revoke anon access explicitly
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename ILIKE 'cultivar_%'
  LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', tbl);
  END LOOP;
END;
$$;
