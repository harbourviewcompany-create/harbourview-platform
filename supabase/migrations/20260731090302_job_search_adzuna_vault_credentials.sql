SELECT vault.create_secret('b15a2c14', 'adzuna_app_id');
SELECT vault.create_secret('0cf2cde22579d37948307ea90b0ecc61', 'adzuna_app_key');

CREATE OR REPLACE FUNCTION job_search.get_adzuna_credentials()
RETURNS TABLE(app_id text, app_key text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT
    (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'adzuna_app_id'),
    (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'adzuna_app_key');
$$;

REVOKE ALL ON FUNCTION job_search.get_adzuna_credentials() FROM PUBLIC;
REVOKE ALL ON FUNCTION job_search.get_adzuna_credentials() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION job_search.get_adzuna_credentials() TO service_role;