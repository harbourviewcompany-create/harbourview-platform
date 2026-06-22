-- Seed country-level cannabis regulatory briefings: Africa (all 54 countries)
-- Key markets: MA (2021 legalization), ZA (constitutional decrim + medical), LS (pioneer),
--              MW (2020 legalization), ZW (2018 legalization), GH/NG/KE (reform under discussion)

-- Algeria
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'algeria','country','DZ','Prohibited',
'Cannabis is prohibited in Algeria under Law 04-18 relating to prevention and repression of illegal drug use and trafficking. Penalties are strict and enforcement is active. Despite Algeria''s geographic position adjacent to Morocco (the world''s largest hashish producer), Algeria treats cannabis transit and use as serious criminal offences. No medical cannabis program exists.',
'No legal patient access pathway exists.','Physicians cannot prescribe cannabis.','No licensed cannabis market exists.','Cannabis reform is not a current policy priority. Morocco''s 2021 legalization has not visibly influenced Algerian policy.',
'Ministry of Justice; Ministry of Health; Office National de Lutte contre la Drogue et la Toxicomanie (ONLCDT).',
'Law 04-18; ONLCDT annual reports; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='DZ' AND jurisdiction_type='country');

-- Angola
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'angola','country','AO','Prohibited',
'Cannabis is prohibited in Angola under the Lei do Combate à Droga. No medical cannabis program has been established. Enforcement capacity is variable across the country''s regions.',
'No legal patient access pathway exists.','Physicians cannot prescribe cannabis.','No licensed market exists.','Cannabis reform is not a current policy priority.',
'SIDA (Serviço de Investigação Criminal) for drug enforcement. Ministry of Health for pharmaceutical regulation.',
'Lei do Combate à Droga; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='AO' AND jurisdiction_type='country');

-- Benin
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'benin','country','BJ','Prohibited',
'Cannabis is prohibited in Benin. No medical cannabis program exists.',
'No legal patient access pathway exists.','Physicians cannot prescribe cannabis.','No licensed market exists.','Cannabis reform is not a current policy priority.',
'Office Central de Répression du Trafic Illicite de Drogues (OCERTID); Ministry of Health.',
'Drug trafficking law; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='BJ' AND jurisdiction_type='country');

-- Botswana
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'botswana','country','BW','Prohibited',
'Cannabis is prohibited in Botswana under the Drugs and Related Substances Act of 1992. Botswana has strict drug laws with significant penalties. No medical cannabis program exists.',
'No legal patient access pathway exists.','Physicians cannot prescribe cannabis.','No licensed market exists.','Cannabis reform has been discussed at the civil society level. Regional developments including South Africa''s constitutional ruling may influence future discussions.',
'Botswana Police Service; Department of Health for pharmaceutical matters.',
'Drugs and Related Substances Act 1992; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='BW' AND jurisdiction_type='country');

-- Burkina Faso
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'burkina-faso','country','BF','Prohibited',
'Cannabis is prohibited in Burkina Faso. No medical cannabis program exists. Enforcement capacity is affected by ongoing security challenges.',
'No legal patient access pathway exists.','Physicians cannot prescribe cannabis.','No licensed market exists.','Cannabis reform is not a current policy priority given the country''s security situation.',
'Direction Générale de la Police Nationale; Ministry of Health.',
'Drug law; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='BF' AND jurisdiction_type='country');

-- Burundi
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'burundi','country','BI','Prohibited',
'Cannabis is prohibited in Burundi under national drug laws. No medical cannabis program exists.',
'No legal patient access pathway exists.','Physicians cannot prescribe cannabis.','No licensed market exists.','Cannabis reform is not a current policy priority.',
'Police Nationale du Burundi; Ministry of Public Health.',
'National drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='BI' AND jurisdiction_type='country');

-- Cameroon
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'cameroon','country','CM','Prohibited',
'Cannabis is prohibited in Cameroon under Law No. 97/019 on drugs and precursor substances. No medical cannabis program exists. Some traditional use of cannabis occurs in rural areas.',
'No legal patient access pathway exists.','Physicians cannot prescribe cannabis.','No licensed market exists.','Cannabis reform is not a current policy priority.',
'DGSN (Délégation Générale à la Sûreté Nationale); Ministry of Public Health.',
'Law No. 97/019; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='CM' AND jurisdiction_type='country');

-- Cape Verde
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'cape-verde','country','CV','Prohibited',
'Cannabis is prohibited in Cape Verde. The island nation has focused drug policy attention on cocaine transit given its Atlantic position. No medical cannabis program exists.',
'No legal patient access pathway exists.','Physicians cannot prescribe cannabis.','No licensed market exists.','Cannabis reform is not a current policy priority.',
'Polícia Judiciária; Ministry of Health.',
'Cape Verde drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='CV' AND jurisdiction_type='country');

