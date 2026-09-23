-- Authority evidence tranche 003.
-- Official state-government sources only. Precise effective dates are recorded
-- only where supported by the cited source; otherwise NULL.

insert into public.jurisdiction_regulators
(jurisdiction_key,regulator_name,regulator_type,authority_scope,source_url,effective_from,verification_status,verified_at)
values
('US-CT','Connecticut Department of Consumer Protection','state_regulator','Licensing and regulation of medical and adult-use cannabis establishments','https://portal.ct.gov/cannabis/knowledge-base/articles/licensing/licensing-home-page','2021-06-22','verified','2026-09-23T00:00:00Z'),
('US-MD','Maryland Cannabis Administration','state_regulator','Regulation and licensing of cultivation, manufacturing, testing and distribution of medical and adult-use cannabis','https://cannabis.maryland.gov/Pages/contactus.aspx',null,'verified','2026-09-23T00:00:00Z'),
('US-ME','Maine Office of Cannabis Policy','state_regulator','Licensing, compliance and oversight of medical and adult-use cannabis programs','https://www.maine.gov/dafs/ocp/about','2019-02-01','verified','2026-09-23T00:00:00Z'),
('US-OR','Oregon Liquor and Cannabis Commission','state_regulator','Licensing and regulation of recreational marijuana and cannabis activity','https://www.oregon.gov/olcc/marijuana/pages/default.aspx',null,'verified','2026-09-23T00:00:00Z'),
('US-WA','Washington State Liquor and Cannabis Board','state_regulator','State cannabis licensing and regulatory oversight, with Department of Health and Agriculture roles for specific programs','https://lcb.wa.gov/cannabis',null,'verified','2026-09-23T00:00:00Z')
on conflict (jurisdiction_key,regulator_name) do update set
 regulator_type=excluded.regulator_type, authority_scope=excluded.authority_scope,
 source_url=excluded.source_url, effective_from=excluded.effective_from,
 verification_status=excluded.verification_status, verified_at=excluded.verified_at,
 updated_at=now();

insert into public.jurisdiction_regulatory_rules
(jurisdiction_key,rule_dimension,rule_type,rule_value,source_url,effective_from,verification_status,verified_at)
values
('US-CT','commercial_activity','licensed_adult_use_market','{"adult_use_sales_at_licensed_retailers":true,"medical_program_continues":true}'::jsonb,'https://portal.ct.gov/cannabis','2021-06-22','verified','2026-09-23T00:00:00Z'),
('US-CT','testing','regulated_testing','{"cultivation_manufacturing_testing_transport_and_sale_are_regulated":true}'::jsonb,'https://portal.ct.gov/cannabis/knowledge-base/articles/cannabis-laws','2026-05-22','verified','2026-09-23T00:00:00Z'),
('US-MD','commercial_activity','licensed_market','{"medical_and_adult_use_cannabis_industry_is_regulated":true,"licensed_business_categories":["cultivation","manufacture","testing","distribution"]}'::jsonb,'https://cannabis.maryland.gov/Pages/contactus.aspx',null,'verified','2026-09-23T00:00:00Z'),
('US-ME','commercial_activity','licensed_adult_use_market','{"licensed_activities":["cultivation","manufacturing","retail","testing"]}'::jsonb,'https://www.maine.gov/dafs/ocp/adult-use','2020-09-08','verified','2026-09-23T00:00:00Z'),
('US-ME','testing','mandatory_contaminant_testing','{"mandatory_contaminant_testing":true,"statewide_inventory_tracking":true}'::jsonb,'https://www.maine.gov/dafs/ocp/adult-use',null,'verified','2026-09-23T00:00:00Z'),
('US-OR','commercial_activity','licensed_market','{"license_application_and_renewal_available":true}'::jsonb,'https://www.oregon.gov/olcc/marijuana/pages/default.aspx',null,'verified','2026-09-23T00:00:00Z'),
('US-OR','commercial_activity','regulated_adult_use','{"cannabis_regulation_statute":"ORS Chapter 475C","adult_use_rules":"OAR Chapter 845 Divisions 25 and 26"}'::jsonb,'https://www.oregon.gov/olcc/marijuana/Pages/Recreational-Marijuana-Laws-and-Rules.aspx',null,'verified','2026-09-23T00:00:00Z'),
('US-WA','access_rules','medical_cannabis_program','{"medical_cannabis_producers_processors_and_stores_are_subject_to_strict_regulation":true}'::jsonb,'https://doh.wa.gov/you-and-your-family/cannabis/medical-cannabis','2016-07-01','verified','2026-09-23T00:00:00Z')
on conflict do nothing;

comment on table public.jurisdiction_regulators is 'Authority evidence tranche 003: additional U.S. state authorities and structured regulatory facts from official state sources.';
