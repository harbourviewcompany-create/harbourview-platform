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
