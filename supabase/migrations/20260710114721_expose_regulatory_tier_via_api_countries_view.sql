-- Append regulatory_tier to api.countries so the globe client can read it.
-- New columns appended at the end; existing column order preserved so
-- create-or-replace succeeds and existing grants carry over.
-- Deliberately NOT exposing regulatory_tier_rationale / _source / _reviewed_at:
-- those are internal review metadata, not something the public globe needs.

create or replace view api.countries as
 SELECT id,
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
    regulatory_tier
   FROM countries;
