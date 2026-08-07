-- Restore the exact production-owned body for migration 20260629015153.
-- The previous local reconciliation stub made zero-state replay omit all
-- three discovery tables even though the production migration ledger owns
-- their creation.

begin;

create table public.source_candidates (
  id uuid primary key default gen_random_uuid(),
  discovered_from_source_id uuid references public.discovery_sources(id) on delete set null,
  discovered_from_document_url text,
  status public.source_status not null default 'candidate',
  kind public.source_kind,
  proposed_name text,
  proposed_url text not null,
  normalized_url text,
  base_domain text,
  country_code text,
  region_code text,
  municipality_name text,
  jurisdiction_label text,
  evidence_count integer not null default 1,
  recurrence_score numeric(5,2) not null default 0,
  novelty_score numeric(5,2) not null default 0,
  authority_score numeric(5,2) not null default 0,
  parseability_score numeric(5,2) not null default 0,
  commercial_relevance_score numeric(5,2) not null default 0,
  aggregate_score numeric(5,2) not null default 0,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  review_required boolean not null default true,
  rejection_reason text,
  merged_into_source_id uuid references public.discovery_sources(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (proposed_url)
);

create table public.link_observations (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.discovery_sources(id) on delete cascade,
  source_candidate_id uuid references public.source_candidates(id) on delete set null,
  document_url text,
  observed_url text not null,
  normalized_url text not null,
  anchor_text text,
  surrounding_text text,
  rel_flags text[] not null default '{}',
  http_hint integer,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  observation_count integer not null default 1
);

create table public.coverage_gaps (
  id uuid primary key default gen_random_uuid(),
  gap_type text not null,
  country_code text,
  region_code text,
  municipality_name text,
  entity_type text,
  label text not null,
  severity_score numeric(5,2) not null default 0,
  strategic_score numeric(5,2) not null default 0,
  discovered_reason text,
  resolved_at timestamptz,
  resolved_by_source_id uuid references public.discovery_sources(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

commit;
