create extension if not exists pgcrypto;

create table if not exists public.source_registry (
  id uuid primary key default gen_random_uuid(),
  source_key text not null unique,
  category text not null check (category in ('used-surplus')),
  name text not null,
  source_url text not null,
  parser_type text not null default 'manual-html',
  status text not null default 'needs-review' check (status in ('enabled', 'disabled', 'needs-review')),
  cadence_hours integer not null default 24 check (cadence_hours > 0),
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.source_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.source_registry(id) on delete cascade,
  snapshot_hash text not null,
  fetched_at timestamptz not null default now(),
  http_status integer,
  raw_payload text,
  metadata jsonb not null default '{}'::jsonb,
  unique (source_id, snapshot_hash)
);

create table if not exists public.used_surplus_candidates (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.source_registry(id) on delete set null,
  snapshot_id uuid references public.source_snapshots(id) on delete set null,
  candidate_hash text not null unique,
  title text not null,
  description text not null,
  price text,
  currency text,
  location text,
  condition text not null default 'used' check (condition in ('used', 'refurbished', 'surplus')),
  tags text[] not null default array[]::text[],
  image_url text,
  image_alt text,
  image_status text check (image_status in ('representative', 'supplier-provided', 'verified')),
  image_attribution text,
  image_allowed_use boolean not null default false,
  image_reviewed_at timestamptz,
  discovered_at timestamptz not null default now(),
  expires_at timestamptz,
  review_status text not null default 'pending' check (review_status in ('pending', 'approved', 'rejected')),
  publication_status text not null default 'private' check (publication_status in ('private', 'published', 'unpublished')),
  confidence numeric(4,3) not null default 0,
  raw_candidate jsonb not null default '{}'::jsonb,
  internal_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.candidate_review_events (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.used_surplus_candidates(id) on delete cascade,
  actor_id uuid,
  event_type text not null check (event_type in ('created', 'approved', 'rejected', 'published', 'unpublished', 'expired', 'note')),
  note text,
  created_at timestamptz not null default now()
);

alter table public.source_registry enable row level security;
alter table public.source_snapshots enable row level security;
alter table public.used_surplus_candidates enable row level security;
alter table public.candidate_review_events enable row level security;

create or replace function public.harbourview_is_admin_or_operator()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role in ('admin', 'operator')
  );
$$;

create policy source_registry_admin_operator_select on public.source_registry
  for select using (public.harbourview_is_admin_or_operator());
create policy source_registry_admin_operator_write on public.source_registry
  for all using (public.harbourview_is_admin_or_operator())
  with check (public.harbourview_is_admin_or_operator());

create policy source_snapshots_admin_operator_select on public.source_snapshots
  for select using (public.harbourview_is_admin_or_operator());
create policy source_snapshots_admin_operator_write on public.source_snapshots
  for all using (public.harbourview_is_admin_or_operator())
  with check (public.harbourview_is_admin_or_operator());

create policy used_surplus_candidates_admin_operator_select on public.used_surplus_candidates
  for select using (public.harbourview_is_admin_or_operator());
create policy used_surplus_candidates_admin_operator_write on public.used_surplus_candidates
  for all using (public.harbourview_is_admin_or_operator())
  with check (public.harbourview_is_admin_or_operator());

create policy candidate_review_events_admin_operator_select on public.candidate_review_events
  for select using (public.harbourview_is_admin_or_operator());
create policy candidate_review_events_admin_operator_write on public.candidate_review_events
  for all using (public.harbourview_is_admin_or_operator())
  with check (public.harbourview_is_admin_or_operator());

create index if not exists idx_source_registry_category_status on public.source_registry(category, status);
create index if not exists idx_source_snapshots_source_hash on public.source_snapshots(source_id, snapshot_hash);
create index if not exists idx_used_surplus_candidates_public on public.used_surplus_candidates(review_status, publication_status, expires_at);
create index if not exists idx_used_surplus_candidates_hash on public.used_surplus_candidates(candidate_hash);
create index if not exists idx_candidate_review_events_candidate on public.candidate_review_events(candidate_id, created_at desc);
