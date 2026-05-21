-- CNA ingestion foundation
-- Official public source basis: May 19, 2026 INCB/UNODC email confirmation and UNODC CNA page/PDF.
-- Confidentiality posture: service-role/admin controlled ingestion tables, RLS enabled, no anon/authenticated read policies by default.

create extension if not exists pgcrypto;

create table if not exists public.cna_sources (
  id uuid primary key default gen_random_uuid(),
  source_key text not null unique,
  title text not null,
  source_type text not null check (source_type in ('unodc_cna_page', 'unodc_cna_pdf', 'derived_extract', 'manual_review')),
  authority_name text not null default 'United Nations Office on Drugs and Crime / International Narcotics Control Board Secretariat',
  canonical_url text not null,
  isbn text,
  publication_year integer,
  clearance_status text not null default 'source_cleared' check (clearance_status in ('source_cleared', 'restricted', 'needs_review')),
  clearance_basis text not null,
  clearance_evidence_date date,
  usage_boundary text not null default 'official public source; raw extraction/provenance remains private until explicitly DTO-redacted',
  is_active boolean not null default true,
  first_registered_at timestamptz not null default now(),
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cna_source_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.cna_sources(id) on delete cascade,
  snapshot_url text not null,
  fetched_at timestamptz not null default now(),
  fetch_status text not null check (fetch_status in ('registered', 'fetched', 'failed', 'unchanged', 'changed')),
  http_status integer,
  content_type text,
  content_length bigint,
  sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  storage_path text,
  parser_version text,
  extraction_status text not null default 'pending' check (extraction_status in ('pending', 'parsed', 'failed', 'manual_review')),
  extraction_notes text,
  created_at timestamptz not null default now(),
  unique (source_id, sha256)
);

create table if not exists public.cna_authority_records (
  id uuid primary key default gen_random_uuid(),
  country_iso2 text,
  country_iso3 text,
  country_name text not null,
  normalized_country_name text not null,
  authority_name text not null,
  normalized_authority_name text not null,
  authority_type text,
  city text,
  address_text text,
  email text,
  phone text,
  fax text,
  website_url text,
  contact_person text,
  dedupe_key text not null unique,
  source_id uuid not null references public.cna_sources(id),
  latest_snapshot_id uuid references public.cna_source_snapshots(id),
  review_status text not null default 'needs_review' check (review_status in ('needs_review', 'verified', 'suppressed', 'superseded')),
  public_release_status text not null default 'private' check (public_release_status in ('private', 'redacted_summary', 'approved_public')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cna_record_versions (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.cna_authority_records(id) on delete cascade,
  source_id uuid not null references public.cna_sources(id),
  snapshot_id uuid references public.cna_source_snapshots(id),
  version_number integer not null,
  source_page text,
  raw_record jsonb not null default '{}'::jsonb,
  normalized_record jsonb not null default '{}'::jsonb,
  extraction_confidence numeric(5,4) check (extraction_confidence is null or (extraction_confidence >= 0 and extraction_confidence <= 1)),
  change_type text not null default 'created' check (change_type in ('created', 'updated', 'unchanged', 'suppressed', 'manual_correction')),
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (record_id, version_number)
);

create table if not exists public.cna_ingestion_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('source_registered', 'source_checked', 'snapshot_created', 'parser_started', 'parser_completed', 'parser_failed', 'record_upserted', 'record_suppressed', 'manual_review')),
  source_id uuid references public.cna_sources(id),
  snapshot_id uuid references public.cna_source_snapshots(id),
  record_id uuid references public.cna_authority_records(id),
  actor text not null default 'system',
  severity text not null default 'info' check (severity in ('info', 'warning', 'error')),
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists cna_sources_active_idx on public.cna_sources (is_active, source_type);
create index if not exists cna_source_snapshots_source_fetched_idx on public.cna_source_snapshots (source_id, fetched_at desc);
create index if not exists cna_authority_records_country_idx on public.cna_authority_records (country_iso2, country_iso3, normalized_country_name);
create index if not exists cna_authority_records_review_idx on public.cna_authority_records (review_status, public_release_status);
create index if not exists cna_record_versions_record_idx on public.cna_record_versions (record_id, version_number desc);
create index if not exists cna_ingestion_events_created_idx on public.cna_ingestion_events (created_at desc, event_type);

alter table public.cna_sources enable row level security;
alter table public.cna_source_snapshots enable row level security;
alter table public.cna_authority_records enable row level security;
alter table public.cna_record_versions enable row level security;
alter table public.cna_ingestion_events enable row level security;

revoke all on table public.cna_sources from anon, authenticated;
revoke all on table public.cna_source_snapshots from anon, authenticated;
revoke all on table public.cna_authority_records from anon, authenticated;
revoke all on table public.cna_record_versions from anon, authenticated;
revoke all on table public.cna_ingestion_events from anon, authenticated;

comment on table public.cna_sources is 'Controlled registry of official CNA source endpoints and clearance evidence. RLS deny-by-default.';
comment on table public.cna_source_snapshots is 'Private source snapshot metadata and SHA-256 hashes for CNA source monitoring.';
comment on table public.cna_authority_records is 'Private normalized CNA authority records. Public surfaces must use redacted DTOs only.';
comment on table public.cna_record_versions is 'Private versioned raw and normalized CNA extraction payloads with provenance.';
comment on table public.cna_ingestion_events is 'Private audit log for CNA ingestion events.';
