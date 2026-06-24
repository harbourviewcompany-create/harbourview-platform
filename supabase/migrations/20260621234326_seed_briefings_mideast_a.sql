
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'afghanistan','country','AF','Prohibited; Taliban Enforcement',
'Under the Taliban government that assumed control in 2021, cannabis (hashish/charas) is prohibited alongside poppy. The Taliban banned opium poppy cultivation in April 2022. Cannabis has traditionally been cultivated in some regions and used in hashish production. Enforcement of the Taliban''s drug bans varies by region and commander. No medical cannabis program exists or is being considered.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. Afghanistan was historically a significant hashish producer in the informal market.',
'Cannabis reform is not a policy consideration under the Taliban government. The trajectory is toward prohibition enforcement rather than liberalization.',
'Taliban-controlled Ministry of Interior and religious authorities (ulema).',
'Taliban drug decrees 2021–2022; UNODC Afghanistan cannabis monitoring; regional security analysis','Current as of Q2 2026','Annual','Country-level briefing noting Taliban prohibition and traditional production context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='AF' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'armenia','country','AM','Prohibited',
'Cannabis is prohibited in Armenia under the Law on Narcotic Drugs. No medical cannabis program exists. Armenia has not engaged in formal cannabis policy reform at the legislative level.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Police of the Republic of Armenia; Ministry of Health (State Medical Commission).',
'Law on Narcotic Drugs; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='AM' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'azerbaijan','country','AZ','Prohibited',
'Cannabis is prohibited in Azerbaijan under the Law on Narcotic Drugs, Psychotropic Substances and Precursors. Enforcement is active. No medical cannabis program exists. Azerbaijan has not engaged in cannabis policy reform.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Azerbaijan State Customs Committee and Ministry of Internal Affairs for enforcement; Ministry of Health for pharmaceuticals.',
'Law on Narcotic Drugs, Psychotropic Substances and Precursors; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='AZ' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'bahrain','country','BH','Prohibited; Zero Tolerance',
'Cannabis is prohibited in Bahrain under strict drug laws influenced by Islamic jurisprudence. Penalties are severe, with significant mandatory sentencing. No medical cannabis program exists. Bahrain has maintained a zero-tolerance approach to cannabis.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis. No cannabis-based pharmaceuticals are available through Bahraini healthcare.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. Gulf Cooperation Council regional peer pressure maintains prohibitionist approaches across GCC states.',
'Ministry of Interior; National Authority for Combating Drugs and Alcohol (NACDA); Ministry of Health.',
'Bahrain drug laws; NACDA reports; GCC regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting strict prohibition',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='BH' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'georgia','country','GE','Personal Use Decriminalized (Constitutional Court); No Medical Program',
'Georgia''s Constitutional Court ruled in 2018 and 2019 that criminalizing cannabis use (as opposed to possession with intent to supply) was unconstitutional. This effectively decriminalized personal use. However, Georgia has not enacted a medical cannabis program or adult-use licensing framework. Possession above personal-use thresholds remains criminally prohibited.',
'No formal medical patient access pathway exists. Personal use is constitutionally protected but there is no licensed supply chain for cannabis.',
'Physicians cannot formally prescribe cannabis as no medical regulatory framework exists.',
'No licensed market exists. The constitutional ruling has created a legal grey area that has not been resolved by comprehensive cannabis legislation.',
'Cannabis legislation to formalize personal use rights and potentially create a medical program is under civil society advocacy. No imminent formal legislation has been introduced.',
'Ministry of Internal Affairs for enforcement; Ministry of Labour, Health and Social Affairs for medical matters.',
'Georgian Constitutional Court ruling 2018–2019; regional comparative analysis; civil society monitoring','Current as of Q2 2026','Annual','Country-level briefing covering constitutional decriminalization and absence of medical framework',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='GE' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'iran','country','IR','Prohibited; Severe Penalties',
'Cannabis is prohibited in Iran under the Islamic Penal Code and drug trafficking laws. Iran imposes some of the world''s harshest drug penalties, including the death penalty for trafficking above threshold quantities. No medical cannabis program exists. Cannabis use and supply face extreme legal risk. Iran executes significant numbers of drug offenders annually.',
'No legal patient access pathway exists. Iran''s strict prohibitionist laws leave no room for medical access.',
'Physicians cannot prescribe cannabis. No cannabis-based pharmaceuticals are available through the Iranian healthcare system.',
'No licensed market exists.',
'Cannabis reform is not a current policy consideration. Iran''s position on drug policy remains firmly prohibitionist with severe enforcement.',
'Law Enforcement Command of the Islamic Republic of Iran (FARAJA); Anti-Narcotics Headquarters; Ministry of Health and Medical Education.',
'Islamic Penal Code; Anti-Narcotics Law; UNODC Iran drug reports','Current as of Q2 2026','Annual','Country-level briefing noting severe prohibition including death penalty for trafficking',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='IR' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'iraq','country','IQ','Prohibited',
'Cannabis is prohibited in Iraq under the Anti-Narcotics Law. Enforcement varies significantly across different regions and is complicated by security conditions in some areas. No medical cannabis program exists. Iraq has not engaged in cannabis policy reform.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. Political and security instability affects all regulatory functions.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Ministry of Interior; Iraqi Counter Narcotics Directorate; Ministry of Health.',
'Anti-Narcotics Law; regional comparative analysis; security monitoring','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='IQ' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'jordan','country','JO','Prohibited; Strict Enforcement',
'Cannabis is prohibited in Jordan under the Law on Narcotic Drugs and Psychotropic Substances. Jordan maintains strict enforcement, with penalties including imprisonment for possession. No medical cannabis program exists. Jordan has not engaged in cannabis policy reform.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. Regional dynamics and Jordan''s security-oriented governance make near-term liberalization unlikely.',
'Public Security Directorate Anti-Narcotics Department; Ministry of Health (Jordan Food and Drug Administration).',
'Law on Narcotic Drugs and Psychotropic Substances; Jordan Food and Drug Administration reports; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting strict prohibition',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='JO' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'kazakhstan','country','KZ','Prohibited; Industrial Hemp Research Developing',
'Cannabis is prohibited in Kazakhstan under the Law on Narcotic Drugs, Psychotropic Substances, Precursors and Measures to Counteract Their Illicit Trafficking. Kazakhstan has vast areas of naturally growing wild cannabis across the Kazakh steppe, though this has not influenced regulatory liberalization. No medical cannabis program exists. Kazakhstan has shown some interest in industrial hemp regulation for fiber and seed markets.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed cannabis market exists. Kazakhstan''s wild cannabis coverage is predominantly from uncontrolled feral plants and does not represent a licensed sector.',
'Industrial hemp policy development is possible given agricultural export interests. Medical cannabis reform is not currently under active consideration. Central Asian regional context remains largely prohibitionist.',
'Agency for Financial Monitoring (drug trafficking); Ministry of Health of Kazakhstan for pharmaceutical matters.',
'Law on Narcotic Drugs; Kazakhstan hemp regulatory discussions; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibition and industrial hemp development context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='KZ' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'kuwait','country','KW','Prohibited; Zero Tolerance',
'Cannabis is prohibited in Kuwait under strict drug laws with severe penalties including lengthy imprisonment and deportation for foreign nationals. Kuwait maintains an uncompromising zero-tolerance approach to all narcotics including cannabis. No medical cannabis program exists.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis. No cannabis-based pharmaceuticals are available.',
'No licensed market exists.',
'Cannabis reform is not a current policy consideration. GCC regional peer dynamics and Islamic law influence maintain strict prohibition.',
'General Department of Criminal Investigation; Ministry of Health (Kuwait Drug and Food Control Authority).',
'Kuwait drug laws; Kuwait Drug and Food Control Authority guidance; GCC regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting strict zero-tolerance prohibition',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='KW' AND jurisdiction_type='country');
