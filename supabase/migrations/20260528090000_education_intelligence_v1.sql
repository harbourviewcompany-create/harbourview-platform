create type public.education_publication_state as enum (
  'draft',
  'source-review',
  'clinical-review',
  'legal-review',
  'approved',
  'request-only',
  'published',
  'archived'
);

create table if not exists public.education_tracks (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  audience_tags text[] not null default '{}',
  sensitivity text not null default 'standard',
  publication_state public.education_publication_state not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.education_modules (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.education_tracks(id) on delete cascade,
  slug text not null unique,
  title text not null,
  summary text not null,
  review_due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.education_articles (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.education_modules(id) on delete cascade,
  slug text not null unique,
  title text not null,
  public_summary text not null,
  source_basis text not null default 'draft',
  confidence_score numeric(4,2) not null default 0.5,
  reviewer_type text not null default 'internal',
  disclaimer_type text not null default 'education-only',
  publication_state public.education_publication_state not null default 'draft',
  last_reviewed_at timestamptz,
  next_review_due_at timestamptz,
  is_restricted boolean not null default false,
  country_applicability text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.education_article_sections (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.education_articles(id) on delete cascade,
  section_key text not null,
  section_title text not null,
  content text not null,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(article_id, section_key)
);

create table if not exists public.education_sources (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.education_articles(id) on delete cascade,
  source_title text not null,
  source_url text,
  source_basis text not null default 'pending-verification',
  snapshot_path text,
  contradictory_flag boolean not null default false,
  unresolved_issues text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.education_reviews (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.education_articles(id) on delete cascade,
  reviewer_category text not null,
  state public.education_publication_state not null,
  notes text,
  confidence_dispute boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.education_glossary_terms (
  id uuid primary key default gen_random_uuid(),
  term text not null unique,
  definition text not null,
  synonyms text[] not null default '{}',
  restricted_warning text,
  claim_sensitivity text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.education_country_briefs (
  id uuid primary key default gen_random_uuid(),
  country_code text not null unique,
  country_name text not null,
  readiness_label text not null,
  pathway_summary text not null,
  publication_state public.education_publication_state not null default 'draft',
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.education_requests (
  id uuid primary key default gen_random_uuid(),
  requester_name text not null,
  requester_email text not null,
  organization text,
  topic text not null,
  country_code text,
  sensitivity_detected text not null default 'standard',
  workflow_status text not null default 'queued',
  admin_assignment text,
  escalation_tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.education_audit_events (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  event_type text not null,
  actor text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.education_content_relationships (
  id uuid primary key default gen_random_uuid(),
  source_article_id uuid not null references public.education_articles(id) on delete cascade,
  target_article_id uuid not null references public.education_articles(id) on delete cascade,
  relationship_type text not null,
  created_at timestamptz not null default now(),
  unique(source_article_id, target_article_id, relationship_type)
);

create table if not exists public.education_publication_history (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.education_articles(id) on delete cascade,
  previous_state public.education_publication_state,
  next_state public.education_publication_state not null,
  changed_by text not null,
  reason text,
  created_at timestamptz not null default now()
);
