-- Authority evidence tranche 005.
-- Official current government/regulator sources; no parent-jurisdiction inheritance.

insert into public.jurisdiction_regulators
(jurisdiction_key,regulator_name,regulator_type,authority_scope,source_url,effective_from,verification_status,verified_at)
values
('US-VA','Virginia Cannabis Control Authority','state_regulator','Regulation and licensing of Virginia cannabis and hemp activities','https://cca.virginia.gov/','2026-08-01','verified','2026-09-23T00:00:00Z'),
('US-AL','Alabama Medical Cannabis Commission','state_regulator','Licensing and regulation of Alabama medical cannabis establishments','https://amcc.alabama.gov/','2021-05-17','verified','2026-09-23T00:00:00Z'),
('US-AR','Arkansas Department of Finance and Administration, Alcoholic Beverage Control Division','state_regulator','Licensing and regulation of Arkansas medical marijuana cultivation, processing, dispensary and testing activities','https://www.dfa.arkansas.gov/alcoholic-beverage-control/medical-marijuana/','2016-11-08','verified','2026-09-23T00:00:00Z'),
('US-AZ','Arizona Department of Health Services','state_regulator','Arizona medical marijuana program and related regulatory oversight','https://www.azdhs.gov/licensing/medical-marijuana/','2010-11-02','verified','2026-09-23T00:00:00Z'),
('US-DE','Delaware Division of Cannabis Regulation','state_regulator','Licensing and regulation of Delaware adult-use cannabis establishments','https://cannabis.delaware.gov/','2023-04-23','verified','2026-09-23T00:00:00Z')
on conflict (jurisdiction_key,regulator_name) do update set
 regulator_type=excluded.regulator_type, authority_scope=excluded.authority_scope,
 source_url=excluded.source_url, effective_from=excluded.effective_from,
 verification_status=excluded.verification_status, verified_at=excluded.verified_at,
 updated_at=now();

insert into public.jurisdiction_regulatory_rules
(jurisdiction_key,rule_dimension,rule_type,rule_value,source_url,effective_from,verification_status,verified_at)
values
('US-VA','commercial_activity','future_adult_use_retail_market','{"regulated_retail_sales_begin":"2027-07-01","retail_market_authorized":true}'::jsonb,'https://www.vdacs.virginia.gov/press-releases-260701-virginias-new-marijuana-hemp-laws.shtml','2026-07-01','verified','2026-09-23T00:00:00Z'),
('US-VA','access_rules','medical_program','{"medical_cannabis_program_exists":true}'::jsonb,'https://cca.virginia.gov/','2026-08-01','verified','2026-09-23T00:00:00Z'),
('US-AL','commercial_activity','medical_market','{"medical_cannabis_establishments_are_state_licensed":true}'::jsonb,'https://amcc.alabama.gov/','2021-05-17','verified','2026-09-23T00:00:00Z'),
('US-AR','commercial_activity','medical_market','{"medical_marijuana_businesses_are_licensed":true}'::jsonb,'https://www.dfa.arkansas.gov/alcoholic-beverage-control/medical-marijuana/','2016-11-08','verified','2026-09-23T00:00:00Z'),
('US-AZ','access_rules','medical_program','{"medical_marijuana_program":true}'::jsonb,'https://www.azdhs.gov/licensing/medical-marijuana/','2010-11-02','verified','2026-09-23T00:00:00Z'),
('US-DE','commercial_activity','adult_use_licensing','{"adult_use_cannabis_establishments_require_state_licensing":true}'::jsonb,'https://cannabis.delaware.gov/','2023-04-23','verified','2026-09-23T00:00:00Z')
on conflict do nothing;

comment on table public.jurisdiction_regulators is 'Authority evidence tranche 005: Virginia, Alabama, Arkansas, Arizona and Delaware; Virginia current 2026 retail milestone captured as structured calendar evidence.';
