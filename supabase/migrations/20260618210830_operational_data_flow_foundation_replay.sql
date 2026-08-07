-- Replay-safe operational foundation recovered from the production schema.
-- These relations existed in production before the June 18 data-flow backfill,
-- but their creation history was recorded only as no-op production stubs.

create table if not exists public.engagements (
  id uuid primary key default gen_random_uuid(),
  client text not null,
  type text not null default 'retainer'
    check (type in ('retainer','commission','project','placement')),
  status text not null default 'active'
    check (status in ('active','scoping','paused','closed')),
  monthly_value numeric(10,2),
  total_value numeric(10,2),
  entity text not null default 'harbourview'
    check (entity in ('harbourview','strangford')),
  next_action text,
  next_action_date date,
  start_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dossier_status (
  id uuid primary key default gen_random_uuid(),
  market text not null unique,
  region text not null default 'Europe'
    check (region in ('Europe','LATAM','ANZ','North America','Africa','Asia','Middle East','Other')),
  status text not null default 'not_started'
    check (status in ('current','in_progress','stale','not_started')),
  last_updated date,
  priority text not null default 'later'
    check (priority in ('now','soon','later','parked')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'Deal',
  stage text not null default 'Identified',
  priority text not null default 'soon'
    check (priority in ('now','soon','later','parked')),
  priority_order integer generated always as (
    case priority
      when 'now' then 1
      when 'soon' then 2
      when 'later' then 3
      else 4
    end
  ) stored,
  value_est text,
  value_num numeric(12,2),
  next_action text,
  next_action_date date,
  project text,
  market text,
  counterparty text,
  notes text,
  entity text not null default 'harbourview'
    check (entity in ('harbourview','strangford','personal')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dossiers (
  id uuid primary key default gen_random_uuid(),
  title text,
  created_at timestamptz default now(),
  country_id uuid references public.countries(id),
  storage_bucket text,
  file_path text,
  file_size_bytes bigint,
  maturity_score integer,
  maturity_tier text,
  page_count integer,
  updated_at timestamptz not null default now(),
  drive_file_id text
);

create table if not exists public.hv_public_feed (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  artifact_id uuid not null unique references public.hv_artifacts(id),
  feed_type text not null,
  title_public text not null,
  summary_public text not null,
  body_public text,
  jurisdiction_code text,
  country_iso text,
  region text,
  tags text[],
  effective_date date,
  source_label text,
  authority_label text,
  status text not null default 'draft',
  published_at timestamptz,
  unpublished_at timestamptz,
  review_due_at timestamptz,
  expires_at timestamptz,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  publication_note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Processing queue types and tables recovered from production.
do $hv_job_types$
begin
  if not exists (
    select 1 from pg_type
    where typnamespace = 'public'::regnamespace and typname = 'hv_job_type'
  ) then
    create type public.hv_job_type as enum (
      'embed','summarize','ocr','parse','extract_relations','classify',
      'translate','signal_extraction','duplicate_check','public_dto_generate'
    );
  end if;

  if not exists (
    select 1 from pg_type
    where typnamespace = 'public'::regnamespace and typname = 'hv_job_status'
  ) then
    create type public.hv_job_status as enum (
      'pending','claimed','running','completed','failed','dead_letter','cancelled'
    );
  end if;
end
$hv_job_types$;

create table if not exists public.hv_processing_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  artifact_id uuid references public.hv_artifacts(id) on delete cascade,
  job_type public.hv_job_type not null,
  job_key text not null unique,
  priority integer not null default 5,
  input_payload jsonb not null default '{}'::jsonb,
  output_payload jsonb,
  status public.hv_job_status not null default 'pending',
  attempt_count integer not null default 0,
  max_attempts integer not null default 3,
  last_error text,
  dead_letter_reason text,
  scheduled_at timestamptz not null default now(),
  claimed_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  dead_lettered_at timestamptz,
  next_retry_at timestamptz,
  claimed_by text,
  worker_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hv_job_attempts (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.hv_processing_jobs(id) on delete cascade,
  attempt_num integer not null,
  status text not null,
  worker_id text,
  worker_version text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_ms integer,
  error text,
  output_hash text,
  created_at timestamptz not null default now()
);

-- Ensure the pre-existing marketplace candidate table exposes the fields used
-- by the June data-flow backfill. Existing values and provenance are preserved.
alter table public.marketplace_candidates
  add column if not exists confidence numeric,
  add column if not exists reviewed_at timestamptz;

do $marketplace_candidate_status_contract$
begin
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.marketplace_candidates'::regclass
      and conname = 'marketplace_candidates_status_check'
  ) then
    alter table public.marketplace_candidates
      drop constraint marketplace_candidates_status_check;
  end if;

  alter table public.marketplace_candidates
    add constraint marketplace_candidates_status_check
    check (status in (
      'captured','needs_review','needs_verification','reviewed',
      'approved_draft','rejected','archived'
    )) not valid;
end
$marketplace_candidate_status_contract$;

create index if not exists idx_engagements_status on public.engagements(status, updated_at desc);
create index if not exists idx_dossier_status_priority on public.dossier_status(priority, last_updated desc);
create index if not exists idx_opportunities_priority on public.opportunities(priority_order, updated_at desc);
create index if not exists idx_hv_public_feed_status_published on public.hv_public_feed(status, published_at desc);
create index if not exists idx_hv_processing_jobs_queue on public.hv_processing_jobs(status, priority, scheduled_at);
create index if not exists idx_hv_job_attempts_job on public.hv_job_attempts(job_id, attempt_num);

alter table public.engagements enable row level security;
alter table public.dossier_status enable row level security;
alter table public.opportunities enable row level security;
alter table public.dossiers enable row level security;
alter table public.hv_public_feed enable row level security;
alter table public.hv_processing_jobs enable row level security;
alter table public.hv_job_attempts enable row level security;

revoke all on table public.engagements from public, anon, authenticated;
revoke all on table public.dossier_status from public, anon, authenticated;
revoke all on table public.opportunities from public, anon, authenticated;
revoke all on table public.dossiers from public, anon, authenticated;
revoke all on table public.hv_public_feed from public, anon, authenticated;
revoke all on table public.hv_processing_jobs from public, anon, authenticated;
revoke all on table public.hv_job_attempts from public, anon, authenticated;

grant all on table public.engagements to service_role;
grant all on table public.dossier_status to service_role;
grant all on table public.opportunities to service_role;
grant all on table public.dossiers to service_role;
grant select on table public.hv_public_feed to anon, authenticated;
grant all on table public.hv_public_feed to service_role;
grant all on table public.hv_processing_jobs to service_role;
grant all on table public.hv_job_attempts to service_role;

drop policy if exists hv_public_feed_public_read on public.hv_public_feed;
create policy hv_public_feed_public_read
  on public.hv_public_feed for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists opportunities_admin_operator_read on public.opportunities;
create policy opportunities_admin_operator_read
  on public.opportunities for select
  to authenticated
  using (
    exists (
      select 1 from public.user_roles role_record
      where role_record.user_id = (select auth.uid())
        and role_record.role in ('admin','operator','analyst')
    )
  );

drop policy if exists dossiers_admin_operator_select on public.dossiers;
create policy dossiers_admin_operator_select
  on public.dossiers for select
  to authenticated
  using (
    exists (
      select 1 from public.user_roles role_record
      where role_record.user_id = (select auth.uid())
        and role_record.role in ('admin','operator')
    )
  );

drop policy if exists hv_jobs_admin_only on public.hv_processing_jobs;
create policy hv_jobs_admin_only
  on public.hv_processing_jobs for all
  to authenticated
  using (
    exists (
      select 1 from public.user_roles role_record
      where role_record.user_id = (select auth.uid())
        and role_record.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.user_roles role_record
      where role_record.user_id = (select auth.uid())
        and role_record.role = 'admin'
    )
  );

drop policy if exists hv_job_attempts_admin_only on public.hv_job_attempts;
create policy hv_job_attempts_admin_only
  on public.hv_job_attempts for all
  to authenticated
  using (
    exists (
      select 1 from public.user_roles role_record
      where role_record.user_id = (select auth.uid())
        and role_record.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.user_roles role_record
      where role_record.user_id = (select auth.uid())
        and role_record.role = 'admin'
    )
  );