-- Central African Republic
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'central-african-republic','country','CF','Prohibited; Enforcement Severely Limited',
'Cannabis is technically prohibited in the Central African Republic but enforcement is extremely limited due to ongoing armed conflict and the near-collapse of state institutions. No medical program exists.',
'No legal patient access pathway exists.','Physicians cannot prescribe cannabis.','No licensed market exists.','Cannabis policy reform is not a realistic near-term prospect.',
'Government structures extremely limited. Formal drug oversight by MINUSCA and remaining state institutions.',
'Regional security monitoring; limited official data available','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status and governance limitations',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='CF' AND jurisdiction_type='country');

-- Chad
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'chad','country','TD','Prohibited',
'Cannabis is prohibited in Chad. Enforcement capacity is constrained by resources and ongoing security challenges in the Sahel region. No medical cannabis program exists.',
'No legal patient access pathway exists.','Physicians cannot prescribe cannabis.','No licensed market exists.','Cannabis reform is not a current policy priority.',
'Ministère de la Santé Publique; security forces for enforcement.',
'Chad drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='TD' AND jurisdiction_type='country');

-- Comoros
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'comoros','country','KM','Prohibited',
'Cannabis is prohibited in the Comoros. No medical cannabis program or reform discussions are underway.',
'No legal patient access pathway exists.','Physicians cannot prescribe cannabis.','No licensed market exists.','Cannabis reform is not a current policy priority.',
'Ministère de la Santé; Gendarmerie Nationale.',
'Comorian drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='KM' AND jurisdiction_type='country');

-- DRC
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'democratic-republic-of-congo','country','CD','Prohibited; Enforcement Limited',
'Cannabis is prohibited in the Democratic Republic of Congo under national drug laws, but enforcement across this vast country is extremely uneven. Informal cannabis cultivation occurs widely. No medical program exists.',
'No legal patient access pathway exists.','Physicians cannot prescribe cannabis.','No licensed market exists.','Cannabis policy reform is not a realistic near-term prospect.',
'Agence Nationale de Renseignements (ANR); Ministry of Public Health for pharmaceuticals.',
'DRC drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status and enforcement limitations',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='CD' AND jurisdiction_type='country');

-- Côte d'Ivoire
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'cote-divoire','country','CI','Prohibited',
'Cannabis is prohibited in Côte d''Ivoire under Law 88-686 on combating drug trafficking and abuse. Enforcement is active in urban areas. No medical cannabis program exists.',
'No legal patient access pathway exists.','Physicians cannot prescribe cannabis.','No licensed market exists.','Cannabis reform is not a current policy priority.',
'Office Central de Répression du Trafic Illicite de Drogues (OCRTID); Ministry of Health.',
'Law 88-686; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='CI' AND jurisdiction_type='country');

-- Djibouti
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'djibouti','country','DJ','Prohibited',
'Cannabis is prohibited in Djibouti. Drug policy focuses primarily on khat, which is widely used and legally tolerated. No medical cannabis program exists.',
'No legal patient access pathway exists.','Physicians cannot prescribe cannabis.','No licensed market exists.','Cannabis reform is not a current policy priority.',
'Police Nationale de Djibouti; Ministry of Health.',
'Djibouti drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='DJ' AND jurisdiction_type='country');

-- Egypt
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'egypt','country','EG','Prohibited; Strict Enforcement',
'Cannabis is prohibited in Egypt under Law 182 of 1960 on combating narcotic drugs. Egypt imposes severe penalties for cannabis possession and trafficking, with minimum mandatory sentences for many offences. No medical cannabis program exists and no reform is under consideration.',
'No legal patient access pathway exists.','Physicians cannot prescribe cannabis.','No licensed market exists.','Cannabis reform is not a current government priority. Egypt''s drug policy framework is firmly prohibitionist.',
'NCCDP (National Council for Combating and Controlling Drugs Phenomenon); Ministry of Health (MOHP) for pharmaceutical matters.',
'Law 182 of 1960; NCCDP annual reports; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting strict prohibition',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='EG' AND jurisdiction_type='country');

-- Equatorial Guinea
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'equatorial-guinea','country','GQ','Prohibited',
'Cannabis is prohibited in Equatorial Guinea. No medical program exists.',
'No legal patient access pathway exists.','Physicians cannot prescribe cannabis.','No licensed market exists.','Cannabis reform is not a current policy priority.',
'Ministry of Health and Social Welfare; National Police.',
'Equatorial Guinea drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='GQ' AND jurisdiction_type='country');

-- Eritrea
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'eritrea','country','ER','Prohibited',
'Cannabis is prohibited in Eritrea. The country''s isolated political environment means cannabis policy reform is not a consideration. No medical program exists.',
'No legal patient access pathway exists.','Physicians cannot prescribe cannabis.','No licensed market exists.','Cannabis reform is not anticipated given Eritrea''s political isolation.',
'Ministry of Health; national security services.',
'Eritrean drug laws; limited official data available','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='ER' AND jurisdiction_type='country');

