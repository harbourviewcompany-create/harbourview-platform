BEGIN;

GRANT USAGE ON SCHEMA job_search TO anon, authenticated, service_role;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON ALL TABLES IN SCHEMA job_search
  FROM anon, authenticated;
REVOKE ALL PRIVILEGES
  ON ALL SEQUENCES IN SCHEMA job_search
  FROM anon, authenticated;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA job_search TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA job_search TO service_role;

DO $operator_boundary$
DECLARE
  table_name text;
  readable_tables constant text[] := ARRAY[
    'companies',
    'jobs',
    'applications',
    'resume_versions',
    'contacts',
    'outreach_messages',
    'settings',
    'settings_legacy_single_row',
    'opportunities'
  ];
BEGIN
  FOREACH table_name IN ARRAY readable_tables LOOP
    IF to_regclass(format('job_search.%I', table_name)) IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE job_search.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I ON job_search.%I', 'anon full access', table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I ON job_search.%I', 'authenticated full access', table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I ON job_search.%I', 'client read access', table_name);
    EXECUTE format(
      'CREATE POLICY %I ON job_search.%I FOR SELECT TO anon, authenticated USING (true)',
      'client read access',
      table_name
    );
    EXECUTE format('GRANT SELECT ON TABLE job_search.%I TO anon, authenticated', table_name);
  END LOOP;
END
$operator_boundary$;

ALTER DEFAULT PRIVILEGES IN SCHEMA job_search
  REVOKE ALL PRIVILEGES ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA job_search
  REVOKE ALL PRIVILEGES ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA job_search
  GRANT ALL PRIVILEGES ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA job_search
  GRANT ALL PRIVILEGES ON SEQUENCES TO service_role;

COMMIT;