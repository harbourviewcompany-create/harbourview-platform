-- RLS hardening: education_intelligence_foundation

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename ILIKE 'education_%'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY',  tbl);
  END LOOP;
END;
$$;

-- Drop existing
DO $$
DECLARE
  tbl text;
  pol text;
BEGIN
  FOR tbl, pol IN
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename ILIKE 'education_%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol, tbl);
  END LOOP;
END;
$$;

-- Authenticated read
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename ILIKE 'education_%'
  LOOP
    EXECUTE format(
      $policy$
        CREATE POLICY "education_authenticated_read" ON public.%I
        FOR SELECT TO authenticated USING (true)
      $policy$,
      tbl
    );
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', tbl);
  END LOOP;
END;
$$;
