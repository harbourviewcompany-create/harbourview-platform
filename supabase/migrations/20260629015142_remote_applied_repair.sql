-- Restore the exact production-owned body for migration 20260629015142.
-- The previous local reconciliation stub omitted the enum and source-registry
-- foundations required by the immediately following discovery-table migration.

begin;

create extension if not exists pgcrypto;

create type public.source_status as enum (
  'candidate',
  'approved',
  'paused',
  'blocked',
  'retired'
);

create type public.source_kind as enum (
  'regulator',
  'ministry',
  'parliament',
  'court',
  'municipality',
  'registry',
  'dataset',
  'company',
  'exchange_filing',
  'trade_media',
  'industry_association',
  'standards_body',
  'scientific',
  'other'
);

create table public.source_groups (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.discovery_sources (
  id uuid primary key default gen_random_uuid(),
  source_group_id uuid references public.source_groups(id) on delete set null,
  status public.source_status not null default 'approved',
  kind public.source_kind not null,
  name text not null,
  canonical_url text not null unique,
  base_domain text not null,
  country_code text,
  region_code text,
  municipality_name text,
  jurisdiction_label text,
  language_codes text[] not null default '{}',
  access_method text not null default 'html',
  parser_key text,
  trust_score numeric(5,2) not null default 0,
  priority_score numeric(5,2) not null default 0,
  freshness_score numeric(5,2) not null default 0,
  commercial_relevance_score numeric(5,2) not null default 0,
  source_depth_tier integer not null default 1,
  last_seen_at timestamptz,
  last_fetched_at timestamptz,
  next_fetch_at timestamptz,
  fetch_interval_minutes integer,
  requires_auth boolean not null default false,
  is_official boolean not null default false,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint discovery_sources_source_depth_tier_check check (source_depth_tier between 1 and 5)
);

create table public.watchlists (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  scope_type text not null,
  country_code text,
  region_code text,
  municipality_name text,
  enabled boolean not null default true,
  priority integer not null default 100,
  query_hints text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.source_watchlist_links (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.discovery_sources(id) on delete cascade,
  watchlist_id uuid not null references public.watchlists(id) on delete cascade,
  relation_type text not null default 'monitors',
  created_at timestamptz not null default now(),
  unique (source_id, watchlist_id, relation_type)
);

commit;
