-- Stop `public` from auto-granting every new object to the Data API roles.
--
-- WHY THIS EXISTS
--
-- `20260710190300_github_pat_vault_rpc.sql` revoked anon/authenticated EXECUTE on
-- public.get_github_pat() and api.get_github_pat(), and the production ledger
-- confirms it ran (version 20260710190300, 7 statements). Yet production today
-- reports:
--
--   public.get_github_pat()  acl = {postgres=X/postgres, service_role=X/postgres,
--                                   anon=X/postgres, authenticated=X/postgres}
--
-- anon holds EXECUTE again on a SECURITY DEFINER function that reads
-- vault.decrypted_secrets and returns text, in a schema PostgREST exposes.
--
-- The re-grant is not in the ledger -- no migration after 20260710190300 contains
-- a matching GRANT. The mechanism is ALTER DEFAULT PRIVILEGES. `pg_default_acl`
-- in production carries, for schema `public`:
--
--   grantor postgres,        functions -> {postgres=X, anon=X, authenticated=X, service_role=X}
--   grantor supabase_admin,  functions -> {postgres=X, anon=X, authenticated=X, service_role=X}
--   grantor postgres,        tables    -> {postgres=arwdDxtm, anon=arwdDxtm,
--                                          authenticated=arwdDxtm, service_role=arwdDxtm}
--   grantor supabase_admin,  tables    -> same
--   plus the matching sequence entries
--
-- So every newly created function in `public` is executable by anon on creation,
-- and every newly created table is fully writable by anon on creation. Any
-- revoke is undone the next time an object is dropped and recreated. That is why
-- roughly 300 SECURITY DEFINER routines in public/api are anon- or
-- authenticated-executable in production despite targeted revokes.
--
-- WHY A REVOKE OF THE GRANTS ALONE IS NOT ENOUGH
--
-- 20260804190000_production_security_hardening.sql performs 49 revokes and
-- re-grants the operational subset to service_role. That fixes the objects that
-- exist when it runs. It does not change the default privileges, so the exposure
-- reappears for the next object created. This migration closes the source.
--
-- WHAT THIS CHANGES
--
-- After this runs, a new table/view/function/sequence in `public` is NOT reachable
-- by anon or authenticated until something grants it explicitly. That is
-- deliberate, and it matches this project's own stated intent: `supabase/config.toml`
-- documents `auto_expose_new_tables` as deprecated, notes that "When unset, new
-- entities are NOT auto-exposed, matching the new cloud default", and leaves it
-- unset. Local already behaves this way; production does not. This aligns them.
--
-- Existing objects are untouched -- ALTER DEFAULT PRIVILEGES only affects objects
-- created afterwards. Anything that currently works keeps working. Migrations that
-- create public-facing tables or views must grant explicitly from here on; the
-- ones in this repository already do.
--
-- service_role and postgres defaults are deliberately left in place: service_role
-- is the backend/edge-function identity and postgres owns the schema.
--
-- LIMIT ON FUNCTIONS -- READ BEFORE ASSUMING THIS CLOSES EVERYTHING
--
-- This migration fixes TABLES and SEQUENCES. It does NOT stop new functions in
-- `public` from being executable by anon, and PostgreSQL provides no way to do
-- that through ALTER DEFAULT PRIVILEGES. Proven on PostgreSQL 16.13 with three
-- experiments:
--
--   1. defaclacl = {service_role=X/postgres} (a stored row with no PUBLIC entry)
--      -> new function proacl = {=X/postgres, postgres=X/postgres,
--                                service_role=X/postgres}   anon EXECUTE = true
--   2. `revoke execute on functions from public` alone
--      -> zero rows stored in pg_default_acl, new function proacl = NULL,
--         anon EXECUTE = true
--   3. grant to service_role + revoke from public together
--      -> defaclacl = {service_role=X/postgres}, new function still
--         {=X/postgres, ...}                                anon EXECUTE = true
--
-- `=X/` is the PUBLIC pseudo-role. pg_default_acl entries are MERGED WITH the
-- built-in defaults rather than replacing them, and the built-in default for
-- functions is EXECUTE TO PUBLIC. Revoking PUBLIC there does not persist.
--
-- The compensating controls for functions therefore remain, unchanged:
--   * every function migration revoking explicitly from public, anon, authenticated
--     (the pattern 20260722031500 and 20260710190300 already use), and
--   * the anon_definer_execute / authenticated_definer_execute assertions in
--     supabase/tests/production_security_hardening.sql, which must return zero rows.
--
-- Tables are the more severe half regardless: production's default grants anon
-- `arwdDxtm` -- full INSERT/UPDATE/DELETE -- on every newly created table in
-- `public`. That is what this closes.
--
-- Idempotent: ALTER DEFAULT PRIVILEGES ... REVOKE is a no-op when the default
-- entry is already absent.
--
-- Guarded per grantor role. `supabase_admin`'s defaults can only be altered by
-- supabase_admin, which the migration role is not (verified: postgres is not a
-- superuser and not a member of supabase_admin). Those are attempted and reported
-- honestly rather than assumed -- same discipline as 20260805234000.

do $revoke_public_default_privileges$
declare
  v_role       text;
  v_remaining  int;
begin
  foreach v_role in array array['postgres', 'supabase_admin']
  loop
    if to_regrole(v_role) is null then
      raise notice 'role % not present; skipping its default privileges', v_role;
      continue;
    end if;

    begin
      -- Functions: this removes the EXPLICIT anon/authenticated default grants
      -- only. It does NOT stop new functions being executable by anon, and the
      -- migration does not claim to -- see the LIMIT ON FUNCTIONS note in the
      -- header. PUBLIC is included anyway so the explicit entry is gone if one
      -- was ever added.
      execute format(
        'alter default privileges for role %I in schema public '
        'revoke execute on functions from public, anon, authenticated', v_role);
      execute format(
        'alter default privileges for role %I in schema public '
        'revoke all on tables from anon, authenticated', v_role);
      execute format(
        'alter default privileges for role %I in schema public '
        'revoke all on sequences from anon, authenticated', v_role);
    exception
      when insufficient_privilege then
        raise warning
          'cannot alter default privileges owned by % -- they must be changed by '
          'that role. New objects in public will continue to be auto-granted to '
          'anon/authenticated via this entry.', v_role;
      when others then
        raise warning 'could not alter default privileges for %: %', v_role, sqlerrm;
    end;
  end loop;

  -- Verify rather than assume. Scoped to tables and sequences, because those are
  -- the object types this migration can actually close; functions are covered by
  -- the assertion gate instead (see the LIMIT ON FUNCTIONS note above).
  select count(*) into v_remaining
  from pg_default_acl d
  join pg_namespace n on n.oid = d.defaclnamespace
  where n.nspname = 'public'
    and d.defaclobjtype in ('r', 'S')
    and d.defaclacl::text ~ '(anon|authenticated)=';

  if v_remaining > 0 then
    raise warning
      'public still has % table/sequence default-privilege entr(y/ies) granting '
      'anon or authenticated. New tables there will be auto-exposed.', v_remaining;
  else
    raise notice
      'public table/sequence defaults no longer grant anon or authenticated '
      '(function EXECUTE to PUBLIC is unaffected by design -- see header)';
  end if;
end
$revoke_public_default_privileges$;
