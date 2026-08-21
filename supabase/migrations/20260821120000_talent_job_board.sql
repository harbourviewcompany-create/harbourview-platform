-- Migration: Harbourview Talent Job Board foundation
-- Date: 2026-08-21
-- Additive only. Does not touch supplier_profiles, clinical tables, or counterparty records.
-- organization_id is optional UUID (no hard FK) so migration applies even if org table naming differs.

-- ---------------------------------------------------------------------------
-- 1. talent_opportunities
-- ---------------------------------------------------------------------------
create table if not exists public.talent_opportunities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid,
  company_name text not null default '',
  company_location text,
  title text not null check (char_length(title) between 3 and 200),
  slug text not null,
  description text not null,
  requirements text,
  benefits text,
  role_family text not null,
  seniority text check (seniority is null or seniority in (
    'entry', 'mid', 'senior', 'director', 'executive'
  )),
  employment_type text not null default 'full_time' check (employment_type in (
    'full_time', 'part_time', 'contract', 'temporary', 'internship'
  )),
  location_type text not null default 'onsite' check (location_type in (
    'onsite', 'hybrid', 'remote'
  )),
  primary_jurisdiction text,
  jurisdictions text[] not null default '{}',
  salary_min numeric check (salary_min is null or salary_min >= 0),
  salary_max numeric check (salary_max is null or salary_max >= 0),
  salary_currency text not null default 'EUR',
  salary_period text not null default 'year' check (salary_period in (
    'year', 'month', 'hour', 'day'
  )),
  application_url text,
  application_email text,
  status text not null default 'draft' check (status in (
    'draft', 'pending_review', 'published', 'closed', 'archived'
  )),
  is_featured boolean not null default false,
  published_at timestamptz,
  closes_at timestamptz,
  created_by uuid references auth.users(id),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  review_notes text,
  source text not null default 'manual' check (source in (
    'manual', 'import', 'partner', 'api'
  )),
  view_count integer not null default 0 check (view_count >= 0),
  application_count integer not null default 0 check (application_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint talent_opportunities_salary_range_check
    check (salary_min is null or salary_max is null or salary_min <= salary_max)
);

create unique index if not exists talent_opportunities_slug_active_idx
  on public.talent_opportunities (slug)
  where status <> 'archived';

create index if not exists talent_opportunities_status_jurisdiction_idx
  on public.talent_opportunities (status, primary_jurisdiction);

create index if not exists talent_opportunities_role_family_status_idx
  on public.talent_opportunities (role_family, status);

create index if not exists talent_opportunities_organization_id_idx
  on public.talent_opportunities (organization_id)
  where organization_id is not null;

create index if not exists talent_opportunities_published_at_idx
  on public.talent_opportunities (published_at desc nulls last)
  where status = 'published';

