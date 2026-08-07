-- Restore the exact production-owned body for migration 20260629015202.
-- The previous local reconciliation stub omitted the collection foundations
-- required by the immediately following intelligence-table migration.

begin;

create type public.fetch_status as enum (
  'queued',
  'claimed',
  'succeeded',
  'failed',
  'skipped',
  'dead'
);

create table public.source_fetch_jobs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.discovery_sources(id) on delete cascade,
  priority integer not null default 100,
  scheduled_for timestamptz not null,
  available_at timestamptz not null default now(),
  claimed_at timestamptz,
  claimed_by text,
  attempts integer not null default 0,
  max_attempts integer not null default 5,
  status public.fetch_status not null default 'queued',
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.source_fetch_runs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.discovery_sources(id) on delete cascade,
  job_id uuid references public.source_fetch_jobs(id) on delete set null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status public.fetch_status not null,
  http_status integer,
  response_time_ms integer,
  content_type text,
  content_length bigint,
  content_hash text,
  etag text,
  last_modified text,
  fetched_url text,
  final_url text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb
);

create table public.discovery_documents (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.discovery_sources(id) on delete cascade,
  fetch_run_id uuid references public.source_fetch_runs(id) on delete set null,
  document_url text not null,
  normalized_url text not null,
  title text,
  language_code text,
  mime_type text,
  published_at timestamptz,
  observed_at timestamptz not null default now(),
  raw_storage_path text,
  extracted_text text,
  text_hash text,
  extraction_version text,
  parser_key text,
  is_changed boolean not null default true,
  metadata jsonb not null default '{}'::jsonb
);

commit;
