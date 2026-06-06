-- Harbourview Supabase + Airtable integration foundation: base tables.
create table if not exists hv_core.app_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  account_id uuid,
  email text,
  display_name text,
  hv_role text not null default 'authenticated' check (hv_role in ('anon','authenticated','buyer','supplier','sponsor','educator','operator','admin','service_role')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hv_core.jurisdictions (
  id uuid primary key default gen_random_uuid(),
  airtable_record_id text unique not null,
  country_name text not null,
  iso_code text,
  region text,
  cannabis_market_status text,
  priority_tier text,
  notes_private text,
  verification_status text not null default 'pending',
  review_status text not null default 'pending',
  public_visibility boolean not null default false,
  sensitivity text not null default 'internal' check (sensitivity in ('public','internal','confidential','restricted')),
  source_payload_hash text,
  unresolved_references jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hv_core.source_types (
  id uuid primary key default gen_random_uuid(),
  airtable_record_id text unique,
  name text not null unique,
  description text,
  public_visibility boolean not null default false,
  sensitivity text not null default 'internal' check (sensitivity in ('public','internal','confidential','restricted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hv_core.source_organizations (
  id uuid primary key default gen_random_uuid(),
  airtable_record_id text unique,
  name text not null,
  website_url text,
  jurisdiction_id uuid references hv_core.jurisdictions(id),
  public_visibility boolean not null default false,
  sensitivity text not null default 'internal' check (sensitivity in ('public','internal','confidential','restricted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hv_core.sources (
  id uuid primary key default gen_random_uuid(),
  airtable_record_id text unique not null,
  source_name text not null,
  source_url text,
  normalized_url text,
  dedupe_key text,
  country_text text,
  source_type_text text,
  organization_text text,
  jurisdiction_level text,
  jurisdiction_id uuid references hv_core.jurisdictions(id),
  source_type_id uuid references hv_core.source_types(id),
  organization_id uuid references hv_core.source_organizations(id),
  verification_status text not null default 'pending',
  confidence_score numeric,
  commercial_relevance text,
  last_checked date,
  import_batch_id text,
  raw_row_id text,
  raw_source_file text,
  notes_private text,
  public_visibility boolean not null default false,
  sensitivity text not null default 'internal' check (sensitivity in ('public','internal','confidential','restricted')),
  source_payload_hash text,
  unresolved_references jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hv_core.market_signals (
  id uuid primary key default gen_random_uuid(),
  airtable_record_id text unique,
  jurisdiction_id uuid references hv_core.jurisdictions(id),
  title text not null,
  summary_public text,
  summary_private text,
  signal_type text,
  verification_status text not null default 'pending',
  review_status text not null default 'pending',
  public_visibility boolean not null default false,
  sensitivity text not null default 'internal' check (sensitivity in ('public','internal','confidential','restricted')),
  source_id uuid references hv_core.sources(id),
  source_payload_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hv_private.verification_queue (
  id uuid primary key default gen_random_uuid(),
  airtable_record_id text unique not null,
  destination_table text not null,
  destination_record_id uuid,
  queue_status text not null default 'pending',
  review_notes_private text,
  operator_comments text,
  sensitivity text not null default 'confidential' check (sensitivity in ('internal','confidential','restricted')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hv_private.rejected_records (
  id uuid primary key default gen_random_uuid(),
  airtable_record_id text unique,
  source_table text not null,
  rejection_reason text not null,
  raw_payload jsonb not null default '{}'::jsonb,
  operator_notes_private text,
  created_at timestamptz not null default now()
);

create table if not exists hv_private.evidence_items (
  id uuid primary key default gen_random_uuid(),
  airtable_record_id text unique not null,
  source_id uuid references hv_core.sources(id),
  claim_table text,
  claim_record_id uuid,
  evidence_type text,
  evidence_url text,
  evidence_title text,
  evidence_notes_private text,
  verification_status text not null default 'pending',
  review_status text not null default 'pending',
  public_summary text,
  public_visibility boolean not null default false,
  sensitivity text not null default 'internal' check (sensitivity in ('public','internal','confidential','restricted')),
  source_payload_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hv_commercial.companies (
  id uuid primary key default gen_random_uuid(),
  airtable_record_id text unique,
  account_id uuid,
  company_name text not null,
  normalized_website_domain text,
  website_url text,
  country_code text,
  company_type text,
  verification_status text not null default 'pending',
  review_status text not null default 'pending',
  private_notes text,
  internal_score numeric,
  source_payload_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hv_commercial.people (
  id uuid primary key default gen_random_uuid(),
  airtable_record_id text unique,
  company_id uuid references hv_commercial.companies(id),
  account_id uuid,
  full_name text not null,
  email text,
  title text,
  verification_status text not null default 'pending',
  review_status text not null default 'pending',
  private_notes text,
  source_payload_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hv_commercial.offers (
  id uuid primary key default gen_random_uuid(),
  airtable_record_id text unique,
  offer_id text unique,
  company_id uuid references hv_commercial.companies(id),
  account_id uuid,
  title text not null,
  description_public text,
  description_private text,
  category text,
  ready_to_sell text not null default 'NO' check (ready_to_sell in ('YES','NO')),
  public_visibility boolean not null default false,
  verification_status text not null default 'pending',
  review_status text not null default 'pending',
  sensitivity text not null default 'internal' check (sensitivity in ('public','internal','confidential','restricted')),
  private_notes text,
  internal_score numeric,
  source_payload_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hv_commercial.opportunities (
  id uuid primary key default gen_random_uuid(),
  airtable_record_id text unique,
  opportunity_id text unique,
  company_id uuid references hv_commercial.companies(id),
  account_id uuid,
  title text not null,
  summary_public text,
  summary_private text,
  status text not null default 'private_review',
  public_visibility boolean not null default false,
  verification_status text not null default 'pending',
  review_status text not null default 'pending',
  private_notes text,
  internal_score numeric,
  source_payload_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hv_marketplace.listings (
  id uuid primary key default gen_random_uuid(),
  airtable_record_id text unique,
  account_id uuid,
  company_id uuid references hv_commercial.companies(id),
  title text not null,
  description_public text,
  description_private text,
  category text,
  price_public text,
  country_code text,
  verification_status text not null default 'pending',
  review_status text not null default 'pending',
  public_visibility boolean not null default false,
  sensitivity text not null default 'internal' check (sensitivity in ('public','internal','confidential','restricted')),
  private_notes text,
  internal_score numeric,
  source_payload_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hv_education.resources (
  id uuid primary key default gen_random_uuid(),
  airtable_record_id text unique,
  title text not null,
  summary_public text,
  content_public text,
  notes_private text,
  source_id uuid references hv_core.sources(id),
  evidence_id uuid references hv_private.evidence_items(id),
  verified_evidence boolean not null default false,
  claim_review_status text not null default 'pending',
  public_visibility boolean not null default false,
  sensitivity text not null default 'internal' check (sensitivity in ('public','internal','confidential','restricted')),
  source_payload_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hv_sync.airtable_sync_log (
  id uuid primary key default gen_random_uuid(),
  log_id text unique not null,
  mode text not null,
  base_id text not null,
  status text not null,
  tables text[] not null default '{}',
  dry_run boolean not null default true,
  writeback_requested boolean not null default false,
  summary jsonb not null default '{}'::jsonb,
  errors jsonb not null default '[]'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists hv_audit.action_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_role text,
  action text not null,
  target_schema text,
  target_table text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists hv_search.search_documents (
  id uuid primary key default gen_random_uuid(),
  source_schema text not null,
  source_table text not null,
  source_id uuid not null,
  title text not null,
  body_public text,
  body_private text,
  visibility text not null default 'private' check (visibility in ('public','private','operator')),
  verification_status text not null default 'pending',
  review_status text not null default 'pending',
  embedding vector(1536),
  search_tsv tsvector generated always as (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(body_public,''))) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_schema, source_table, source_id)
);
