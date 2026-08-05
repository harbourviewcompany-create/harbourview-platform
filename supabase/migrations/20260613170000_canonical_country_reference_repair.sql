-- Canonical country-reference repair for post-seed migration dependencies.
--
-- The Natural Earth seed intentionally contained 191 rows, while later
-- Harbourview migrations reference 28 additional ISO 3166-1 jurisdictions.
-- This identity-only repair runs before the first dependent local-intelligence
-- migration. It is safe for production histories: existing regulatory and
-- commercial fields are preserved; only canonical identity fields are aligned.

insert into public.countries (
  country_name,
  country_slug,
  iso_alpha2,
  iso_alpha3,
  region,
  subregion,
  market_access_status,
  medical_status,
  adult_use_status,
  import_status,
  export_status,
  signals_status,
  opportunity_status,
  opportunity_score,
  public_summary,
  data_completeness,
  last_updated_label
)
values
  ('Andorra', 'andorra', 'AD', 'AND', 'Europe', 'Southern Europe', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical jurisdiction identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Antigua and Barbuda', 'antigua-and-barbuda', 'AG', 'ATG', 'Americas', 'Caribbean', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical jurisdiction identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Aruba', 'aruba', 'AW', 'ABW', 'Americas', 'Caribbean', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical territory identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Barbados', 'barbados', 'BB', 'BRB', 'Americas', 'Caribbean', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical jurisdiction identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Bahrain', 'bahrain', 'BH', 'BHR', 'Asia', 'Western Asia', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical jurisdiction identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Curaçao', 'curacao', 'CW', 'CUW', 'Americas', 'Caribbean', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical territory identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Micronesia', 'micronesia', 'FM', 'FSM', 'Oceania', 'Micronesia', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical jurisdiction identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Grenada', 'grenada', 'GD', 'GRD', 'Americas', 'Caribbean', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical jurisdiction identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Guernsey', 'guernsey', 'GG', 'GGY', 'Europe', 'Northern Europe', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical dependency identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Gibraltar', 'gibraltar', 'GI', 'GIB', 'Europe', 'Southern Europe', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical territory identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Jersey', 'jersey', 'JE', 'JEY', 'Europe', 'Northern Europe', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical dependency identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Saint Kitts and Nevis', 'saint-kitts-and-nevis', 'KN', 'KNA', 'Americas', 'Caribbean', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical jurisdiction identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Liechtenstein', 'liechtenstein', 'LI', 'LIE', 'Europe', 'Western Europe', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical jurisdiction identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Monaco', 'monaco', 'MC', 'MCO', 'Europe', 'Western Europe', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical jurisdiction identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Marshall Islands', 'marshall-islands', 'MH', 'MHL', 'Oceania', 'Micronesia', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical jurisdiction identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Macao', 'macao', 'MO', 'MAC', 'Asia', 'Eastern Asia', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical territory identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Malta', 'malta', 'MT', 'MLT', 'Europe', 'Southern Europe', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical jurisdiction identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Maldives', 'maldives', 'MV', 'MDV', 'Asia', 'Southern Asia', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical jurisdiction identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Nauru', 'nauru', 'NR', 'NRU', 'Oceania', 'Micronesia', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical jurisdiction identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Palau', 'palau', 'PW', 'PLW', 'Oceania', 'Micronesia', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical jurisdiction identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Seychelles', 'seychelles', 'SC', 'SYC', 'Africa', 'Eastern Africa', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical jurisdiction identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Singapore', 'singapore', 'SG', 'SGP', 'Asia', 'South-Eastern Asia', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical jurisdiction identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('San Marino', 'san-marino', 'SM', 'SMR', 'Europe', 'Southern Europe', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical jurisdiction identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Sint Maarten', 'sint-maarten', 'SX', 'SXM', 'Americas', 'Caribbean', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical territory identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Tonga', 'tonga', 'TO', 'TON', 'Oceania', 'Polynesia', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical jurisdiction identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Tuvalu', 'tuvalu', 'TV', 'TUV', 'Oceania', 'Polynesia', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical jurisdiction identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Holy See', 'vatican-city', 'VA', 'VAT', 'Europe', 'Southern Europe', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical jurisdiction identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Saint Vincent and the Grenadines', 'saint-vincent-and-the-grenadines', 'VC', 'VCT', 'Americas', 'Caribbean', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical jurisdiction identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026')
on conflict (iso_alpha2) do update
set
  country_name = excluded.country_name,
  country_slug = excluded.country_slug,
  iso_alpha3 = excluded.iso_alpha3,
  region = excluded.region,
  subregion = excluded.subregion,
  updated_at = now();

-- The public country identity layer must now cover every jurisdiction referenced
-- by the current post-seed migration history.
do $country_reference_assertion$
declare
  missing_codes text[];
begin
  select array_agg(required_code order by required_code)
  into missing_codes
  from unnest(array[
    'AD','AG','AW','BB','BH','CW','FM','GD','GG','GI','JE','KN','LI','MC',
    'MH','MO','MT','MV','NR','PW','SC','SG','SM','SX','TO','TV','VA','VC'
  ]::text[]) as required_code
  where not exists (
    select 1
    from public.countries country
    where country.iso_alpha2 = required_code
  );

  if missing_codes is not null then
    raise exception 'Canonical country reference repair incomplete: %', missing_codes;
  end if;
end
$country_reference_assertion$;
