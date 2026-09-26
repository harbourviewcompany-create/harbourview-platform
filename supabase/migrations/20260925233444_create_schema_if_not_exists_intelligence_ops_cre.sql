-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260925233444
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

create schema if not exists intelligence_ops;

create table if not exists public.jurisdiction_data_depth_source_candidates (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_key text not null,
  dimension_key text not null,
  source_registry_id uuid,
  source_url text not null,
  authority_level text not null default 'unknown',
  document_type text not null default 'unknown',
  jurisdiction_specificity numeric(5,2) not null default 0,
  dimension_relevance numeric(5,2) not null default 0,
  substantive_content numeric(5,2) not null default 0,
  accessibility_score numeric(5,2) not null default 0,
  freshness_score numeric(5,2) not null default 0,
  total_score numeric(6,2) generated always as (
    jurisdiction_specificity * 0.25 +
    dimension_relevance * 0.25 +
    substantive_content * 0.25 +
    accessibility_score * 0.10 +
    freshness_score * 0.15
  ) stored,
  status text not null default 'candidate',
  rejection_reason text,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jurisdiction_specificity between 0 and 100),
  check (dimension_relevance between 0 and 100),
  check (substantive_content between 0 and 100),
  check (accessibility_score between 0 and 100),
  check (freshness_score between 0 and 100),
  check (status in ('candidate','selected','rejected','unavailable','stale'))
);
create index if not exists idx_fd_source_candidates_rank
  on public.jurisdiction_data_depth_source_candidates(jurisdiction_key, dimension_key, total_score desc);
create unique index if not exists uq_fd_source_candidates_url_dim
  on public.jurisdiction_data_depth_source_candidates(jurisdiction_key, dimension_key, source_url);

create table if not exists public.jurisdiction_data_depth_document_chunks (
  id uuid primary key default gen_random_uuid(),
  source_snapshot_id uuid not null,
  jurisdiction_key text not null,
  dimension_key text,
  chunk_index integer not null,
  page_number integer,
  section_path text,
  content text not null,
  content_sha256 text not null,
  created_at timestamptz not null default now(),
  unique(source_snapshot_id, chunk_index)
);
create index if not exists idx_fd_document_chunks_snapshot
  on public.jurisdiction_data_depth_document_chunks(source_snapshot_id, chunk_index);

create table if not exists public.jurisdiction_data_depth_work_items (
  id uuid primary key default gen_random_uuid(),
  capture_job_id uuid,
  jurisdiction_key text not null,
  dimension_key text not null,
  work_type text not null,
  priority integer not null default 100,
  status text not null default 'queued',
  available_at timestamptz not null default now(),
  claimed_at timestamptz,
  lease_until timestamptz,
  attempts integer not null default 0,
  max_attempts integer not null default 8,
  worker_id text,
  payload jsonb not null default '{}'::jsonb,
  last_error text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (work_type in ('discover','acquire','extract','adjudicate','promote','refresh')),
  check (status in ('queued','leased','complete','retry','dead_letter','cancelled'))
);
create index if not exists idx_fd_work_ready
  on public.jurisdiction_data_depth_work_items(work_type, status, priority desc, available_at);
create unique index if not exists uq_fd_work_job_type
  on public.jurisdiction_data_depth_work_items(capture_job_id, work_type)
  where capture_job_id is not null;

create table if not exists public.jurisdiction_data_depth_fact_versions (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_key text not null,
  dimension_key text not null,
  fact_key text not null,
  evidence_id uuid,
  payload jsonb not null,
  effective_from date,
  effective_to date,
  state text not null default 'candidate',
  supersedes_id uuid references public.jurisdiction_data_depth_fact_versions(id),
  conflict_group text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (state in ('candidate','accepted','superseded','conflicted','rejected'))
);
create index if not exists idx_fd_fact_current
  on public.jurisdiction_data_depth_fact_versions(jurisdiction_key, dimension_key, fact_key, state);
create index if not exists idx_fd_fact_conflicts
  on public.jurisdiction_data_depth_fact_versions(conflict_group)
  where state='conflicted';

create table if not exists public.jurisdiction_data_depth_refresh_policies (
  dimension_key text primary key,
  max_age_days integer not null,
  critical_max_age_days integer not null,
  priority_weight numeric(8,2) not null default 1,
  active boolean not null default true
);

insert into public.jurisdiction_data_depth_refresh_policies(dimension_key,max_age_days,critical_max_age_days,priority_weight)
select dimension_key,
       case when dimension_key in ('regulatory_status','regulatory_tier','access_rules','commercial_activity','import','export','distribution') then 30 else 180 end,
       case when dimension_key in ('regulatory_status','regulatory_tier','access_rules','commercial_activity') then 14 else 90 end,
       case when dimension_key in ('regulatory_status','regulatory_tier','access_rules','commercial_activity') then 5 else 1 end
from public.jurisdiction_data_depth_dimensions
on conflict (dimension_key) do update
set max_age_days=excluded.max_age_days,
    critical_max_age_days=excluded.critical_max_age_days,
    priority_weight=excluded.priority_weight;

