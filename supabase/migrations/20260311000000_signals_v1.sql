-- Signals V1 migration (operator-grade, RLS placeholder to be aligned with user_roles helper)
create schema if not exists signals;

create table if not exists signals.signals (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  headline text not null,
  signal_type text not null,
  review_status text not null default 'captured',
  public_safe boolean not null default false,
  publish_to_public boolean not null default false,
  signal_date date not null,
  country_name text,
  region text,
  regulator_name text,
  canonical_source_url text,
  public_summary text,
  public_implication text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table signals.signals enable row level security;

-- NOTE: Replace with existing user_roles-based policies before production
