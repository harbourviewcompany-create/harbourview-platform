
-- Talent / ATS: job postings
create table public.talent_jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  department text,
  location text,
  workspace_id uuid references public.workspaces(id),
  status text not null default 'open' check (status in ('open','on_hold','closed')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.talent_jobs is 'Internal Harbourview job postings for operator-expansion hiring (ATS). Reads gated to admin/operator/analyst; writes service-role only, mirrors the opportunities table pattern.';

create trigger set_talent_jobs_updated_at
  before update on public.talent_jobs
  for each row execute function public.set_updated_at();

-- Talent / ATS: candidates in the pipeline
create table public.talent_candidates (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.talent_jobs(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  source text,
  stage text not null default 'sourced'
    check (stage in ('sourced','screening','interview','offer','hired','rejected')),
  stage_changed_at timestamptz not null default now(),
  tags text[] not null default '{}',
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.talent_candidates is 'Candidates in the ATS pipeline, one row per candidate per job. stage_changed_at drives the "days in stage" freshness indicator in the UI; no separate audit trail yet.';

create index talent_candidates_job_id_idx on public.talent_candidates(job_id);
create index talent_candidates_stage_idx on public.talent_candidates(stage);

-- keep stage_changed_at accurate whenever stage actually changes
create or replace function public.set_talent_candidate_stage_changed_at()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  if TG_OP = 'UPDATE' and NEW.stage is distinct from OLD.stage then
    NEW.stage_changed_at = now();
  end if;
  NEW.updated_at = now();
  return NEW;
end;
$$;

create trigger set_talent_candidates_stage_changed_at
  before update on public.talent_candidates
  for each row execute function public.set_talent_candidate_stage_changed_at();

create trigger set_talent_candidates_updated_at_insert
  before insert on public.talent_candidates
  for each row execute function public.set_updated_at();

-- RLS: same admin/operator/analyst read + service-role write pattern as public.opportunities
alter table public.talent_jobs enable row level security;
alter table public.talent_candidates enable row level security;

create policy talent_jobs_admin_operator_read
  on public.talent_jobs for select
  using (exists (
    select 1 from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.role = any (array['admin','operator','analyst'])
  ));

create policy talent_jobs_service_write
  on public.talent_jobs for all
  using ((select auth.role()) = 'service_role')
  with check ((select auth.role()) = 'service_role');

create policy talent_candidates_admin_operator_read
  on public.talent_candidates for select
  using (exists (
    select 1 from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.role = any (array['admin','operator','analyst'])
  ));

create policy talent_candidates_service_write
  on public.talent_candidates for all
  using ((select auth.role()) = 'service_role')
  with check ((select auth.role()) = 'service_role');
