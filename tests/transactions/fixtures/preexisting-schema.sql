-- Minimal pre-existing Harbourview schema required to execute the additive transaction migrations in CI.
-- This is a disposable PostgreSQL test fixture only; it is never applied to Supabase production.
-- It deliberately includes the legacy Signal Engine entities table and broad marketplace grants so
-- the transaction migrations prove compatibility and public-boundary hardening rather than a greenfield replay.

create extension if not exists pgcrypto;
create schema if not exists auth;

do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
do $$ begin create role service_role nologin; exception when duplicate_object then null; end $$;

create or replace function auth.uid()
returns uuid
language sql
stable
as $$ select null::uuid $$;

create table auth.users (id uuid primary key default gen_random_uuid());

create type public.hv_classification as enum (
  'public','internal','confidential','restricted','legal_hold','personal_contact','source_protected','ai_advisory','quarantined','archived'
);

create table public.user_roles (
  user_id uuid not null,
  role text not null,
  created_at timestamptz default now(),
  created_by uuid
);
create table public.workspaces (id uuid primary key default gen_random_uuid());
create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id),
  user_id uuid not null,
  role text,
  status text not null default 'active'
);

create table public.hv_evidence (
  id uuid primary key default gen_random_uuid(),
  content_hash text,
  captured_at timestamptz default now(),
  classification public.hv_classification not null default 'internal'
);
create table public.hv_evidence_documents (id uuid primary key default gen_random_uuid());
create table public.hv_artifacts (id uuid primary key default gen_random_uuid());
create table public.product_formats (id uuid primary key default gen_random_uuid());

-- Legacy Signal Engine identity root from 20260430000001_signal_engine_schema.sql.
create table public.entities (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  name text not null,
  website text,
  domain text,
  country text,
  region text,
  verification_status text not null default 'unverified',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
insert into public.entities(id, entity_type, name, domain, country, verification_status)
values (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'company',
  'Legacy Signal Engine Entity',
  'legacy.example',
  'ca',
  'unverified'
);

create table public.signal_candidates (
  id uuid primary key default gen_random_uuid(),
  title text not null
);
create table public.signal_entity_mentions (
  id uuid primary key default gen_random_uuid(),
  signal_candidate_id uuid not null references public.signal_candidates(id) on delete cascade,
  entity_id uuid references public.entities(id) on delete set null,
  mentioned_name text not null
);
insert into public.signal_candidates(id,title)
values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Legacy signal');
insert into public.signal_entity_mentions(signal_candidate_id,entity_id,mentioned_name)
values (
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Legacy Signal Engine Entity'
);

create table public.cannabis_operators (id uuid primary key default gen_random_uuid());
create table public.ia_counterparties (id text primary key);
create table public.operator_licences (id uuid primary key default gen_random_uuid());
create table public.opportunities (id uuid primary key default gen_random_uuid());
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  title text,
  status text not null default 'pending_review'
);
create table public.buyer_requests (
  id uuid primary key default gen_random_uuid(),
  request_text text,
  status text not null default 'pending_review'
);
create table public.matches (id uuid primary key default gen_random_uuid());
create table public.deal_rooms (id uuid primary key default gen_random_uuid());
create table public.engagements (id uuid primary key default gen_random_uuid());
create table public.commissions (id uuid primary key default gen_random_uuid());

-- Model the broad legacy privileges observed on the connected project. Stage 6b must retain access
-- to pre-existing marketplace columns while excluding the new internal bridge columns.
grant select on public.entities to anon;
grant select, insert, update, delete on public.listings to anon, authenticated;
grant select, insert, update, delete on public.buyer_requests to anon, authenticated;

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  actor text not null default 'system',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  actor_user_id uuid,
  actor_org_id uuid,
  deal_room_id uuid,
  ip_address text,
  user_agent text
);
create table public.status_history (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  from_status text,
  to_status text not null,
  changed_by text not null default 'system',
  reason text,
  created_at timestamptz not null default now()
);
