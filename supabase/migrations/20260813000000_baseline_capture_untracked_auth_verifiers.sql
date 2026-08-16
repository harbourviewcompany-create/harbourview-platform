-- Baseline capture: four secret-verification functions with NO history
-- anywhere in supabase_migrations.schema_migrations -- not a stub, not a
-- differently-named file elsewhere, genuinely zero ledger record. Same
-- untracked-origin pattern documented in
-- 20260723084446_baseline_hv_intelligence_pipeline.sql: built live via
-- direct execute_sql calls with no migration, doc, or handoff entry ever
-- created for them, discovered by cross-checking every live public/api
-- function in production against this repository's full migration history.
--
-- All four are live, in active use (cron secret verification and the
-- GitHub PAT accessor's plpgsql sibling), and already correctly locked
-- down in production -- confirmed via pg_proc.proacl before writing this,
-- not assumed: none grant execute to anon, authenticated, or PUBLIC.
-- Postgres's default (EXECUTE granted to PUBLIC on function creation) is
-- already closed repo-wide by 20260807001000_revoke_data_api_default_
-- privileges_on_public.sql and 20260804190000_production_security_
-- hardening.sql, both of which predate this capture, so no explicit
-- REVOKE is added here -- doing so would imply these functions were ever
-- exposed, which the ACL check shows they were not. Bodies are verbatim
-- from live pg_get_functiondef.
--
-- public.hv_get_github_pat(): plpgsql sibling of public.get_github_pat()
-- (restored separately in 20260710190300_github_pat_vault_rpc.sql, which
-- does have ledger history). Same purpose, different implementation --
-- checks vault secret GITHUB_PAT first, falls back to hv_github_pat if
-- unset. Both accessors are in live use; neither supersedes the other in
-- the ledger, so both are restored rather than picking one.

CREATE OR REPLACE FUNCTION public.hv_get_github_pat()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
declare
  token text;
begin
  select decrypted_secret
    into token
    from vault.decrypted_secrets
   where name = 'GITHUB_PAT';

  if token is null then
    select decrypted_secret
      into token
      from vault.decrypted_secrets
     where name = 'hv_github_pat';
  end if;

  return token;
end;
$function$;

CREATE OR REPLACE FUNCTION api.hv_get_github_pat()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'api', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
declare
  token text;
begin
  select decrypted_secret
    into token
    from vault.decrypted_secrets
   where name = 'GITHUB_PAT';

  if token is null then
    select decrypted_secret
      into token
      from vault.decrypted_secrets
     where name = 'hv_github_pat';
  end if;

  return token;
end;
$function$;

-- Bridge-key verifier (distinct from api.hv_bridge_key_matches, restored
-- separately -- same secret, two independent implementations, both live).
CREATE OR REPLACE FUNCTION public.verify_hv_bridge_key(candidate text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
  select exists (
    select 1 from vault.decrypted_secrets
    where name = 'hv_github_bridge_caller_secret' and decrypted_secret = candidate
  );
$function$;

CREATE OR REPLACE FUNCTION api.verify_hv_bridge_key(candidate text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'pg_catalog', 'api', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
  select public.verify_hv_bridge_key(candidate);
$function$;

-- Pipeline cron secret verifier.
CREATE OR REPLACE FUNCTION public.verify_hv_cron_secret(candidate text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
  select exists (
    select 1 from vault.decrypted_secrets
    where name = 'hv_pipeline_cron_shared_secret' and decrypted_secret = candidate
  );
$function$;

CREATE OR REPLACE FUNCTION api.verify_hv_cron_secret(candidate text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'pg_catalog', 'api', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
  select public.verify_hv_cron_secret(candidate);
$function$;

-- Source-engine cron secret verifier. Digest-compares (constant-time
-- equality check via sha256, not a plain `=`) to avoid leaking the secret
-- byte-by-byte through response timing, same rationale as
-- api.hv_bridge_key_matches above. No api.* wrapper exists in production
-- for this one -- confirmed, not assumed.
CREATE OR REPLACE FUNCTION public.verify_source_engine_cron_secret(candidate text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
declare
  expected text;
begin
  if candidate is null or length(candidate) < 32 then
    return false;
  end if;

  select decrypted_secret into expected
  from vault.decrypted_secrets
  where name = 'harbourview_source_engine_cron_secret'
  limit 1;

  if expected is null or length(expected) < 32 then
    return false;
  end if;

  return encode(digest(candidate, 'sha256'), 'hex') = encode(digest(expected, 'sha256'), 'hex');
end;
$function$;
