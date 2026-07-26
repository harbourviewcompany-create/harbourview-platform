
-- Talent is company-facing: each workspace (operator) owns and manages its
-- own job postings and candidate pipeline. Candidates can also apply
-- directly to open postings without a Harbourview account.

-- A job posting always belongs to a hiring company now.
alter table public.talent_jobs
  alter column workspace_id set not null;

-- Support a public apply flow.
alter table public.talent_candidates
  add column resume_url text,
  add column cover_note text;

comment on table public.talent_jobs is 'Company-facing job postings (ATS). Each row belongs to a workspace (the hiring operator). Open postings are publicly readable so candidates can browse/apply; full management is workspace-member-only.';
comment on table public.talent_candidates is 'Candidates in a job''s pipeline. Workspace members that own the job manage the full pipeline. External applicants may insert their own application (stage forced to sourced) but cannot read or edit other candidates.';

-- ---- drop the internal-admin-only policies from the first pass ----
drop policy if exists talent_jobs_admin_operator_read on public.talent_jobs;
drop policy if exists talent_jobs_service_write on public.talent_jobs;
drop policy if exists talent_candidates_admin_operator_read on public.talent_candidates;
drop policy if exists talent_candidates_service_write on public.talent_candidates;

-- ---- talent_jobs ----
-- Anyone can see open postings (public job board / apply flow).
create policy talent_jobs_public_read_open
  on public.talent_jobs for select
  to anon, authenticated
  using (status = 'open');

-- The owning company's members can fully manage their own postings
-- (including drafts/closed ones), matching the hv_* workspace-isolation pattern.
create policy talent_jobs_workspace_manage
  on public.talent_jobs for all
  to authenticated
  using (workspace_id in (
    select workspace_members.workspace_id from public.workspace_members
    where workspace_members.user_id = (select auth.uid())
  ))
  with check (workspace_id in (
    select workspace_members.workspace_id from public.workspace_members
    where workspace_members.user_id = (select auth.uid())
  ));

-- Platform admins keep support/moderation visibility, consistent with other tables.
create policy talent_jobs_admin_manage
  on public.talent_jobs for all
  to authenticated
  using (exists (
    select 1 from public.user_roles ur
    where ur.user_id = (select auth.uid()) and ur.role = 'admin'
  ))
  with check (exists (
    select 1 from public.user_roles ur
    where ur.user_id = (select auth.uid()) and ur.role = 'admin'
  ));

-- ---- talent_candidates ----
-- The owning company's members fully manage their own pipeline.
create policy talent_candidates_workspace_manage
  on public.talent_candidates for all
  to authenticated
  using (job_id in (
    select tj.id from public.talent_jobs tj
    where tj.workspace_id in (
      select workspace_members.workspace_id from public.workspace_members
      where workspace_members.user_id = (select auth.uid())
    )
  ))
  with check (job_id in (
    select tj.id from public.talent_jobs tj
    where tj.workspace_id in (
      select workspace_members.workspace_id from public.workspace_members
      where workspace_members.user_id = (select auth.uid())
    )
  ));

-- Anyone (logged in or not) can apply to an open posting. They can only
-- create the initial application — stage is forced to 'sourced' and no
-- read/update/delete access is granted, so applicants can't see the pipeline
-- or other candidates.
create policy talent_candidates_public_apply
  on public.talent_candidates for insert
  to anon, authenticated
  with check (
    stage = 'sourced'
    and job_id in (select id from public.talent_jobs where status = 'open')
  );

-- Platform admins keep support/moderation visibility.
create policy talent_candidates_admin_manage
  on public.talent_candidates for all
  to authenticated
  using (exists (
    select 1 from public.user_roles ur
    where ur.user_id = (select auth.uid()) and ur.role = 'admin'
  ))
  with check (exists (
    select 1 from public.user_roles ur
    where ur.user_id = (select auth.uid()) and ur.role = 'admin'
  ));
