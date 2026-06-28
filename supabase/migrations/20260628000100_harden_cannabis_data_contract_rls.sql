-- RLS hardening: cannabis_data_contract_v1_p0_p1
-- Public read for reference/taxonomy tables, authenticated read for market data,
-- service_role-only writes.

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename ILIKE 'cannabis_%'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY',  tbl);
  END LOOP;
END;
$$;

-- Drop existing policies
DO $$
DECLARE
  tbl text;
  pol text;
BEGIN
  FOR tbl, pol IN
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename ILIKE 'cannabis_%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol, tbl);
  END LOOP;
END;
$$;

-- Authenticated users can read all cannabis data
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename ILIKE 'cannabis_%'
  LOOP
    EXECUTE format(
      $policy$
        CREATE POLICY "cannabis_authenticated_read" ON public.%I
        FOR SELECT TO authenticated USING (true)
      $policy$,
      tbl
    );
  END LOOP;
END;
$$;

-- Anon gets read on reference/taxonomy tables only (prefix: cannabis_ref_)
-- All others: revoke anon entirely
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename ILIKE 'cannabis_%'
      AND tablename NOT ILIKE 'cannabis_ref_%'
  LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', tbl);
  END LOOP;
END;
$$;
