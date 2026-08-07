-- cc_jurisdiction_briefings lives in public but PostgREST is configured to
-- expose the api schema. Production recorded this version as a reconciliation
-- marker because the schema and view already existed out of band.
--
-- Restore the missing zero-state foundation without broadening write access.
create schema if not exists api authorization postgres;
revoke create on schema api from public;
grant usage on schema api to anon, authenticated, service_role;

create or replace view api.cc_jurisdiction_briefings as
select * from public.cc_jurisdiction_briefings;

revoke all on table api.cc_jurisdiction_briefings from public, anon, authenticated;
grant select on table api.cc_jurisdiction_briefings to anon, authenticated;
grant all on table api.cc_jurisdiction_briefings to service_role;

notify pgrst, 'reload schema';
