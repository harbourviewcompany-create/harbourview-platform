
-- Territories and dependencies: UK Crown Dependencies, British Overseas Territories, Dutch Caribbean, Danish territories, French overseas, Macao

-- Jersey (JE)
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'jersey','country','JE','Medical Legal (Limited); CBD Available',
'Jersey, a British Crown Dependency in the English Channel, enacted the Misuse of Drugs (Amendment No. 7) (Jersey) Law 2021, introducing limited medical cannabis access. The Law permits prescribing of cannabis-based products for medicinal use (CBPMs) aligned with UK MHRA standards. CBD products are commercially available in Jersey given their classification outside the controlled drugs framework. Jersey operates independently of UK drug law but has chosen to broadly align with UK CBPM standards.',
'Patients in Jersey may access cannabis-based products for medicinal use (CBPMs) through registered medical practitioners with specialist recommendation, dispensed via licensed pharmacies. The access pathway mirrors the UK''s NHS CBPM framework.',
'Jersey-registered physicians may prescribe CBPMs for qualifying conditions including multiple sclerosis spasticity, nausea, and treatment-resistant epilepsy. Specialist endorsement is generally required.',
'Jersey''s small population (approximately 103,000) supports a limited medical cannabis market. CBD products are commercially available through health and wellness retailers. No domestic cannabis cultivation or production exists.',
'Jersey is expected to continue its alignment with UK medical cannabis policy developments. As the UK expands its CBPM framework, Jersey is likely to follow suit.',
'Jersey Health and Community Services (HCS) oversees pharmaceutical regulation. States of Jersey Police enforce drug laws.',
'Jersey Misuse of Drugs (Amendment No. 7) Law 2021; HCS pharmaceutical guidance; MHRA CBPM alignment; UK medical cannabis policy monitoring','Current as of Q2 2026','Annual','Crown Dependency briefing covering limited medical access aligned with UK CBPM standards',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='JE' AND jurisdiction_type='country');

-- Guernsey (GG)
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'guernsey','country','GG','Prohibited; CBD Gray Area',
'Guernsey, a British Crown Dependency, prohibits cannabis under its Misuse of Drugs (Bailiwick of Guernsey) Law. Unlike Jersey, Guernsey has not enacted medical cannabis legislation. CBD products exist in a legal gray area. Guernsey''s Bailiwick includes the islands of Guernsey, Alderney, and Sark.',
'No formal medical cannabis access pathway exists in Guernsey. Patients seeking cannabis-based medicines must rely on individual clinical import authorization, which is administratively complex.',
'Guernsey physicians cannot formally prescribe cannabis under the existing legal framework.',
'No licensed cannabis market exists. CBD products are commercially present but face regulatory uncertainty.',
'Guernsey may follow Jersey''s lead in establishing a medical cannabis framework if and when the political will emerges. No imminent legislative action is confirmed.',
'Health and Social Care (HSC) Guernsey oversees pharmaceutical regulation. Guernsey Police enforce drug laws.',
'Guernsey Misuse of Drugs Law; HSC Guernsey pharmaceutical guidance; Jersey comparison monitoring','Current as of Q2 2026','Annual','Crown Dependency briefing noting prohibition and absence of medical framework',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='GG' AND jurisdiction_type='country');

-- Isle of Man (IM)
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'isle-of-man','country','IM','Prohibited; CBD Available',
'The Isle of Man, a British Crown Dependency in the Irish Sea, prohibits cannabis under the Misuse of Drugs Act 1995. No medical cannabis program exists. CBD products with THC below 0.2% are available commercially. The Isle of Man Tynwald (Parliament) has discussed cannabis reform in line with UK and Channel Islands developments but no legislation has been enacted.',
'No formal medical cannabis access pathway exists. Individual import authorization may be possible for specific pharmaceutical products.',
'Isle of Man physicians cannot prescribe cannabis under the existing framework.',
'No licensed cannabis market exists. CBD products are commercially available through health retailers.',
'Reform may follow UK and Channel Islands precedents. Tynwald discussions have acknowledged the need to review medical access. No imminent legislation confirmed.',
'Isle of Man Department of Health and Social Care oversees pharmaceutical regulation. Isle of Man Constabulary enforces drug laws.',
'Isle of Man Misuse of Drugs Act 1995; DHSC IoM pharmaceutical guidance; Tynwald cannabis reform discussion records','Current as of Q2 2026','Annual','Crown Dependency briefing noting prohibition with CBD market',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='IM' AND jurisdiction_type='country');