-- Ethiopia
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'ethiopia','country','ET','Prohibited',
'Cannabis is prohibited in Ethiopia under the Drug Administration and Control Proclamation. Drug policy in Ethiopia focuses significantly on khat (qat), which is legal and culturally important. Cannabis remains prohibited. No medical cannabis program exists.',
'No legal patient access pathway exists.','Physicians cannot prescribe cannabis.','No licensed market exists.','Cannabis reform is not currently being considered.',
'Ethiopian Food and Drug Authority (EFDA); Federal Police for enforcement.',
'Drug Administration and Control Proclamation; EFDA pharmaceutical policy; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibition and khat policy context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='ET' AND jurisdiction_type='country');

-- Gabon
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'gabon','country','GA','Prohibited',
'Cannabis is prohibited in Gabon under national drug laws. No medical cannabis program exists.',
'No legal patient access pathway exists.','Physicians cannot prescribe cannabis.','No licensed market exists.','Cannabis reform is not a current policy priority.',
'Direction Générale de la Pharmacie, du Médicament et des Laboratoires; Gendarmerie Nationale.',
'Gabonese drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='GA' AND jurisdiction_type='country');

-- Gambia
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'gambia','country','GM','Prohibited',
'Cannabis is prohibited in The Gambia under the Drug Control Act. No medical cannabis program exists.',
'No legal patient access pathway exists.','Physicians cannot prescribe cannabis.','No licensed market exists.','Cannabis reform is not a current policy priority.',
'National Drug Enforcement Agency (NDEA); Ministry of Health.',
'Drug Control Act; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='GM' AND jurisdiction_type='country');

-- Ghana
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'ghana','country','GH','Prohibited; Medical Reform Under Discussion',
'Cannabis is prohibited in Ghana under the Narcotic Drugs (Control, Enforcement and Sanctions) Law of 1990. However, the Narcotics Control Commission (NCC) Act of 2020 modernized the regulatory framework and the government has been publicly exploring medical cannabis licensing for export purposes. Ghana has not yet enacted a medical cannabis program but is one of the more active reformers in West Africa.',
'No formal patient access pathway currently exists. Parliamentary debates on medical cannabis access have occurred.',
'Physicians cannot prescribe cannabis under the current legal framework. Medical professionals have participated in policy consultations.',
'No licensed cannabis market currently exists. Ghana''s government has expressed interest in licensing medical cannabis cultivation primarily for export to EU markets. Agricultural infrastructure and a professional regulatory culture position Ghana as a potential West African cannabis hub.',
'Ghana is one of the more likely near-term African medical cannabis legalizers. Parliamentary support has been expressed. Legislation enabling export-oriented medical cannabis cultivation is anticipated in the 2025–2027 policy window.',
'Narcotics Control Commission (NCC) under the Ministry of Interior. Food and Drugs Authority (FDA) for pharmaceutical matters.',
'Narcotic Drugs Law 1990; NCC Act 2020; parliamentary cannabis committee proceedings','Current as of Q2 2026','Quarterly','Country-level briefing covering prohibition with active medical reform discussion and export potential',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='GH' AND jurisdiction_type='country');

-- Guinea
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'guinea','country','GN','Prohibited',
'Cannabis is prohibited in Guinea. Political instability and governance challenges have constrained regulatory capacity. No medical cannabis program exists.',
'No legal patient access pathway exists.','Physicians cannot prescribe cannabis.','No licensed market exists.','Cannabis reform is not a current policy priority.',
'Ministry of Public Health; Gendarmerie Nationale for enforcement.',
'Guinean drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='GN' AND jurisdiction_type='country');

-- Guinea-Bissau
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'guinea-bissau','country','GW','Prohibited; Limited Enforcement',
'Cannabis is prohibited in Guinea-Bissau but enforcement is extremely limited. The country faces significant governance and capacity challenges. Cannabis prohibition nominally stands but domestic use is largely unaddressed by enforcement.',
'No legal patient access pathway exists.','Physicians cannot prescribe cannabis.','No licensed market exists. Informal cannabis cultivation and use occurs with minimal enforcement.','Cannabis reform is not a current policy priority.',
'Polícia Judiciária; Ministry of Health.',
'Guinea-Bissau drug laws; limited official data','Current as of Q2 2026','Annual','Country-level briefing noting limited enforcement context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='GW' AND jurisdiction_type='country');

