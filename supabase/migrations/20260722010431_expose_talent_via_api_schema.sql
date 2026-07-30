
-- PostgREST on this project only exposes the `api` schema. talent_jobs and
-- talent_candidates were created in `public` and, without this, would be
-- completely unreachable from the app (the exact "silent RPC failure"
-- pattern flagged elsewhere in this repo's history). security_invoker=on
-- means these views enforce the base tables' RLS, not view-owner privilege,
-- matching every other api.* passthrough view in this schema.

create view api.talent_jobs
  with (security_invoker = on)
  as select * from public.talent_jobs;

create view api.talent_candidates
  with (security_invoker = on)
  as select * from public.talent_candidates;

-- Public job board: anyone can list open postings.
grant select on api.talent_jobs to anon, authenticated;

-- Public apply flow: anyone can insert an application; RLS
-- (talent_candidates_public_apply) restricts what that insert can contain.
grant insert on api.talent_candidates to anon, authenticated;

-- Company pipeline management (talent_jobs_workspace_manage /
-- talent_candidates_workspace_manage / admin_manage RLS policies already
-- exist on the base tables from the prior migration) — grant the table
-- privileges those policies assume, so the future company-side dashboard
-- doesn't need another migration just to become reachable.
grant insert, update, delete on api.talent_jobs to authenticated;
grant select, update, delete on api.talent_candidates to authenticated;
