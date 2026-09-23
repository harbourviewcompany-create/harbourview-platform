-- First authoritative evidence tranche: authority records and directly supported
-- regulatory rules from current government/regulator publications.
-- No row below is inferred from a secondary tracker.
insert into public.jurisdiction_regulators
  (jurisdiction_key,regulator_name,regulator_type,authority_scope,source_url,effective_from,verification_status,verified_at)
values
('CA','Health Canada','federal_regulator','Cannabis licensing, production, sale for medical purposes, testing, research and federal import/export controls','https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/laws-regulations/regulations-support-cannabis-act.html','2019-10-17','verified','2026-09-23T00:00:00Z'),
('DE','Federal Ministry of Health (BMG)','federal_government_authority','Cannabis Act framework including adult personal cultivation, cultivation associations and medical cannabis','https://www.bundesgesundheitsministerium.de/service/gesetze-und-verordnungen/detail/cannabisgesetz','2024-04-01','verified','2026-09-23T00:00:00Z'),
('NL','Ministry of Health, Welfare and Sport','federal_government_authority','Controlled Cannabis Supply Chain Experiment governing designated production, distribution and sale','https://www.government.nl/themes/family-health-and-care/controlled-cannabis-supply-chain-experiment','2025-04-07','verified','2026-09-23T00:00:00Z'),
('UY','Institute for the Regulation and Control of Cannabis (IRCCA)','national_regulator','Cannabis licensing, registered users and regulated adult-use, medical, industrial and research activities','https://ircca.gub.uy/','2013-05-20','verified','2026-09-23T00:00:00Z'),
('AU','Office of Drug Control (ODC)','federal_regulator','Medicinal cannabis cultivation, manufacture, import and export licensing and permits','https://www.odc.gov.au/medicinal-cannabis','2016-02-01','verified','2026-09-23T00:00:00Z'),
('AU','Therapeutic Goods Administration (TGA)','federal_regulator','Medicinal cannabis therapeutic-goods access pathways and supply controls','https://www.tga.gov.au/accessing-medicinal-cannabis-patient','2026-02-27','verified','2026-09-23T00:00:00Z'),
('NZ','Medicinal Cannabis Agency, Ministry of Health','federal_regulator','Medicinal cannabis licensing, minimum quality standard and prescription access','https://www.health.govt.nz/regulation-legislation/medicinal-cannabis','2019-04-01','verified','2026-09-23T00:00:00Z'),
('MT','Authority for the Responsible Use of Cannabis','national_regulator','Responsible-use cannabis authority and regulated association framework','https://www.gov.mt/en/Government/DOI/Government%20Gazette/Government%20Notices/Pages/2026/02/GovNotices2402.aspx','2026-02-18','verified','2026-09-23T00:00:00Z'),
('GB','Home Office','national_regulator','Controlled-drug licensing for cannabis and cannabis-based products for medicinal use; national cannabis agency','https://www.gov.uk/guidance/controlled-drugs-domestic-licences','2015-01-01','verified','2026-09-23T00:00:00Z')
on conflict (jurisdiction_key,regulator_name) do update set
  regulator_type=excluded.regulator_type,
  authority_scope=excluded.authority_scope,
  source_url=excluded.source_url,
  effective_from=excluded.effective_from,
  verification_status=excluded.verification_status,
  verified_at=excluded.verified_at,
  updated_at=now();

insert into public.jurisdiction_regulatory_rules
  (jurisdiction_key,rule_dimension,rule_type,rule_value,source_url,effective_from,verification_status,verified_at)