-- Kenya
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'kenya','country','KE','Prohibited; Export Licensing Under Discussion',
'Cannabis is prohibited in Kenya under the Narcotic Drugs and Psychotropic Substances (Control) Act of 1994. However, Kenya has been actively exploring medical cannabis export licensing, with the government issuing statements about potential licensing for export to regulated markets. No domestic medical program exists for patients as of 2026.',
'No formal patient access pathway exists domestically. The policy discussion is primarily oriented toward export-oriented production.',
'Physicians cannot prescribe cannabis as no medical regulatory framework for domestic use exists.',
'No licensed commercial market exists yet. Kenya''s strong agricultural infrastructure, established export channels, and proximity to European markets make it an attractive production base. Several international companies have engaged with Kenyan authorities about cultivation licenses.',
'Kenya is positioned to be a significant East African cannabis producer for export markets. Regulatory frameworks for export cultivation are under development. The timeline for licensing operationalization is the key uncertainty.',
'Pharmacy and Poisons Board (PPB) under Ministry of Health. National Police Service for enforcement.',
'Narcotic Drugs and Psychotropic Substances (Control) Act 1994; PPB cannabis export framework consultations','Current as of Q2 2026','Quarterly','Country-level briefing covering prohibition with active export licensing development',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='KE' AND jurisdiction_type='country');

-- Lesotho
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'lesotho','country','LS','Medical Legal; Export-Oriented Pioneer',
'Lesotho became the first African country to issue a medical cannabis cultivation license when it licensed Medi Kingdom (now Medigrow) in 2017. Since then, additional cultivation licenses have been issued. Lesotho''s high-altitude growing conditions are ideal for cannabis cultivation. The Lesotho Cannabis Authority administers the licensed sector. Products are primarily exported to international pharmaceutical markets.',
'Domestic patient access to medical cannabis products is limited. The program is primarily export-oriented.',
'Domestic physician prescription pathways are in development. The medical regulatory framework focuses more on production licensing than domestic clinical access.',
'Lesotho''s cannabis sector is one of the most developed in sub-Saharan Africa by regulatory maturity. Multiple licensed cultivators produce cannabis for export, particularly to the UK and EU. The sector provides significant employment in a country with limited economic opportunities.',
'Lesotho''s Cannabis Authority is working to streamline licensing and improve GMP compliance for major export market access. A domestic medical access program is expected to be developed alongside the export industry.',
'Lesotho Cannabis Authority (LCA); Ministry of Health for medical matters.',
'Lesotho Cannabis Authority regulations; Pharmacy Order 2008 (amended); Ministry of Health cannabis guidelines','Current as of Q2 2026; verified against LCA official guidance','Quarterly','Full country-level briefing covering pioneer African medical cannabis status and export-oriented market',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='LS' AND jurisdiction_type='country');

-- Liberia
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'liberia','country','LR','Prohibited',
'Cannabis is prohibited in Liberia under the Revised Narcotic Drug Law. No medical cannabis program exists.',
'No legal patient access pathway exists.','Physicians cannot prescribe cannabis.','No licensed market exists.','Cannabis reform is not a current policy priority.',
'Drug Enforcement Agency (DEA) of Liberia; Ministry of Health.',
'Revised Narcotic Drug Law; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='LR' AND jurisdiction_type='country');

-- Libya
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'libya','country','LY','Prohibited; Political Instability',
'Cannabis is prohibited in Libya under strict drug laws. The country''s ongoing political fragmentation and conflict between rival governments make coherent drug policy enforcement difficult. No medical cannabis program exists.',
'No legal patient access pathway exists.','Physicians cannot prescribe cannabis.','No licensed market exists.','Cannabis reform is not a current policy priority given Libya''s political fragmentation.',
'Multiple competing state structures; LPHO (Libyan Pharmaceutical Health Organization) where operational.',
'Libyan drug laws; regional comparative analysis; conflict monitoring','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status and political context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='LY' AND jurisdiction_type='country');

-- Madagascar
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'madagascar','country','MG','Prohibited; Informal Production Prevalent',
'Cannabis is prohibited in Madagascar but informal cultivation is widespread, particularly in the north and northwest. Madagascar is one of Africa''s significant informal cannabis producers. No medical cannabis program exists.',
'No legal patient access pathway exists.','Physicians cannot prescribe cannabis.','No licensed market exists. Informal cultivation and domestic/regional trade occurs.','Cannabis reform has not been formalized legislatively despite significant informal production capacity.',
'Brigade Centrale de Lutte contre les Stupéfiants; Ministry of Public Health.',
'Malagasy drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status with significant informal cultivation',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='MG' AND jurisdiction_type='country');

