-- Structural fix for the security_invoker regression, not another one-off
-- patch. This bug class has now hit at least 6 times across 3+ weeks
-- (20260622151411, 20260701001549, 20260709092127, 20260710190000 fixed 18
-- views; this session alone found and fixed 16 more across 2 passes, plus
-- api.source_snapshots as a 3rd, found on a routine re-check). The root
-- cause is structural: `CREATE OR REPLACE VIEW api.x AS SELECT ...` resets
-- any omitted `WITH (...)` option back to its default, so ANY future edit
-- to a view -- by any session, human or agent, whether or not it goes
-- through a PR -- silently reopens RLS on the underlying table. Six
-- instances in three weeks is a pattern, not noise, and manually re-running
-- get_advisors after the fact can only ever catch it after it's already
-- live.
--
-- This makes it structurally impossible instead: an event trigger that
-- fires after any CREATE VIEW or ALTER VIEW completes, checks whether the
-- affected view is in the `api` schema, and force-sets
-- security_invoker = true if it isn't already. Tested directly before
-- committing this file (not just asserted):
--   1. A fresh view created in api schema with no WITH clause at all ->
--      security_invoker=true appears in reloptions automatically.
--   2. The same view re-created via CREATE OR REPLACE (the exact scenario
--      that caused every prior regression) -> self-heals back to
--      security_invoker=true instead of reverting to false.
--   3. A view created in the public schema (outside api) -> untouched,
--      confirming the schema scope actually holds.
--   4. No recursion: the function checks reloptions before altering, so
--      the ALTER VIEW it issues doesn't cause it to fire on itself again.
--   5. Wrapped in exception handling that logs a WARNING and continues
--      rather than failing -- this must never be the thing that breaks a
--      real migration; worst case on failure is back to today's status
--      quo of manual get_advisors checks, not a blocked deploy.
--
-- Does not retroactively fix anything -- it only prevents the *next*
-- regression on any view created or edited from this point forward.

create or replace function public.enforce_api_view_security_invoker()
returns event_trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  obj record;
  current_opts text;
begin
  for obj in select * from pg_event_trigger_ddl_commands()
  loop
    if obj.object_type = 'view' and obj.schema_name = 'api' then
      select array_to_string(c.reloptions, ',') into current_opts
      from pg_class c where c.oid = obj.objid;

      if current_opts is null or position('security_invoker=true' in current_opts) = 0 then
        execute format('alter view %s set (security_invoker = true)', obj.object_identity);
        raise notice 'enforce_api_view_security_invoker: set security_invoker=true on %', obj.object_identity;
      end if;
    end if;
  end loop;
exception when others then
  raise warning 'enforce_api_view_security_invoker failed: %', sqlerrm;
end;
$$;

drop event trigger if exists enforce_api_view_security_invoker_trigger;
create event trigger enforce_api_view_security_invoker_trigger
  on ddl_command_end
  when tag in ('CREATE VIEW', 'ALTER VIEW')
  execute function public.enforce_api_view_security_invoker();

-- Also closes the 3rd live instance found today, api.source_snapshots
-- (admin/operator-only per RLS; authenticated already had view-level
-- SELECT, so this was live, not theoretical -- crawler snapshot content,
-- lower sensitivity than the dossier/passport/matches batch fixed earlier
-- today but a real policy violation regardless). Base table already had
-- the matching authenticated grant, so no companion grant needed.
alter view api.source_snapshots set (security_invoker = true);
