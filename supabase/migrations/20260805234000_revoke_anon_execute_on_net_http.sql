-- Best-effort revoke of anon/authenticated EXECUTE on net.http_get / net.http_post,
-- plus a standing report of the exposure this project cannot close itself.
--
-- WHAT IS EXPOSED
--
-- pg_net's http_get/http_post queue arbitrary outbound HTTP requests and are
-- SECURITY DEFINER. In this project anon and authenticated both hold EXECUTE on
-- them, which is Supabase's platform default rather than anything this
-- repository granted.
--
-- WHY THIS MIGRATION CANNOT FIX IT
--
-- Verified read-only against production (zvxdgdkukjrrwamdpqrg):
--
--   net.http_get / net.http_post   owner = supabase_admin, prosecdef = true
--   acl entries                    anon=X/supabase_admin
--                                  authenticated=X/supabase_admin
--                                  postgres=X/supabase_admin
--                                  service_role=X/supabase_admin
--                                  supabase_admin=X/supabase_admin
--                                  supabase_functions_admin=X/supabase_admin
--   schema net                     owner = supabase_admin
--   postgres                       rolsuper = false
--   pg_has_role('postgres','supabase_admin','MEMBER')  = false
--   has_schema_privilege('postgres','net','CREATE')    = false
--   has_schema_privilege('postgres','net','USAGE')     = true
--
-- Every grant names supabase_admin as the grantor, so only supabase_admin or a
-- superuser can revoke it. `postgres` is the role that runs these migrations
-- locally, the role behind the Supabase SQL editor, and the role behind the
-- management API -- and it is neither. Postgres does not raise for a revoke by a
-- non-grantor; it emits
--   WARNING (01007): no privileges were granted for "http_get"
--   WARNING (01006): no privileges could be revoked for "http_get"
-- and carries on, which is why the first version of this migration reported
-- success while changing nothing. The candidate run at 869203ec confirmed the
-- same outcome even after attempting SET ROLE supabase_admin first.
--
-- HOW REACHABLE IT ACTUALLY IS
--
-- Not through the Data API. PostgREST exposes `public, graphql_public,
-- job_search, api` in production and `public, graphql_public, api` locally;
-- `net` is in neither list and is not in extra_search_path, so no anon or
-- authenticated request can dispatch to net.http_get. Every caller in this
-- repository reaches pg_net from inside a SECURITY DEFINER function in `public`
-- -- the enrichment, digest, extraction and source-pull routines at
-- 20260611153902, 20260705110551, 20260705233347, 20260706221210, 20260709085300
-- and others -- and those execute as their owner, so the caller's own grant is
-- irrelevant to them. Exploiting the grant requires a direct Postgres session
-- authenticated as anon or authenticated, which the publishable anon key does not
-- provide.
--
-- So: a real but low-reachability platform default, not remediable from here.
-- Closing it needs supabase_admin, i.e. Supabase support or a platform-level
-- change, and it is a production security change requiring explicit sign-off.
-- Tracked in docs/control/EVIDENCE_LOG.md.
--
-- WHY THIS MIGRATION STAYS
--
-- The revoke is kept rather than deleted so the history self-heals if the grants
-- ever become owned by a role this project controls, or if the replay is run by a
-- privileged role. It is guarded on the schema and functions existing, idempotent,
-- and never aborts the replay. When it cannot take effect it says so, once per
-- replay, instead of claiming success.

do $revoke_net_http_public_execute$
declare
  target text;
  prior_role text := current_user;
begin
  if to_regnamespace('net') is null then
    raise notice 'net schema not present; skipping pg_net execute revokes';
    return;
  end if;

  foreach target in array array[
    'net.http_get(text, jsonb, jsonb, integer)',
    'net.http_post(text, jsonb, jsonb, jsonb, integer)'
  ]
  loop
    if to_regprocedure(target) is null then
      raise notice 'skipping revoke, % not present', target;
    else
      begin
        -- Try to become the grantor. Proven not to be permitted for `postgres`
        -- on Supabase, but harmless to attempt and correct if it ever is.
        begin
          set local role supabase_admin;
        exception
          when others then
            null;
        end;

        -- NB: the restore below is `set local role <prior_role>`, not RESET ROLE.
        -- RESET ROLE reverts to session_user, which is not necessarily the role
        -- that entered this block. A local harness caught exactly that: with the
        -- session at `postgres` and `set role` to an unprivileged migrator, the
        -- first iteration's RESET ROLE escalated the second iteration back to the
        -- superuser session role, so one function was revoked and the other was
        -- not. Restoring the captured role keeps every iteration at the same
        -- privilege level.

        -- Grant the operational roles explicitly BEFORE revoking PUBLIC, so they
        -- keep access when any blanket grant goes away. This matches production's
        -- acl shape, which names every role individually and has no PUBLIC entry.
        execute format('grant execute on function %s to postgres, service_role', target);

        -- PUBLIC must be included. Revoking only anon and authenticated leaves the
        -- PUBLIC pseudo-role grant in place and both roles keep EXECUTE through it
        -- -- has_function_privilege still returns true. 20260722031500 records this
        -- exact trap after hitting it on the hv_* pipeline functions.
        execute format('revoke execute on function %s from public, anon, authenticated', target);

        execute format('set local role %I', prior_role);

        -- Verify rather than assume, because a revoke by a non-grantor only warns.
        if has_function_privilege('anon', to_regprocedure(target), 'execute')
           or has_function_privilege('authenticated', to_regprocedure(target), 'execute')
        then
          raise warning
            'anon/authenticated retain EXECUTE on % -- granted by supabase_admin, '
            'which this role cannot revoke. Unreachable via PostgREST (the net '
            'schema is not exposed); closing it needs a platform-level change. '
            'See docs/control/EVIDENCE_LOG.md.', target;
        else
          raise notice 'revoked public/anon/authenticated execute on %', target;
        end if;
      exception
        when insufficient_privilege then
          execute format('set local role %I', prior_role);
          raise notice 'insufficient privilege to revoke on %; left unchanged', target;
      end;
    end if;
  end loop;
end
$revoke_net_http_public_execute$;
