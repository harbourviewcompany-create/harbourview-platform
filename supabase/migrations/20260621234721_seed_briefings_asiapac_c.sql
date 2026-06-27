
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'palau','country','PW','Prohibited',
'Cannabis is prohibited in Palau. As a Pacific island nation in Compact of Free Association with the United States, Palau''s drug policy framework is influenced by US drug control frameworks. No medical cannabis program exists.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Palau Police; Ministry of Health.',
'Palau drug laws; Pacific regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='PW' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'papua-new-guinea','country','PG','Prohibited; Informal Cultivation Prevalent',
'Cannabis is prohibited in Papua New Guinea under the Dangerous Drugs Act, but enforcement is minimal across the country''s challenging geography. Cannabis cultivation is widespread in highland regions, and the plant has become an important cash crop for some communities. No medical cannabis program exists. PNG''s substantial cannabis informal economy has attracted some advocacy for legalization as a revenue-generating and harm-reduction measure.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. Informal cultivation is extensive in highland provinces.',
'Cannabis reform has been discussed in PNG academic and civil society circles. Economic arguments for licensing existing production have been made. No legislative action is currently anticipated.',
'Royal Papua New Guinea Constabulary; National Department of Health.',
'Dangerous Drugs Act; regional comparative analysis; informal market monitoring','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status with extensive informal cultivation',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='PG' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'philippines','country','PH','Prohibited; Strict Enforcement',
'Cannabis is prohibited in the Philippines under the Comprehensive Dangerous Drugs Act of 2002 (Republic Act 9165). The Philippines has historically applied severe enforcement against drug offences. Under the Marcos administration (from 2022), enforcement has continued though with less extrajudicial concern than under Duterte. No medical cannabis program has been established, though congressional bills have been filed. CBD products remain in a grey area.',
'No formal patient access pathway exists. Congressional bills for medical cannabis have been filed but not enacted as of Q2 2026.',
'Physicians cannot formally prescribe cannabis as no regulatory framework exists. Medical associations have engaged in public discussions about potential medical programs.',
'No licensed market exists. Significant civil society and patient advocacy has developed around medical cannabis access, particularly for pediatric epilepsy patients.',
'Medical cannabis legislation remains a live issue in the Philippine Congress. Bills have been filed in multiple legislative sessions. Patient advocacy, particularly around childhood epilepsy, is significant. Passage of medical cannabis legislation is possible in the 2025–2027 period, though political opposition from conservative and religious sectors remains.',
'Philippine Drug Enforcement Agency (PDEA); Food and Drug Administration Philippines (FDA-PH) for pharmaceutical matters.',
'Republic Act 9165 (Comprehensive Dangerous Drugs Act); FDA-PH pharmaceutical guidance; Congressional medical cannabis bill tracking','Current as of Q2 2026','Quarterly','Country-level briefing covering strict prohibition with active medical cannabis legislative process',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='PH' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'samoa','country','WS','Prohibited',
'Cannabis is prohibited in Samoa. The Pacific island nation maintains prohibition with no medical program or reform under consideration.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Samoa Police Service; Ministry of Health.',
'Samoa drug laws; Pacific regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='WS' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'singapore','country','SG','Prohibited; Death Penalty for Trafficking; Zero Tolerance',
'Cannabis is prohibited in Singapore under the Misuse of Drugs Act with one of the world''s harshest drug regimes. Trafficking 500 grams or more of cannabis carries a mandatory death penalty. Even possession of small amounts can result in imprisonment. Singapore actively prosecutes its own citizens for drug offences committed abroad. The country has maintained zero tolerance despite global reform trends and has executed individuals for cannabis trafficking.',
'No legal patient access pathway exists under any circumstances in Singapore.',
'Physicians cannot prescribe cannabis. No cannabis-based pharmaceuticals are available through Singapore''s healthcare system.',
'No licensed market exists. Singapore has explicitly rejected cannabis legalization as inconsistent with its public health and social policies.',
'Cannabis reform is not a current policy consideration. Singapore has been an outspoken defender of its strict drug policies internationally. No reform is anticipated.',
'Central Narcotics Bureau (CNB); Health Sciences Authority (HSA) for pharmaceutical regulation.',
'Misuse of Drugs Act; CNB annual reports; HSA pharmaceutical guidance; Ministry of Home Affairs drug policy statements','Current as of Q2 2026','Annual','Country-level briefing noting death penalty for trafficking and Singapore''s explicitly zero-tolerance position',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='SG' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'solomon-islands','country','SB','Prohibited',
'Cannabis is prohibited in Solomon Islands. The Pacific island nation has limited formal drug enforcement capacity outside of the capital. No medical cannabis program exists.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Royal Solomon Islands Police Force; Ministry of Health and Medical Services.',
'Solomon Islands drug laws; Pacific regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='SB' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'sri-lanka','country','LK','Prohibited; Traditional Ayurvedic Use Context',
'Cannabis is prohibited in Sri Lanka under the Poisons, Opium and Dangerous Drugs Ordinance. However, cannabis has a historical role in traditional Ayurvedic medicine in Sri Lanka, where preparations using cannabis have been used therapeutically for centuries. This traditional use is not formally recognized in the current legal framework. No modern medical cannabis program exists, though there is academic and civil society advocacy.',
'No formal legal patient access pathway exists for modern medical cannabis. Traditional Ayurvedic practitioners may use cannabis-containing preparations in limited contexts.',
'Physicians cannot formally prescribe cannabis under the current legal framework.',
'No licensed market exists. Sri Lanka''s Ayurvedic medicine sector is a potential policy consideration for future cannabis regulation.',
'Cannabis reform with a focus on traditional medicine applications and potential export is under advocacy discussion. No near-term legislative action is anticipated, though economic development interests in a cannabis sector have been expressed.',
'National Dangerous Drugs Control Board (NDDCB); State Pharmaceutical Corporation; Department of Ayurveda for traditional medicine.',
'Poisons, Opium and Dangerous Drugs Ordinance; NDDCB reports; Department of Ayurveda guidance; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing covering prohibition with traditional Ayurvedic use context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='LK' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'taiwan','country','TW','Prohibited; Research Interest Growing',
'Cannabis is prohibited in Taiwan under the Narcotics Hazard Prevention Act with significant penalties. Taiwan has not enacted a medical cannabis program. However, Taiwan''s biomedical research sector has significant interest in cannabinoid medicines, and academic institutions have engaged with the topic. CBD remains in a regulatory grey area. Industrial hemp is permitted in limited research contexts.',
'No formal patient access pathway exists. Some import-authorized pharmaceutical cannabinoid products may be available through specialized import procedures for exceptional cases.',
'Physicians cannot prescribe cannabis under the current framework.',
'No licensed cannabis market exists. Taiwan''s pharmaceutical research sector has growing interest in cannabinoid therapeutics.',
'Taiwan''s regulatory environment for cannabinoid medicines may evolve as international evidence base grows. No near-term formal medical cannabis program is anticipated, but incremental pharmaceutical approvals are possible. Taiwan tracks regulatory developments in the US, EU, and Australia closely.',
'Food and Drug Administration (TFDA) under the Ministry of Health and Welfare. Investigation Bureau (Ministry of Justice) for enforcement.',
'Narcotics Hazard Prevention Act; TFDA pharmaceutical guidelines; academic cannabinoid research monitoring','Current as of Q2 2026','Annual','Country-level briefing noting prohibition with growing research interest',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='TW' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'timor-leste','country','TL','Prohibited',
'Cannabis is prohibited in Timor-Leste (East Timor). As a young nation (independent 2002) with developing institutions, Timor-Leste''s drug regulatory framework is limited. No medical cannabis program exists.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Polícia Nacional de Timor-Leste (PNTL); Ministry of Health.',
'Timor-Leste drug laws; Pacific regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='TL' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'tuvalu','country','TV','Prohibited',
'Cannabis is prohibited in Tuvalu. The very small Pacific island state has limited regulatory capacity. No medical cannabis program exists.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Tuvalu Police Service; Ministry of Health.',
'Tuvalu drug laws; Pacific regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='TV' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'vietnam','country','VN','Prohibited; Strict Enforcement',
'Cannabis is prohibited in Vietnam under the Law on Prevention and Combat of Drug-Related Crimes with strict penalties including imprisonment and potential capital punishment for large-scale trafficking. No medical cannabis program exists. Vietnam''s drug policy is firmly prohibitionist and enforcement is active.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy consideration. Vietnam''s political and legal framework maintains firm prohibition.',
'Ministry of Public Security (Drug Prevention Department); Drug Administration of Vietnam (DAV) under Ministry of Health.',
'Law on Prevention and Combat of Drug-Related Crimes; DAV pharmaceutical policy; Ministry of Public Security enforcement reports','Current as of Q2 2026','Annual','Country-level briefing noting strict prohibition',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='VN' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'vanuatu','country','VU','Prohibited; Enforcement Limited in Outer Islands',
'Cannabis is prohibited in Vanuatu under the Dangerous Drugs Act, but enforcement is minimal outside of the capital Port Vila and is largely absent on outer islands. Informal cannabis cultivation and use occurs. No medical cannabis program exists.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. Informal cultivation occurs on some islands with minimal enforcement.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Vanuatu Police Force; Ministry of Health.',
'Dangerous Drugs Act; Pacific regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status with limited outer island enforcement',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='VU' AND jurisdiction_type='country');