values
('CA','commercial_activity','licensing_required','{"activities":["cultivation","processing","sale_for_medical_purposes","analytical_testing","research"]}'::jsonb,'https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/laws-regulations/regulations-support-cannabis-act.html','2019-10-17','verified','2026-09-23T00:00:00Z'),
('CA','import','permit_required','{"purposes":["medical","scientific"],"shipment_permit_required":true}'::jsonb,'https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/industry-licensees-applicants/applying-licence.html','2019-10-17','verified','2026-09-23T00:00:00Z'),
('CA','export','permit_required','{"purposes":["medical","scientific"],"shipment_permit_required":true}'::jsonb,'https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/industry-licensees-applicants/applying-licence.html','2019-10-17','verified','2026-09-23T00:00:00Z'),
('CA','packaging_labeling','mandatory_requirements','{"plain_packaging":true,"health_warnings":true,"standardized_cannabis_symbol":true}'::jsonb,'https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/laws-regulations/regulations-support-cannabis-act.html','2019-10-17','verified','2026-09-23T00:00:00Z'),
('AU','import','licence_and_permit','{"licence_required":true,"permit_required_each_shipment":true,"permitted_purposes":["medical","scientific","clinical_trials","laboratory_testing","cultivation"]}'::jsonb,'https://www.odc.gov.au/medicinal-cannabis/importing-medicinal-cannabis-products-australia','2017-07-11','verified','2026-09-23T00:00:00Z'),
('AU','export','licence_and_permit','{"licence_required":true,"permit_required":true,"eligible_products":["medicinal_cannabis_products_under_gmp","export_only_or_artg_products","eligible_extracts"]}'::jsonb,'https://www.odc.gov.au/medicinal-cannabis/exporting-medicinal-cannabis-australia','2017-07-11','verified','2026-09-23T00:00:00Z'),
('AU','access_rules','prescription_pathways','{"pathways":["Special Access Scheme","Authorised Prescriber","Clinical Trial"]}'::jsonb,'https://www.tga.gov.au/accessing-medicinal-cannabis-patient','2026-02-27','verified','2026-09-23T00:00:00Z'),
('NZ','access_rules','prescription_only','{"medicinal_cannabis_prescription_only":true}'::jsonb,'https://www.health.govt.nz/regulation-legislation/medicinal-cannabis/information-for-consumers','2024-05-29','verified','2026-09-23T00:00:00Z'),
('NZ','testing','minimum_quality_standard','{"minimum_quality_standard_required":true,"applies_to_all_suppliers":true}'::jsonb,'https://www.health.govt.nz/regulation-legislation/medicinal-cannabis/information-for-industry/working-with-medicinal-cannabis/requirements-for-the-minimum-quality-standard','2019-04-01','verified','2026-09-23T00:00:00Z'),
('GB','commercial_activity','controlled_drug_licence','{"controlled_drug_licence_required_for":["possess","manufacture","produce","supply","import","export"],"scope":"cannabis_based_products_for_medicinal_use"}'::jsonb,'https://www.gov.uk/guidance/controlled-drugs-domestic-licences','2015-01-01','verified','2026-09-23T00:00:00Z'),
('GB','commercial_activity','cultivation_prohibited','{"cultivation_of_cannabis_offence":true}'::jsonb,'https://www.gov.uk/guidance/controlled-drugs-domestic-licences','2015-01-01','verified','2026-09-23T00:00:00Z'),
('NL','commercial_activity','controlled_supply_chain_experiment','{"production_distribution_sale_quality_controlled":true,"designated_growers":true,"participating_municipalities":true}'::jsonb,'https://www.government.nl/themes/family-health-and-care/controlled-cannabis-supply-chain-experiment','2025-04-07','verified','2026-09-23T00:00:00Z'),
('DE','commercial_activity','regulated_framework','{"adult_personal_cultivation":true,"noncommercial_cultivation_associations":true,"medical_cannabis_regulated":true}'::jsonb,'https://www.bundesgesundheitsministerium.de/service/gesetze-und-verordnungen/detail/cannabisgesetz','2024-04-01','verified','2026-09-23T00:00:00Z'),
('UY','commercial_activity','regulated_cannabis_system','{"licensed_activities":["adult_use_cultivation","medical_cultivation","industrialization","research","analytical_laboratories"]}'::jsonb,'https://ircca.gub.uy/','2013-05-20','verified','2026-09-23T00:00:00Z'),
('MT','regulator','authority_established','{"authority":"Authority for the Responsible Use of Cannabis","board_appointment_effective":"2025-12-02"}'::jsonb,'https://www.gov.mt/en/Government/DOI/Government%20Gazette/Government%20Notices/Pages/2026/03/GovNotices0303.aspx','2025-12-02','verified','2026-09-23T00:00:00Z')
on conflict do nothing;

comment on table public.jurisdiction_regulators is 'Authority evidence populated only from current official government/regulator sources; absence of a row remains a research gap.';
comment on table public.jurisdiction_regulatory_rules is 'Structured authority-backed regulatory facts. Rows are not inherited across jurisdictions and require source provenance.';
