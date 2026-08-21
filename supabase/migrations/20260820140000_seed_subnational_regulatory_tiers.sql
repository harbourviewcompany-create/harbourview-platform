-- Seed the 88 subnational geometries rendered by the Harbourview globe.
-- Identifiers and centroids mirror the four data/globe geometry fixtures exactly.
-- Idempotent by countries.iso_alpha2; live DB rows override static app defaults at runtime.

with seed(country_name, iso_alpha2, iso_alpha3, lat, lng, regulatory_tier) as (
  values
    ('Alaska', 'US-AK', 'USA-AK', 61.506, -154.104, 'domestic_only'),
    ('Alabama', 'US-AL', 'USA-AL', 32.628, -86.704, 'medical_limited_trade'),
    ('Arkansas', 'US-AR', 'USA-AR', 34.756, -92.154, 'medical_limited_trade'),
    ('Arizona', 'US-AZ', 'USA-AZ', 34.164, -111.941, 'domestic_only'),
    ('California', 'US-CA', 'USA-CA', 37.267, -119.248, 'domestic_only'),
    ('Colorado', 'US-CO', 'USA-CO', 39.001, -105.53, 'domestic_only'),
    ('Connecticut', 'US-CT', 'USA-CT', 41.524, -72.759, 'domestic_only'),
    ('District of Columbia', 'US-DC', 'USA-DC', 38.909, -77.027, 'domestic_only'),
    ('Delaware', 'US-DE', 'USA-DE', 39.149, -75.41, 'domestic_only'),
    ('Florida', 'US-FL', 'USA-FL', 27.772, -83.824, 'medical_limited_trade'),
    ('Georgia', 'US-GA', 'USA-GA', 32.686, -83.248, 'medical_limited_trade'),
    ('Hawaii', 'US-HI', 'USA-HI', 23.593, -166.097, 'medical_limited_trade'),
    ('Iowa', 'US-IA', 'USA-IA', 41.941, -93.388, 'cbd_hemp_only'),
    ('Idaho', 'US-ID', 'USA-ID', 45.497, -114.126, 'prohibited'),
    ('Illinois', 'US-IL', 'USA-IL', 39.753, -89.27, 'domestic_only'),
    ('Indiana', 'US-IN', 'USA-IN', 39.774, -86.442, 'cbd_hemp_only'),
    ('Kansas', 'US-KS', 'USA-KS', 38.501, -98.321, 'cbd_hemp_only'),
    ('Kentucky', 'US-KY', 'USA-KY', 37.814, -85.763, 'medical_limited_trade'),
    ('Louisiana', 'US-LA', 'USA-LA', 30.999, -91.428, 'medical_limited_trade'),
    ('Massachusetts', 'US-MA', 'USA-MA', 42.066, -71.721, 'domestic_only'),
    ('Maryland', 'US-MD', 'USA-MD', 38.838, -77.263, 'domestic_only'),
    ('Maine', 'US-ME', 'USA-ME', 45.267, -69.036, 'domestic_only'),
    ('Michigan', 'US-MI', 'USA-MI', 45.002, -86.275, 'domestic_only'),
    ('Minnesota', 'US-MN', 'USA-MN', 46.435, -93.362, 'domestic_only'),
    ('Missouri', 'US-MO', 'USA-MO', 38.309, -92.444, 'domestic_only'),
    ('Mississippi', 'US-MS', 'USA-MS', 32.597, -89.871, 'medical_limited_trade'),
    ('Montana', 'US-MT', 'USA-MT', 46.695, -110.027, 'domestic_only'),
    ('North Carolina', 'US-NC', 'USA-NC', 35.244, -79.891, 'cbd_hemp_only'),
    ('North Dakota', 'US-ND', 'USA-ND', 47.468, -100.295, 'medical_limited_trade'),
    ('Nebraska', 'US-NE', 'USA-NE', 41.501, -99.688, 'medical_limited_trade'),
    ('New Hampshire', 'US-NH', 'USA-NH', 43.998, -71.643, 'medical_limited_trade'),
    ('New Jersey', 'US-NJ', 'USA-NJ', 40.149, -74.717, 'domestic_only'),
    ('New Mexico', 'US-NM', 'USA-NM', 34.164, -106.024, 'domestic_only'),
    ('Nevada', 'US-NV', 'USA-NV', 38.496, -117.021, 'domestic_only'),
    ('New York', 'US-NY', 'USA-NY', 42.762, -75.833, 'domestic_only'),
    ('Ohio', 'US-OH', 'USA-OH', 40.37, -82.67, 'domestic_only'),
    ('Oklahoma', 'US-OK', 'USA-OK', 35.325, -98.72, 'medical_limited_trade'),
    ('Oregon', 'US-OR', 'USA-OR', 44.113, -120.508, 'domestic_only'),
    ('Pennsylvania', 'US-PA', 'USA-PA', 41.131, -77.61, 'medical_limited_trade'),
    ('Rhode Island', 'US-RI', 'USA-RI', 41.674, -71.537, 'domestic_only'),
    ('South Carolina', 'US-SC', 'USA-SC', 33.62, -80.96, 'cbd_hemp_only'),
    ('South Dakota', 'US-SD', 'USA-SD', 44.227, -100.245, 'medical_limited_trade'),
    ('Tennessee', 'US-TN', 'USA-TN', 35.841, -85.976, 'cbd_hemp_only'),
    ('Texas', 'US-TX', 'USA-TX', 31.186, -100.099, 'medical_limited_trade'),
    ('Utah', 'US-UT', 'USA-UT', 39.501, -111.544, 'medical_limited_trade'),
    ('Virginia', 'US-VA', 'USA-VA', 38.001, -79.447, 'domestic_only'),
    ('Vermont', 'US-VT', 'USA-VT', 43.869, -72.468, 'domestic_only'),
    ('Washington', 'US-WA', 'USA-WA', 47.292, -120.803, 'domestic_only'),
    ('Wisconsin', 'US-WI', 'USA-WI', 44.901, -89.581, 'cbd_hemp_only'),
    ('West Virginia', 'US-WV', 'USA-WV', 38.928, -80.173, 'medical_limited_trade'),
    ('Wyoming', 'US-WY', 'USA-WY', 43.001, -107.537, 'cbd_hemp_only'),
    ('Alberta', 'CA-AB', 'CAN-AB', 52.88, -115.782, 'domestic_only'),
    ('British Columbia', 'CA-BC', 'CAN-BC', 52.429, -126.579, 'domestic_only'),
    ('Manitoba', 'CA-MB', 'CAN-MB', 55.876, -95.858, 'domestic_only'),
    ('New Brunswick', 'CA-NB', 'CAN-NB', 46.531, -66.459, 'domestic_only'),
    ('Newfoundland and Labrador', 'CA-NL', 'CAN-NL', 52.722, -59.579, 'domestic_only'),
    ('Northwest Territories', 'CA-NT', 'CAN-NT', 70.704, -121.267, 'domestic_only'),
    ('Nova Scotia', 'CA-NS', 'CAN-NS', 45.274, -62.724, 'domestic_only'),
    ('Nunavut', 'CA-NU', 'CAN-NU', 71.107, -87.815, 'domestic_only'),
    ('Ontario', 'CA-ON', 'CAN-ON', 48.789, -83.693, 'domestic_only'),
    ('Prince Edward Island', 'CA-PE', 'CAN-PE', 46.396, -63.324, 'domestic_only'),
    ('Québec', 'CA-QC', 'CAN-QC', 54.023, -69.327, 'domestic_only'),
    ('Saskatchewan', 'CA-SK', 'CAN-SK', 54.381, -105.898, 'domestic_only'),
    ('Yukon', 'CA-YT', 'CAN-YT', 64.003, -132.173, 'domestic_only'),
    ('Sachsen', 'DE-SN', 'DE-SN', 51.005, 13.46, 'domestic_only'),
    ('Bayern', 'DE-BY', 'DE-BY', 49.006, 11.397, 'domestic_only'),
    ('Rheinland-Pfalz', 'DE-RP', 'DE-RP', 49.868, 7.37, 'domestic_only'),
    ('Saarland', 'DE-SL', 'DE-SL', 49.403, 6.866, 'domestic_only'),
    ('Schleswig-Holstein', 'DE-SH', 'DE-SH', 54.132, 9.846, 'domestic_only'),
    ('Niedersachsen', 'DE-NI', 'DE-NI', 52.775, 8.862, 'domestic_only'),
    ('Nordrhein-Westfalen', 'DE-NW', 'DE-NW', 51.615, 7.657, 'domestic_only'),
    ('Baden-Württemberg', 'DE-BW', 'DE-BW', 48.59, 9.003, 'domestic_only'),
    ('Brandenburg', 'DE-BB', 'DE-BB', 52.816, 12.921, 'domestic_only'),
    ('Mecklenburg-Vorpommern', 'DE-MV', 'DE-MV', 53.753, 12.565, 'domestic_only'),
    ('Hamburg', 'DE-HH', 'DE-HH', 53.559, 10.034, 'domestic_only'),
    ('Hessen', 'DE-HE', 'DE-HE', 50.61, 8.959, 'domestic_only'),
    ('Thüringen', 'DE-TH', 'DE-TH', 50.905, 11.098, 'domestic_only'),
    ('Sachsen-Anhalt', 'DE-ST', 'DE-ST', 51.934, 11.68, 'domestic_only'),
    ('Berlin', 'DE-BE', 'DE-BE', 52.513, 13.421, 'domestic_only'),
    ('Bremen', 'DE-HB', 'DE-HB', 53.121, 8.743, 'domestic_only'),
    ('Western Australia', 'AU-WA', 'AU-WA', -25.848, 121.646, 'medical_limited_trade'),
    ('Northern Territory', 'AU-NT', 'AU-NT', -20.103, 133.78, 'medical_limited_trade'),
    ('South Australia', 'AU-SA', 'AU-SA', -29.65, 135.783, 'medical_limited_trade'),
    ('Queensland', 'AU-QLD', 'AU-QLD', -23.136, 144.778, 'medical_limited_trade'),
    ('New South Wales', 'AU-NSW', 'AU-NSW', -32.475, 146.781, 'medical_limited_trade'),
    ('Victoria', 'AU-VIC', 'AU-VIC', -37.008, 144.75, 'medical_limited_trade'),
    ('Tasmania', 'AU-TAS', 'AU-TAS', -42.138, 146.603, 'medical_limited_trade'),
    ('Australian Capital Territory', 'AU-ACT', 'AU-ACT', -35.462, 148.983, 'medical_limited_trade')
),
prepared as (
  select
    country_name,
    'subnational-' || lower(iso_alpha2) as country_slug,
    iso_alpha2,
    iso_alpha3,
    lat,
    lng,
    regulatory_tier,
    case
      when iso_alpha2 like 'US-%' and regulatory_tier = 'domestic_only'
        then 'State/District permits adult non-medical cannabis; interstate commercial trade remains federally constrained.'
      when iso_alpha2 like 'US-%' and regulatory_tier = 'medical_limited_trade'
        then 'Comprehensive state medical cannabis access without state adult-use legalization.'
      when iso_alpha2 like 'US-%' and regulatory_tier = 'cbd_hemp_only'
        then 'Limited low-THC/CBD access only; no comprehensive medical or adult-use cannabis program.'
      when iso_alpha2 = 'US-ID'
        then 'No state medical or adult-use cannabis program.'
      when iso_alpha2 like 'CA-%'
        then 'Federal adult-use and medical legality applies within the province/territory; tier represents domestic market access.'
      when iso_alpha2 like 'DE-%'
        then 'Federal CanG adult-use framework and medical legality apply within the Land; tier represents domestic access.'
      when iso_alpha2 like 'AU-%'
        then 'Medical cannabis is legal under the national/state framework; non-medical commercial access remains prohibited.'
    end as regulatory_tier_rationale,
    case
      when iso_alpha2 like 'US-%' then 'NCSL State Medical Cannabis Laws (2026-06-01)'
      when iso_alpha2 like 'CA-%' then 'cc_jurisdiction_briefings Canada subnational seed (2026-06-22)'
      when iso_alpha2 like 'DE-%' then 'cc_jurisdiction_briefings Germany subnational seed (2026-06-22)'
      when iso_alpha2 like 'AU-%' then 'cc_jurisdiction_briefings Australia subnational seed (2026-06-22)'
    end as regulatory_tier_source
  from seed
)
insert into public.countries (
  country_name,
  country_slug,
  iso_alpha2,
  iso_alpha3,
  lat,
  lng,
  regulatory_tier,
  regulatory_tier_rationale,
  regulatory_tier_source
)
select
  country_name,
  country_slug,
  iso_alpha2,
  iso_alpha3,
  lat,
  lng,
  regulatory_tier,
  regulatory_tier_rationale,
  regulatory_tier_source
from prepared
on conflict (iso_alpha2) do update set
  country_name = excluded.country_name,
  country_slug = excluded.country_slug,
  iso_alpha3 = excluded.iso_alpha3,
  lat = excluded.lat,
  lng = excluded.lng,
  regulatory_tier = excluded.regulatory_tier,
  regulatory_tier_rationale = excluded.regulatory_tier_rationale,
  regulatory_tier_source = excluded.regulatory_tier_source,
  updated_at = now();
