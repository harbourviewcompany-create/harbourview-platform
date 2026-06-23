
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'south-korea','country','KR','Prohibited (Recreational); Limited Medical Access (Epidiolex)',
'South Korea prohibits cannabis under the Narcotics Control Act with strict enforcement. However, South Korea approved Epidiolex (cannabidiol) as a pharmaceutical in 2020, creating the country''s first cannabis-derived medical product pathway. Hemp cultivation has been permitted in limited areas since 2020 for authorized research purposes. The overall framework remains strongly prohibitionist.',
'Patients with qualifying severe epilepsy conditions may access Epidiolex through hospital prescription under the MFDS-approved pharmaceutical pathway. General medical cannabis access does not exist.',
'Specialist physicians (primarily neurologists and epileptologists) may prescribe Epidiolex for qualifying conditions. No general practitioner prescription pathway exists for cannabis-based medicines.',
'The cannabis-derived pharmaceutical market in South Korea is limited to Epidiolex. Research into other cannabinoid medicines is developing within the authorized research hemp framework. Korean pharmaceutical companies have begun exploring cannabinoid R&D.',
'Further pharmaceutical cannabinoid products may receive MFDS approval as international regulatory databases expand. General medical cannabis reform is not under active political consideration. Industrial hemp policy may further develop.',
'MFDS (Ministry of Food and Drug Safety) for pharmaceutical regulation and approval. Korea Customs Service and National Police Agency for enforcement.',
'Narcotics Control Act; MFDS Epidiolex approval; MFDS hemp research licensing; Ministry of Agriculture hemp regulations','Current as of Q2 2026; verified against MFDS official guidance','Annual','Country-level briefing covering strict prohibition with limited pharmaceutical CBD access',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='KR' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'laos','country','LA','Prohibited; Inconsistent Enforcement',
'Cannabis is prohibited in Laos under the Law on Drugs. Enforcement has historically been inconsistent, particularly in rural areas and tourism contexts. Traditional use of cannabis in certain hill tribe communities has been documented. No medical cannabis program exists. The government has at times cracked down on cannabis in tourism contexts.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. Informal use in tourism-oriented areas has occurred but is subject to enforcement crackdowns.',
'Cannabis reform is not a current policy priority. Inconsistent enforcement patterns may continue. No legislative action is anticipated.',
'National Authority for Combating Drugs (NACD); Ministry of Health.',
'Law on Drugs; NACD enforcement monitoring; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status with inconsistent enforcement history',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='LA' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'malaysia','country','MY','Prohibited; Mandatory Death Penalty for Trafficking',
'Cannabis is prohibited in Malaysia under the Dangerous Drugs Act 1952. Malaysia imposes mandatory death penalty for possession of 200 grams or more of cannabis. Any amount is illegal. Despite global reform trends, Malaysia''s drug policy remains among the most severely prohibitionist in the world. No medical cannabis program exists.',
'No legal patient access pathway exists. Malaysia''s mandatory death penalty framework leaves no room for medical access.',
'Physicians cannot prescribe cannabis under any circumstances.',
'No licensed market exists.',
'Malaysia has faced international and domestic pressure regarding its mandatory death penalty drug provisions. Some limited debates on drug reform have occurred. Mandatory death penalty reform for drug offences (discretion for judges) has been discussed but comprehensive cannabis reform is not anticipated.',
'Royal Malaysian Police (PDRM); Agensi Anti Dadah Kebangsaan (AADK); National Pharmaceutical Regulatory Agency (NPRA) under Ministry of Health.',
'Dangerous Drugs Act 1952; AADK annual reports; NPRA pharmaceutical guidance','Current as of Q2 2026','Annual','Country-level briefing noting mandatory death penalty prohibition',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='MY' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'maldives','country','MV','Prohibited; Islamic Law Influence',
'Cannabis is prohibited in the Maldives under the Drug Act with severe penalties influenced by Islamic legal principles. The Maldives applies some Sharia provisions to drug offences. No medical cannabis program exists.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Maldives Police Service; Ministry of Health (Maldives Food and Drug Authority).',
'Drug Act; Maldives FDA pharmaceutical guidance; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='MV' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'marshall-islands','country','MH','Prohibited',
'Cannabis is prohibited in the Marshall Islands. As a sovereign nation in Compact of Free Association with the United States, the Marshall Islands'' drug policy is influenced by US frameworks. No medical cannabis program exists.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Marshall Islands Police; Ministry of Health.',
'Marshall Islands drug laws; Pacific regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='MH' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'mongolia','country','MN','Prohibited',
'Cannabis is prohibited in Mongolia under the Law on Combating Narcotic Drugs and Psychotropic Substances. No medical cannabis program exists. Mongolia has not engaged in cannabis policy reform.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'General Police Department (Mongolia); Ministry of Health for pharmaceuticals.',
'Law on Combating Narcotic Drugs and Psychotropic Substances; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='MN' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'myanmar','country','MM','Prohibited; Conflict Complicates Enforcement',
'Cannabis is prohibited in Myanmar under the Narcotic Drugs and Psychotropic Substances Law. Myanmar''s ongoing armed conflict since the 2021 military coup has severely fragmented governance and law enforcement. Traditional cannabis use has been documented in some ethnic minority hill tribe communities. No medical cannabis program exists.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. The conflict significantly affects all regulatory functions.',
'Cannabis reform is not a realistic near-term prospect given Myanmar''s governance and conflict situation.',
'Union Narcotics Department (where operational); Ministry of Health (where operational).',
'Narcotic Drugs and Psychotropic Substances Law; conflict and governance monitoring; UNODC Myanmar reports','Current as of Q2 2026','Annual','Country-level briefing noting prohibition and conflict context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='MM' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'nepal','country','NP','Prohibited Since 1973; Historical Sacred Use',
'Nepal has a long and significant history of cannabis use, with the Pashupatinath temple complex and Shiva-related religious traditions having included cannabis (bhang) use for centuries. Cannabis cultivation and sale were legal until 1973 when Nepal banned cannabis under pressure during the international War on Drugs. Cannabis has been prohibited under the Narcotic Drugs (Control) Act since. No medical cannabis program exists, but civil society advocacy for re-legalization is active.',
'No formal legal patient access pathway exists. Traditional sacred use at Hindu temples continues in grey areas.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. Nepal''s ban eliminated what was once a significant legal cannabis export trade.',
'Civil society advocacy for cannabis reform has been ongoing for decades. There are periodic legislative proposals. Nepal''s historical production regions (particularly Manang, Mustang, and Dolpo districts) retain cultivation knowledge. Agricultural and tourism economic arguments for re-legalization are made. No near-term legislation is anticipated but Nepal is a jurisdiction with significant reform advocacy.',
'Nepal Police Narcotics Control Bureau; Department of Drug Administration (DDA) under Ministry of Health.',
'Narcotic Drugs (Control) Act; DDA pharmaceutical policy; historical and civil society documentation','Current as of Q2 2026','Quarterly','Country-level briefing covering historical sacred use context and decades of cannabis prohibition following 1973 ban',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='NP' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'new-zealand','country','NZ','Medical Legal (2020); Adult-Use Referendum Failed (2020)',
'New Zealand implemented the Medicinal Cannabis Scheme in April 2020, creating a licensed domestic medical cannabis industry. The same year, a referendum on recreational cannabis legalization was narrowly defeated (53% against, 46% in favour). The medical program is administered by Medsafe and includes domestic cultivation, manufacturing, and prescription access. Products include dried flower, oils, and pharmaceutical preparations.',
'Patients access medical cannabis from licensed pharmacies with a prescription from a New Zealand-registered medical professional. Imported products from licensed international suppliers and domestically produced products are available. Registration requirements apply. ACC (accident compensation) does not routinely cover medical cannabis costs.',
'Registered medical practitioners (including general practitioners) may prescribe approved medical cannabis products for any condition where they believe it will benefit the patient. No specialist restriction applies. The NZ Medical Association has provided clinical guidance.',
'New Zealand''s medical cannabis market includes multiple licensed cultivators, manufacturers, and importers. Domestic production has grown, reducing reliance on imports. Several products have received Medsafe assessment for quality and safety. The market is small relative to Canada and Australia but well-regulated.',
'The Medicinal Cannabis Scheme continues to mature. Further product approvals and potential expansion of access (including consideration of adult-use in future referendums) are possibilities. Export from New Zealand to international markets is permitted where regulatory frameworks allow. Policy interest in a future adult-use referendum has not dimmed among advocacy groups.',
'Medsafe (Medicines and Medical Devices Safety Authority) under the Ministry of Health. Ministry of Primary Industries for cultivation licensing.',
'Misuse of Drugs (Medicinal Cannabis) Regulations 2019; Medsafe Medicinal Cannabis Scheme guidance; Ministry of Health policy documents','Current as of Q2 2026; verified against Medsafe official guidance','Quarterly','Full country-level briefing covering medical legalization, referendum outcome, and regulated market development',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='NZ' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'nauru','country','NR','Prohibited',
'Cannabis is prohibited in Nauru. The small island state has limited regulatory capacity. No medical cannabis program exists.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Nauru Police Force; Ministry of Health.',
'Nauru drug laws; Pacific regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='NR' AND jurisdiction_type='country');
