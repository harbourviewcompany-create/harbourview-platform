-- Restores caller authentication for the github-bridge edge function.
--
-- Context: vault secret `hv_github_bridge_caller_secret` was created 2026-07-06
-- to close a hole where github-bridge was deployed with verify_jwt=false and
-- zero caller auth, letting anyone on the internet invoke push_file and commit
-- arbitrary content to any branch using the server-side admin-scoped GITHUB_PAT.
-- The deployed function later regressed to a version with no key check at all.
--
-- Edge Function env secrets can't be set from here, so instead of giving the
-- function a copy of the key, we give it a verifier it can call with its
-- auto-injected service-role credentials. The secret never leaves Postgres and
-- the function never holds it.
--
-- Digest-compares rather than `=` so the comparison doesn't leak the secret
-- byte-by-byte through response timing.

create or replace function api.hv_bridge_key_matches(candidate text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  expected text;
begin
  if candidate is null or length(candidate) = 0 then
    return false;
  end if;

  select decrypted_secret
    into expected
    from vault.decrypted_secrets
   where name = 'hv_github_bridge_caller_secret';

  -- Fail closed if the secret is missing rather than silently allowing callers.
  if expected is null then
    return false;
  end if;

  return extensions.digest(candidate, 'sha256') = extensions.digest(expected, 'sha256');
end;
$fn$;

comment on function api.hv_bridge_key_matches(text) is
  'Service-role-only verifier for the github-bridge x-hv-bridge-key header. Returns true iff the candidate matches vault secret hv_github_bridge_caller_secret. Never returns the secret itself.';

-- Lock it down: only the service role (i.e. the edge function itself) may call
-- this. anon/authenticated must never be able to use it as an oracle.
revoke all on function api.hv_bridge_key_matches(text) from public;
revoke all on function api.hv_bridge_key_matches(text) from anon;
revoke all on function api.hv_bridge_key_matches(text) from authenticated;
grant execute on function api.hv_bridge_key_matches(text) to service_role;
