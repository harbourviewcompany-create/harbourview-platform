create type education_publication_state as enum (
  'draft','source-review','clinical-review','legal-review','approved','request-only','published','archived'
);

create table if not exists public.education_tracks (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  audience text[] not null default '{}',
  sensitivity text not null default 'standard',
  publication_state education_publication_state not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.education_modules (
  id uuid primary key default gen_random_uuid(),
  track_id uuid references public.education_tracks(id) on delete cascade,
  slug text unique not null,
  title text not null,
  summary text not null default '',
  source_basis text not null default 'draft',
  review_status text not null default 'source-review',
  reviewer_type text,
  last_reviewed_at date,
  next_review_due_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.education_articles (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references public.education_modules(id) on delete cascade,
  slug text unique not null,
  title text not null,
  publication_state education_publication_state not null default 'draft',
  clinical_sensitivity boolean not null default false,
  medical_sensitivity boolean not null default false,
  disclaimer_type text not null default 'standard',
  source_confidence numeric(3,2) not null default 0.50,
  stale_review_status text not null default 'fresh',
  country_applicability text[] not null default '{}',
  restricted_language_flags text[] not null default '{}',
  public_summary text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.education_article_sections (
  id uuid primary key default gen_random_uuid(),
  article_id uuid references public.education_articles(id) on delete cascade,
  section_key text not null,
  heading text not null,
  body text not null,
  position int not null default 0
);

create table if not exists public.education_sources (
  id uuid primary key default gen_random_uuid(),
  article_id uuid references public.education_articles(id) on delete cascade,
  source_label text not null,
  source_basis text not null,
  source_url text,
  review_status text not null default 'pending-verification',
  reviewer_notes text,
  contradiction_flag boolean not null default false,
  confidence_dispute boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.education_reviews (
  id uuid primary key default gen_random_uuid(),
  article_id uuid references public.education_articles(id) on delete cascade,
  review_state education_publication_state not null,
  reviewer_category text not null,
  notes text not null default '',
  unresolved_issues text[] not null default '{}',
  reviewed_at timestamptz not null default now()
);

create table if not exists public.education_glossary_terms (
  id uuid primary key default gen_random_uuid(),
  term text unique not null,
  slug text unique not null,
  definition text not null,
  synonyms text[] not null default '{}',
  restricted_term_warning boolean not null default false,
  prohibited_wording_flags text[] not null default '{}',
  related_terms text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.education_country_briefs (
  id uuid primary key default gen_random_uuid(),
  country_code text unique not null,
  country_name text not null,
  pathway_summary text not null,
  jurisdiction_readiness_label text not null,
  source_reference text,
  created_at timestamptz not null default now()
);

create table if not exists public.education_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  organization text,
  topic text not null,
  country text,
  sensitivity_detected text not null default 'standard',
  workflow_status text not null default 'submitted',
  created_at timestamptz not null default now()
);

create table if not exists public.education_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor text not null,
  event_type text not null,
  entity_type text not null,
  entity_id text not null,
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.education_content_relationships (
  id uuid primary key default gen_random_uuid(),
  from_article_id uuid references public.education_articles(id) on delete cascade,
  to_article_id uuid references public.education_articles(id) on delete cascade,
  relationship_type text not null
);

create table if not exists public.education_publication_history (
  id uuid primary key default gen_random_uuid(),
  article_id uuid references public.education_articles(id) on delete cascade,
  from_state education_publication_state,
  to_state education_publication_state not null,
  changed_by text not null,
  changed_at timestamptz not null default now()
);
