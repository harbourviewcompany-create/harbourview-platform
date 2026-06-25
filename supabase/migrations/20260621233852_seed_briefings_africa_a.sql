
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'algeria','country','DZ','Prohibited',
'Cannabis is prohibited in Algeria under Law 04-18 relating to prevention and repression of illegal drug use and trafficking. Penalties are strict and enforcement is active. Despite Algeria''s geographic position adjacent to Morocco (the world''s largest hashish producer), Algeria treats cannabis transit and use as serious criminal offences. No medical cannabis program exists.',
'No legal patient access pathway exists. Cannabis-based pharmaceuticals are not available through the Algerian public health system.',
'Physicians cannot prescribe cannabis. No regulatory framework for cannabis-based medicines exists.',
'No licensed cannabis market exists. Algeria''s position as a transit corridor for Moroccan hashish creates enforcement challenges. No investment in licensed cannabis has occurred.',
'Cannabis reform is not a current policy priority. Algeria''s drug policy is oriented toward strict enforcement. Morocco''s 2021 legalization has not visibly influenced Algerian policy.',
'Ministry of Justice; Ministry of Health; Office National de Lutte contre la Drogue et la Toxicomanie (ONLCDT).',
'Law 04-18; ONLCDT annual reports; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='DZ' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'angola','country','AO','Prohibited',
'Cannabis is prohibited in Angola under the Lei do Combate à Droga. No medical cannabis program has been established. Enforcement capacity is variable across the country''s regions. Angola has not engaged in formal cannabis policy reform.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. No investment in licensed cannabis has occurred.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated in the near term.',
'SIDA (Serviço de Investigação Criminal) for drug enforcement. Ministry of Health for pharmaceutical regulation.',
'Lei do Combate à Droga; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='AO' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'benin','country','BJ','Prohibited',
'Cannabis is prohibited in Benin under the Loi portant répression du trafic de stupéfiants. No medical cannabis program exists. Enforcement intensity varies. Benin has not engaged in cannabis policy reform discussions.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no framework exists.',
'No licensed market exists. No cannabis investment has occurred.',
'Cannabis reform is not a current policy priority. No imminent legislative change is anticipated.',
'Office Central de Répression du Trafic Illicite de Drogues (OCERTID); Ministry of Health.',
'Drug trafficking law; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='BJ' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'botswana','country','BW','Prohibited',
'Cannabis is prohibited in Botswana under the Drugs and Related Substances Act of 1992. Botswana has strict drug laws with significant penalties. No medical cannabis program exists. The country has not engaged in formal cannabis policy reform, though there is some civil society advocacy.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. No cannabis investment has occurred in the regulated sector.',
'Cannabis reform has been discussed at the civil society level. No legislative action is anticipated in the near term, though regional developments including South Africa''s constitutional ruling may influence future discussions.',
'Botswana Police Service; Department of Health for pharmaceutical matters.',
'Drugs and Related Substances Act 1992; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='BW' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'burkina-faso','country','BF','Prohibited',
'Cannabis is prohibited in Burkina Faso under the Loi portant organisation de la lutte contre la drogue. No medical cannabis program exists. Enforcement capacity is affected by ongoing security challenges in parts of the country.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority given the country''s security situation. No legislative action is anticipated.',
'Direction Générale de la Police Nationale; Ministry of Health.',
'Drug law; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='BF' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'burundi','country','BI','Prohibited',
'Cannabis is prohibited in Burundi under national drug laws. No medical cannabis program exists. Governance challenges and poverty constrain regulatory capacity for cannabis policy reform.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Police Nationale du Burundi; Ministry of Public Health.',
'National drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='BI' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'cameroon','country','CM','Prohibited',
'Cannabis is prohibited in Cameroon under Law No. 97/019 on drugs and precursor substances. No medical cannabis program exists. Some traditional use of cannabis occurs in rural areas. Enforcement is variable across the country''s diverse regions.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. Cameroon''s agricultural potential has been noted in regional cannabis industry discussions but no licensed activity has occurred.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated in the near term.',
'DGSN (Délégation Générale à la Sûreté Nationale); Ministry of Public Health.',
'Law No. 97/019; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status and traditional use context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='CM' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'cape-verde','country','CV','Prohibited',
'Cannabis is prohibited in Cape Verde. The island nation has focused drug policy attention on cocaine transit given its Atlantic position. Cannabis possession and sale are illegal with penalties applied. No medical cannabis program exists.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Polícia Judiciária; Ministry of Health.',
'Cape Verde drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='CV' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'central-african-republic','country','CF','Prohibited; Enforcement Severely Limited',
'Cannabis is technically prohibited in the Central African Republic but enforcement is extremely limited due to ongoing armed conflict and the near-collapse of state institutions across much of the country. Informal cannabis cultivation occurs in some regions. No medical program exists or is being developed.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. Informal cultivation occurs in regions outside government control.',
'Cannabis policy reform is not a realistic near-term prospect given the country''s governance and security situation.',
'Government structures extremely limited. Formal drug oversight by MINUSCA and remaining state institutions.',
'Regional security monitoring; limited official data available','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status and governance limitations',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='CF' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'chad','country','TD','Prohibited',
'Cannabis is prohibited in Chad. Drug enforcement focuses primarily on the country''s position as a transit corridor and the Sahel security environment. No medical cannabis program exists. Enforcement capacity is constrained by resources and ongoing security challenges.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Ministère de la Santé Publique; security forces for enforcement.',
'Chad drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='TD' AND jurisdiction_type='country');
