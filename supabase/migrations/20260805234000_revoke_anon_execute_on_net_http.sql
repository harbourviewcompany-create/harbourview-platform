-- Remove anon and authenticated EXECUTE on net.http_get / net.http_post.
--
-- The hardened-state assertions run at the end of the candidate replay reported
-- these two as defects before failing for an unrelated reason:
--   net|http_get |url text, params jsonb, headers jsonb, timeout_milliseconds integer|anon_definer_execute
--   net|http_post|url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer|anon_definer_execute
-- The assertion file must return zero rows, so these have to go regardless of
-- anything else.
--
-- The exposure is real, and it is present in production too. Checked live:
-- both functions are SECURITY DEFINER (prosecdef = true) with acl
--   supabase_admin=X | supabase_functions_admin=X | postgres=X
--   | anon=X | authenticated=X | service_role=X
-- pg_net's http_get/http_post queue arbitrary outbound HTTP requests. Executable
-- by anon, through the public anon key, that is a server-side request forgery
-- primitive against anything the database can reach, including internal
-- addresses -- the same class of exposure 20260722031500 closed for the hv_*
-- pipeline functions.
--
-- Nothing legitimate breaks. Every caller in this repository reaches pg_net from
-- inside a SECURITY DEFINER function -- the enrichment, digest, extraction and
-- source-pull routines at 20260611153902, 20260705110551, 20260705233347,
-- 20260706221210, 20260709085300 and others -- and those execute as their owner,
-- not as the caller, so revoking the caller's direct grant does not affect them.
-- service_role and postgres keep their grants, which is what the cron jobs and
-- edge functions authenticate as.
--
-- Guarded on the functions existing, because the net schema is created by the
-- pg_net extension and a replay without it should not fail here. Also tolerant
-- of insufficient privilege: the acl is granted by supabase_admin, and the role
-- running migrations is not always able to revoke it. A notice is raised in that
-- case rather than aborting the replay, since failing the whole history over a
-- grant this migration does not own would be worse than reporting it.
--
-- Idempotent: revoking an already-revoked privilege is a no-op.

do $revoke_net_http_public_execute$
declare
  target text;
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
        -- Grant the operational roles explicitly BEFORE revoking PUBLIC, so
        -- they keep access when the blanket grant goes away. This reproduces
        -- production's acl shape, which names every role individually and has
        -- no PUBLIC entry.
        execute format('grant execute on function %s to postgres, service_role', target);

        -- PUBLIC must be included. Revoking only anon and authenticated leaves
        -- the PUBLIC pseudo-role grant in place and both roles keep EXECUTE
        -- through it -- has_function_privilege still returns true, so the
        -- assertion still fails. 20260722031500 records this exact trap after
        -- hitting it on the hv_* pipeline functions, and a local test of the
        -- anon-and-authenticated-only form here reproduced it again.
        execute format('revoke execute on function %s from public, anon, authenticated', target);
        raise notice 'revoked public/anon/authenticated execute on %', target;
      exception
        when insufficient_privilege then
          raise notice 'insufficient privilege to revoke on %; left unchanged', target;
      end;
    end if;
  end loop;
end
$revoke_net_http_public_execute$;
