create or replace function public.is_hv_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from user_roles
    where user_roles.user_id = auth.uid()
      and user_roles.role in ('admin', 'operator', 'analyst')
  );
$$;

revoke all on function public.is_hv_staff() from public, authenticated;
grant execute on function public.is_hv_staff() to service_role;

create table if not exists public.crawl_domain_circuit_state (
  domain text primary key,
  consecutive_failures int not null default 0,
  locked_until timestamptz,
  last_failure_at timestamptz,
  last_success_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.crawl_domain_circuit_state enable row level security;

drop policy if exists crawl_domain_circuit_state_staff_read on public.crawl_domain_circuit_state;
create policy crawl_domain_circuit_state_staff_read on public.crawl_domain_circuit_state
  for select using (is_hv_staff());

create index if not exists idx_crawl_domain_circuit_state_locked
  on public.crawl_domain_circuit_state (locked_until)
  where locked_until is not null;

create table if not exists public.worker_heartbeats (
  worker_id text primary key,
  status text not null default 'starting',
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  targets_processed_total bigint not null default 0,
  last_error text,
  updated_at timestamptz not null default now()
);

alter table public.worker_heartbeats enable row level security;

drop policy if exists worker_heartbeats_staff_read on public.worker_heartbeats;
create policy worker_heartbeats_staff_read on public.worker_heartbeats
  for select using (is_hv_staff());