create or replace function intelligence_ops.enqueue_full_depth_work(
  p_work_type text,
  p_limit integer default 1000
) returns integer
language plpgsql
security definer
set search_path = public, intelligence_ops, pg_catalog
as $$
declare v_count integer;
begin
  insert into public.jurisdiction_data_depth_work_items
    (capture_job_id,jurisdiction_key,dimension_key,work_type,priority,payload)
  select j.id,j.jurisdiction_key,j.dimension_key,p_work_type,
         case
           when j.dimension_key in ('regulatory_status','regulatory_tier','access_rules','commercial_activity') then 500
           else 100
         end,
         jsonb_build_object('contract_version',j.contract_version)
  from public.jurisdiction_data_depth_capture_jobs j
  where j.status in ('queued','needs_review')
    and not exists (
      select 1 from public.jurisdiction_data_depth_work_items w
      where w.capture_job_id=j.id and w.work_type=p_work_type
        and w.status in ('queued','leased','retry')
    )
  order by
    case when j.dimension_key in ('regulatory_status','regulatory_tier','access_rules','commercial_activity') then 0 else 1 end,
    j.updated_at
  limit greatest(1,p_limit)
  on conflict do nothing;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function intelligence_ops.lease_full_depth_work(
  p_work_type text,
  p_worker_id text,
  p_limit integer default 8,
  p_lease_seconds integer default 300
) returns setof public.jurisdiction_data_depth_work_items
language plpgsql
security definer
set search_path = public, intelligence_ops, pg_catalog
as $$
begin
  return query
  with candidates as (
    select id
    from public.jurisdiction_data_depth_work_items
    where work_type=p_work_type
      and (
        (status in ('queued','retry') and available_at <= now())
        or (status='leased' and lease_until < now())
      )
    order by priority desc, available_at, created_at
    for update skip locked
    limit greatest(1,p_limit)
  )
  update public.jurisdiction_data_depth_work_items w
  set status='leased',
      claimed_at=now(),
      lease_until=now() + make_interval(secs=>greatest(30,p_lease_seconds)),
      attempts=attempts+1,
      worker_id=p_worker_id,
      updated_at=now()
  from candidates c
  where w.id=c.id
  returning w.*;
end;
$$;

create or replace function intelligence_ops.requeue_expired_full_depth_work()
returns integer
language plpgsql
security definer
set search_path = public, intelligence_ops, pg_catalog
as $$
declare v_count integer;
begin
  update public.jurisdiction_data_depth_work_items
  set status=case when attempts >= max_attempts then 'dead_letter' else 'retry' end,
      available_at=now() + make_interval(secs=>least(3600, greatest(30, 15 * (2 ^ least(attempts,6))))),
      last_error=coalesce(last_error,'lease expired'),
      updated_at=now()
  where status='leased' and lease_until < now();
  get diagnostics v_count=row_count;
  return v_count;
end;
$$;

create or replace function intelligence_ops.full_depth_health()
returns jsonb
language sql
security definer
set search_path = public, intelligence_ops, pg_catalog
as $$
select jsonb_build_object(
  'matrix_cells', (select count(*) from public.jurisdiction_data_depth_dimension_state),
  'jobs', (select jsonb_object_agg(status,n) from (select status,count(*) n from public.jurisdiction_data_depth_capture_jobs group by status) s),
  'verified_evidence', (select count(*) from public.jurisdiction_data_depth_evidence where verification_status='verified'),
  'accepted_candidates', (select count(*) from public.jurisdiction_data_depth_extraction_candidates where status='accepted'),
  'bound_cells', (select count(*) from public.jurisdiction_data_depth_authority_bindings where binding_status='bound'),
  'work_items', (select jsonb_object_agg(status,n) from (select status,count(*) n from public.jurisdiction_data_depth_work_items group by status) s),
  'timestamp', now()
);
$$;

revoke all on function intelligence_ops.enqueue_full_depth_work(text,integer) from public, anon, authenticated;
revoke all on function intelligence_ops.lease_full_depth_work(text,text,integer,integer) from public, anon, authenticated;
revoke all on function intelligence_ops.requeue_expired_full_depth_work() from public, anon, authenticated;
revoke all on function intelligence_ops.full_depth_health() from public, anon, authenticated;

alter table public.jurisdiction_data_depth_source_candidates enable row level security;
alter table public.jurisdiction_data_depth_document_chunks enable row level security;
alter table public.jurisdiction_data_depth_work_items enable row level security;
alter table public.jurisdiction_data_depth_fact_versions enable row level security;
alter table public.jurisdiction_data_depth_refresh_policies enable row level security;

create policy fd_source_candidates_read on public.jurisdiction_data_depth_source_candidates
for select to authenticated using (true);
create policy fd_chunks_read on public.jurisdiction_data_depth_document_chunks
for select to authenticated using (true);
create policy fd_work_read on public.jurisdiction_data_depth_work_items
for select to authenticated using (true);
create policy fd_facts_read on public.jurisdiction_data_depth_fact_versions
for select to authenticated using (true);
create policy fd_refresh_read on public.jurisdiction_data_depth_refresh_policies
for select to authenticated using (true);
