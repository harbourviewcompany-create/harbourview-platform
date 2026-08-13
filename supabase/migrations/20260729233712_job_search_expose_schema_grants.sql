GRANT USAGE ON SCHEMA job_search TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA job_search TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA job_search TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA job_search GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA job_search GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;