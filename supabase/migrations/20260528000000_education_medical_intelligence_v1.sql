create table if not exists public.education_tracks (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text not null,
  publication_state text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.education_modules (
  id uuid primary key default gen_random_uuid(),
  track_id uuid references public.education_tracks(id) on delete cascade,
  slug text unique not null,
  title text not null,
  audience text[] not null default '{}',
  sensitivity text not null default 'standard',
  publication_state text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.education_articles (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references public.education_modules(id) on delete set null,
  slug text unique not null,
  title text not null,
  summary text not null,
  source_basis text not null default 'draft',
  publication_state text not null default 'draft',
  review_status text not null default 'review-required',
  last_reviewed date,
  next_review_due date,
  publication_confidence text not null default 'low',
  reviewer_type text,
  controlled_topic boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.education_article_sections (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.education_articles(id) on delete cascade,
  section_key text not null,
  section_content text not null,
  sort_order int not null default 0
);

create table if not exists public.education_sources (
  id uuid primary key default gen_random_uuid(),
  article_id uuid references public.education_articles(id) on delete cascade,
  raw_source_url text,
  source_snapshot_path text,
  source_basis text not null default 'pending-verification',
  contradictory_source_flag boolean not null default false,
  unresolved_issues text[] not null default '{}',
  reviewer_notes text
);

create table if not exists public.education_reviews (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.education_articles(id) on delete cascade,
  review_state text not null,
  reviewer_category text not null,
  review_notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.education_glossary_terms (id uuid primary key default gen_random_uuid(),term text unique not null,definition text not null,synonyms text[] not null default '{}',restricted_term_warning boolean not null default false,prohibited_wording_flags text[] not null default '{}');
create table if not exists public.education_country_briefs (id uuid primary key default gen_random_uuid(),country_code text unique not null,title text not null,readiness_label text not null,summary text not null,jurisdiction_sources text[] not null default '{}');
create table if not exists public.education_requests (id uuid primary key default gen_random_uuid(),requester_name text not null,requester_email text not null,topic text not null,country text,sensitivity text not null default 'standard',status text not null default 'submitted',created_at timestamptz not null default now());
create table if not exists public.education_audit_events (id uuid primary key default gen_random_uuid(),actor text not null,event_type text not null,entity_type text not null,entity_id text not null,payload jsonb not null default '{}'::jsonb,created_at timestamptz not null default now());
create table if not exists public.education_content_relationships (id uuid primary key default gen_random_uuid(),from_article_id uuid references public.education_articles(id) on delete cascade,to_article_id uuid references public.education_articles(id) on delete cascade,relationship_type text not null);
create table if not exists public.education_publication_history (id uuid primary key default gen_random_uuid(),article_id uuid not null references public.education_articles(id) on delete cascade,previous_state text not null,new_state text not null,transitioned_by text not null,transitioned_at timestamptz not null default now());
