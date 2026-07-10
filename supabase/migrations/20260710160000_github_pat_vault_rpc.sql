-- Vault-backed GitHub PAT accessor. See github-bridge and hv-repo-reader
-- edge functions -- both call this via supabase.rpc('get_github_pat')
-- instead of a hardcoded token in source, so rotation is a one-line SQL
-- update rather than a redeploy.

CREATE OR REPLACE FUNCTION public.get_github_pat()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, vault
AS $fn$
  SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'GITHUB_PAT' LIMIT 1;
$fn$;

REVOKE ALL ON FUNCTION public.get_github_pat() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_github_pat() TO service_role;

CREATE OR REPLACE FUNCTION api.get_github_pat()
RETURNS text
LANGUAGE sql STABLE
AS $fn$ SELECT public.get_github_pat() $fn$;

REVOKE ALL ON FUNCTION api.get_github_pat() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION api.get_github_pat() TO service_role;

NOTIFY pgrst, 'reload schema';