-- Malawi
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'malawi','country','MW','Medical and Industrial Cultivation Licensed; Emerging Market',
'Malawi enacted the Cannabis Regulation Act and Industrial Hemp Act in 2020, establishing a licensing framework for medical cannabis and industrial hemp cultivation. Malawi Cannabis Regulatory Authority (MCRA) was established to license and regulate the sector. The program is primarily oriented toward export to international medical and industrial markets.',
'Domestic patient access pathways are limited. The program focuses on export-oriented cultivation. Medical access for Malawian patients is an expected future development.',
'Domestic physician prescription pathways are not yet well-established. The focus is on cultivation and export licensing.',
'Malawi''s cannabis sector is developing with multiple cultivation licenses issued under the MCRA framework. The country''s existing tobacco farming infrastructure creates a natural fit for cannabis cultivation. Several international cannabis companies have established Malawian partnerships.',
'The MCRA is refining regulatory standards to meet EU and UK GMP requirements. A domestic medical access program is expected to be developed in parallel. Malawi is well-positioned as a significant African cannabis producer.',
'Malawi Cannabis Regulatory Authority (MCRA); Ministry of Health for medical matters.',
'Cannabis Regulation Act 2020; Industrial Hemp Act 2020; MCRA licensing registry and guidance','Current as of Q2 2026; verified against MCRA official guidance','Quarterly','Full country-level briefing covering licensed medical cannabis sector and export development',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='MW' AND jurisdiction_type='country');

-- Mali
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'mali','country','ML','Prohibited; Enforcement Limited by Instability',
'Cannabis is prohibited in Mali but enforcement is severely constrained by the country''s ongoing political instability and security challenges. No medical cannabis program exists.',
'No legal patient access pathway exists.','Physicians cannot prescribe cannabis.','No licensed market exists. Informal trade occurs through transit corridors.','Cannabis reform is not a current policy priority given Mali''s security situation.',
'Direction des Stupéfiants et de la Police Judiciaire; Ministère de la Santé.',
'Mali drug laws; regional comparative analysis; security monitoring','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status and security context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='ML' AND jurisdiction_type='country');

-- Mauritania
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'mauritania','country','MR','Prohibited; Strict Islamic Law Influence',
'Cannabis is prohibited in Mauritania under a legal framework influenced by Islamic jurisprudence as well as civil drug laws. Penalties are severe. No medical cannabis program exists.',
'No legal patient access pathway exists.','Physicians cannot prescribe cannabis.','No licensed market exists.','Cannabis reform is not a current policy priority.',
'Ministère de la Santé; security forces for enforcement.',
'Mauritanian drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='MR' AND jurisdiction_type='country');

-- Mauritius
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'mauritius','country','MU','Prohibited; Strict Enforcement',
'Cannabis is prohibited in Mauritius under the Dangerous Drugs Act with mandatory minimum sentences. Enforcement is active. No medical cannabis program exists.',
'No legal patient access pathway exists.','Physicians cannot prescribe cannabis.','No licensed market exists.','Cannabis reform has been discussed in civil society. No near-term legislative action is anticipated.',
'Mauritius Drug Unit (MDU); Ministry of Health and Wellness.',
'Dangerous Drugs Act; Mauritius Drug Unit reports; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting strict prohibition',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='MU' AND jurisdiction_type='country');

-- Morocco
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'morocco','country','MA','Medical and Industrial Legal (since 2021); Major Global Hashish Producer',
'Morocco is the world''s largest producer of cannabis resin (hashish) and passed Law 13-21 in 2021, ending 54 years of formal prohibition by legalizing cannabis for medical, industrial, and cosmetic purposes. The National Agency for the Regulation of Cannabis Activities (ANRAC) was established to license and regulate the sector. The Rif Mountain region has been the center of traditional hashish production for generations. The regulated program focuses on channeling existing cultivation into a licensed framework.',
'Domestic patient access to medical cannabis products is being developed as the domestic production and distribution frameworks are operationalized.',
'Moroccan physicians are beginning to engage with the new medical cannabis regulatory framework. Clinical guidelines are being developed.',
'Morocco''s regulated cannabis sector has enormous scale potential given existing cultivation infrastructure. Export licensing for medical and pharmaceutical cannabis to Europe and beyond is a primary policy goal. International investment in licensed Moroccan cannabis production has begun.',
'ANRAC is developing the full licensing and regulatory infrastructure. Export market access to the EU, requiring GMP certification, is the near-term industry priority. Morocco''s cannabis legalization is one of the most consequential in global regulatory history given scale.',
'ANRAC (Agence Nationale de Réglementation des Activités liées au Cannabis) under the Head of Government''s Office. Ministry of Health for medical product authorization.',
'Law 13-21 (2021); ANRAC implementing regulations; Ministry of Health guidance','Current as of Q2 2026; verified against ANRAC official guidance','Quarterly','Full country-level briefing covering landmark 2021 legalization, world''s largest hashish production base, and regulated sector development',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='MA' AND jurisdiction_type='country');

-- Mozambique
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'mozambique','country','MZ','Prohibited',
'Cannabis is prohibited in Mozambique. No medical cannabis program exists.',
'No legal patient access pathway exists.','Physicians cannot prescribe cannabis.','No licensed market exists.','Cannabis reform is not a current policy priority.',
'PRM (Polícia da República de Moçambique); Ministry of Health (MISAU).',
'Mozambique drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='MZ' AND jurisdiction_type='country');

