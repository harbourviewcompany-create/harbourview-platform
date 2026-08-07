-- Close anon/authenticated EXECUTE on the vault-backed secret accessors.
--
-- WHY THIS IS SEPARATE FROM 20260807001000
--
-- `ALTER DEFAULT PRIVILEGES` only affects objects created AFTER it runs. It stops
-- the exposure recurring; it does nothing for the functions that already carry the
-- grant. This migration closes the ones that exist. Both are needed.
--
-- THE EXPOSURE (verified read-only against production, 2026-08-07)
--
-- | function                                  | secdef | reads vault | returns | anon |
-- |-------------------------------------------|--------|-------------|---------|------|
-- | public.get_github_pat()                   | yes    | yes         | text    | yes  |
-- | api.hv_get_github_pat()                   | yes    | yes         | text    | yes  |
-- | api.get_github_pat()                      | no     | via public  | text    | yes  |
-- | public.verify_hv_cron_secret(text)        | yes    | yes         | boolean | yes  |
-- | public.verify_hv_bridge_key(text)         | yes    | yes         | boolean | yes  |
-- | public.verify_source_engine_cron_secret(text) | yes | yes        | boolean | yes  |
-- | api.verify_hv_cron_secret(text)           | yes    | yes         | boolean | yes  |
-- | api.verify_hv_bridge_key(text)            | yes    | yes         | boolean | yes  |
-- | api.hv_bridge_key_matches(text)           | yes    | yes         | boolean | yes  |
--
-- acl on each: {postgres=X/postgres, service_role=X/postgres, anon=X/postgres,
-- authenticated=X/postgres}. PostgREST exposes `public, graphql_public,
-- job_search, api` in production, so `public` and `api` are both RPC-dispatched.
--
-- The first two are SECURITY DEFINER, read `vault.decrypted_secrets` and return
-- `text` -- the publishable anon key is sufficient to retrieve a GitHub PAT in
-- plaintext. The `verify_*` family returns boolean and acts as an anon-callable
-- oracle against the cron secret, bridge key and source-engine secret.
--
-- Not exploited: confirming end-to-end would disclose the secret. Every fact above
-- is from `pg_proc`, `pg_namespace` and `pg_db_role_setting`, read-only.
--
-- HOW IT REGRESSED
--
-- `20260710190300_github_pat_vault_rpc.sql` already revoked these correctly and the
-- production ledger confirms it ran. The grant came back via the `public` schema's
-- default privileges (see 20260807001000), which re-grant anon on object creation.
-- Reapplying the revoke without also fixing the defaults would regress again.
--
-- These are backend-only by construction: the edge functions `github-bridge` and
-- `hv-repo-reader` call them as `service_role`, which keeps EXECUTE.
--
-- PUBLIC is included in every revoke. Leaving it out lets anon and authenticated
-- keep EXECUTE through the pseudo-role -- `has_function_privilege` still returns
-- true. 20260722031500 records this trap; 20260805234000 and 20260807001000 both
-- hit it again.
--
-- Guarded per function and idempotent: absent functions are skipped, and revoking
-- an already-revoked privilege is a no-op.

do $revoke_secret_accessor_execute$
declare
  target      text;
  v_remaining text[] := '{}';
begin
  foreach target in array array[
    'public.get_github_pat()',
    'api.get_github_pat()',
    'api.hv_get_github_pat()',
    'public.verify_hv_cron_secret(text)',
    'public.verify_hv_bridge_key(text)',
    'public.verify_source_engine_cron_secret(text)',
    'api.verify_hv_cron_secret(text)',
    'api.verify_hv_bridge_key(text)',
    'api.hv_bridge_key_matches(text)'
  ]
  loop
    if to_regprocedure(target) is null then
      raise notice 'skipping %, not present', target;
      continue;
    end if;

    execute format('revoke all privileges on function %s from public, anon, authenticated', target);
    execute format('grant execute on function %s to service_role', target);

    -- Verify rather than assume.
    if has_function_privilege('anon', to_regprocedure(target), 'execute')
       or has_function_privilege('authenticated', to_regprocedure(target), 'execute')
    then
      v_remaining := v_remaining || target;
    end if;
  end loop;

  if array_length(v_remaining, 1) is not null then
    raise exception
      'anon or authenticated still hold EXECUTE on secret accessors after revoke: %',
      array_to_string(v_remaining, ', ');
  end if;

  raise notice 'secret accessors are service_role-only';
end
$revoke_secret_accessor_execute$;

notify pgrst, 'reload schema';
