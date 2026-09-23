-- Authority evidence tranche 002.
-- Facts are limited to official government/regulator publications and remain
-- jurisdiction-specific. Empty jurisdictions remain unresolved.
insert into public.jurisdiction_regulators
(jurisdiction_key,regulator_name,regulator_type,authority_scope,source_url,effective_from,verification_status,verified_at)
values
('US-CA','California Department of Cannabis Control','state_regulator','Licensing and regulation of commercial cannabis activity in California','https://cannabis.ca.gov/','2018-01-01','verified','2026-09-23T00:00:00Z'),
('US-CO','Colorado Marijuana Enforcement Division','state_regulator','Licensing and regulation of Colorado marijuana businesses','https://med.colorado.gov/','2010-07-01','verified','2026-09-23T00:00:00Z'),
('US-MA','Massachusetts Cannabis Control Commission','state_regulator','Regulation and licensing of adult-use and medical cannabis establishments','https://masscannabiscontrol.com/','2017-12-15','verified','2026-09-23T00:00:00Z'),
('US-NY','New York Office of Cannabis Management','state_regulator','Licensing and regulation of adult-use, medical and cannabinoid cannabis programs','https://cannabis.ny.gov/','2021-03-31','verified','2026-09-23T00:00:00Z'),
('US-IL','Illinois Department of Financial and Professional Regulation','state_regulator','Regulation and licensing of cannabis dispensaries and professional cannabis activities','https://idfpr.illinois.gov/profs/cannabis.html','2020-01-01','verified','2026-09-23T00:00:00Z'),
('US-MI','Michigan Cannabis Regulatory Agency','state_regulator','Regulation and licensing of Michigan cannabis establishments','https://www.michigan.gov/cra','2018-12-06','verified','2026-09-23T00:00:00Z'),
('US-NJ','New Jersey Cannabis Regulatory Commission','state_regulator','Regulation and licensing of adult-use and medicinal cannabis businesses','https://www.nj.gov/cannabis/','2021-04-21','verified','2026-09-23T00:00:00Z'),
('US-OH','Ohio Division of Cannabis Control','state_regulator','Regulation and licensing of adult-use and medical marijuana operators','https://com.ohio.gov/divisions-and-programs/cannabis-control','2016-06-08','verified','2026-09-23T00:00:00Z'),
('US-PA','Pennsylvania Department of Health','state_regulator','Administration and regulation of the Pennsylvania medical marijuana program','https://www.pa.gov/agencies/health/programs/medical-marijuana','2016-04-17','verified','2026-09-23T00:00:00Z'),
('US-FL','Florida Department of Health Office of Medical Marijuana Use','state_regulator','Regulation and licensing of Florida medical marijuana treatment centers','https://knowthefactsmmj.com/','2017-06-23','verified','2026-09-23T00:00:00Z'),
('CA-ON','Alcohol and Gaming Commission of Ontario','provincial_regulator','Retail cannabis store licensing and authorization in Ontario','https://www.agco.ca/cannabis','2018-10-17','verified','2020-01-01','verified','2026-09-23T00:00:00Z'),
('CA-BC','Liquor and Cannabis Regulation Branch','provincial_regulator','Licensing and regulation of non-medical cannabis retail and production-related activities in British Columbia','https://www2.gov.bc.ca/gov/content/safety/public-safety/cannabis','2018-10-17','verified','2026-09-23T00:00:00Z'),
('CA-AB','Alberta Gaming, Liquor and Cannabis','provincial_regulator','Cannabis retail licensing and provincial cannabis regulatory oversight','https://aglc.ca/cannabis','2018-10-17','verified','2026-09-23T00:00:00Z'),
('CA-QC','Société québécoise du cannabis / Government of Quebec','provincial_authority','Provincial cannabis retail framework and public cannabis distribution','https://www.quebec.ca/en/health/advice-and-prevention/alcohol-drugs-gambling/cannabis','2018-10-17','verified','2026-09-23T00:00:00Z'),
('AU-NSW','NSW Health','state_regulator','Medicinal cannabis and therapeutic goods regulatory oversight in New South Wales','https://www.health.nsw.gov.au/pharmaceutical/Pages/cannabis.aspx','2016-01-01','verified','2026-09-23T00:00:00Z'),
('AU-VIC','Department of Health Victoria','state_regulator','Victorian medicinal cannabis and drugs regulatory oversight','https://www.health.vic.gov.au/drugs-and-poisons/medicinal-cannabis','2016-02-01','verified','2026-09-23T00:00:00Z'),
('AU-QLD','Queensland Health','state_regulator','Queensland medicinal cannabis and controlled drugs oversight','https://www.health.qld.gov.au/public-health/topics/medicinal-cannabis','2017-01-01','verified','2026-09-23T00:00:00Z'),
('AU-WA','Department of Health Western Australia','state_regulator','Western Australian medicinal cannabis and poisons regulatory oversight','https://www.health.wa.gov.au/Articles/J_M/Medicinal-cannabis','2016-01-01','verified','2026-09-23T00:00:00Z'),
('AU-SA','SA Health','state_regulator','South Australian controlled drugs and medicinal cannabis oversight','https://www.sahealth.sa.gov.au/','2016-01-01','verified','2026-09-23T00:00:00Z')
on conflict (jurisdiction_key,regulator_name) do update set
 regulator_type=excluded.regulator_type, authority_scope=excluded.authority_scope,
 source_url=excluded.source_url, effective_from=excluded.effective_from,
 verification_status=excluded.verification_status, verified_at=excluded.verified_at,
 updated_at=now();

