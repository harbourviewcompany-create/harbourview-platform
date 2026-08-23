-- Harbourview Talent Job Board API-schema exposure
-- Scope: Talent Job Board only.
-- The canonical Supabase client is locked to the exposed `api` schema, so
-- public.* Talent objects require security-invoker passthrough views/wrappers.

create or replace view api.talent_opportunities
  with (security_invoker = on)
  as select * from public.talent_opportunities;

create or replace view api.talent_applications
  with (security_invoker = on)
  as select * from public.talent_applications;

create or replace view api.talent_saved_jobs
  with (security_invoker = on)
  as select * from public.talent_saved_jobs;

create or replace view api.talent_alerts
  with (security_invoker = on)
  as select * from public.talent_alerts;

revoke all privileges on api.talent_opportunities from anon, authenticated;
revoke all privileges on api.talent_applications from anon, authenticated;
revoke all privileges on api.talent_saved_jobs from anon, authenticated;
revoke all privileges on api.talent_alerts from anon, authenticated;

grant select on api.talent_opportunities to anon, authenticated;
grant insert, update on api.talent_opportunities to authenticated;

grant insert on api.talent_applications to anon;
grant select, insert on api.talent_applications to authenticated;

grant select, insert, update, delete on api.talent_saved_jobs to authenticated;
grant select, insert on api.talent_alerts to authenticated;

create or replace function api.increment_talent_view_count(opportunity_id uuid)
returns void
language sql
security invoker
set search_path = pg_catalog, public
as $$
  select public.increment_talent_view_count(opportunity_id);
$$;

create or replace function api.increment_talent_application_count(opportunity_id uuid)
returns void
language sql
security invoker
set search_path = pg_catalog, public
as $$
  select public.increment_talent_application_count(opportunity_id);
$$;

revoke execute on function api.increment_talent_view_count(uuid)
  from public, anon, authenticated;
revoke execute on function api.increment_talent_application_count(uuid)
  from public, anon, authenticated;

grant execute on function api.increment_talent_view_count(uuid)
  to anon, authenticated;
grant execute on function api.increment_talent_application_count(uuid)
  to authenticated;