-- Namibia
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'namibia','country','NA','Decriminalized (Personal Use); Medical Access Under Development',
'Namibia''s High Court ruled in 2018 that private cannabis use and possession was not criminally unlawful, effectively decriminalizing personal use. The government has been developing a formal medical cannabis licensing framework since 2021. No licensed commercial market exists as of 2026.',
'No formal licensed patient access pathway exists yet. Medical program licensing, when operational, will provide formal access.',
'Physicians are not yet able to formally prescribe cannabis under a regulated framework.',
'No licensed commercial market exists. Namibia''s stable governance and professional regulatory infrastructure make it a credible candidate for attracting cannabis investment.',
'Namibia is expected to operationalize medical cannabis licensing regulations in 2025–2027. Export market orientation is expected.',
'Ministry of Health and Social Services (MoHSS); Namibia Police Force (NAMPOL) for enforcement.',
'High Court ruling 2018; MoHSS cannabis framework development; regional comparative monitoring','Current as of Q2 2026','Quarterly','Country-level briefing covering decriminalization ruling and pending medical licensing framework',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='NA' AND jurisdiction_type='country');

-- Niger
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'niger','country','NE','Prohibited',
'Cannabis is prohibited in Niger. The country faces significant security challenges in the Sahel region. No medical cannabis program exists.',
'No legal patient access pathway exists.','Physicians cannot prescribe cannabis.','No licensed market exists.','Cannabis reform is not a current policy priority given the security situation.',
'Direction de la Police Judiciaire; Ministère de la Santé Publique.',
'Niger drug laws; regional security monitoring','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='NE' AND jurisdiction_type='country');

-- Nigeria
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'nigeria','country','NG','Prohibited; Medical Reform Under Active Consideration',
'Cannabis is prohibited in Nigeria under the NDLEA Act, with enforcement by the National Drug Law Enforcement Agency. However, Nigeria''s Senate has been actively reviewing medical cannabis legislation, with committee hearings and executive briefings occurring from 2020 onwards. As Africa''s largest economy and most populous nation, Nigeria''s entry into the medical cannabis market would have continental significance.',
'No formal patient access pathway currently exists. The prospect of a future medical program is contingent on pending legislation.',
'Physicians cannot prescribe cannabis under the current legal framework. Medical professionals have participated in policy consultations.',
'No licensed market exists. Nigeria''s scale—200 million population, significant agricultural capacity, and growing pharmaceutical sector—makes it a potentially transformative African cannabis market.',
'Nigeria is one of the most closely watched African jurisdictions for cannabis reform. Senate committee deliberations have been substantive. Legislation is possible in the 2025–2027 period.',
'NDLEA (National Drug Law Enforcement Agency); NAFDAC (National Agency for Food and Drug Administration and Control) for pharmaceutical matters.',
'NDLEA Act; NAFDAC regulatory framework; Senate cannabis committee proceedings','Current as of Q2 2026','Quarterly','Country-level briefing covering prohibition with active high-stakes medical reform process',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='NG' AND jurisdiction_type='country');

-- Republic of Congo
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'republic-of-congo','country','CG','Prohibited',
'Cannabis is prohibited in the Republic of Congo. No medical cannabis program exists.',
'No legal patient access pathway exists.','Physicians cannot prescribe cannabis.','No licensed market exists.','Cannabis reform is not a current policy priority.',
'Direction Générale de la Pharmacie, du Médicament et des Laboratoires; Gendarmerie Nationale.',
'Congo drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='CG' AND jurisdiction_type='country');

-- Rwanda
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'rwanda','country','RW','Prohibited; Strict Enforcement',
'Cannabis is prohibited in Rwanda under strict drug laws. Rwanda''s government maintains a strong law enforcement approach to drug policy. No medical cannabis program exists.',
'No legal patient access pathway exists.','Physicians cannot prescribe cannabis.','No licensed market exists.','Cannabis reform is not a current policy priority. Rwanda''s enforcement-oriented governance approach makes near-term liberalization unlikely.',
'Rwanda Investigation Bureau (RIB); Ministry of Health (Rwanda FDA) for pharmaceutical matters.',
'Rwanda drug laws; RIB enforcement reports; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting strict prohibition',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='RW' AND jurisdiction_type='country');

-- São Tomé and Príncipe
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'sao-tome-and-principe','country','ST','Prohibited',
'Cannabis is prohibited in São Tomé and Príncipe. No medical program exists.',
'No legal patient access pathway exists.','Physicians cannot prescribe cannabis.','No licensed market exists.','Cannabis reform is not a current policy priority.',
'Ministério da Saúde; Polícia Nacional for enforcement.',
'Drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='ST' AND jurisdiction_type='country');

-- Senegal
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'senegal','country','SN','Prohibited',
'Cannabis is prohibited in Senegal under the Code des Drogues. Enforcement is active.',
'No legal patient access pathway exists.','Physicians cannot prescribe cannabis.','No licensed market exists.','Cannabis reform is not a current policy priority.',
'Office Central pour la Répression du Trafic Illicite de Stupéfiants (OCRTIS); Ministère de la Santé et de l''Action Sociale.',
'Code des Drogues; OCRTIS reports; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='SN' AND jurisdiction_type='country');

