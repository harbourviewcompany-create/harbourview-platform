-- Long-tail jurisdictions with known frameworks: pathway stubs flagged needs_review,
-- feeding v_regulatory_format_stale for the research/verification loop.
insert into public.regulatory_pathways
  (country_id, iso_alpha2, slug, name, pathway_type, legal_basis, regulator, status, summary, verification)
select c.id, v.iso2, v.slug, v.name, v.ptype::public.reg_pathway_type, v.legal, v.reg, v.status, v.summary, 'needs_review'
from (values
('AT','at-magistral','Dronabinol magistral + registered medicines','magistral_compounding','AMG; SMG','BASG','active','Dronabinol compounding widespread; Sativex and Epidyolex registered; herbal flower not dispensed.'),
('BE','be-registered','Registered medicine only (Sativex)','registered_medicine','Royal Decree 2015','FAMHP','active','Sativex the sole medical route; magistral cannabis not permitted.'),
('NO','no-special','Registered medicines + named-patient approvals','special_access_import','Approval exemption scheme','NoMA/DMP','active','Sativex registered; other products case-by-case exemption.'),
('SE','se-license','Registered medicines + licence prescriptions','special_access_import','Licence prescription scheme','Lakemedelsverket','active','Epidyolex/Sativex plus case-by-case licences (incl. Bediol flower historically).'),
('FI','fi-special','Special permit scheme','special_access_import','Fimea special permits','Fimea','active','Case-by-case special permits (Bedrocan flower, Sativex).'),
('HR','hr-medical','Medical cannabis preparations','medical_access_program','2015 ordinance amendments','HALMED','active','THC-containing preparations prescribable; expanding product list.'),
('SI','si-cannabinoids','Cannabinoid medicines pathway','medical_access_program','2017 reclassification','JAZMP','active','Cannabinoid-based medicines prescribable; 2024 referendum supported medical-use expansion.'),
('CY','cy-medical','Medical cannabis law','medical_access_program','2019 law','Ministry of Health','active','Cultivation licensing plus patient access framework.'),
('EE','ee-registered','Registered medicine access','registered_medicine','Case approvals','Ravimiamet','active','Sativex-type access; very limited.'),
('LV','lv-registered','Registered medicine access','registered_medicine',null,'ZVA','active','Extremely limited licensed-medicine-only access.'),
('LT','lt-registered','Registered cannabinoid medicines','registered_medicine','2019 amendment','VVKT','active','Cannabinoid medicines allowed since 2019 law change.'),
('KR','kr-import','Rare-disease import of approved cannabis medicines','special_access_import','2018 Narcotics Act amendment','MFDS/KODC','active','Epidiolex/Sativex-type imports via Korea Orphan Drug Center on physician application.'),
('TR','tr-registered','Registered sublingual/oromucosal products + state hemp','registered_medicine','2016 regulation','TITCK/TMO','active','Sativex-type products only; state-controlled cultivation for pharma.'),
('PE','pe-medical','Medical cannabis law','medical_access_program','Law 30681 (2017); DS 005-2019','DIGEMID','active','Registered products and magistral preparations via licensed pharmacies; patient registry.'),
('CL','cl-medical','Medical access via registered products and magistral','medical_access_program','Law 20.000 framework; Decree 84/2015','ISP','active','Pharmacy products (e.g. Sativex-type) and magistral preparations on prescription.'),
('EC','ec-hemp-medical','Medicinal/hemp framework (<=1% THC)','low_thc_consumer','2019 penal reform; 2020 regs','ARCSA/MAG','active','Non-psychoactive cannabis (<=1% THC) for medicinal/industrial use.'),
('PA','pa-medical','Medicinal cannabis law','medical_access_program','Law 242 (2021)','MINSA','active','Medicinal use framework; licensing rollout gradual.'),
('PY','py-medical','Medicinal cannabis + hemp export','medical_access_program','Law 6007/2017','DINAVISA','active','Domestic program plus industrial hemp exports.'),
('CR','cr-medical','Medicinal cannabis and hemp law','medical_access_program','Law 10113 (2022)','Ministry of Health','active','Medicinal use and hemp production legalized; implementing regs phased.'),
('BB','bb-medical','Medicinal cannabis industry','medical_access_program','Medicinal Cannabis Industry Act 2019','BMCLA','active','Licensed cultivation and patient access (flower, oils).'),
('JM','jm-framework','Medical/therapeutic licensing + decrim','medical_access_program','Dangerous Drugs Amendment Act 2015','CLA','active','Licensed cultivation, herb houses, therapeutic dispensing; possession <=2oz decriminalized; sacramental use protected.'),
('TT','tt-decrim-medical','Decriminalization + medical framework','adult_use_noncommercial','Dangerous Drugs Amendment 2019; Cannabis Control Act 2019','TTCLA','active','30g possession decriminalized, 4 plants; commercial licensing under Cannabis Control Act rolling out.'),
('GE','ge-personal','Personal consumption legal, no market','adult_use_noncommercial','Constitutional Court 2018','n/a','active','Use/possession decriminalized-to-legal for personal amounts; cultivation and sales prohibited.'),
('LS','ls-export','Licensed cultivation for export','export_oriented','Drugs of Abuse Act licensing (2017)','Ministry of Health','active','First African medical-cannabis licensing regime; EU-GMP export operators.'),
('ZW','zw-export','Licensed medicinal/industrial production','export_oriented','SI 62/2018','MCAZ','active','Export-focused cultivation licensing; industrial hemp expansion.'),
('UG','ug-export','Licensed cultivation for export','export_oriented','Narcotics Act 2023 framework','NDA','active','Export licences to regulated markets (DE, IL).'),
('RW','rw-export','High-value therapeutic crop export program','export_oriented','2021 ministerial order','Rwanda FDA/NAEB','active','Export-only cultivation regime.'),
('MW','mw-export','Cannabis Regulation Act (medicinal/industrial)','export_oriented','Cannabis Regulation Act 2020','Cannabis Regulatory Authority','active','Licensed medicinal and industrial cultivation, export-oriented.'),
('GH','gh-hemp','Industrial/medicinal hemp (<=0.3% THC)','low_thc_consumer','Narcotics Control Commission Act 2020 s43','NACOC','active','Licences for cultivation of <=0.3% THC cannabis for industrial/medicinal purposes.'),
('IN','in-limited','State bhang exemptions + research/AYUSH products','low_thc_consumer','NDPS Act 1985 (leaf exemption); state excise','State authorities','active','Bhang (leaf) regulated by states; cannabis-leaf AYUSH products; flower/resin prohibited.'),
('LB','lb-medical','Medicinal/industrial cultivation law (unimplemented)','export_oriented','Law 178/2020','Regulatory authority pending','announced','2020 law legalized medicinal/industrial cultivation; regulatory authority never stood up - not operational.'),
('SK','sk-cbd','CBD descheduled','low_thc_consumer','2021 amendment removing CBD from psychotropics','SIDC','active','CBD products lawful; no medical cannabis program.'),
('NG','ng-status','No lawful cannabis pathway','research_only','NDLEA Act','NDLEA','active','Prohibited; periodic hemp policy debate only.'),
('ID','id-status','No lawful cannabis pathway','research_only','Law 35/2009','BNN','active','Strict prohibition; 2022 court ruling ordered medical-use research review.'),
('SG','sg-status','No lawful cannabis pathway (pharma exception theoretical)','research_only','Misuse of Drugs Act','CNB/HSA','active','Strict prohibition; cannabinoid pharmaceuticals only via exceptional HSA channels.')
) as v(iso2, slug, name, ptype, legal, reg, status, summary)
join public.countries c on c.iso_alpha2 = v.iso2;

