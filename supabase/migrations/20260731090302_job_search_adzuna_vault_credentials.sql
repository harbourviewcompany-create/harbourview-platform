-- Originally applied directly against production on 2026-07-31 (outside git),
-- backfilled here for ledger/version-control parity on 2026-09-19.
--
-- SECURITY NOTE: The live migration created two vault secrets
-- (adzuna_app_id, adzuna_app_key) with literal plaintext values passed as
-- SQL arguments. That is not reproduced here: a plaintext third-party API
-- credential must never enter git history, including via a "backfill."
-- ACTION REQUIRED, NOT YET DONE: the credential visible in the production
-- migration ledger (supabase_migrations.schema_migrations, version
-- 20260731090302) has NOT been rotated as of this commit. Rotate it in the
-- Adzuna dashboard, then recreate the vault secrets with the new values via
-- `vault.create_secret()` (or the Supabase dashboard) — out of band from
-- git — before or alongside merging this file.
--
-- The function/grant definitions below are reproduced verbatim from the
-- live migration and are safe to commit as-is.

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
