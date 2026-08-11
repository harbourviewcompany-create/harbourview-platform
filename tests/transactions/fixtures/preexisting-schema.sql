-- Minimal pre-existing Harbourview schema required to execute the additive transaction migrations in CI.
-- This is a disposable PostgreSQL test fixture only; it is never applied to Supabase production.

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

create table public.cannabis_operators (id uuid primary key default gen_random_uuid());
create table public.ia_counterparties (id text primary key);
create table public.operator_licences (id uuid primary key default gen_random_uuid());
create table public.opportunities (id uuid primary key default gen_random_uuid());
create table public.listings (id uuid primary key default gen_random_uuid());
create table public.buyer_requests (id uuid primary key default gen_random_uuid());
create table public.matches (id uuid primary key default gen_random_uuid());
create table public.deal_rooms (id uuid primary key default gen_random_uuid());
create table public.engagements (id uuid primary key default gen_random_uuid());
create table public.commissions (id uuid primary key default gen_random_uuid());

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