-- Minimal rules for stubs where format detail is well established
insert into public.pathway_format_rules (pathway_id, format_id, status, notes, verification)
select p.id, f.id, v.status::public.reg_rule_status, v.notes, 'needs_review'
from (values
('at-magistral','isolates','permitted','Dronabinol compounding'),
('at-magistral','oral_oil','permitted','Dronabinol drops; Epidyolex'),
('at-magistral','dried_flower','prohibited','Flower not dispensed'),
('be-registered','oromucosal_spray','permitted','Sativex'),
('kr-import','oral_oil','permitted','Epidiolex-type imports'),
('kr-import','oromucosal_spray','permitted','Sativex-type imports'),
('jm-framework','dried_flower','permitted','Licensed herb houses / therapeutic dispensing'),
('jm-framework','extracts_concentrates','permitted',null),
('jm-framework','oral_oil','permitted',null),
('pe-medical','oral_oil','permitted','Registered + magistral'),
('pe-medical','magistral_preparations','permitted',null),
('cl-medical','oral_oil','permitted',null),
('cl-medical','magistral_preparations','permitted',null),
('bb-medical','dried_flower','permitted',null),
('bb-medical','oral_oil','permitted',null),
('tt-decrim-medical','seeds_plants','permitted','4 plants per adult'),
('tt-decrim-medical','dried_flower','permitted','30g decriminalized possession'),
('ls-export','bulk_api_raw','permitted','EU-GMP export flower/extract'),
('ls-export','dried_flower','permitted','Export'),
('zw-export','bulk_api_raw','permitted',null),
('ug-export','bulk_api_raw','permitted',null),
('rw-export','bulk_api_raw','permitted',null),
('mw-export','bulk_api_raw','permitted',null),
('in-limited','edibles','restricted','Bhang preparations under state excise rules'),
('sk-cbd','oral_oil','permitted','CBD products')
) as v(pslug, fslug, status, notes)
join public.regulatory_pathways p on p.slug = v.pslug
join public.product_formats f on f.slug = v.fslug;