BEGIN;

-- Harbourview Talent P0 / TAL-082 / CTL-016.
-- The legacy job_search schema was built as an operator utility and currently
-- grants anonymous/authenticated SELECT across applications, resume versions,
-- contacts, outreach, settings and jobs. Generalized Talent must never inherit
-- that browser-readable boundary. Preserve every legacy row, but make the
-- schema server/service-role only before any canonical Talent API is exposed.

REVOKE USAGE ON SCHEMA job_search FROM anon, authenticated;
GRANT USAGE ON SCHEMA job_search TO service_role;

DO $talent_job_search_boundary$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'job_search'
      AND c.relkind IN ('r', 'p', 'v', 'm')
  LOOP
    EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE job_search.%I FROM anon, authenticated', r.table_name);

    IF to_regclass(format('job_search.%I', r.table_name)) IS NOT NULL
       AND EXISTS (
         SELECT 1
         FROM pg_class c2
         JOIN pg_namespace n2 ON n2.oid = c2.relnamespace
         WHERE n2.nspname = 'job_search'
           AND c2.relname = r.table_name
           AND c2.relkind IN ('r', 'p')
       ) THEN
      EXECUTE format('ALTER TABLE job_search.%I ENABLE ROW LEVEL SECURITY', r.table_name);
      EXECUTE format('DROP POLICY IF EXISTS %I ON job_search.%I', 'anon full access', r.table_name);
      EXECUTE format('DROP POLICY IF EXISTS %I ON job_search.%I', 'authenticated full access', r.table_name);
      EXECUTE format('DROP POLICY IF EXISTS %I ON job_search.%I', 'client read access', r.table_name);
    END IF;
  END LOOP;
END
$talent_job_search_boundary$;

REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA job_search FROM anon, authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA job_search TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA job_search TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA job_search
  REVOKE ALL PRIVILEGES ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA job_search
  REVOKE ALL PRIVILEGES ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA job_search
  GRANT ALL PRIVILEGES ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA job_search
  GRANT ALL PRIVILEGES ON SEQUENCES TO service_role;

COMMENT ON SCHEMA job_search IS
  'Legacy/operator job-search data. Server/service-role only after Talent P0 security boundary; generalized Talent uses allowlisted api.* contracts.';

COMMIT;