-- Gibraltar (GI)
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'gibraltar','country','GI','Medical Legal; Recreational Decriminalized',
'Gibraltar, a British Overseas Territory on the southern tip of Spain, enacted the Cannabis Agency Act 2020, creating a Cannabis Agency to license medical cannabis activities and decriminalizing personal possession. Gibraltar has positioned itself as an early mover in regulated cannabis in the British territories context. Medical cannabis products may be prescribed and dispensed under the Act''s framework. Gibraltar''s proximity to Spain (where cannabis clubs are widespread) and its British legal tradition create a unique regulatory environment.',
'Patients access cannabis through licensed medical dispensaries with physician recommendation under the Cannabis Agency Act framework. Products include oils and flower from licensed sources.',
'Gibraltar-registered physicians may recommend medical cannabis under the Cannabis Agency Act. No strict specialist-only requirement applies.',
'Gibraltar''s small population (approximately 32,000) limits market scale, but its forward-looking regulatory framework and financial services expertise position it as a potential cannabis licensing hub. Several operators have obtained Cannabis Agency licenses.',
'Gibraltar''s Cannabis Agency is expected to continue developing the licensing framework. As a British Overseas Territory, Gibraltar''s model is watched closely by other UK-adjacent territories.',
'Gibraltar Cannabis Agency administers all cannabis licenses. Royal Gibraltar Police enforce drug laws.',
'Gibraltar Cannabis Agency Act 2020; Cannabis Agency licensing data; Ministry of Health Gibraltar pharmaceutical guidance','Current as of Q2 2026','Quarterly','Territory briefing covering landmark Cannabis Agency Act and progressive framework',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='GI' AND jurisdiction_type='country');

-- Aruba (AW)
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'aruba','country','AW','Prohibited; Reform Discussion',
'Aruba, a constituent country of the Kingdom of the Netherlands in the Caribbean, prohibits cannabis under the Opiumlandsverordening (Opium National Ordinance). Despite the Netherlands'' tolerant approach to cannabis, Aruba maintains formal prohibition. Tourism is the dominant economic sector, and some reform advocates have raised cannabis tourism as a potential revenue opportunity given Dutch cultural precedents.',
'No formal medical cannabis access pathway exists in Aruba.',
'Aruba physicians cannot prescribe cannabis under the existing framework.',
'No licensed cannabis market exists. Tourism-focused reform discussion references Dutch practice. No commercial development has occurred.',
'Reform may follow Dutch Kingdom developments. Cannabis tourism has been discussed as an economic opportunity given Aruba''s hospitality sector dominance. No imminent legislation confirmed.',
'Directorate of Public Health Aruba oversees pharmaceutical regulation. Korps Politie Aruba enforces drug laws.',
'Aruba Opiumlandsverordening; Ministry of Health Aruba pharmaceutical guidance; Kingdom of the Netherlands cannabis policy context','Current as of Q2 2026','Annual','Constituent country briefing noting prohibition despite Dutch Kingdom affiliation',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='AW' AND jurisdiction_type='country');

-- Curaçao (CW)
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'curacao','country','CW','Prohibited; Reform Discussion',
'Curaçao, a constituent country of the Kingdom of the Netherlands in the Dutch Caribbean, maintains cannabis prohibition under its national ordinances. Curaçao has discussed cannabis reform, including medical access, given the Netherlands'' tolerant framework. Willemstad is the capital and the primary economic and tourism centre.',
'No formal medical cannabis access pathway exists in Curaçao.',
'Curaçao physicians cannot prescribe cannabis under the existing framework.',
'No licensed cannabis market exists. Reform discussions have occurred in the Staten (parliament) but no legislation has been enacted.',
'Cannabis reform is possible given Kingdom of Netherlands precedents. Medical access legislation has been discussed. Tourism and economic development motives exist.',
'Curaçao Ministry of Health, Environment and Nature (GMN) oversees pharmaceutical regulation. Curaçao Police (Korps Politie Curaçao) enforces drug laws.',
'Curaçao national drug ordinances; GMN pharmaceutical guidance; Kingdom of Netherlands cannabis policy context','Current as of Q2 2026','Annual','Constituent country briefing noting prohibition with reform discussion context',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='CW' AND jurisdiction_type='country');

