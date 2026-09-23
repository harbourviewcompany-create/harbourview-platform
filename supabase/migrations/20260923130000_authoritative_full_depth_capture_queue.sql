-- Full-depth authoritative evidence capture queue.
-- Creates a durable, auditable work queue for all 9,312 jurisdiction x dimension cells.
-- No cell is marked complete without a qualifying source snapshot and verified extraction.

create table if not exists public.jurisdiction_data_depth_capture_jobs (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_key text not null references public.countries(iso_alpha2) on update cascade on delete cascade,
  dimension_key text not null references public.jurisdiction_data_depth_dimensions(dimension_key) on update cascade on delete cascade,
  status text not null default 'queued' check (status in ('queued','capturing','captured','needs_review','complete','blocked')),
  source_registry_id uuid references public.source_registry(id) on delete set null,
  source_snapshot_id uuid references public.source_snapshots(id) on delete set null,
  attempts integer not null default 0,
  last_error text,
  extracted_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(jurisdiction_key, dimension_key)
);

create index if not exists jurisdiction_data_depth_capture_jobs_status_idx
  on public.jurisdiction_data_depth_capture_jobs(status, updated_at);

create index if not exists jurisdiction_data_depth_capture_jobs_source_idx
  on public.jurisdiction_data_depth_capture_jobs(source_registry_id);

insert into public.jurisdiction_data_depth_capture_jobs(jurisdiction_key,dimension_key)
select c.iso_alpha2,d.dimension_key
from public.countries c
cross join public.jurisdiction_data_depth_dimensions d
where c.iso_alpha2 is not null
  and d.contract_version='2026-09-22.v1'
on conflict (jurisdiction_key,dimension_key) do nothing;

create or replace view public.v_jurisdiction_data_depth_capture_status
with (security_invoker=on) as
select
  count(*)::bigint total_jobs,
  count(*) filter(where status='queued')::bigint queued,
  count(*) filter(where status='capturing')::bigint capturing,
  count(*) filter(where status='captured')::bigint captured,
  count(*) filter(where status='needs_review')::bigint needs_review,
  count(*) filter(where status='complete')::bigint complete,
  count(*) filter(where status='blocked')::bigint blocked,
  count(*) filter(where status in ('queued','capturing','captured','needs_review','blocked'))::bigint unresolved
from public.jurisdiction_data_depth_capture_jobs;

create or replace view public.v_jurisdiction_data_depth_capture_gaps
with (security_invoker=on) as
select j.jurisdiction_key,j.dimension_key,j.status,j.attempts,j.last_error,
       j.source_registry_id,j.source_snapshot_id
from public.jurisdiction_data_depth_capture_jobs j
where j.status <> 'complete';

alter table public.jurisdiction_data_depth_capture_jobs enable row level security;
drop policy if exists jurisdiction_data_depth_capture_jobs_read on public.jurisdiction_data_depth_capture_jobs;
create policy jurisdiction_data_depth_capture_jobs_read
on public.jurisdiction_data_depth_capture_jobs
for select to authenticated using (true);
grant select on public.jurisdiction_data_depth_capture_jobs,
  public.v_jurisdiction_data_depth_capture_status,
  public.v_jurisdiction_data_depth_capture_gaps
to authenticated, service_role;

revoke insert,update,delete on public.jurisdiction_data_depth_capture_jobs from anon,authenticated;

comment on table public.jurisdiction_data_depth_capture_jobs is
'Authoritative evidence capture queue for the exact 291 x 32 full-depth contract. Queue state never implies evidence completeness.';
