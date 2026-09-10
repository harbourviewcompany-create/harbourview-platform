-- Bootstrap SKU snapshots

insert into public.clinical_formulary_skus (
  country_iso2, authority, registration_code, brand_name, product_name,
  strength_label, dosage_form, route, cannabinoid_profile, authorization_status,
  source_url, source_type, review_status, notes, last_seen_at
)
select * from (values
  ('BR', 'ANVISA', null::text, null::text,
   'ANVISA-authorised CBD oral products (register class)',
   'Per product registration', 'oil / oral solution', 'oral / oromucosal',
   'CBD-dominant; THC limits per registration', 'authorised',
   'https://www.gov.br/anvisa', 'authority_register_snapshot', 'published',
   'Confirm exact brand, registration code and strength on the live ANVISA register before prescribing.',
   now()),
  ('BR', 'ANVISA', null, null,
   'Individual import authorisation pathway products',
   'Varies', 'varies', 'varies',
   'Varies by authorised product', 'import-authorised',
   'https://www.gov.br/anvisa', 'class_reference', 'published',
   'Import authorisation pathway — verify current ANVISA process for each patient product.',
   now()),
  ('AU', 'TGA', null, null,
   'TGA SAS-B medicinal cannabis products (pathway class)',
   'Sponsor-specific', 'varies', 'varies',
   'Wide CBD/THC range', 'authorised',
   'https://www.tga.gov.au', 'class_reference', 'published',
   'Most medicinal cannabis access is via SAS-B or Authorised Prescriber. Confirm current TGA pathway rules.',
   now()),
  ('AU', 'TGA', null, null,
   'Authorised Prescriber medicinal cannabis products (pathway class)',
   'Sponsor-specific', 'varies', 'varies',
   'Wide CBD/THC range', 'authorised',
   'https://www.tga.gov.au', 'class_reference', 'published',
   'Authorised Prescriber pathway — product set is clinic/sponsor specific.',
   now())
) as v(country_iso2, authority, registration_code, brand_name, product_name,
       strength_label, dosage_form, route, cannabinoid_profile, authorization_status,
       source_url, source_type, review_status, notes, last_seen_at)
where not exists (
  select 1 from public.clinical_formulary_skus s
  where s.country_iso2 = v.country_iso2
    and s.authority = v.authority
    and s.product_name = v.product_name
);

SELECT 'sku_published' AS metric, count(*)::text AS value
FROM public.clinical_formulary_skus WHERE review_status = 'published';
