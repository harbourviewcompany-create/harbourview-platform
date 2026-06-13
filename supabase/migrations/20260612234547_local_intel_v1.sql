-- Harbourview Local Intel layer v1
-- Additive schema for per-country (and optional subnational) regulatory authorities,
-- subdivision-level operating status, local operating notes (constraints/supply routes),
-- evidence coverage, and open research questions.
-- Keys off countries.iso_alpha2 to stay joinable with the existing global country registry
-- and country_intel. subdivision_code uses ISO 3166-2 style codes (e.g. 'US-FL', 'US-GA')
-- to align with the existing globe/jurisdiction routing work.

create extension if not exists pgcrypto;

-- 1. Coverage tracker: has local intel research actually been done for this country?
-- Lets the UI honestly say "data pending" instead of fabricating content.
create table if not exists public.local_intel_coverage (
  country_code      text primary key references public.countries(iso_alpha2) on delete cascade,
  coverage_status   text not null default 'pending_research'
                       check (coverage_status in ('available','pending_research','not_applicable')),
  notes             text,
  last_reviewed_at  timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- 2. Regulatory authorities org chart (country- or subdivision-level)
create table if not exists public.local_authorities (
  id               uuid primary key default gen_random_uuid(),
  country_code     text not null references public.countries(iso_alpha2) on delete cascade,
  subdivision_code text,
  org_tier         text not null check (org_tier in ('top','mid','bot')),
  authority_type   text not null check (authority_type in ('primary','oversight','enforcement')),
  authority_name   text not null,
  authority_role   text not null,
  display_order    integer not null default 0,
  source_id        uuid references public.source_registry(id),
  confidence_label text,
  last_verified_at timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists local_authorities_country_idx
  on public.local_authorities (country_code, subdivision_code);

-- 3. Subnational / municipal intel rows (the "municipalities" panel)
create table if not exists public.local_subdivisions_intel (
  id               uuid primary key default gen_random_uuid(),
  country_code     text not null references public.countries(iso_alpha2) on delete cascade,
  subdivision_code text,
  subdivision_name text not null,
  status_level     text not null check (status_level in ('high','medium','low')),
  note             text,
  display_order    integer not null default 0,
  source_id        uuid references public.source_registry(id),
  last_verified_at timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists local_subdivisions_intel_country_idx
  on public.local_subdivisions_intel (country_code, subdivision_code);

-- 4. Local operating notes: constraints & supply-chain routes
create table if not exists public.local_operating_notes (
  id               uuid primary key default gen_random_uuid(),
  country_code     text not null references public.countries(iso_alpha2) on delete cascade,
  subdivision_code text,
  note_category    text not null check (note_category in ('constraint','supply_route')),
  icon             text,
  label            text not null,
  body_text        text not null,
  display_order    integer not null default 0,
  source_id        uuid references public.source_registry(id),
  last_verified_at timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists local_operating_notes_country_idx
  on public.local_operating_notes (country_code, subdivision_code, note_category);

-- 5. Evidence coverage levels (per category, per country)
create table if not exists public.local_evidence_coverage (
  id               uuid primary key default gen_random_uuid(),
  country_code     text not null references public.countries(iso_alpha2) on delete cascade,
  category_label   text not null,
  coverage_level   text not null check (coverage_level in ('high','medium','low')),
  display_order    integer not null default 0,
  source_id        uuid references public.source_registry(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists local_evidence_coverage_country_idx
  on public.local_evidence_coverage (country_code);

-- 6. Open research questions
create table if not exists public.local_open_questions (
  id               uuid primary key default gen_random_uuid(),
  country_code     text not null references public.countries(iso_alpha2) on delete cascade,
  subdivision_code text,
  question_text    text not null,
  status           text not null default 'open' check (status in ('open','answered')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists local_open_questions_country_idx
  on public.local_open_questions (country_code, subdivision_code, status);

-- ── RLS: public-read, write restricted to service role (consistent with `countries`) ──
alter table public.local_intel_coverage     enable row level security;
alter table public.local_authorities        enable row level security;
alter table public.local_subdivisions_intel enable row level security;
alter table public.local_operating_notes    enable row level security;
alter table public.local_evidence_coverage  enable row level security;
alter table public.local_open_questions     enable row level security;

create policy local_intel_coverage_public_read
  on public.local_intel_coverage for select to anon, authenticated using (true);

create policy local_authorities_public_read
  on public.local_authorities for select to anon, authenticated using (true);

create policy local_subdivisions_intel_public_read
  on public.local_subdivisions_intel for select to anon, authenticated using (true);

create policy local_operating_notes_public_read
  on public.local_operating_notes for select to anon, authenticated using (true);

create policy local_evidence_coverage_public_read
  on public.local_evidence_coverage for select to anon, authenticated using (true);

create policy local_open_questions_public_read
  on public.local_open_questions for select to anon, authenticated using (true);

-- ── Seed coverage tracker for all 191 countries ──
insert into public.local_intel_coverage (country_code, coverage_status)
select iso_alpha2, 'pending_research'
from public.countries
on conflict (country_code) do nothing;
