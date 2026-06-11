-- Harbourview global country-data identity layer.
-- Scope: identity-only country pages. Regulated-market claims remain review-pending.

create table if not exists public.jurisdictions (
  jurisdiction_id text primary key,
  slug text not null unique,
  canonical_name text not null,
  display_name text not null,
  iso_alpha3 text,
  un_region_name text,
  un_subregion_name text,
  jurisdiction_type text not null default 'country_or_area',
  identity_verification_status text not null default 'verified_identity_only',
  data_release_status text not null default 'seeded_identity_pending_regulated_market_review',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.country_profiles_public (
  profile_id text primary key,
  jurisdiction_id text not null references public.jurisdictions(jurisdiction_id) on delete cascade,
  slug text not null unique,
  public_display_name text not null,
  public_region text,
  public_subregion text,
  public_status_label text,
  medical_cannabis_status_public text,
  adult_use_cannabis_status_public text,
  hemp_status_public text,
  import_export_status_public text,
  licensing_status_public text,
  public_summary text,
  confidence_band_public text,
  last_identity_verified_at date,
  last_regulatory_verified_at date,
  public_dto_allowed boolean not null default true,
  admin_evidence_excluded_from_public boolean not null default true
);

create table if not exists public.source_documents (
  source_document_id text primary key,
  jurisdiction_id text references public.jurisdictions(jurisdiction_id),
  source_url text,
  evidence_status text not null,
  admin_only_notes text
);

create table if not exists public.country_regulatory_profiles_admin (
  regulatory_profile_id text primary key,
  jurisdiction_id text not null references public.jurisdictions(jurisdiction_id) on delete cascade,
  review_status text not null default 'missing_primary_source_review_required',
  evidence_summary text,
  reviewer_id text
);

create table if not exists public.country_coverage_matrix (
  coverage_id text primary key,
  jurisdiction_id text not null references public.jurisdictions(jurisdiction_id) on delete cascade,
  identity_core text not null,
  public_country_page_ready text,
  admin_review_required boolean not null default true,
  overall_release_gate text not null
);

create table if not exists public.review_queue (
  review_id text primary key,
  jurisdiction_id text references public.jurisdictions(jurisdiction_id),
  country_or_area text not null,
  priority text not null,
  review_type text not null,
  blocking_fields text,
  reason text,
  recommended_next_action text,
  public_release_blocker boolean not null default true,
  created_at date not null default current_date
);

create table if not exists public.country_data_import_runs (
  import_run_id text primary key,
  package_name text not null,
  package_version text not null,
  source_zip_name text,
  expected_jurisdiction_count integer not null,
  loaded_jurisdiction_count integer,
  dry_run boolean not null default true,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null,
  evidence_json jsonb not null default '{}'::jsonb
);

create or replace view public.public_country_profile_dto as
select j.jurisdiction_id, j.slug, p.public_display_name, p.public_region, p.public_subregion, p.public_status_label, p.medical_cannabis_status_public, p.adult_use_cannabis_status_public, p.hemp_status_public, p.import_export_status_public, p.licensing_status_public, p.public_summary, p.confidence_band_public, p.last_identity_verified_at, p.last_regulatory_verified_at
from public.jurisdictions j
join public.country_profiles_public p on p.jurisdiction_id = j.jurisdiction_id
where p.public_dto_allowed = true;

alter table public.jurisdictions enable row level security;
alter table public.country_profiles_public enable row level security;
alter table public.source_documents enable row level security;
alter table public.country_regulatory_profiles_admin enable row level security;
alter table public.country_coverage_matrix enable row level security;
alter table public.review_queue enable row level security;
alter table public.country_data_import_runs enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'country_profiles_public' and policyname = 'public read country profiles public') then
    create policy "public read country profiles public" on public.country_profiles_public for select using (public_dto_allowed = true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'jurisdictions' and policyname = 'public read jurisdictions for country dto') then
    create policy "public read jurisdictions for country dto" on public.jurisdictions for select using (data_release_status = 'seeded_identity_pending_regulated_market_review');
  end if;
end $$;

grant select on public.public_country_profile_dto to anon, authenticated;
