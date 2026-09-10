-- Expose the evidence-backed regulatory tier columns through api.countries.
--
-- The public globe colours Market Access from countries.verified_regulatory_tier
-- and fails closed unless tier + evidence key + verified_at + unexpired
-- expires_at all agree (lib/globe/supabaseGlobeData.ts). The browser client is
-- pinned to the `api` schema, so it reads api.countries -- which exposed the
-- legacy countries.regulatory_tier but none of those four columns. Every globe
-- request therefore failed with 42703 and the map rendered with no tier colour
-- at all, while 117 countries sat in public.countries with valid, unexpired,
-- evidence-backed tiers (earliest expiry 2027-03-01).
--
-- docs/control/REGULATORY_MARKET_ACCESS_LIVE_EFFECT_RECONCILIATION_20260831.md
-- already establishes that verified_regulatory_tier is "the only tier the public
-- globe may render", so this exposes nothing new in intent -- it lets the view
-- catch up with the contract the application was already written against.
--
-- No new privilege is granted. The view keeps security_invoker = true, so the
-- caller's own rights apply, and anon/authenticated already hold column-level
-- SELECT on all four columns of public.countries (verified live 2026-09-06).
-- Columns are appended in order so CREATE OR REPLACE VIEW is legal.

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
  regulatory_tier_expires_at
from public.countries;

comment on view api.countries is
  'Public country projection. Market Access colour must be read from verified_regulatory_tier (evidence-backed, expiring); regulatory_tier is legacy and must not be used for public colouring.';