-- Sint Maarten (SX)
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'sint-maarten','country','SX','Prohibited',
'Sint Maarten, the Dutch side of the island of Saint Martin, is a constituent country of the Kingdom of the Netherlands. Cannabis is prohibited under Sint Maarten''s national ordinances. The unique geography — sharing the island of Saint Martin with French collectivity Saint-Martin — creates interesting cross-border dynamics given France''s separate drug enforcement framework.',
'No formal medical cannabis access pathway exists in Sint Maarten.',
'Sint Maarten physicians cannot prescribe cannabis under the existing framework.',
'No licensed cannabis market exists. Sint Maarten''s tourism-heavy economy and island-sharing with France creates cross-border informal market dynamics.',
'No imminent reform is confirmed. Kingdom of Netherlands framework developments may influence Sint Maarten policy over time.',
'Sint Maarten Ministry of Public Health, Social Development and Labour (VSA) oversees pharmaceutical regulation. Sint Maarten Police Force enforces drug laws.',
'Sint Maarten national drug ordinances; VSA pharmaceutical guidance; Kingdom of Netherlands cannabis policy context','Current as of Q2 2026','Annual','Constituent country briefing noting prohibition on shared island with French territory',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='SX' AND jurisdiction_type='country');

-- Greenland (GL)
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'greenland','country','GL','Prohibited',
'Greenland, an autonomous territory of the Kingdom of Denmark in the Arctic, prohibits cannabis under Danish law extended to the territory. Greenland has extensive self-government (Selvstyre) but drug policy has not been a priority area of autonomous governance. Denmark''s medical cannabis pilot program applies to Danish citizens but Greenland''s remote communities face significant healthcare access challenges generally.',
'No formal medical cannabis access pathway exists outside the Danish framework. Access challenges in remote Arctic communities make even theoretical framework implementation extremely difficult.',
'Greenland-based practitioners cannot formally prescribe cannabis given the absence of a distinct Greenlandic medical cannabis framework.',
'No licensed cannabis market exists. Greenland''s sparse population (approximately 56,000) and remote geography severely limit market development.',
'No cannabis-specific reform is anticipated as a Greenlandic priority. Danish medical program developments nominally cover Greenland but practical access is severely limited.',
'Naalakkersuisut (Government of Greenland) Department of Health handles health regulation. Grønlands Politi enforces drug laws.',
'Danish Medicines Act extension to Greenland; Naalakkersuisut health policy; Danish medical cannabis pilot program application','Current as of Q2 2026','Annual','Territory briefing noting prohibition in Arctic autonomous territory context',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='GL' AND jurisdiction_type='country');

-- Faroe Islands (FO)
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'faroe-islands','country','FO','Prohibited',
'The Faroe Islands, an autonomous territory of the Kingdom of Denmark in the North Atlantic, prohibit cannabis under drug control legislation. The Faroese Løgting (parliament) has legislative competence in most areas, including drug policy, but has not enacted cannabis reform. The Faroe Islands have a distinctive conservative social culture influenced by Christian values.',
'No formal medical cannabis access pathway exists in the Faroe Islands.',
'Faroese practitioners cannot prescribe cannabis under the existing framework.',
'No licensed cannabis market exists. The Faroe Islands'' small population (approximately 55,000) and conservative culture limit reform momentum.',
'No reform is anticipated given the conservative social and political culture. Danish medical cannabis program developments may eventually influence discussion.',
'Faroese Landslægen (Chief Medical Officer) oversees pharmaceutical regulation. Faroe Islands Police enforce drug laws.',
'Faroese drug control legislation; Landslægen pharmaceutical guidance; Kingdom of Denmark monitoring','Current as of Q2 2026','Annual','Territory briefing noting prohibition in conservative North Atlantic autonomous territory',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='FO' AND jurisdiction_type='country');

-- Macao (MO)
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'macao','country','MO','Prohibited; Strict Enforcement',
'Macao (Macau), a Special Administrative Region of China, prohibits cannabis under Law No. 17/2009 on illicit drug trafficking and consumption. Macao enforces strict drug prohibition aligned with mainland Chinese standards. No medical cannabis program exists. Macao''s status as a major gaming and hospitality hub does not translate to cannabis tolerance — enforcement is strict for both residents and visitors.',
'No legal patient access exists. Cannabis-based medicines are unavailable through official Macao healthcare channels.',
'Macao physicians cannot prescribe cannabis under the existing legal framework.',
'No licensed cannabis market exists. Strict enforcement in a densely populated gaming jurisdiction means informal markets are heavily policed.',
'No reform is anticipated. Macao''s alignment with mainland Chinese drug enforcement standards and its SAR governance framework make cannabis liberalization effectively impossible.',
'Bureau for Food and Drug Safety (CAFSA) oversees pharmaceutical regulation. Polícia de Segurança Pública (PSP) and Judiciary Police handle drug enforcement.',
'Macao Law No. 17/2009; CAFSA pharmaceutical guidance; mainland Chinese drug enforcement alignment','Current as of Q2 2026','Annual','SAR briefing noting strict prohibition aligned with mainland Chinese standards',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='MO' AND jurisdiction_type='country');
