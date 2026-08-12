-- Seed public.jurisdictions from public.countries + jurisdiction_crossref.
--
-- Production 2026-08-10: jurisdictions = 0 rows, jurisdiction_crossref = 203.
-- Decision Intel Stage 0 (#1309) leaves jurisdiction linkage null until this
-- identity registry exists. Identity-only: data_release_status remains
-- seeded_identity_pending_regulated_market_review (no market claims).
--
-- Idempotent. jurisdiction_id format matches lib/country-data identity rows:
--   country_area:<ISO-3166-1 alpha-3>

begin;

-- 1. Insert missing jurisdiction identity rows from countries.
insert into public.jurisdictions (
  jurisdiction_id,
  slug,
  canonical_name,
  display_name,
  iso_alpha3,
  un_region_name,
  un_subregion_name,
  jurisdiction_type,
  identity_verification_status,
  data_release_status
)
select
  'country_area:' || upper(c.iso_alpha3) as jurisdiction_id,
  c.country_slug as slug,
  c.country_name as canonical_name,
  c.country_name as display_name,
  upper(c.iso_alpha3) as iso_alpha3,
  null::text as un_region_name,
  null::text as un_subregion_name,
  'country_or_area'::text as jurisdiction_type,
  'verified_identity_only'::text as identity_verification_status,
  'seeded_identity_pending_regulated_market_review'::text as data_release_status
from public.countries c
where c.iso_alpha3 is not null
  and length(trim(c.iso_alpha3)) = 3
  and c.country_slug is not null
  and length(trim(c.country_slug)) > 0
on conflict (jurisdiction_id) do nothing;

-- Slug uniqueness: skip rows whose slug is already owned by a different id.
-- (Handled by ON CONFLICT only on PK above; if slug collides, insert fails
-- for that row — use a guarded insert for remaining slug conflicts.)
insert into public.jurisdictions (
  jurisdiction_id,
  slug,
  canonical_name,
  display_name,
  iso_alpha3,
  jurisdiction_type,
  identity_verification_status,
  data_release_status
)
select
  'country_area:' || upper(c.iso_alpha3),
  c.country_slug || '-' || lower(c.iso_alpha3),
  c.country_name,
  c.country_name,
  upper(c.iso_alpha3),
  'country_or_area',
  'verified_identity_only',
  'seeded_identity_pending_regulated_market_review'
from public.countries c
where c.iso_alpha3 is not null
  and length(trim(c.iso_alpha3)) = 3
  and not exists (
    select 1 from public.jurisdictions j
    where j.jurisdiction_id = 'country_area:' || upper(c.iso_alpha3)
  )
  and exists (
    select 1 from public.jurisdictions j2
    where j2.slug = c.country_slug
  )
on conflict (jurisdiction_id) do nothing;

-- 2. Bridge crossref → jurisdictions when still null.
update public.jurisdiction_crossref x
set jurisdictions_id = 'country_area:' || upper(c.iso_alpha3)
from public.countries c
where x.jurisdictions_id is null
  and c.iso_alpha3 is not null
  and length(trim(c.iso_alpha3)) = 3
  and (
    c.iso_alpha2 = x.countries_iso2
    or c.iso_alpha2 = x.canonical_iso2
  )
  and exists (
    select 1 from public.jurisdictions j
    where j.jurisdiction_id = 'country_area:' || upper(c.iso_alpha3)
  );

-- 3. Minimal public profile rows so public_country_profile_dto is non-empty
-- for identity pages (still review-pending regulated claims).
insert into public.country_profiles_public (
  profile_id,
  jurisdiction_id,
  slug,
  public_display_name,
  public_region,
  public_subregion,
  public_status_label,
  public_summary,
  confidence_band_public,
  public_dto_allowed,
  admin_evidence_excluded_from_public
)
select
  'profile:' || j.jurisdiction_id,
  j.jurisdiction_id,
  j.slug,
  j.display_name,
  j.un_region_name,
  j.un_subregion_name,
  'Identity only — regulated claims pending review',
  'Canonical jurisdiction identity. Regulated-market status is not asserted by this seed.',
  'identity',
  true,
  true
from public.jurisdictions j
where not exists (
  select 1 from public.country_profiles_public p
  where p.jurisdiction_id = j.jurisdiction_id
)
on conflict (profile_id) do nothing;

-- 4. Import-run audit row (optional observability).
insert into public.country_data_import_runs (
  import_run_id,
  package_name,
  package_version,
  expected_jurisdiction_count,
  loaded_jurisdiction_count,
  dry_run,
  completed_at,
  status,
  evidence_json
)
select
  'seed-jurisdictions-identity-20260811',
  'seed_jurisdictions_identity_from_countries',
  '20260811140000',
  (select count(*)::integer from public.countries where iso_alpha3 is not null),
  (select count(*)::integer from public.jurisdictions),
  false,
  now(),
  'completed',
  jsonb_build_object(
    'source', 'public.countries',
    'crossref_linked', (
      select count(*) from public.jurisdiction_crossref
      where jurisdictions_id is not null
    )
  )
where not exists (
  select 1 from public.country_data_import_runs
  where import_run_id = 'seed-jurisdictions-identity-20260811'
);

commit;
