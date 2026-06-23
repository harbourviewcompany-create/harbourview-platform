-- Clinical Education data layer: moves app/network/clinical-education off the
-- bundled fixture and onto Supabase. Public, non-promotional educational
-- content: anon/authenticated may read; writes are service_role only.

create table if not exists public.clinical_education_modules (
  id                            text primary key,
  slug                          text unique not null,
  title                         text not null,
  route                         text not null,
  audience                      text[] not null default '{}',
  module_status                 text not null,
  risk_level                    text not null,
  public_summary                text not null,
  education_themes              text[] not null default '{}',
  safe_language                 text[] not null default '{}',
  restricted_language           text[] not null default '{}',
  research_status               text,
  professional_review_required  boolean not null default false,
  source_basis                  text,
  reviewer_role_required        text[] not null default '{}',
  audience_boundary             text,
  last_reviewed                 date,
  next_review_due               text,
  public_use_approved           boolean not null default false,
  medical_advice_boundary       text,
  country_relevance             text[] not null default '{}',
  format_relevance              text[] not null default '{}',
  disclaimer_type               text not null default 'standard',
  cta_label                     text,
  cta_href                      text,
  sort_order                    integer not null default 0,
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now()
);

create table if not exists public.clinical_education_country_readiness (
  id                                uuid primary key default gen_random_uuid(),
  country                           text not null,
  region                            text,
  professional_education_readiness  text,
  known_training_gap                text,
  official_guidance_status          text,
  formats_requiring_education       text[] not null default '{}',
  pharmacist_relevance              text,
  clinician_relevance               text,
  research_status                   text,
  professional_reviewer_needed      boolean not null default false,
  brief_availability                text,
  sort_order                        integer not null default 0,
  constraint clinical_education_country_readiness_country_key unique (country),
  created_at                        timestamptz not null default now(),
  updated_at                        timestamptz not null default now()
);

alter table public.clinical_education_modules            enable row level security;
alter table public.clinical_education_country_readiness  enable row level security;

create policy clinical_education_modules_public_read
  on public.clinical_education_modules for select to anon, authenticated using (true);
create policy clinical_education_country_readiness_public_read
  on public.clinical_education_country_readiness for select to anon, authenticated using (true);

grant select on public.clinical_education_modules           to anon, authenticated;
grant select on public.clinical_education_country_readiness to anon, authenticated;

create index if not exists idx_ce_modules_sort   on public.clinical_education_modules (sort_order);
create index if not exists idx_ce_readiness_sort on public.clinical_education_country_readiness (sort_order);

create trigger trg_ce_modules_touch   before update on public.clinical_education_modules
  for each row execute function public.touch_updated_at();
create trigger trg_ce_readiness_touch before update on public.clinical_education_country_readiness
  for each row execute function public.touch_updated_at();
