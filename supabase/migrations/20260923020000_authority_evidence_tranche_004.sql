-- Authority evidence tranche 004.
-- Official state sources verified 2026-09-23.

insert into public.jurisdiction_regulators
(jurisdiction_key,regulator_name,regulator_type,authority_scope,source_url,effective_from,verification_status,verified_at)
values
('US-NV','Nevada Cannabis Compliance Board','state_regulator','Licensing and regulation of Nevada cannabis industry operations','https://ccb.nv.gov/','2019-06-12','verified','2026-09-23T00:00:00Z'),
('US-MN','Minnesota Office of Cannabis Management','state_regulator','Oversight, licensing and regulation of Minnesota cannabis and hemp industry','https://mn.gov/ocm/','2023-05-30','verified','2026-09-23T00:00:00Z'),
('US-MO','Missouri Department of Health and Senior Services, Division of Cannabis Regulation','state_regulator','Licensing and regulation of medical and adult-use marijuana in Missouri','https://health.mo.gov/business-professionals/cannabis-regulation/','2018-11-06','verified','2026-09-23T00:00:00Z'),
('US-NM','New Mexico Regulation and Licensing Department, Cannabis Control Division','state_regulator','Licensing and compliance under the Cannabis Regulation Act and Lynn and Erin Compassion Use Act','https://www.rld.nm.gov/cannabis/','2021-06-29','verified','2026-09-23T00:00:00Z')
on conflict (jurisdiction_key,regulator_name) do update set
 regulator_type=excluded.regulator_type, authority_scope=excluded.authority_scope,
 source_url=excluded.source_url, effective_from=excluded.effective_from,
 verification_status=excluded.verification_status, verified_at=excluded.verified_at,
 updated_at=now();

insert into public.jurisdiction_regulatory_rules
(jurisdiction_key,rule_dimension,rule_type,rule_value,source_url,effective_from,verification_status,verified_at)
values
('US-NV','commercial_activity','licensed_market','{"state_license_required_for_cannabis_operations":true,"licensed_activities":["cultivation","manufacturing","testing","distribution","retail"]}'::jsonb,'https://ccb.nv.gov/industry/','2019-06-12','verified','2026-09-23T00:00:00Z'),
('US-NV','packaging_labeling','regulated_packaging_labeling','{"packaging_and_labeling_rules_are_administered_under_cannabis_regulations":true}'::jsonb,'https://ccb.nv.gov/laws-regulations/','2019-06-12','verified','2026-09-23T00:00:00Z'),
('US-MN','commercial_activity','licensed_market','{"adult_use_cannabis_industry_has_state_licensing_and_regulation":true}'::jsonb,'https://mn.gov/ocm/laws/cannabis-law.jsp','2023-05-30','verified','2026-09-23T00:00:00Z'),
('US-MN','testing','testing_and_labeling_required','{"cannabis_and_hemp_products_require_testing_and_labeling":true}'::jsonb,'https://mn.gov/ocm/laws/cannabis-law.jsp','2023-05-30','verified','2026-09-23T00:00:00Z'),
('US-MO','commercial_activity','licensed_medical_and_adult_use_market','{"medical_and_adult_use_marijuana_are_licensed_and_regulated":true}'::jsonb,'https://health.mo.gov/business-professionals/cannabis-regulation/cannabis-rules-and-law','2018-11-06','verified','2026-09-23T00:00:00Z'),
('US-MO','calendar','current_rules_effective','{"rule_set":"19 CSR 100-1","effective_date":"2026-05-30"}'::jsonb,'https://health.mo.gov/business-professionals/cannabis-regulation/cannabis-rules-and-law','2026-05-30','verified','2026-09-23T00:00:00Z'),
('US-NM','commercial_activity','licensed_market','{"cannabis_control_division_oversees_licensing_and_compliance":true}'::jsonb,'https://www.nm.gov/departments-and-agencies/regulation-and-licensing-department/','2021-06-29','verified','2026-09-23T00:00:00Z')
on conflict do nothing;

comment on table public.jurisdiction_regulators is 'Authority evidence tranche 004: Nevada, Minnesota, Missouri and New Mexico official state authorities.';
