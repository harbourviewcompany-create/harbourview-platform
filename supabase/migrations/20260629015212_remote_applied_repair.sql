-- Restore the exact production-owned body for migration 20260629015212.
-- The previous local reconciliation stub omitted the extracted intelligence
-- tables required by later numeric-type optimization and hardening migrations.

begin;

create table public.extracted_entities (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.discovery_documents(id) on delete cascade,
  entity_type text not null,
  canonical_name text not null,
  raw_name text not null,
  country_code text,
  region_code text,
  municipality_name text,
  confidence numeric(5,2) not null default 0,
  first_offset integer,
  last_offset integer,
  metadata jsonb not null default '{}'::jsonb
);

create table public.extracted_events (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.discovery_documents(id) on delete cascade,
  event_type text not null,
  event_label text not null,
  event_date timestamptz,
  country_code text,
  region_code text,
  municipality_name text,
  significance_score numeric(5,2) not null default 0,
  confidence numeric(5,2) not null default 0,
  metadata jsonb not null default '{}'::jsonb
);

create table public.extracted_citations (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.discovery_documents(id) on delete cascade,
  cited_url text,
  cited_title text,
  citation_kind text,
  confidence numeric(5,2) not null default 0,
  metadata jsonb not null default '{}'::jsonb
);

create table public.extraction_contradictions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.discovery_documents(id) on delete cascade,
  subject_type text not null,
  subject_key text not null,
  field_name text not null,
  previous_value text,
  new_value text,
  contradiction_score numeric(5,2) not null default 0,
  resolution_status text not null default 'open',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

commit;
