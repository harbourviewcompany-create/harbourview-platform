-- Product-level ANVISA catalogue bootstrap (verify live on consultas.anvisa.gov.br)
insert into public.clinical_formulary_skus (
  country_iso2, authority, registration_code, brand_name, product_name,
  strength_label, dosage_form, route, cannabinoid_profile, authorization_status,
  source_url, source_type, review_status, notes, last_seen_at
)
select * from (values
  ('BR','ANVISA','159910001','Canabidiol Nunature','Canabidiol Nunature 17,18 mg/mL','17,18 mg/mL','solução oral','oral','CBD/extrato','authorised','https://consultas.anvisa.gov.br/#/cannabis/','manual_curated','published','AS pública. Verificar em consultas.anvisa.gov.br. Detentor: Nunature', now()),
  ('BR','ANVISA','159910002','Canabidiol Nunature','Canabidiol Nunature 34,36 mg/mL','34,36 mg/mL','solução oral','oral','CBD/extrato','authorised','https://consultas.anvisa.gov.br/#/cannabis/','manual_curated','published','AS pública. Verificar em consultas.anvisa.gov.br. Detentor: Nunature', now()),
  ('BR','ANVISA','110630158','Canabidiol Farmanguinhos','Canabidiol Farmanguinhos',null,'solução oral','oral','CBD/extrato','authorised','https://consultas.anvisa.gov.br/#/cannabis/','manual_curated','published','AS pública. Verificar em consultas.anvisa.gov.br. Detentor: Fiocruz', now()),
  ('BR','ANVISA','143130001','Promediol','Extrato de Cannabis Sativa Promediol',null,'solução oral','oral','CBD/extrato','authorised','https://consultas.anvisa.gov.br/#/cannabis/','manual_curated','published','AS pública. Verificar em consultas.anvisa.gov.br. Detentor: Promediol', now()),
  ('BR','ANVISA','142730001','Zion Medpharma','Extrato de Cannabis Sativa Zion Medpharma 200 mg/mL','200 mg/mL','solução oral','oral','CBD/extrato','authorised','https://consultas.anvisa.gov.br/#/cannabis/','manual_curated','published','AS pública. Verificar em consultas.anvisa.gov.br. Detentor: Endogen', now()),
  ('BR','ANVISA','145000001','Greencare','Extrato de Cannabis Sativa Greencare 79,14 mg/mL','79,14 mg/mL','solução oral','oral','CBD/extrato','authorised','https://consultas.anvisa.gov.br/#/cannabis/','manual_curated','published','AS pública. Verificar em consultas.anvisa.gov.br. Detentor: Greencare', now()),
  ('BR','ANVISA',null,'Active Pharmaceutica','Canabidiol Active Pharmaceutica 20 mg/mL','20 mg/mL','solução oral','oral','CBD/extrato','authorised','https://consultas.anvisa.gov.br/#/cannabis/','manual_curated','published','Listado em levantamentos públicos de AS. Confirmar código e situação em consultas.anvisa.gov.br.', now()),
  ('BR','ANVISA',null,'Aura Pharma','Canabidiol Aura Pharma 50 mg/mL','50 mg/mL','solução oral','oral','CBD/extrato','authorised','https://consultas.anvisa.gov.br/#/cannabis/','manual_curated','published','Listado em levantamentos públicos de AS. Confirmar código e situação em consultas.anvisa.gov.br.', now()),
  ('BR','ANVISA',null,'Belcher','Canabidiol Belcher 150 mg/mL','150 mg/mL','solução oral','oral','CBD/extrato','authorised','https://consultas.anvisa.gov.br/#/cannabis/','manual_curated','published','Listado em levantamentos públicos de AS. Confirmar código e situação em consultas.anvisa.gov.br.', now()),
  ('BR','ANVISA',null,'Ease Labs','Canabidiol Ease Labs 100 mg/mL','100 mg/mL','solução oral','oral','CBD/extrato','authorised','https://consultas.anvisa.gov.br/#/cannabis/','manual_curated','published','Listado em levantamentos públicos de AS. Confirmar código e situação em consultas.anvisa.gov.br.', now()),
  ('BR','ANVISA',null,'Herbarium','Canabidiol Herbarium 200 mg/mL','200 mg/mL','solução oral','oral','CBD/extrato','authorised','https://consultas.anvisa.gov.br/#/cannabis/','manual_curated','published','Listado em levantamentos públicos de AS. Confirmar código e situação em consultas.anvisa.gov.br.', now()),
  ('BR','ANVISA',null,'Mantecorp Farmasa','Canabidiol Mantecorp Farmasa 23,75 mg/mL','23,75 mg/mL','solução oral','oral','CBD/extrato','authorised','https://consultas.anvisa.gov.br/#/cannabis/','manual_curated','published','Listado em levantamentos públicos de AS. Confirmar código e situação em consultas.anvisa.gov.br.', now()),
  ('BR','ANVISA',null,'Greencare','Canabidiol Greencare 23,75 mg/mL','23,75 mg/mL','solução oral','oral','CBD/extrato','authorised','https://consultas.anvisa.gov.br/#/cannabis/','manual_curated','published','Listado em levantamentos públicos de AS. Confirmar código e situação em consultas.anvisa.gov.br.', now()),
  ('BR','ANVISA',null,'Aura Pharma','Extrato de Cannabis Sativa Aura Pharma 200 mg/mL','200 mg/mL','solução oral','oral','CBD/extrato','authorised','https://consultas.anvisa.gov.br/#/cannabis/','manual_curated','published','Listado em levantamentos públicos de AS. Confirmar código e situação em consultas.anvisa.gov.br.', now()),
  ('BR','ANVISA',null,'Mantecorp Farmasa','Extrato de Cannabis Sativa Mantecorp Farmasa 79,14 mg/mL','79,14 mg/mL','solução oral','oral','CBD/extrato','authorised','https://consultas.anvisa.gov.br/#/cannabis/','manual_curated','published','Listado em levantamentos públicos de AS. Confirmar código e situação em consultas.anvisa.gov.br.', now())
) as v(country_iso2, authority, registration_code, brand_name, product_name,
       strength_label, dosage_form, route, cannabinoid_profile, authorization_status,
       source_url, source_type, review_status, notes, last_seen_at)
