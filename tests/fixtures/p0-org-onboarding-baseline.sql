-- Isolated Supabase baseline for the P0 organization-onboarding E2E gate.
-- This is test-only schema setup. The production P0 migration is copied and
-- applied after this file by the workflow so invitation/RLS behavior comes
-- from the real migration under test.

create extension if not exists pgcrypto;
create schema if not exists api;

grant usage on schema public, api to anon, authenticated, service_role;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  legal_name text,
  trade_name text,
  org_type text,
  jurisdiction_country text,
  jurisdiction_region text,
  verification_status text not null default 'unverified',
  is_public boolean not null default false,
  settings jsonb not null default '{}'::jsonb,
  status text not null default 'active'
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'viewer',
  status text not null default 'active',
  invited_by uuid references auth.users(id),
  invited_at timestamptz,
  joined_at timestamptz,
  primary key (workspace_id, user_id)
);

create table if not exists public.user_dashboard_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  country_iso2 text,
  role_id text,
  heatmap_layer text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_dashboard_preferences enable row level security;

create policy "Users can read their own dashboard preferences"
  on public.user_dashboard_preferences for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own dashboard preferences"
  on public.user_dashboard_preferences for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own dashboard preferences"
  on public.user_dashboard_preferences for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table if not exists public.hv_passports (
  org_id uuid primary key references public.workspaces(id) on delete cascade,
  verification_level text,
  completeness_band text,
  recall_exposure_flag boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.hv_licences (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.workspaces(id) on delete cascade,
  licence_number text,
  licence_type text,
  jurisdiction_country text,
  status text,
  verified boolean not null default false,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid,
  action text not null,
  actor text,
  actor_user_id uuid,
  actor_org_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Empty source tables used by the dashboard loader. Missing coverage should
-- remain an ordinary empty/degraded state rather than preventing Command from
-- rendering during the organization workflow.
create table if not exists api.talent_jobs_public (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  department text,
  location text,
  operator_name text,
  operator_verification_status text,
  created_at timestamptz not null default now()
);

create table if not exists api.hv_professionals (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  title text,
  credential_type text,
  specialties text[] not null default '{}',
  countries text[] not null default '{}',
  institution text,
  accepts_referrals boolean not null default false,
  consultation_available boolean not null default false,
  bio_public text,
  verification_status text not null default 'verified',
  status text not null default 'active'
);

create table if not exists api.daily_digest (
  digest_date date primary key,
  headlines jsonb not null default '[]'::jsonb,
  editorial_headlines jsonb not null default '[]'::jsonb,
  generated_at timestamptz not null default now(),
  status text not null default 'draft'
);

create table if not exists api.signals (
  id uuid primary key default gen_random_uuid(),
  headline text not null default '',
  cat text,
  top_lane text,
  pri text,
  country text,
  date timestamptz,
  created_at timestamptz not null default now(),
  reviewed boolean not null default false,
  action text,
  analysis jsonb,
  quality_label text,
  quality_confidence numeric,
  content_type text,
  impact text,
  title_en text,
  summary_en text,
  lang_detected text,
  is_representative boolean,
  cluster_rep_id uuid
);

create or replace view api.signals_with_quality as select * from api.signals;

create table if not exists api.market_metrics (
  id uuid primary key default gen_random_uuid(),
  country_iso2 text,
  metric_name text,
  metric_value numeric,
  metric_unit text,
  source_name text,
  source_url text,
  source_date date
);

create table if not exists api.deal_rooms (
  id uuid primary key default gen_random_uuid(),
  title text,
  listing_ref text,
  status text,
  updated_at timestamptz not null default now(),
  initiator_id uuid,
  counterparty_id uuid
);

create table if not exists api.marketplace_candidates (
  id uuid primary key default gen_random_uuid(),
  title_public_draft text,
  marketplace_category text,
  listing_type text,
  status text,
  created_at timestamptz not null default now(),
  country text,
  submitted_by uuid,
  submission_source text
);

create table if not exists public.marketplace_public_listings_v1 (
  id uuid primary key,
  slug text,
  title text not null,
  description text not null,
  category text not null,
  subcategory text,
  marketplace_section text not null,
  product_type text,
  region text not null,
  condition text,
  location_country text,
  location_region text,
  price_amount numeric,
  price_currency text not null,
  price_display text,
  seller_type text not null,
  is_featured boolean not null default false,
  high_level_specs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  average_rating numeric,
  review_count integer
);

-- Existing API contracts present before the P0 migration.
create or replace view api.workspaces
with (security_invoker = true) as
select
  id, name, slug, legal_name, trade_name, org_type,
  jurisdiction_country, jurisdiction_region, verification_status,
  is_public, settings, status
from public.workspaces;

create or replace view api.workspace_members
with (security_invoker = true) as
select workspace_id, user_id, role, status, invited_by, invited_at, joined_at
from public.workspace_members;

create or replace view api.user_dashboard_preferences
with (security_invoker = true) as
select id, user_id, country_iso2, role_id, heatmap_layer, created_at, updated_at
from public.user_dashboard_preferences;

create or replace view api.hv_passports
with (security_invoker = true) as
select org_id, verification_level, completeness_band, recall_exposure_flag, created_at
from public.hv_passports;

create or replace view api.hv_licences
with (security_invoker = true) as
select id, org_id, licence_number, licence_type, jurisdiction_country, status, verified, expires_at, created_at
from public.hv_licences;

create or replace view api.audit_events
with (security_invoker = true) as
select id, entity_type, entity_id, action, actor, actor_user_id, actor_org_id, metadata, created_at
from public.audit_events;

grant select on public.workspaces, public.workspace_members to authenticated;
grant select, insert, update, delete on public.user_dashboard_preferences to authenticated;
grant all on public.workspaces, public.workspace_members, public.user_dashboard_preferences, public.hv_passports, public.hv_licences, public.audit_events to service_role;

grant select on api.workspaces, api.workspace_members, api.user_dashboard_preferences to authenticated;
grant select, insert, update, delete on api.user_dashboard_preferences to authenticated;
grant select, insert, update, delete on api.workspaces, api.workspace_members, api.user_dashboard_preferences, api.hv_passports, api.hv_licences, api.audit_events to service_role;

grant select on all tables in schema api to anon, authenticated, service_role;
grant insert, update, delete on api.talent_jobs_public, api.hv_professionals, api.daily_digest, api.signals, api.market_metrics, api.deal_rooms, api.marketplace_candidates to service_role;
grant select on public.marketplace_public_listings_v1 to anon, authenticated, service_role;