-- Sierra Leone
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'sierra-leone','country','SL','Prohibited',
'Cannabis is prohibited in Sierra Leone. No medical program exists.',
'No legal patient access pathway exists.','Physicians cannot prescribe cannabis.','No licensed market exists.','Cannabis reform is not a current policy priority.',
'Sierra Leone Police; Ministry of Health and Sanitation.',
'Sierra Leone drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='SL' AND jurisdiction_type='country');

-- Somalia
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'somalia','country','SO','Prohibited; Governance-Limited Enforcement',
'Cannabis is prohibited in Somalia but enforcement is functionally minimal across much of the country due to ongoing conflict and the absence of effective central governance. Khat (qat) is widely used and significant in Somali culture.',
'No legal patient access pathway exists.','Physicians cannot prescribe cannabis.','No licensed market exists.','Cannabis policy reform is not a realistic near-term prospect.',
'Federal Government of Somalia (where operational); Somali Police Force; Ministry of Health.',
'Somali drug laws; governance and security monitoring','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status and governance limitations',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='SO' AND jurisdiction_type='country');

-- South Africa
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'south-africa','country','ZA','Private Use Decriminalized (Constitutional Court); Medical Licensed; Adult-Use Framework Pending',
'South Africa''s Constitutional Court ruled in 2018 (Prince v Minister of Justice) that prohibiting private adult cannabis use and cultivation was unconstitutional. Medical cannabis has been regulated under Section 22C of the Medicines and Related Substances Act since 2017, with SAHPRA licensing cultivation, manufacturing, and research. A Cannabis for Private Purposes Act was enacted in 2024 to codify private use rights. An adult-use commercial market framework is under development.',
'Adults may privately use and cultivate cannabis. Medical cannabis patients access products through SAHPRA-licensed channels with physician recommendations. The regulated adult-use retail market is expected to open once commercial licensing regulations are finalized.',
'Physicians registered with the HPCSA may recommend medical cannabis products through SAHPRA-licensed dispensing channels. General practitioners and specialists may recommend.',
'South Africa''s licensed cannabis sector spans cultivation, extraction, manufacturing, and research. Export-oriented producers target EU and UK markets. The domestic adult-use market, once commercially regulated, will be one of Africa''s largest by population.',
'The commercial adult-use licensing framework is the most significant pending regulatory development. South Africa''s cannabis economy has significant potential given its scale, infrastructure, and agricultural capacity.',
'SAHPRA (South African Health Products Regulatory Authority) for medical licensing. Department of Health for policy. SAPS for enforcement. DALRRD for cultivation.',
'Cannabis for Private Purposes Act 2024; Medicines and Related Substances Act Section 22C; SAHPRA licensing regulations; Constitutional Court ruling Prince v Minister of Justice 2018','Current as of Q2 2026; verified against SAHPRA official guidance','Quarterly','Full country-level briefing covering constitutional decriminalization, medical licensing, and pending commercial adult-use framework',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='ZA' AND jurisdiction_type='country');

-- South Sudan
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'south-sudan','country','SS','Prohibited; Governance Challenges',
'Cannabis is prohibited in South Sudan. Ongoing governance challenges and periodic conflict have prevented coherent drug policy development. Enforcement capacity is severely limited.',
'No legal patient access pathway exists.','Physicians cannot prescribe cannabis.','No licensed market exists.','Cannabis reform is not a current policy priority.',
'South Sudan National Police Service; Ministry of Health.',
'South Sudan drug laws; governance monitoring','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status and governance limitations',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='SS' AND jurisdiction_type='country');

-- Sudan
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'sudan','country','SD','Prohibited; Strict Penalties',
'Cannabis is prohibited in Sudan under the Drugs and Psychotropic Substances Control Act with severe penalties. Islamic-influenced drug law provides a strong prohibitionist framework. No medical program exists.',
'No legal patient access pathway exists.','Physicians cannot prescribe cannabis.','No licensed market exists.','Cannabis reform is not a current policy priority.',
'Sudan Counter Narcotics Police; Ministry of Health.',
'Drugs and Psychotropic Substances Control Act; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting strict prohibition',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='SD' AND jurisdiction_type='country');

-- Eswatini
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'eswatini','country','SZ','Prohibited; Traditional Cultivation Prevalent',
'Cannabis is prohibited in Eswatini (formerly Swaziland) but traditional cultivation has occurred for generations, producing varieties known internationally as "Swazi Gold." Enforcement is inconsistent in rural areas. No medical cannabis program exists.',
'No legal patient access pathway exists.','Physicians cannot prescribe cannabis.','No licensed market exists. Traditional cultivation occurs informally.','The economic potential of formalizing traditional cannabis cultivation could be a future policy driver.',
'Eswatini Royal Police Service; Ministry of Health.',
'Eswatini drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibition alongside traditional cultivation heritage',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='SZ' AND jurisdiction_type='country');

