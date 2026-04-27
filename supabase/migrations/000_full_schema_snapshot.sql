-- =============================================================================
-- FILE: supabase/migrations/000_full_schema_snapshot.sql
-- PURPOSE: Compiled schema snapshot — NOT a live pg_dump
--
-- This file is assembled from repo migration files (0001–0012 + hardening).
-- It represents the intended schema. The live database at
-- tpfvhhrwzsofhdcfdenc has 49 applied migrations as of 2026-04-26,
-- which may include migrations not present in this repo.
--
-- DO NOT apply this file to a live database. Use the individual migration
-- files in order, or the Supabase dashboard migration history.
--
-- To get the true live schema: Supabase dashboard →
--   tpfvhhrwzsofhdcfdenc → Database → Backups → Schema dump
-- =============================================================================

-- SOURCE: migrations/APPLY_ALL.sql (0001–0012)
-- SOURCE: supabase/migrations/20260424_security_hardening.sql

-- ── Extensions ────────────────────────────────────────────────────────────────
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- ── Enums ─────────────────────────────────────────────────────────────────────
do $$ begin
  create type public.platform_role as enum ('admin', 'analyst', 'client');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.source_tier as enum (
    'company_primary', 'company_secondary', 'regulatory', 'media',
    'industry_report', 'government', 'ngo', 'other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.workspace_role as enum ('owner', 'editor', 'viewer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.signal_review_status as enum (
    'draft', 'in_review', 'approved', 'rejected', 'returned'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.dossier_status as enum (
    'draft', 'published', 'archived', 'superseded'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.publish_event_status as enum (
    'pending', 'completed', 'revoked'
  );
exception when duplicate_object then null; end $$;

-- ── Core tables ────────────────────────────────────────────────────────────────
-- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  platform_role public.platform_role not null default 'analyst',
  default_workspace_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- workspaces
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  is_internal boolean not null default true,
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- workspace_members
create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  workspace_role public.workspace_role not null default 'viewer',
  created_at timestamptz not null default now(),
  unique (workspace_id, profile_id)
);

-- sources
create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete restrict,
  name text not null,
  canonical_url text,
  domain text,
  source_tier public.source_tier not null,
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  jurisdiction text,
  entity_type text,
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- source_documents
create table if not exists public.source_documents (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources(id) on delete cascade,
  title text not null,
  url text not null,
  status text not null default 'captured' check (status in ('captured', 'reviewed', 'archived')),
  publication_date date,
  captured_at timestamptz,
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- signals
create table if not exists public.signals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  signal_type text not null,
  jurisdiction text,
  event_date date,
  entity_name text,
  entity_org text,
  data_class text not null default 'observed'
    check (data_class in ('observed', 'inferred', 'unverified')),
  confidence_level text not null default 'medium'
    check (confidence_level in ('high', 'medium', 'low')),
  review_status public.signal_review_status not null default 'draft',
  visibility_scope text not null default 'internal'
    check (visibility_scope in ('internal', 'workspace', 'published')),
  internal_notes text,
  analyst_notes text,
  analyst_interpretation text,
  source_id uuid references public.sources(id) on delete set null,
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  updated_by_profile_id uuid references public.profiles(id) on delete set null,
  submitted_by_profile_id uuid references public.profiles(id) on delete set null,
  submitted_at timestamptz,
  reviewed_by_profile_id uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- signal_evidence
create table if not exists public.signal_evidence (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid not null references public.signals(id) on delete cascade,
  source_document_id uuid references public.source_documents(id) on delete set null,
  evidence_type text not null,
  evidence_source_type text not null default 'human'
    check (evidence_source_type in ('human', 'ai_assisted')),
  evidence_text text not null,
  citation_reference text,
  analyst_interpretation text,
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- review_queue_items
create table if not exists public.review_queue_items (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid not null references public.signals(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'under_review', 'approved', 'rejected', 'returned')),
  assigned_to_profile_id uuid references public.profiles(id) on delete set null,
  submitted_by_profile_id uuid references public.profiles(id) on delete set null,
  reviewer_notes text,
  rejection_reason text,
  return_reason text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- dossiers
create table if not exists public.dossiers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete restrict,
  title text not null,
  summary text,
  jurisdiction text,
  status public.dossier_status not null default 'draft',
  version_number integer not null default 1,
  internal_notes text,
  published_at timestamptz,
  effective_at timestamptz,
  published_by_profile_id uuid references public.profiles(id) on delete set null,
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  updated_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- dossier_items
create table if not exists public.dossier_items (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.dossiers(id) on delete cascade,
  signal_id uuid not null references public.signals(id) on delete restrict,
  display_order integer not null default 0,
  item_notes text,
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (dossier_id, signal_id)
);

-- publish_events
create table if not exists public.publish_events (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.dossiers(id) on delete restrict,
  workspace_id uuid not null references public.workspaces(id) on delete restrict,
  status public.publish_event_status not null default 'completed',
  published_by_profile_id uuid references public.profiles(id) on delete set null,
  snapshot_json jsonb not null,
  api_token text,
  revokes_event_id uuid references public.publish_events(id) on delete restrict,
  revoke_reason text,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

-- audit_events
create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  action_type text not null,
  performed_by_profile_id uuid references public.profiles(id) on delete set null,
  from_status text,
  to_status text,
  change_summary text,
  workspace_id uuid references public.workspaces(id) on delete set null,
  created_at timestamptz not null default now()
);

-- public_feed_tokens (added in 20260424_security_hardening.sql)
create table if not exists public.public_feed_tokens (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete restrict,
  publish_event_id uuid references public.publish_events(id) on delete restrict,
  token_hash text not null unique,
  status text not null default 'active' check (status in ('active', 'revoked', 'expired')),
  snapshot jsonb not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  revoked_by_profile_id uuid references public.profiles(id) on delete set null,
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint public_feed_tokens_hash_shape check (token_hash ~ '^[a-f0-9]{64}$'),
  constraint public_feed_tokens_revoked_consistency check (
    (status = 'revoked' and revoked_at is not null) or (status <> 'revoked')
  )
);

-- public_feed_token_access_events
create table if not exists public.public_feed_token_access_events (
  id uuid primary key default gen_random_uuid(),
  public_feed_token_id uuid not null
    references public.public_feed_tokens(id) on delete cascade,
  accessed_at timestamptz not null default now(),
  ip_hash text,
  user_agent text
);
