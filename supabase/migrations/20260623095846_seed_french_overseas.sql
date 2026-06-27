INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'guadeloupe','state','FR','FR-GP','Prohibited (Civil Penalty for Simple Use)',
'Guadeloupe is a French overseas department and region (DROM) in the Caribbean. French law applies in full. Under the Loi du 31 décembre 1970 and the 2020 civil forfait amendment, simple cannabis use is subject to a fixed €200 civil penalty (amende forfaitaire délictuelle) rather than criminal prosecution, though the underlying legal classification remains a criminal offence. Cultivation, sale, and trafficking remain serious criminal offences. No medical cannabis programme exists under French law — France''s Expérimentation du cannabis à usage médical (ECUM), launched nationally in 2021 and extended through 2025–2026, applies to metropolitan France and does not extend to overseas departments. CBD products containing <0.3% THC are legally sold in shops across Guadeloupe as throughout France.',
'No medical cannabis access is available in Guadeloupe under a local programme. Guadeloupean patients enrolled in clinical trials or the ECUM would need access via metropolitan French channels, which is logistically impractical. No overseas extension of ECUM is in place.',
'Guadeloupean physicians are not authorised to prescribe medical cannabis under ECUM or any other framework in the overseas department.',
'No legal cannabis retail market exists. CBD product retail is a growing legal market across Guadeloupe, paralleling metropolitan France trends. The Caribbean geography creates some informal market dynamics from nearby countries (Dominica, other Caribbean islands).',
'French government policy applies uniformly across DROMs. No separate Guadeloupe cannabis policy is possible. If France advances full medical legalisation post-ECUM, it would extend to Guadeloupe as a full department.',
'Préfet de la Guadeloupe; Agence régionale de santé (ARS) Guadeloupe; Gendarmerie nationale and Police nationale for enforcement',
'French Légifrance legislation portal; ANSM ECUM publications; ARS Guadeloupe health data',
'Current as of Q2 2026; verified against French national legislation and ANSM ECUM documentation',
'Annually','Overseas department briefing on Guadeloupe''s application of French cannabis law, €200 civil penalty for simple use, ECUM non-extension, and CBD market legality',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='FR' AND state_iso2='FR-GP');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'martinique','state','FR','FR-MQ','Prohibited (Civil Penalty for Simple Use)',
'Martinique is a French overseas department and region (DROM) in the Caribbean. French national cannabis law applies in full. Simple cannabis use carries a €200 civil forfeit; cultivation, sale, and trafficking remain criminal offences. No medical cannabis programme exists in Martinique — France''s ECUM medical trial does not extend to overseas departments. CBD products (<0.3% THC) are legal across Martinique as throughout France.',
'No medical cannabis access exists in Martinique under any formal programme. Martinican patients cannot access ECUM.',
'Martinican physicians are not authorised to prescribe medical cannabis.',
'No legal cannabis retail market. CBD retail is growing. Caribbean market dynamics (proximity to Saint Lucia and other islands) are background factors.',
'French national policy applies. No separate Martinique cannabis framework is possible. ECUM extension to overseas departments would require specific national legislative action.',
'Préfet de la Martinique; ARS Martinique; Gendarmerie nationale and Police nationale',
'French Légifrance; ANSM ECUM data; ARS Martinique health publications',
'Current as of Q2 2026',
'Annually','Overseas department briefing on Martinique''s application of French cannabis law, civil penalty for use, and CBD market',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='FR' AND state_iso2='FR-MQ');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'reunion','state','FR','FR-RE','Prohibited (Civil Penalty for Simple Use)',
'Réunion is a French overseas department and region (DROM) in the Indian Ocean. French national cannabis law applies in full. Simple use carries a €200 civil forfeit; cultivation, sale, and trafficking are criminal. No medical cannabis programme exists — ECUM does not extend to Réunion. CBD products (<0.3% THC) are legal as throughout France.',
'No medical cannabis access in Réunion under any formal programme.',
'Réunion physicians are not authorised to prescribe medical cannabis.',
'No legal retail cannabis market. CBD retail is growing. Réunion''s Indian Ocean location creates different informal market dynamics than the Caribbean DROMs.',
'French national policy applies uniformly.',
'Préfet de La Réunion; ARS Océan Indien; Gendarmerie nationale and Police nationale',
'French Légifrance; ANSM data; ARS Océan Indien publications',
'Current as of Q2 2026',
'Annually','Overseas department briefing on Réunion''s application of French cannabis law and CBD market',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='FR' AND state_iso2='FR-RE');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'french-guiana','state','FR','FR-GF','Prohibited (Civil Penalty for Simple Use)',
'French Guiana is a French overseas department and region (DROM) on the northeastern coast of South America. French national cannabis law applies in full. Simple use carries a €200 civil forfeit; cultivation, sale, and trafficking are criminal. French Guiana''s unique geographic position — sharing land borders with Suriname (where cannabis use is broadly tolerated) and Brazil (adult-use legalisation advancing) — creates significant cross-border cannabis flow dynamics. No medical cannabis programme exists under ECUM. French Guiana also hosts the Guiana Space Centre (Centre Spatial Guyanais), which brings a significant international workforce with varied cannabis law backgrounds.',
'No medical cannabis access exists in French Guiana under any formal programme.',
'French Guiana physicians are not authorised to prescribe medical cannabis.',
'No legal retail cannabis market. French Guiana''s porous borders with Suriname and Brazil create significant informal cannabis market dynamics that differ markedly from the Caribbean DROMs. The Space Centre international workforce represents a distinctive consumer demographic.',
'French national policy applies. Border control challenges are significant given French Guiana''s Amazon frontier geography.',
'Préfet de la Guyane; ARS Guyane; Gendarmerie nationale and Douanes françaises (customs) for border enforcement',
'French Légifrance; ANSM data; ARS Guyane publications; OFDT border data',
'Current as of Q2 2026',
'Annually','Overseas department briefing on French Guiana''s French cannabis law application, Suriname/Brazil border dynamics, Space Centre context, and absence of legal cannabis market',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='FR' AND state_iso2='FR-GF');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'french-polynesia','state','FR','FR-PF','Prohibited',
'French Polynesia is a French overseas collectivity (collectivité d''outre-mer) with a significant degree of autonomy through its Statute of Autonomy (2004). Criminal law — including drug prohibition — falls under French state competence. Cannabis is prohibited under French law as applied in French Polynesia. French Polynesia''s cannabis context is shaped by traditional Polynesian culture and the significant tourism industry (primarily from France, the US, and Australia). The €200 civil forfeit for simple use that applies in metropolitan France and the DROMs may not apply in French Polynesia in the same way, as it is a collectivité rather than a DROM.',
'No medical cannabis programme exists. Access to French ECUM is not available in French Polynesia.',
'French Polynesian physicians follow French medical law in areas of state competence. No cannabis prescribing is authorised.',
'No legal cannabis market. Tourism (Bora Bora, Moorea, Tahiti) creates consumer awareness from visiting nationals of adult-use legal jurisdictions, but no legal market accommodates this.',
'French Polynesia''s semi-autonomous status creates some regulatory nuance, but cannabis prohibition under French state law remains firmly in effect. No reform is under consideration locally or in Paris.',
'Haut-Commissariat de la République en Polynésie française; Direction de la Santé Polynésie française; Gendarmerie nationale for enforcement',
'Direction de la Santé publications; French state legislation as applied in French Polynesia; Haut-Commissariat publications',
'Current as of Q2 2026',
'Annually','Overseas collectivity briefing on French Polynesia''s cannabis prohibition under French state law, autonomy framework context, tourism dynamics, and absence of legal market',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='FR' AND state_iso2='FR-PF');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'new-caledonia','state','FR','FR-NC','Prohibited',
'New Caledonia (Nouvelle-Calédonie) is a French special collectivity (collectivité sui generis) in the southwestern Pacific with extensive autonomy including a distinct legal and governmental framework established by the Nouméa Accord (1998). Criminal law remains within French state competence, and cannabis is prohibited under French criminal law as applied in New Caledonia. New Caledonia''s political situation is complex — three independence referenda (2018, 2020, 2021) all resulted in votes for continued association with France, but by narrowing margins.',
'No medical cannabis programme exists in New Caledonia. ECUM does not extend to New Caledonia.',
'New Caledonian physicians (under French licensing) are not authorised to prescribe medical cannabis.',
'No legal cannabis market. New Caledonia''s nickel mining economy and Pacific position create a distinct economic context.',
'New Caledonia''s unique sui generis status creates constitutional complexity, but cannabis prohibition under French state law is not subject to local legislative override. No reform is under local or national consideration.',
'Haut-Commissariat de la République en Nouvelle-Calédonie; Direction des Affaires Sanitaires et Sociales (DASS-NC); Gendarmerie nationale and Police nationale for enforcement',
'DASS-NC publications; French state legislation; Haut-Commissariat publications; Nouméa Accord for constitutional context',
'Current as of Q2 2026',
'Annually','Special collectivity briefing on New Caledonia''s cannabis prohibition under French state law, Nouméa Accord political context, Kanak customary framework, and absence of legal market',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='FR' AND state_iso2='FR-NC');
