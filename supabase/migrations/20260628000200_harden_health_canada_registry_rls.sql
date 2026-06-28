-- RLS hardening: health_canada_operator_registry + cc_access_pathway + cc_watchlist

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND (
        tablename ILIKE 'health_canada_%'
        OR tablename ILIKE 'cc_%'
        OR tablename ILIKE 'hc_%'
      )
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
    WHERE schemaname = 'public'
      AND (
        tablename ILIKE 'health_canada_%'
        OR tablename ILIKE 'cc_%'
        OR tablename ILIKE 'hc_%'
      )
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
    WHERE schemaname = 'public'
      AND (
        tablename ILIKE 'health_canada_%'
        OR tablename ILIKE 'cc_%'
        OR tablename ILIKE 'hc_%'
      )
  LOOP
    EXECUTE format(
      $policy$
        CREATE POLICY "hc_authenticated_read" ON public.%I
        FOR SELECT TO authenticated USING (true)
      $policy$,
      tbl
    );
    -- Revoke anon entirely — Health Canada registry is not public data
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', tbl);
  END LOOP;
END;
$$;
