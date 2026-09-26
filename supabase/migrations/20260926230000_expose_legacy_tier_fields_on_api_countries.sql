-- api.countries is the globe PostgREST contract (schema = api).
-- #2156 selects regulatory_tier_needs_review + regulatory_tier_last_derived_at.
-- Those columns exist on public.countries but were never projected through
-- api.countries, so getGlobeCountryMarkers failed with 42703 and /api/globe
-- returned globe_live_data_unavailable.
--
-- Columns are appended so CREATE OR REPLACE VIEW stays legal.

create or replace view api.countries
with (security_invoker = true) as
select
  id,
  country_name,
  country_slug,
  iso_alpha2,
  iso_alpha3,
  region,
  subregion,
  map_region_key,
  market_access_status,
  medical_status,
  adult_use_status,
  import_status,
  export_status,
  signals_status,
  opportunity_status,
  compliance_risk_status,
  education_status,
  marketplace_availability_status,
  public_summary,
  data_completeness,
  last_updated_label,
  created_at,
  updated_at,
  lat,
  lng,
  opportunity_categories,
  trade_roles,
  regulator_label,
  opportunity_score,
  regulatory_tier,
  verified_regulatory_tier,
  regulatory_tier_evidence_key,
  regulatory_tier_verified_at,
  regulatory_tier_expires_at,
  regulatory_tier_needs_review,
  regulatory_tier_last_derived_at
from public.countries;

comment on view api.countries is
  'Public country projection. Globe colour prefers verified_regulatory_tier; regulatory_tier plus needs_review/last_derived_at are the bounded legacy coverage fallback.';

grant select on api.countries to anon, authenticated, service_role;