insert into public.jurisdiction_regulatory_rules
(jurisdiction_key,rule_dimension,rule_type,rule_value,source_url,effective_from,verification_status,verified_at)
values
('US-CA','commercial_activity','commercial_license_required','{"commercial_cannabis_activity_requires_state_license":true}'::jsonb,'https://cannabis.ca.gov/applicants/','2018-01-01','verified','2026-09-23T00:00:00Z'),
('US-CO','commercial_activity','commercial_license_required','{"marijuana_businesses_are_regulated_and_licensed":true}'::jsonb,'https://med.colorado.gov/','2010-07-01','verified','2026-09-23T00:00:00Z'),
('US-NY','commercial_activity','licensed_market','{"adult_use_cannabis_businesses_require_ocm_authorization":true}'::jsonb,'https://cannabis.ny.gov/','2021-03-31','verified','2026-09-23T00:00:00Z'),
('US-MA','commercial_activity','licensed_market','{"adult_use_and_medical_cannabis_establishments_are_regulated":true}'::jsonb,'https://masscannabiscontrol.com/','2017-12-15','verified','2026-09-23T00:00:00Z'),
('US-NJ','commercial_activity','licensed_market','{"adult_use_and_medical_cannabis_businesses_are_regulated":true}'::jsonb,'https://www.nj.gov/cannabis/businesses/','2021-04-21','verified','2026-09-23T00:00:00Z'),
('US-PA','access_rules','medical_program','{"medical_marijuana_program":true}'::jsonb,'https://www.pa.gov/agencies/health/programs/medical-marijuana','2016-04-17','verified','2026-09-23T00:00:00Z'),
('CA-ON','commercial_activity','retail_authorization','{"authorized_private_retail_stores":true,"provincial_retail_regulator":"AGCO"}'::jsonb,'https://www.agco.ca/cannabis','2018-10-17','verified','2026-09-23T00:00:00Z'),
('CA-BC','commercial_activity','retail_authorization','{"licensed_private_cannabis_retail":true}'::jsonb,'https://www2.gov.bc.ca/gov/content/safety/public-safety/cannabis','2018-10-17','verified','2026-09-23T00:00:00Z'),
('CA-AB','commercial_activity','retail_authorization','{"licensed_private_cannabis_retail":true}'::jsonb,'https://aglc.ca/cannabis','2018-10-17','verified','2026-09-23T00:00:00Z'),
('CA-QC','commercial_activity','public_retail_model','{"provincial_public_cannabis_retailer":"SQDC"}'::jsonb,'https://www.quebec.ca/en/health/advice-and-prevention/alcohol-drugs-gambling/cannabis','2018-10-17','verified','2026-09-23T00:00:00Z'),
('AU-NSW','access_rules','medicinal_cannabis_state_oversight','{"state_poison_regulation_applies":true}'::jsonb,'https://www.health.nsw.gov.au/pharmaceutical/Pages/cannabis.aspx','2016-01-01','verified','2026-09-23T00:00:00Z'),
('AU-VIC','access_rules','medicinal_cannabis_state_oversight','{"state_drug_and_poison_regulation_applies":true}'::jsonb,'https://www.health.vic.gov.au/drugs-and-poisons/medicinal-cannabis','2016-02-01','verified','2026-09-23T00:00:00Z')
on conflict do nothing;

comment on table public.jurisdiction_regulators is 'Authority evidence tranche 002: U.S. states, Canadian provinces and Australian states, sourced from official regulator/government domains.';