where not exists (
  select 1 from public.clinical_formulary_skus s
  where s.country_iso2 = v.country_iso2
    and s.authority = v.authority
    and s.product_name = v.product_name
);

-- Sample TGA sponsor products (Category 1 subset) until live cron populates full list
insert into public.clinical_formulary_skus (
  country_iso2, authority, registration_code, brand_name, product_name,
  strength_label, dosage_form, route, cannabinoid_profile, authorization_status,
  source_url, source_type, review_status, notes, last_seen_at
)
select * from (values
  ('AU','TGA',null,null,'Oral Liquid · CBD 100mg/mL · 30mL','30mL','Oral Liquid','oral','CBD 100mg/mL','authorised','https://www.tga.gov.au/resources/explore-topic/medicinal-cannabis-hub/medicinal-cannabis-product-list','authority_register_snapshot','published','SAS/AP Category 1. Sponsor: Little Green Pharma Ltd. Verify live TGA list.', now()),
  ('AU','TGA',null,null,'Oral Liquid · CBD 200mg/mL · 30mL','30mL','Oral Liquid','oral','CBD 200mg/mL','authorised','https://www.tga.gov.au/resources/explore-topic/medicinal-cannabis-hub/medicinal-cannabis-product-list','authority_register_snapshot','published','SAS/AP Category 1. Sponsor: Cannatrek Medical Pty Ltd. Verify live TGA list.', now()),
  ('AU','TGA',null,null,'Herb, Dried · CBD 120mg/g · 10g','10g','Herb, Dried','inhaled','CBD 120mg/g','authorised','https://www.tga.gov.au/resources/explore-topic/medicinal-cannabis-hub/medicinal-cannabis-product-list','authority_register_snapshot','published','SAS/AP Category 1. Sponsor: Little Green Pharma Ltd. Verify live TGA list.', now()),
  ('AU','TGA',null,null,'Capsule · CBD 20mg, THC 1mg · 30','30','Capsule','oral','CBD 20mg, THC 1mg','authorised','https://www.tga.gov.au/resources/explore-topic/medicinal-cannabis-hub/medicinal-cannabis-product-list','authority_register_snapshot','published','SAS/AP Category 2. Sponsor: Canopy Growth Australia. Verify live TGA list.', now()),
  ('AU','TGA',null,null,'Oral Liquid · CBD 100mg/mL, THC 10mg/mL · 30mL','30mL','Oral Liquid','oral','CBD 100mg/mL, THC 10mg/mL','authorised','https://www.tga.gov.au/resources/explore-topic/medicinal-cannabis-hub/medicinal-cannabis-product-list','authority_register_snapshot','published','SAS/AP Category 2. Sponsor: Indica Industries Pty Ltd. Verify live TGA list.', now())
) as v(country_iso2, authority, registration_code, brand_name, product_name,
       strength_label, dosage_form, route, cannabinoid_profile, authorization_status,
       source_url, source_type, review_status, notes, last_seen_at)
where not exists (
  select 1 from public.clinical_formulary_skus s
  where s.country_iso2 = v.country_iso2 and s.authority = v.authority and s.product_name = v.product_name
);

SELECT count(*) FILTER (WHERE authority='ANVISA') AS anvisa_skus,
       count(*) FILTER (WHERE authority='TGA') AS tga_skus
FROM public.clinical_formulary_skus WHERE review_status='published';
