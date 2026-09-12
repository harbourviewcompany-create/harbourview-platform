-- Continuation of 20260903100100 -- adds 49 more countries to
-- country_cannabis_legal_status, bringing total coverage to 90 of ~195.
-- Same scope disclosure applies: general research pass on well-documented
-- markets, not an individually-exhaustive legal audit. 105 countries
-- remain unresearched after this batch.
--
-- Already applied directly to the live project this session.

insert into public.country_cannabis_legal_status (iso2, country_name, legal_status, notes) values
('IT','Italy','medical_only','Prescription-based medical cannabis program; low-THC hemp products widely sold; recreational use not legal.'),
('ES','Spain','recreational_noncommercial','Private cannabis social clubs and home cultivation tolerated under a legal grey area; no licensed commercial retail.'),
('BE','Belgium','medical_only','Narrow medical access program; small personal possession has some tolerance in practice; recreational sale not legal.'),
('AT','Austria','medical_only','Prescription-based medical cannabis; CBD products widely available; recreational use not legal.'),
('GR','Greece','medical_only','Medical cannabis legal by prescription; licensed cultivation for medical/export exists; recreational use not legal.'),
('IE','Ireland','medical_only','Limited access medical cannabis programme; recreational use not legal.'),
('SI','Slovenia','medical_only','Medical cannabis legal by prescription; recreational use not legal.'),
('SK','Slovakia','medical_only','Very limited medical cannabis access; recreational use not legal.'),
('EE','Estonia','medical_only','Narrow medical cannabis access; recreational use not legal.'),
('LV','Latvia','medical_only','Very limited medical cannabis access; recreational use not legal.'),
('LT','Lithuania','medical_only','Narrow medical cannabis access; recreational use not legal.'),
('RO','Romania','medical_only','Restrictive medical cannabis framework; recreational use not legal.'),
('BG','Bulgaria','medical_only','Very limited/narrow medical access; recreational use not legal.'),
('NO','Norway','medical_only','Limited medical cannabis access via named-patient scheme; recreational use not legal.'),
('SE','Sweden','medical_only','Very restrictive medical cannabis access; recreational use not legal.'),
('IS','Iceland','medical_only','Very limited medical cannabis access; recreational use not legal.'),
('MK','North Macedonia','medical_only','Licensed medical cannabis cultivation and a notable export-oriented industry; recreational use not legal.'),
('RS','Serbia','medical_only','Medical cannabis legal by prescription; recreational use not legal.'),
('UA','Ukraine','medical_only','Medical cannabis legalized 2024; recreational use not legal.'),
('TR','Turkey','medical_only','Narrow medical cannabis allowance for specific conditions; industrial hemp permitted; recreational use not legal.'),
('PE','Peru','medical_only','Medical cannabis legal by prescription; recreational use not legal.'),
('PY','Paraguay','medical_only','Medical cannabis legal with a growing licensed export-oriented cultivation industry; recreational use not legal.'),
('PA','Panama','medical_only','Medical cannabis legal by prescription; recreational use not legal.'),
('VE','Venezuela','prohibited','Cannabis illegal; unstable/unclear enforcement environment.'),
('MA','Morocco','medical_only','2021 law permits licensed cultivation for medical, cosmetic, and industrial/export purposes; personal recreational use remains illegal.'),
('ZW','Zimbabwe','medical_only','Licensed medical and export-oriented cannabis cultivation; recreational use not legal.'),
('ZM','Zambia','medical_only','Licensed medical/export-oriented cannabis cultivation; recreational use not legal.'),
('MW','Malawi','medical_only','Licensed industrial hemp and medical cannabis cultivation; recreational use not legal.'),
('RW','Rwanda','medical_only','Licensed medical cannabis cultivation oriented toward export; recreational use not legal.'),
('EG','Egypt','prohibited','Cannabis illegal with severe penalties, strictly enforced.'),
('NG','Nigeria','prohibited','Cannabis illegal with severe penalties.'),
('GH','Ghana','medical_only','2020 law permits licensed cultivation for industrial/medical/export purposes; personal recreational use remains illegal.'),
('NZ','New Zealand','medical_only','Medical cannabis scheme in place; a 2020 referendum on recreational legalization narrowly failed.'),
('IN','India','prohibited','Cannabis illegal nationally under the NDPS Act; traditional bhang preparations have narrow, state-specific quasi-legal tolerance -- not a commercial framework.'),
('LK','Sri Lanka','prohibited','Cannabis illegal; narrow traditional Ayurvedic-medicine exceptions exist, not a commercial framework.'),
('PK','Pakistan','prohibited','Cannabis illegal nationally; historical regional tolerance of hashish does not reflect current legal status.'),
('VN','Vietnam','prohibited','Cannabis fully illegal with severe penalties.'),
('NP','Nepal','prohibited','Cannabis illegal since 1976 despite historical cultural use; no legal commercial framework.'),
('BD','Bangladesh','prohibited','Cannabis illegal with severe penalties.'),
('KZ','Kazakhstan','prohibited','Cannabis illegal; industrial hemp permitted under license.'),
('LB','Lebanon','medical_only','2020 law permits licensed cultivation for medical and industrial export purposes; personal recreational use remains illegal.'),
('QA','Qatar','prohibited','Cannabis illegal with severe penalties.'),
('KW','Kuwait','prohibited','Cannabis illegal with severe penalties.'),
('IR','Iran','prohibited','Cannabis illegal with severe penalties.'),
('IQ','Iraq','prohibited','Cannabis illegal with severe penalties.'),
('TT','Trinidad and Tobago','recreational_noncommercial','Personal possession of small amounts and home cultivation (up to 4 plants) decriminalized/legalized 2019; no licensed commercial retail.'),
('AG','Antigua and Barbuda','recreational_noncommercial','Personal possession and home cultivation decriminalized; religious/sacramental use recognized; no licensed commercial retail.'),
('VC','Saint Vincent and the Grenadines','medical_only','Medical cannabis legalized 2018; traditional/religious use has some decriminalization; no licensed recreational retail.'),
('BB','Barbados','medical_only','Medical cannabis legalized 2019; small-amount possession decriminalized; no licensed recreational retail.')
on conflict (iso2) do nothing;