-- ---------------------------------------------------------------------------
-- 2. talent_applications
-- ---------------------------------------------------------------------------
create table if not exists public.talent_applications (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.talent_opportunities(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  applicant_name text,
  applicant_email text,
  status text not null default 'submitted' check (status in (
    'submitted', 'viewed', 'shortlisted', 'rejected', 'withdrawn', 'hired'
  )),
  cover_note text,
  resume_url text,
  professional_profile_snapshot jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists talent_applications_opportunity_id_idx
  on public.talent_applications (opportunity_id);

create index if not exists talent_applications_user_id_idx
  on public.talent_applications (user_id)
  where user_id is not null;

-- ---------------------------------------------------------------------------
-- 3. talent_saved_jobs
-- ---------------------------------------------------------------------------
create table if not exists public.talent_saved_jobs (
  user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid not null references public.talent_opportunities(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, opportunity_id)
);

-- ---------------------------------------------------------------------------
-- 4. talent_alerts
-- ---------------------------------------------------------------------------
create table if not exists public.talent_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  jurisdictions text[] not null default '{}',
  role_families text[] not null default '{}',
  location_types text[] not null default '{}',
  min_salary numeric,
  frequency text not null default 'daily' check (frequency in (
    'instant', 'daily', 'weekly'
  )),
  is_active boolean not null default true,
  last_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists talent_alerts_user_id_idx
  on public.talent_alerts (user_id);

-- ---------------------------------------------------------------------------
-- 5. updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists talent_opportunities_set_updated_at on public.talent_opportunities;
create trigger talent_opportunities_set_updated_at
  before update on public.talent_opportunities
  for each row execute function public.set_updated_at();

drop trigger if exists talent_applications_set_updated_at on public.talent_applications;
create trigger talent_applications_set_updated_at
  before update on public.talent_applications
  for each row execute function public.set_updated_at();

drop trigger if exists talent_alerts_set_updated_at on public.talent_alerts;
create trigger talent_alerts_set_updated_at
  before update on public.talent_alerts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 6. Increment RPCs
-- ---------------------------------------------------------------------------
create or replace function public.increment_talent_view_count(opportunity_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.talent_opportunities
  set view_count = view_count + 1
  where id = opportunity_id and status = 'published';
$$;

create or replace function public.increment_talent_application_count(opportunity_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.talent_opportunities
  set application_count = application_count + 1
  where id = opportunity_id;
$$;

grant execute on function public.increment_talent_view_count(uuid) to anon, authenticated;
grant execute on function public.increment_talent_application_count(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 7. RLS (no organization_members dependency)
-- ---------------------------------------------------------------------------
alter table public.talent_opportunities enable row level security;
alter table public.talent_applications enable row level security;
alter table public.talent_saved_jobs enable row level security;
alter table public.talent_alerts enable row level security;

-- Published readable by anyone
drop policy if exists "talent_opportunities_select_published" on public.talent_opportunities;
create policy "talent_opportunities_select_published"
  on public.talent_opportunities
  for select
  using (status = 'published' or created_by = auth.uid());

-- Authenticated users can insert their own drafts
drop policy if exists "talent_opportunities_insert_own" on public.talent_opportunities;
create policy "talent_opportunities_insert_own"
  on public.talent_opportunities
  for insert
  to authenticated
  with check (created_by = auth.uid());

-- Owners can update their non-published rows (cannot self-publish)
drop policy if exists "talent_opportunities_update_own" on public.talent_opportunities;
create policy "talent_opportunities_update_own"
  on public.talent_opportunities
  for update
  to authenticated
  using (created_by = auth.uid() and status in ('draft', 'pending_review', 'closed'))
  with check (created_by = auth.uid() and status in ('draft', 'pending_review', 'closed', 'archived'));

-- Applications
drop policy if exists "talent_applications_select_own" on public.talent_applications;
create policy "talent_applications_select_own"
  on public.talent_applications
  for select
  using (user_id = auth.uid());

drop policy if exists "talent_applications_insert_own" on public.talent_applications;
create policy "talent_applications_insert_own"
  on public.talent_applications
  for insert
  with check (user_id = auth.uid() or user_id is null);

drop policy if exists "talent_applications_update_own" on public.talent_applications;
create policy "talent_applications_update_own"
  on public.talent_applications
  for update
  using (user_id = auth.uid());

-- Saved jobs + alerts: owner only
drop policy if exists "talent_saved_jobs_own" on public.talent_saved_jobs;
create policy "talent_saved_jobs_own"
  on public.talent_saved_jobs
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "talent_alerts_own" on public.talent_alerts;
create policy "talent_alerts_own"
  on public.talent_alerts
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

comment on table public.talent_opportunities is
  'Reviewed job postings for the regulated cannabis industry. Separated from counterparty commercial records.';
comment on column public.talent_opportunities.status is
  'draft → pending_review → published | closed | archived. Publish requires service-role / admin review.';
comment on column public.talent_opportunities.company_name is
  'Denormalized company display name so list/detail work without an organizations join.';
