
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'comoros','country','KM','Prohibited',
'Cannabis is prohibited in the Comoros. The island nation''s drug policy focuses on the widely used khat (miraa) locally. Cannabis prohibition is maintained with no medical program or reform discussions underway.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Ministère de la Santé; Gendarmerie Nationale.',
'Comorian drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='KM' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'democratic-republic-of-congo','country','CD','Prohibited; Enforcement Limited',
'Cannabis is prohibited in the Democratic Republic of Congo under national drug laws, but enforcement across this vast country is extremely uneven and largely symbolic in many regions. Informal cannabis cultivation occurs widely. No medical program exists. The DRC''s scale and governance challenges make coherent drug policy enforcement difficult.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. Informal cultivation and trade occur across many provinces.',
'Cannabis policy reform is not a realistic near-term prospect given governance and resource constraints.',
'Agence Nationale de Renseignements (ANR); Ministry of Public Health for pharmaceuticals.',
'DRC drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status and enforcement limitations',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='CD' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'cote-divoire','country','CI','Prohibited',
'Cannabis is prohibited in Côte d''Ivoire under Law 88-686 on combating drug trafficking and abuse. Enforcement is active in urban areas. No medical cannabis program exists. Côte d''Ivoire has not engaged in cannabis policy reform discussions at the legislative level.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Office Central de Répression du Trafic Illicite de Drogues (OCRTID); Ministry of Health.',
'Law 88-686; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='CI' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'djibouti','country','DJ','Prohibited',
'Cannabis is prohibited in Djibouti. Drug policy in Djibouti focuses primarily on khat, which is widely used and legally tolerated in the country and region. Cannabis prohibition is maintained with no reform discussion underway.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Police Nationale de Djibouti; Ministry of Health.',
'Djibouti drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='DJ' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'egypt','country','EG','Prohibited; Strict Enforcement',
'Cannabis is prohibited in Egypt under Law 182 of 1960 on combating narcotic drugs. Egypt imposes severe penalties for cannabis possession and trafficking, with minimum mandatory sentences for many offences. The country has historically been a transit point for hashish from other regions but maintains aggressive enforcement domestically. No medical cannabis program exists and no reform is under consideration.',
'No legal patient access pathway exists. Egypt''s strict drug laws offer no pathways for medical cannabis access.',
'Physicians cannot prescribe cannabis. No approved cannabis-based pharmaceuticals are available through Egyptian health channels.',
'No licensed market exists. Egypt''s historic role as a regional transit point does not translate to licensed commercial activity.',
'Cannabis reform is not a current government priority. Egypt''s drug policy framework is firmly prohibitionist. No legislative change is anticipated.',
'NCCDP (National Council for Combating and Controlling Drugs Phenomenon); Ministry of Health (MOHP) for pharmaceutical matters.',
'Law 182 of 1960; NCCDP annual reports; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting strict prohibition and absence of reform pathway',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='EG' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'equatorial-guinea','country','GQ','Prohibited',
'Cannabis is prohibited in Equatorial Guinea. The country''s oil-wealth-driven economy has not generated political interest in cannabis policy reform. No medical program exists.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Ministry of Health and Social Welfare; National Police.',
'Equatorial Guinea drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='GQ' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'eritrea','country','ER','Prohibited',
'Cannabis is prohibited in Eritrea. The country''s isolated political environment and limited international engagement mean cannabis policy reform is not a consideration. No medical program exists.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not anticipated given Eritrea''s political isolation. No legislative action is expected.',
'Ministry of Health; national security services.',
'Eritrean drug laws; limited official data available','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status and political isolation context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='ER' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'ethiopia','country','ET','Prohibited',
'Cannabis is prohibited in Ethiopia under the Drug Administration and Control Proclamation. Drug policy in Ethiopia focuses significantly on khat (qat), which is legal, culturally important, and a significant export crop. Cannabis remains prohibited with enforcement varying by region. No medical cannabis program exists.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. Khat is the primary legal stimulant plant.',
'Cannabis reform is not currently being considered. The policy focus remains on khat regulation and traditional agricultural exports. No legislative action is anticipated.',
'Ethiopian Food and Drug Authority (EFDA); Federal Police for enforcement.',
'Drug Administration and Control Proclamation; EFDA pharmaceutical policy; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibition and khat policy context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='ET' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'gabon','country','GA','Prohibited',
'Cannabis is prohibited in Gabon under national drug laws. No medical cannabis program exists. Gabon''s oil revenues have dominated economic policy, and cannabis reform has not been a legislative priority.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Direction Générale de la Pharmacie, du Médicament et des Laboratoires; Gendarmerie Nationale.',
'Gabonese drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='GA' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'gambia','country','GM','Prohibited',
'Cannabis is prohibited in The Gambia under the Drug Control Act. No medical cannabis program exists. The country''s small size and limited regulatory infrastructure constrain policy development capacity.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'National Drug Enforcement Agency (NDEA); Ministry of Health.',
'Drug Control Act; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='GM' AND jurisdiction_type='country');