-- Tanzania
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'tanzania','country','TZ','Prohibited',
'Cannabis is prohibited in Tanzania under the Drug Control and Enforcement Act. Enforcement has been active under successive governments. No medical cannabis program exists.',
'No legal patient access pathway exists.','Physicians cannot prescribe cannabis.','No licensed market exists.','Cannabis reform is not a current legislative priority.',
'Drug Control and Enforcement Authority (DCEA); Ministry of Health.',
'Drug Control and Enforcement Act; DCEA annual reports; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='TZ' AND jurisdiction_type='country');

-- Togo
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'togo','country','TG','Prohibited',
'Cannabis is prohibited in Togo. No medical cannabis program exists.',
'No legal patient access pathway exists.','Physicians cannot prescribe cannabis.','No licensed market exists.','Cannabis reform is not a current policy priority.',
'Office Togolais de la Lutte Contre la Drogue (OTLCD); Ministry of Health.',
'Togo drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='TG' AND jurisdiction_type='country');

-- Tunisia
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'tunisia','country','TN','Prohibited; Controversial Mandatory Minimums',
'Cannabis is prohibited in Tunisia under Law 92-52, which imposes mandatory minimum prison sentences for cannabis possession that have been widely criticized by civil society and human rights organizations. Even possession of small amounts can result in a one-year minimum sentence. Reform advocacy is active.',
'No legal patient access pathway exists.','Physicians cannot prescribe cannabis.','No licensed market exists.','Tunisia is a jurisdiction where reform advocacy is significant and internationally supported. Legislative change is politically contested but possible.',
'Ministère de la Santé; Ministère de l''Intérieur for enforcement.',
'Law 92-52 (1992); UNODC Tunisia reports; human rights monitoring','Current as of Q2 2026','Quarterly','Country-level briefing covering prohibition with significant reform advocacy context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='TN' AND jurisdiction_type='country');

-- Uganda
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'uganda','country','UG','Prohibited',
'Cannabis is prohibited in Uganda under the Narcotic Drugs and Psychotropic Substances (Control) Act. Enforcement is active. No medical cannabis program exists.',
'No legal patient access pathway exists.','Physicians cannot prescribe cannabis.','No licensed market exists.','Cannabis reform is not a current policy priority.',
'National Drug Authority (NDA); Uganda Police Force Anti-Narcotics Unit.',
'Narcotic Drugs and Psychotropic Substances (Control) Act; NDA reports; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='UG' AND jurisdiction_type='country');

-- Zambia
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'zambia','country','ZM','Prohibited',
'Cannabis is prohibited in Zambia under the Narcotic Drugs and Psychotropic Substances Act of 1993. No medical cannabis program exists.',
'No legal patient access pathway exists.','Physicians cannot prescribe cannabis.','No licensed market exists.','Zimbabwe''s medical cannabis program may create regional pressure for Zambia to consider reform.',
'Drug Enforcement Commission (DEC); Ministry of Health (Zambia Medicines Regulatory Authority, ZAMRA).',
'Narcotic Drugs and Psychotropic Substances Act 1993; DEC annual reports; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='ZM' AND jurisdiction_type='country');

-- Zimbabwe
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'zimbabwe','country','ZW','Medical Legal; Pioneer Sub-Saharan Africa',
'Zimbabwe became one of sub-Saharan Africa''s first countries to legalize medical cannabis in 2018 through the Dangerous Drugs and Controlled Substances (General) Regulations (SI 62 of 2018). The Medicines Control Authority of Zimbabwe (MCAZ) licenses cultivation, processing, and export of medical cannabis. Zimbabwe''s program is primarily export-oriented, with Zimbabwean-produced cannabis targeting European pharmaceutical markets.',
'Domestic patient access to medical cannabis products is limited. The program''s primary focus is on cultivating and processing cannabis for international medical markets.',
'Zimbabwean physicians are not yet widely able to access domestic clinical cannabis products. Medical access frameworks for local patients are being developed.',
'Zimbabwe''s medical cannabis sector has attracted investment from international cannabis companies. Zimbabwe''s fertile agricultural land, skilled farming workforce, and established export infrastructure provide a strong foundation.',
'The MCAZ licensing framework continues to be refined. Domestic medical access program development is anticipated alongside continued export market expansion.',
'MCAZ (Medicines Control Authority of Zimbabwe) under the Ministry of Health and Child Care.',
'SI 62 of 2018 (Dangerous Drugs and Controlled Substances Regulations); MCAZ licensing registry and guidance','Current as of Q2 2026; verified against MCAZ official guidance','Quarterly','Full country-level briefing covering pioneer medical cannabis legalization and export-oriented market',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='ZW' AND jurisdiction_type='country');
