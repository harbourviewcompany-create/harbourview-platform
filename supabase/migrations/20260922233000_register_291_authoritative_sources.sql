-- Register newly verified authoritative source endpoints used by the
-- 291-jurisdiction evidence acquisition pipeline.
-- Runtime snapshots remain data, not embedded migration fixtures.

begin;

insert into public.source_registry
(source_name,source_url,jurisdiction,country,is_active,iso,requires_translation,notes,region,language,adapter,crawl_cadence,relevance_status,jurisdiction_code,tier,requires_auth,crawl_allowed,regulator_class,source_type)
values
('UAE Legislation — Federal Decree-Law on Combating Narcotics','https://uaelegislation.gov.ae/en/legislations/1540','United Arab Emirates','United Arab Emirates',true,'AE',false,'Official UAE legislation; active federal narcotics law.','Asia','en','html_snapshot','daily','active','AE',1,false,true,'drug_control_authority','official_legal'),
('Albania National Agency for Cannabis Control','https://nacc.gov.al/en/faq/','Albania','Albania',true,'AL',false,'Official cannabis regulator; Law 61/2023 medical and industrial cannabis framework.','Europe','en','html_snapshot','daily','active','AL',1,false,true,'health_authority','official_regulator'),
('Argentina national cannabis framework — Ley 27669','https://www.argentina.gob.ar/normativa/nacional/365303/texto','Argentina','Argentina',true,'AR',false,'Official national law governing medicinal cannabis and industrial hemp production and commercialization.','South America','es','html_snapshot','daily','active','AR',1,false,true,'health_authority','official_legal'),
('Belgium Federal Justice — Cannabis','https://www.justice.belgium.be/fr/themes_et_dossiers/securite_et_criminalite/drogues/cannabis','Belgium','Belgium',true,'BE',true,'Official Federal Justice cannabis rules.','Europe','fr','html_snapshot','daily','active','BE',1,false,true,'drug_control_authority','official_regulator'),
('Barbados National Council on Substance Abuse — Medical Cannabis Industry Act','https://ncsa.gov.bb/Library/Legislations/Overview.aspx','Barbados','Barbados',true,'BB',false,'Official legislation index including Medical Cannabis Industry Act 2019 and drug-control legislation.','Caribbean','en','html_snapshot','daily','active','BB',1,false,true,'drug_control_authority','official_legal'),
('Azerbaijan Ministry of Internal Affairs — Narcotics Control Law','https://mia.gov.az/en/legislation/1/view/44/','Azerbaijan','Azerbaijan',true,'AZ',false,'Official narcotics-control law covering plants containing narcotic substances and cultivation restrictions.','Asia','en','html_snapshot','daily','active','AZ',1,false,true,'drug_control_authority','official_legal'),
('Antigua and Barbuda Laws — Cannabis Amendment Bill','https://laws.gov.ag/bills/','Antigua and Barbuda','Antigua and Barbuda',true,'AG',false,'Official legislation portal listing the Cannabis Amendment Bill 2026.','Caribbean','en','html_snapshot','daily','active','AG',1,false,true,'legislature','official_legal'),
('Bangladesh Laws — Narcotics Control Act 2018','https://bdlaws.minlaw.gov.bd/act-1276/act-chapter-print-2155.html','Bangladesh','Bangladesh',true,'BD',false,'Official Bangladesh laws portal for the Narcotics Control Act 2018.','Asia','bn','html_snapshot','daily','active','BD',1,false,true,'drug_control_authority','official_legal'),
('Bahamas Office of the Prime Minister — Cannabis Bahamas','https://opm.gov.bs/cannabis-bahamas/','Bahamas','Bahamas',true,'BS',false,'Official government cannabis framework and licensing information.','Caribbean','en','html_snapshot','daily','active','BS',1,false,true,'health_authority','official_government'),
('Botswana Parliament — Cannabis Bill 2025','https://www.parliament.gov.bw/documents/ORDPAP----14-08-25_02_49_19_20_08_2025.pdf','Botswana','Botswana',true,'BW',false,'Official Parliament bill establishing medicinal/scientific/research/industrial cannabis licensing framework.','Africa','en','html_snapshot','daily','active','BW',1,false,true,'legislature','official_legal'),
('Bhutan Office of Attorney General — Narcotic Drugs Act','https://oag.gov.bt/language/en/resources/acts-2/','Bhutan','Bhutan',true,'BT',false,'Official legislation index listing current narcotic-drug statutes.','Asia','en','html_snapshot','daily','active','BT',1,false,true,'drug_control_authority','official_legal'),
('Bolivia Dirección General de Sustancias Controladas — Laws','https://dgsc.gob.bo/leyes.php','Bolivia','Bolivia',true,'BO',false,'Official controlled-substances authority legislation index.','South America','es','html_snapshot','daily','active','BO',1,false,true,'drug_control_authority','official_legal'),
('Brazil ANVISA — Cannabis cultivation controls','https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/rdcs-no-1-012-2026-e-no-1-013-2026','Brazil','Brazil',true,'BR',true,'Official ANVISA 2026 rules for medicinal/pharmaceutical/research cannabis cultivation and authorization.','South America','pt','html_snapshot','daily','active','BR',1,false,true,'health_authority','official_regulator'),
('Cambodia Council for Development of Cambodia — Drug Law','https://cdc.gov.kh/wp-content/uploads/2022/04/Law-on-Drug-Management_full-text_961209.pdf','Cambodia','Cambodia',true,'KH',true,'Official government-hosted drug law; expressly addresses cannabis cultivation and trafficking.','Asia','en','html_snapshot','daily','active','KH',1,false,true,'drug_control_authority','official_legal')
on conflict (source_url) do update set
source_name=excluded.source_name,
jurisdiction_code=excluded.jurisdiction_code,
tier=1,
regulator_class=excluded.regulator_class,
is_active=true,
relevance_status='active',
updated_at=now();

commit;
