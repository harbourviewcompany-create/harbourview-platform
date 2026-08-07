-- Daily public digest: headlines table + signal usage tracking + async job tracking

alter table ia_signals add column if not exists used_in_digest_at timestamptz;

create table if not exists daily_digest (
  id uuid primary key default gen_random_uuid(),
  digest_date date not null unique,
  headlines jsonb not null default '[]'::jsonb,
  markets text[] not null default '{}',
  status text not null default 'published' check (status in ('draft','published')),
  generated_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table daily_digest enable row level security;

create policy "daily_digest_public_read" on daily_digest
  for select
  to anon, authenticated
  using (status = 'published');

-- no insert/update/delete policies: writes are service-role / SECURITY DEFINER function only

create table if not exists _digest_jobs (
  request_id bigint primary key,
  digest_date date not null,
  signal_ids text[] not null,
  collected boolean not null default false,
  created_at timestamptz not null default now()
);
