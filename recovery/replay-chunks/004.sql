
-- RECOVERY BEGIN 20260621234326_seed_briefings_mideast_a.sql

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


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260621234326','seed_briefings_mideast_a','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260621234326_seed_briefings_mideast_a.sql

-- RECOVERY BEGIN 20260621234426_seed_briefings_mideast_b.sql

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'kyrgyzstan','country','KG','Prohibited; Wild Cannabis Prevalent',
'Cannabis is prohibited in Kyrgyzstan under the Law on Narcotic Drugs, Psychotropic Substances and Precursors. Wild cannabis grows extensively across Kyrgyzstan''s Chuy Valley and other regions. Enforcement targets trafficking rather than personal use in practice, though legally all use is prohibited. No medical cannabis program exists.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. Wild cannabis plants are extensive but the legal framework prohibits commercialization.',
'Cannabis reform is not a current policy priority. Central Asian regional peer dynamics are uniformly prohibitionist. No legislative action is anticipated.',
'State Drug Control Agency (GKNB subordinate); Ministry of Health.',
'Law on Narcotic Drugs, Psychotropic Substances and Precursors; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status and prevalence of wild cannabis',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='KG' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'lebanon','country','LB','Medical and Industrial Legal (since 2020); First Arab Country',
'Lebanon passed Law 178 in April 2020, legalizing cannabis cultivation for medical and industrial purposes, making it the first Arab country to do so. The Bekaa Valley has been a historically significant (though illegal) hashish production region for decades. The Lebanese Cannabis Control Authority (now operating under the Ministry of Economy) licenses cultivation. Economic crisis has affected program implementation, but the legal framework is in place.',
'Domestic patient access through a formal medical distribution system is being developed. The program''s focus is primarily on export-oriented cultivation. As implementation matures, domestic medical access is expected to develop.',
'Lebanese physicians will be able to recommend cannabis-based medicines under the forthcoming clinical framework. Implementation of the prescription pathway is dependent on broader program operationalization.',
'Lebanon''s licensed cannabis sector faces implementation challenges due to the country''s severe economic and political crisis since 2019. However, the Bekaa Valley''s cultivators and existing hashish production knowledge base are potential assets for a formal licensed sector. International partners have engaged with Lebanese producers despite the challenging environment.',
'Full program operationalization, including export licensing with quality standards meeting EU requirements, is the near-term priority. Political and economic stability are prerequisites for the market to develop fully. When conditions improve, Lebanon''s agricultural expertise and geographic position could make it a significant Mediterranean cannabis producer.',
'Ministry of Economy and Trade; Lebanese Cannabis Control Authority; Ministry of Public Health for medical matters.',
'Law 178 (2020); Lebanese Cannabis Control Authority licensing framework; Ministry of Economy regulations','Current as of Q2 2026; verified against official law text','Quarterly','Country-level briefing covering first Arab nation medical legalization and implementation challenges',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='LB' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'oman','country','OM','Prohibited; Zero Tolerance',
'Cannabis is prohibited in Oman under strict drug laws with severe penalties. Oman maintains a zero-tolerance approach. Foreign nationals face particular risk including deportation. No medical cannabis program exists.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis.',
'No licensed market exists.',
'Cannabis reform is not a current policy consideration. GCC peer dynamics maintain prohibition across the Gulf.',
'Royal Oman Police; Ministry of Health (Directorate General of Pharmacy).',
'Oman drug laws; Royal Oman Police drug reports; GCC comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting zero-tolerance prohibition',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='OM' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'pakistan','country','PK','Prohibited; Bhang Tolerates Traditional Use',
'Cannabis is prohibited in Pakistan under the Control of Narcotic Substances Act 1997. However, bhang (a traditional cannabis-infused drink) has a long cultural and religious history in Pakistan and is consumed at certain festivals (particularly Basant and Holi-related celebrations in some communities). Bhang is in a legal grey area — technically prohibited under CNSA but traditionally tolerated at festival contexts. No formal medical cannabis program exists.',
'No formal patient access pathway exists. Traditional bhang consumption occurs within cultural contexts despite formal prohibition.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. Pakistan is a significant informal cannabis (hashish) producer, particularly in FATA regions and Khyber Pakhtunkhwa.',
'Cannabis reform is not a current legislative priority in Pakistan. Traditional bhang use tolerance may continue informally. No medical legalization is anticipated in the near term.',
'Anti-Narcotics Force (ANF); Drug Regulatory Authority of Pakistan (DRAP) for pharmaceuticals.',
'Control of Narcotic Substances Act 1997; DRAP pharmaceutical regulations; ANF enforcement reports; traditional use documentation','Current as of Q2 2026','Annual','Country-level briefing covering prohibition with traditional bhang use context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='PK' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'palestine','country','PS','Prohibited (West Bank and Gaza)',
'Cannabis is prohibited in both the West Bank (under Palestinian Authority governance) and Gaza (under Hamas governance). No medical cannabis program exists in either jurisdiction. The complex political situation — including Israeli occupation, PA administration, and Hamas control — creates a fragmented governance environment. No cannabis policy reform has been proposed.',
'No legal patient access pathway exists in either the West Bank or Gaza.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a priority given the political, security, and governance challenges. No legislative action is anticipated.',
'Palestinian Authority Ministry of Health (West Bank); Hamas Ministry of Health (Gaza); Israeli authorities in some areas.',
'PA and Hamas drug laws; regional comparative analysis; governance monitoring','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status in complex governance context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='PS' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'qatar','country','QA','Prohibited; Zero Tolerance',
'Cannabis is prohibited in Qatar under strict drug laws with severe penalties. Qatar maintained its zero-tolerance approach throughout and following the 2022 FIFA World Cup. Foreign nationals face deportation alongside criminal penalties for cannabis offences. No medical cannabis program exists.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis.',
'No licensed market exists.',
'Cannabis reform is not a current policy consideration. GCC peer dynamics and Islamic law maintain strict prohibition.',
'Ministry of Interior Qatar; PHCC (Primary Health Care Corporation) for medical matters.',
'Qatar drug laws; Ministry of Interior guidance; GCC comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting zero-tolerance prohibition',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='QA' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'saudi-arabia','country','SA','Prohibited; Death Penalty for Trafficking',
'Cannabis is prohibited in Saudi Arabia under the Combating Narcotics and Psychotropic Substances Law. Saudi Arabia imposes some of the world''s harshest drug penalties, with the death penalty applicable for drug trafficking, including cannabis trafficking. The country has executed individuals for drug offences. No medical cannabis program exists and no reform is under consideration.',
'No legal patient access pathway exists. Saudi Arabia''s legal framework provides no basis for cannabis in any context.',
'Physicians cannot prescribe cannabis under any circumstances.',
'No licensed market exists.',
'Cannabis reform is not a policy consideration in Saudi Arabia. The country''s religious, cultural, and legal framework firmly maintains prohibition.',
'General Directorate of Narcotics Control (GDNC); Saudi Food and Drug Authority (SFDA) for pharmaceuticals.',
'Combating Narcotics and Psychotropic Substances Law; GDNC enforcement reports; GCC comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibition with death penalty for trafficking',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='SA' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'syria','country','SY','Prohibited; Enforcement Fragmented by Conflict',
'Cannabis is prohibited in Syria under national drug laws, but enforcement is extremely fragmented due to ongoing civil conflict and the presence of multiple controlling actors across different regions. Syria''s Bekaa border region has historically been connected to regional cannabis (hashish) production flows. No medical cannabis program exists.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. Informal cannabis production and trade occurs in conflict-affected areas.',
'Cannabis reform is not a realistic near-term prospect given Syria''s conflict and governance fragmentation.',
'Syrian Arab Republic Ministry of Health (where operational); multiple conflicting control structures.',
'Syrian drug laws; conflict and governance monitoring; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibition and conflict context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='SY' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'tajikistan','country','TJ','Prohibited; Major Transit Country',
'Cannabis is prohibited in Tajikistan under the Law on Narcotic Drugs, Psychotropic Substances and Precursors. Tajikistan is a significant transit country for Afghan narcotics, and its drug law enforcement is substantial. No medical cannabis program exists.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. Central Asian regional context is uniformly prohibitionist.',
'Drug Control Agency (DCA); Ministry of Health.',
'Law on Narcotic Drugs; DCA annual reports; UNODC Tajikistan monitoring','Current as of Q2 2026','Annual','Country-level briefing noting prohibition and drug transit context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='TJ' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'turkmenistan','country','TM','Prohibited; Isolated State',
'Cannabis is prohibited in Turkmenistan under strict drug laws. Turkmenistan is one of the world''s most isolated countries, and its drug policies reflect a strongly prohibitionist approach. No medical cannabis program exists. External monitoring of Turkmenistan''s drug policy is severely limited due to the country''s isolation.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy consideration. Turkmenistan''s political isolation makes reform highly unlikely.',
'Ministry of Internal Affairs; Ministry of Health and Medical Industry.',
'Turkmen drug laws; limited official data; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status and political isolation',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='TM' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'uzbekistan','country','UZ','Prohibited',
'Cannabis is prohibited in Uzbekistan under the Law on Narcotic Drugs, Psychotropic Substances and Precursors. Enforcement is active. Soviet-era prohibitionist frameworks persist. No medical cannabis program exists. Uzbekistan has been modernizing its regulatory frameworks in other sectors but not cannabis.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'State Customs Committee and Ministry of Internal Affairs for enforcement; Ministry of Health for pharmaceuticals.',
'Law on Narcotic Drugs, Psychotropic Substances and Precursors; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='UZ' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'yemen','country','YE','Prohibited; Governance Severely Limited',
'Cannabis is prohibited in Yemen but enforcement is functionally minimal across much of the country due to ongoing armed conflict. Khat (qat) is widely used and legally tolerated in Yemen and is a significant cultural and economic crop. Cannabis prohibition is largely nominal in conflict-affected areas. No medical cannabis program exists.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. Governance constraints prevent any licensed sector development.',
'Cannabis reform is not a realistic near-term prospect given Yemen''s humanitarian and conflict situation.',
'Recognized Yemeni Government Ministry of Health (where operational); Houthi authorities in their zones; various military actors.',
'Yemeni drug laws; conflict monitoring; UNODC Yemen reports','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status and conflict context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='YE' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'united-arab-emirates','country','AE','Prohibited; Zero Tolerance; Severe Penalties',
'Cannabis is prohibited in the United Arab Emirates under Federal Law No. 14 of 1995 on Combating Narcotics and Psychotropic Substances, with extremely severe penalties. Even trace amounts — including cannabis present in the blood or urine — can result in criminal prosecution. Tourists and transiting passengers have been prosecuted for having cannabis-derived items (including CBD products and prescribed medicines) in their possession. No medical cannabis program exists.',
'No legal patient access pathway exists. The UAE actively prosecutes even individuals with prescribed medical cannabis from other jurisdictions.',
'Physicians cannot prescribe cannabis. No cannabis-based pharmaceuticals are available. Foreign prescriptions for cannabis-based medicines do not protect against UAE prosecution.',
'No licensed market exists. The UAE''s zero-tolerance approach extends to business investment in the cannabis sector.',
'Cannabis reform is not a current policy consideration in the UAE. The country maintains one of the world''s strictest cannabis enforcement regimes. Travelers must be aware that cannabis-adjacent products legal elsewhere may result in criminal charges in the UAE.',
'Ministry of Interior (Dubai Police, Abu Dhabi Police, FEWA); Ministry of Health and Prevention; National Media Council monitors cannabis content.',
'Federal Law No. 14 of 1995; Ministry of Interior enforcement guidance; GCC comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting extreme prohibition with risk to travelers carrying cannabis-adjacent products',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='AE' AND jurisdiction_type='country');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260621234426','seed_briefings_mideast_b','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260621234426_seed_briefings_mideast_b.sql

-- RECOVERY BEGIN 20260621234541_seed_briefings_asiapac_a.sql

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'bangladesh','country','BD','Prohibited',
'Cannabis (locally known as ganja) is prohibited in Bangladesh under the Narcotics Control Act 1990. Bhang has some traditional and cultural usage that has historically been tolerated in certain contexts, though legally it falls under the same prohibition. Enforcement targets commercial supply rather than individual users in practice, but penalties under law are significant.',
'No formal legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Department of Narcotics Control (DNC); Directorate General of Drug Administration (DGDA).',
'Narcotics Control Act 1990; DNC enforcement reports; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='BD' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'bhutan','country','BT','Prohibited; Informal Traditional Cultivation',
'Cannabis is prohibited in Bhutan under the Narcotic Drugs, Psychotropic Substances and Substance Abuse Act. Historically, cannabis grew wild across much of Bhutan and was used as animal fodder; this informal relationship with the plant is part of Bhutanese agricultural history. No medical cannabis program exists, and formal enforcement has increased as Bhutan developed its regulatory framework.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. Wild cannabis growth historically prevalent.',
'Cannabis reform is not a current policy priority. Bhutan''s emphasis on Gross National Happiness and cultural values creates a distinct policy environment. No legislative action is anticipated.',
'Royal Bhutan Police; Ministry of Health.',
'Narcotic Drugs, Psychotropic Substances and Substance Abuse Act; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibition and traditional cultivation history',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='BT' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'brunei','country','BN','Prohibited; Death Penalty for Trafficking',
'Cannabis is prohibited in Brunei under the Misuse of Drugs Act, with the death penalty applicable for trafficking above certain thresholds. Brunei implemented Islamic (Syariah) criminal law elements in 2019, reinforcing the strictly prohibitionist approach. No medical cannabis program exists.',
'No legal patient access pathway exists. Brunei''s legal framework is among the most severely prohibitionist globally.',
'Physicians cannot prescribe cannabis.',
'No licensed market exists.',
'Cannabis reform is not a current policy consideration. Brunei''s legal framework makes reform extremely unlikely.',
'Royal Brunei Police Force; Ministry of Health for pharmaceuticals.',
'Misuse of Drugs Act; Syariah criminal law (where applicable); regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibition with death penalty for trafficking',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='BN' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'cambodia','country','KH','Prohibited; Enforcement Active Since 2018',
'Cannabis is prohibited in Cambodia under the Law on Drug Control. Cannabis was historically tolerated in informal tourist contexts (so-called "happy herbs" in tourist restaurants) through the 2000s and early 2010s, but the government cracked down significantly from 2018 onward with active enforcement and prosecution. No medical cannabis program exists.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. The previously informal tourist market has been eliminated by enforcement.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'National Authority for Combating Drugs (NACD); Ministry of Health.',
'Law on Drug Control; NACD enforcement reports; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibition and enforcement crackdown context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='KH' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'china','country','CN','Prohibited (Cannabis); World''s Largest Industrial Hemp Producer',
'Cannabis (THC-containing) is strictly prohibited in China under the Narcotics Law and Drug Administration Law. However, China is the world''s largest producer and exporter of industrial hemp (low-THC cannabis), with licensed cultivation primarily in Yunnan, Heilongjiang, and other provinces under strict regulation. CBD extracted from hemp was clarified as a cosmetic ingredient in 2019 but remains in a grey area for ingestible products. No medical cannabis (THC) program exists.',
'No legal patient access pathway for THC-containing cannabis exists. Hemp-derived CBD cosmetics are available. No CBD-as-medicine regulatory pathway for oral products exists as of 2026.',
'Physicians cannot prescribe cannabis or THC-based medicines. Traditional Chinese medicine does incorporate hemp seeds but no THC pathway exists.',
'China''s hemp industry is globally dominant, with large-scale fiber and seed production and significant CBD cosmetics exports. The domestic market for hemp-derived consumer products is growing despite regulatory ambiguity. China''s position as a global hemp supplier shapes international pricing and sourcing dynamics.',
'China''s industrial hemp regulatory framework continues to evolve, with CBD cosmetics regulation clarifying product pathways. THC-containing medical cannabis is not on any reform agenda. Industrial hemp cultivation regulations may expand to additional provinces.',
'National Narcotics Control Commission (NNCC); National Medical Products Administration (NMPA); Ministry of Agriculture and Rural Affairs (MARA) for hemp cultivation.',
'Drug Administration Law; Yunnan Province hemp regulations; National Narcotics Control Commission guidelines; NMPA cosmetics guidance','Current as of Q2 2026; verified against NMPA and MARA official guidance','Quarterly','Country-level briefing covering strict THC prohibition alongside dominant global hemp industry position',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='CN' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'fiji','country','FJ','Prohibited',
'Cannabis is prohibited in Fiji under the Illicit Drugs Control Act. Fiji has strict drug enforcement and has not engaged in cannabis policy reform. No medical cannabis program exists.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Fiji Police Force Anti-Drug Unit; Ministry of Health and Medical Services.',
'Illicit Drugs Control Act; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='FJ' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'hong-kong','country','HK','Prohibited; Follows National Chinese Law',
'Cannabis is prohibited in Hong Kong under the Dangerous Drugs Ordinance (Cap. 134). As a Special Administrative Region of China, Hong Kong''s cannabis policy is strictly prohibitionist and consistent with national Chinese drug law. No medical cannabis program exists. The ordinance imposes significant penalties including imprisonment for possession.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy consideration. Hong Kong''s legal alignment with mainland China makes reform extremely unlikely.',
'Hong Kong Customs and Excise Department; Hong Kong Police Force; Department of Health.',
'Dangerous Drugs Ordinance (Cap. 134); Department of Health pharmaceutical guidance; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibition aligned with national Chinese law',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='HK' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'india','country','IN','Complex Status: Ganja/Charas Prohibited; Bhang Tolerated',
'India has a complex cannabis legal framework. The Narcotic Drugs and Psychotropic Substances (NDPS) Act 1985 prohibits ganja (marijuana flowers/bud) and charas (hashish) with significant penalties. However, bhang (a cannabis-infused drink made from leaves/seeds) was explicitly excluded from the NDPS definition of "cannabis" and remains legal and widely available, particularly in certain states. Traditional bhang consumption at Holi and Shivratri is culturally significant. No formal medical cannabis (THC) program exists, though there is active advocacy and academic research.',
'Patients cannot access THC-containing medical cannabis products through Indian healthcare. Hemp-derived CBD (from compliant licensed sources) exists in legal ambiguity. Bhang is available in licensed government shops in states including Uttar Pradesh and Rajasthan.',
'Physicians cannot prescribe cannabis under the NDPS Act framework. Academic and clinical researchers are beginning to engage with the topic of medical cannabis.',
'India''s cannabis market structure includes a large informal economy for ganja and charas alongside legal government-licensed bhang shops in certain states. Industrial hemp has been selectively licensed in Uttarakhand and other states for fiber and seed. The potential for a legal medical cannabis market in the world''s most populous country is economically significant.',
'Medical cannabis reform is under increasing advocacy from civil society, patients, and some political figures. Industrial hemp regulation continues to expand. Full medical cannabis legalization would require NDPS Act amendment, which is a significant political challenge. India is a jurisdiction to watch over the 2025–2030 period.',
'Narcotics Control Bureau (NCB) for enforcement. CDSCO (Central Drugs Standard Control Organisation) for pharmaceutical regulation. State Excise Departments for bhang licensing. Ministry of Agriculture for hemp.',
'NDPS Act 1985; CDSCO pharmaceutical policy; state-level bhang licensing regulations; industrial hemp pilot program documentation','Current as of Q2 2026; verified against CDSCO and NCB official guidance','Quarterly','Country-level briefing covering complex legal framework with ganja prohibition, bhang toleration, and medical reform trajectory',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='IN' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'indonesia','country','ID','Prohibited; Death Penalty for Trafficking',
'Cannabis is prohibited in Indonesia under Law No. 35 of 2009 on Narcotics, with the death penalty applicable for trafficking above threshold quantities. Indonesia maintains one of the most strictly prohibitionist drug regimes in Southeast Asia. Drug offenders including foreign nationals have been executed. No medical cannabis program exists. Aceh province has specific Islamic law provisions further restricting drug-related behaviour.',
'No legal patient access pathway exists. Indonesia''s legal framework provides no basis for medical cannabis access.',
'Physicians cannot prescribe cannabis under any circumstances.',
'No licensed market exists.',
'Cannabis reform is not a current policy consideration. Indonesia''s strictly prohibitionist approach is deeply embedded in policy and public discourse.',
'Badan Narkotika Nasional (BNN); BPOM (Badan Pengawas Obat dan Makanan) for pharmaceutical regulation.',
'Law No. 35 of 2009 on Narcotics; BNN annual reports; BPOM pharmaceutical guidance','Current as of Q2 2026','Annual','Country-level briefing noting death penalty for trafficking prohibition',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='ID' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'japan','country','JP','Prohibited (Recreational); Limited Pharmaceutical Access (2024)',
'Japan has historically maintained one of Asia''s strictest cannabis prohibition regimes under the Cannabis Control Act (1948). In December 2023, Japan amended the Cannabis Control Act to allow the prescription of cannabis-derived pharmaceutical products approved by foreign regulatory agencies (notably Epidiolex for epilepsy). This is a very limited and specific pharmaceutical exception. Recreational use and general medical cannabis use remain strictly prohibited with significant penalties.',
'Patients with qualifying conditions (primarily severe epilepsy) may access cannabis-derived pharmaceutical products (Epidiolex/GW Pharmaceuticals) through PMDA-authorized prescription pathways. This is a narrow pharmaceutical exception, not a broad medical cannabis program.',
'Physicians in specialized epilepsy centers may prescribe PMDA-authorized cannabis-derived pharmaceutical products for qualifying patients. The process involves specialist authorization and is not a general practitioner pathway.',
'The cannabis-derived pharmaceutical market in Japan is in its earliest stages, limited to authorized pharmaceutical products. Japan''s pharmaceutical and biotech industry has begun engaging with cannabinoid research following the 2023 law amendment.',
'The 2023 amendment represents a significant policy shift from absolute prohibition. Further expansion of the pharmaceutical cannabis framework, including additional approved products, is possible. General medical cannabis legalization and recreational use remain distant prospects.',
'PMDA (Pharmaceuticals and Medical Devices Agency) for product approval. Ministry of Health, Labour and Welfare (MHLW) for policy and enforcement. National Police Agency for enforcement.',
'Cannabis Control Act 1948 (amended 2023); PMDA pharmaceutical approval registry; MHLW policy guidance','Current as of Q2 2026; verified against PMDA and MHLW official guidance','Quarterly','Country-level briefing covering 2023 pharmaceutical cannabis amendment and otherwise strict prohibition',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='JP' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'kiribati','country','KI','Prohibited',
'Cannabis is prohibited in Kiribati. The small Pacific island nation has limited regulatory capacity and a very limited formal drug enforcement infrastructure. No medical cannabis program exists.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Kiribati Police Service; Ministry of Health and Medical Services.',
'Kiribati drug laws; Pacific regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='KI' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'north-korea','country','KP','Uncertain; Limited External Visibility',
'Cannabis''s legal status in North Korea is uncertain due to the country''s extreme information isolation. Some reports from defectors and observers suggest cannabis use is not actively prosecuted, particularly in rural areas, and that the plant may not be classified the same as other controlled substances. However, no formal legal permission exists and no medical cannabis program is in place. The extreme information deficit means reliable data is not available.',
'No legal patient access pathway exists as far as can be verified externally.',
'Physicians cannot prescribe cannabis as no known regulatory framework exists.',
'No licensed market is known to exist.',
'Cannabis policy in North Korea is opaque and not verifiable through standard monitoring mechanisms.',
'Ministry of Public Health (DPRK); security and intelligence organs.',
'Defector testimony; limited external observations; UNODC monitoring (highly limited)','Current as of Q2 2026; significant information limitations apply','Annual','Country-level briefing noting uncertain status due to information isolation',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='KP' AND jurisdiction_type='country');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260621234541','seed_briefings_asiapac_a','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260621234541_seed_briefings_asiapac_a.sql

-- RECOVERY BEGIN 20260621234632_seed_briefings_asiapac_b.sql

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


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260621234632','seed_briefings_asiapac_b','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260621234632_seed_briefings_asiapac_b.sql

-- RECOVERY BEGIN 20260621234721_seed_briefings_asiapac_c.sql

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


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260621234721','seed_briefings_asiapac_c','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260621234721_seed_briefings_asiapac_c.sql

-- RECOVERY BEGIN 20260622000001_market_metrics_time_series.sql
-- already applied as gap_a_market_metrics_time_series (20260622153559)


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622000001','market_metrics_time_series','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622000001_market_metrics_time_series.sql

-- RECOVERY BEGIN 20260622000002_trade_flows_structured.sql
-- =============================================================================
-- Harbourview Cannabis Platform — Gap B Migration
-- Table: public.trade_flows
-- Description: Bilateral cannabis trade corridor intelligence: which country
--              pairs have active import/export relationships, under what legal
--              framework, and with what regulatory requirements (GMP, GACP,
--              permits, authorities).  Enables the "trade map" product layer.
-- Supabase project: zvxdgkukjrrwamdpqrg  (Postgres 17)
-- Author:  Harbourview Engineering
-- Created: 2026-06-22
-- Idempotent: yes (CREATE TABLE IF NOT EXISTS; ON CONFLICT DO NOTHING)
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. TABLE
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.trade_flows (
    id                  uuid        NOT NULL DEFAULT gen_random_uuid(),
    origin_iso2         text        NOT NULL,
    destination_iso2    text        NOT NULL,
    flow_direction      text        NOT NULL
                            CHECK (flow_direction IN ('export','import','bilateral')),
    product_category    text        NOT NULL
                            CHECK (product_category IN (
                                'flower','extracts','oils','edibles',
                                'pharmaceutical_cannabinoids',
                                'hemp_fiber','hemp_seed','starting_material',
                                'seeds','other'
                            )),
    legal_status        text        NOT NULL DEFAULT 'unknown'
                            CHECK (legal_status IN (
                                'legal_permit_required','legal_no_permit',
                                'restricted','prohibited','unknown','under_review'
                            )),
    permit_required     boolean     NOT NULL DEFAULT true,
    permit_authority    text,           -- name of issuing regulator(s)
    purpose             text
                            CHECK (purpose IN (
                                'medical','scientific','industrial',
                                'adult_use','re_export','unknown'
                            )),
    gmp_required        boolean     NOT NULL DEFAULT false,
    gacp_required       boolean     NOT NULL DEFAULT false,
    key_requirements    text[]      NOT NULL DEFAULT '{}',
    notes               text,
    source_name         text,
    source_url          text,
    last_verified       date        NOT NULL DEFAULT CURRENT_DATE,
    confidence          text        NOT NULL DEFAULT 'medium'
                            CHECK (confidence IN ('high','medium','low')),
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT trade_flows_pkey PRIMARY KEY (id),
    CONSTRAINT trade_flows_origin_fk
        FOREIGN KEY (origin_iso2)
        REFERENCES public.countries (iso_alpha2)
        ON DELETE RESTRICT,
    CONSTRAINT trade_flows_destination_fk
        FOREIGN KEY (destination_iso2)
        REFERENCES public.countries (iso_alpha2)
        ON DELETE RESTRICT,
    CONSTRAINT trade_flows_not_self_trade
        CHECK (origin_iso2 <> destination_iso2)
);

COMMENT ON TABLE public.trade_flows IS
    'Bilateral cannabis trade corridor intelligence: active and prohibited '
    'import/export relationships between country pairs, with regulatory '
    'framework, permit requirements, and GMP/GACP standards.';

COMMENT ON COLUMN public.trade_flows.flow_direction IS
    'export = origin ships to destination; import = destination pulls from origin; '
    'bilateral = documented in both directions simultaneously';
COMMENT ON COLUMN public.trade_flows.legal_status IS
    'legal_permit_required: trade is legal but export+import permits must be obtained. '
    'legal_no_permit: trade permitted without per-shipment permit. '
    'restricted: partial allowance with tight controls. '
    'prohibited: explicitly illegal under one or both jurisdictions. '
    'unknown: status not yet researched. under_review: regulatory status in flux.';
COMMENT ON COLUMN public.trade_flows.key_requirements IS
    'Array of plain-language requirements, e.g. '
    '{"GMP EU certification required","Single Convention Article 31 import cert","Certificate of Analysis per batch"}';
COMMENT ON COLUMN public.trade_flows.last_verified IS
    'Date the regulatory information was last confirmed against primary sources.';

-- ---------------------------------------------------------------------------
-- 2. INDEXES
-- ---------------------------------------------------------------------------

-- Primary lookup: all flows leaving or entering a given country pair
CREATE INDEX IF NOT EXISTS idx_trade_flows_origin_destination
    ON public.trade_flows (origin_iso2, destination_iso2);

-- Destination-only lookup: "what can enter Germany?"
CREATE INDEX IF NOT EXISTS idx_trade_flows_destination
    ON public.trade_flows (destination_iso2);

-- Filter by regulatory status across the whole table
CREATE INDEX IF NOT EXISTS idx_trade_flows_legal_status
    ON public.trade_flows (legal_status);

-- Filter by product category
CREATE INDEX IF NOT EXISTS idx_trade_flows_product_category
    ON public.trade_flows (product_category);

-- ---------------------------------------------------------------------------
-- 3. UPDATED_AT TRIGGER
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_trade_flows_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_trade_flows_updated_at ON public.trade_flows;
CREATE TRIGGER trg_trade_flows_updated_at
    BEFORE UPDATE ON public.trade_flows
    FOR EACH ROW
    EXECUTE FUNCTION public.set_trade_flows_updated_at();

-- ---------------------------------------------------------------------------
-- 4. ROW-LEVEL SECURITY
-- ---------------------------------------------------------------------------

ALTER TABLE public.trade_flows ENABLE ROW LEVEL SECURITY;

-- Public SELECT: trade corridor data is openly readable (no data_type filter needed here)
DROP POLICY IF EXISTS trade_flows_public_read ON public.trade_flows;
CREATE POLICY trade_flows_public_read
    ON public.trade_flows
    FOR SELECT
    TO public
    USING (true);

-- Service role: full write access
DROP POLICY IF EXISTS trade_flows_service_write ON public.trade_flows;
CREATE POLICY trade_flows_service_write
    ON public.trade_flows
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 5. SEED DATA — Known active and prohibited trade corridors
-- Sources: Health Canada export framework, BfArM import guidance (§3 BtMG),
--          TGA import/export rules, MHRA licence conditions, Colombia MinSalud
--          Decreto 613/2017, Lesotho MoH, INCB Single Convention Article 31,
--          Medsafe NZ import schedule.
-- Source label: 'Harbourview Research — regulatory intelligence'
-- last_verified: 2025-01-01 for all seed rows
-- ---------------------------------------------------------------------------

INSERT INTO public.trade_flows (
    origin_iso2, destination_iso2,
    flow_direction, product_category,
    legal_status, permit_required, permit_authority,
    purpose,
    gmp_required, gacp_required,
    key_requirements,
    notes,
    source_name,
    last_verified, confidence
)
VALUES

-- ── CA → DE : flower ──────────────────────────────────────────────────────
-- Canada is Germany's single largest supplier of medical cannabis by volume.
-- Requires EU-GMP certification by German authority + GACP farm certification.
(
    'CA', 'DE',
    'export', 'flower',
    'legal_permit_required', true, 'BfArM/Health Canada',
    'medical',
    true, true,
    ARRAY[
        'EU-GMP certification for Canadian facility required',
        'GACP certification for cultivation site required',
        'BfArM narcotics import permit per shipment (§3 BtMG)',
        'Health Canada cannabis export licence',
        'Single Convention Article 31 import/export authorisations',
        'Certificate of Analysis (CoA) per batch',
        'Phytosanitary certificate not required for processed flower'
    ],
    'Canada is the primary supplier of GMP medical cannabis to Germany. '
    'EU-GMP audits conducted by German state authority (Landesbehörde).',
    'Harbourview Research — regulatory intelligence',
    '2025-01-01', 'high'
),

-- ── CA → UK : extracts ────────────────────────────────────────────────────
(
    'CA', 'GB',
    'export', 'extracts',
    'legal_permit_required', true, 'MHRA/Health Canada',
    'medical',
    true, false,
    ARRAY[
        'MHRA Schedule 2 import licence required',
        'Health Canada cannabis export licence',
        'EU-GMP or equivalent recognised standard (MHRA assessed)',
        'MHRA import declaration per consignment',
        'CoA and batch records required'
    ],
    'Post-Brexit MHRA maintains own import licensing. UK recognises Health Canada '
    'GMP but may require MHRA desktop review for new suppliers.',
    'Harbourview Research — regulatory intelligence',
    '2025-01-01', 'high'
),

-- ── CA → UK : pharmaceutical_cannabinoids ─────────────────────────────────
(
    'CA', 'GB',
    'export', 'pharmaceutical_cannabinoids',
    'legal_permit_required', true, 'MHRA/Health Canada',
    'medical',
    true, false,
    ARRAY[
        'MHRA Schedule 2 import licence required',
        'Health Canada cannabis export licence',
        'Full ICH Q7 API GMP compliance expected for pharmaceutical cannabinoids',
        'CoA and batch records required'
    ],
    'Pharmaceutical-grade cannabinoids (e.g. CBD API, THC API) require '
    'stricter ICH Q7 GMP compliance beyond standard cannabis GMP.',
    'Harbourview Research — regulatory intelligence',
    '2025-01-01', 'high'
),

-- ── CA → AU : flower ──────────────────────────────────────────────────────
(
    'CA', 'AU',
    'export', 'flower',
    'legal_permit_required', true, 'TGA/Health Canada',
    'medical',
    true, false,
    ARRAY[
        'TGA import permit required (Therapeutic Goods Act 1989)',
        'TGA ODC import licence for importer',
        'Health Canada cannabis export licence',
        'Australian GMP licence (PIC/S standard) or TGA recognition of Canadian GMP',
        'CoA per batch; TGA may require independent Australian lab testing',
        'ARTG listing or TGA SAS-B pathway approval for product'
    ],
    'Australia requires TGA-recognised GMP. Canada and Australia have bilateral '
    'GMP recognition arrangements under PIC/S membership, streamlining approvals.',
    'Harbourview Research — regulatory intelligence',
    '2025-01-01', 'high'
),

-- ── CA → AU : oils ────────────────────────────────────────────────────────
(
    'CA', 'AU',
    'export', 'oils',
    'legal_permit_required', true, 'TGA/Health Canada',
    'medical',
    true, false,
    ARRAY[
        'TGA import permit required',
        'TGA ODC import licence',
        'Health Canada cannabis export licence',
        'PIC/S GMP compliance',
        'ARTG listing or TGA SAS-B approval',
        'CoA per batch'
    ],
    NULL,
    'Harbourview Research — regulatory intelligence',
    '2025-01-01', 'high'
),

-- ── CA → IL : flower ──────────────────────────────────────────────────────
(
    'CA', 'IL',
    'export', 'flower',
    'legal_permit_required', true, 'MOH Israel/Health Canada',
    'medical',
    true, false,
    ARRAY[
        'Israeli MOH import licence for medical cannabis',
        'Health Canada cannabis export licence',
        'IMC-GAP (Israeli equivalent of GACP) or GACP certification',
        'IMC-GMP or EU-GMP certification for post-harvest processing',
        'Single Convention Article 31 authorisations',
        'CoA per batch; Israeli lab verification may be required'
    ],
    'Israel operates its own cannabis regulatory framework (IMC). '
    'Canadian exporters require IMC-GMP certification recognised by MOH Israel.',
    'Harbourview Research — regulatory intelligence',
    '2025-01-01', 'medium'
),

-- ── CO → DE : flower ──────────────────────────────────────────────────────
(
    'CO', 'DE',
    'export', 'flower',
    'legal_permit_required', true, 'BfArM/Colombia MinSalud',
    'medical',
    true, true,
    ARRAY[
        'EU-GMP certification for Colombian facility (Invima-audited)',
        'GACP certification for Colombian farms',
        'BfArM narcotics import permit (§3 BtMG)',
        'Colombia MinSalud/Invima export licence under Decree 613/2017',
        'Single Convention Article 31 export/import authorisations',
        'CoA per batch; phytosanitary certificate'
    ],
    'Colombia is a fast-growing EU exporter. Invima-issued GMP certificates '
    'are accepted by BfArM. GACP audits conducted by German-accredited bodies.',
    'Harbourview Research — regulatory intelligence',
    '2025-01-01', 'high'
),

-- ── CO → DE : oils ────────────────────────────────────────────────────────
(
    'CO', 'DE',
    'export', 'oils',
    'legal_permit_required', true, 'BfArM/Colombia MinSalud',
    'medical',
    true, false,
    ARRAY[
        'EU-GMP certification for Colombian extraction/manufacturing facility',
        'BfArM narcotics import permit',
        'Colombia MinSalud/Invima export licence',
        'Single Convention Article 31 authorisations',
        'CoA per batch'
    ],
    NULL,
    'Harbourview Research — regulatory intelligence',
    '2025-01-01', 'high'
),

-- ── CO → UK : oils ────────────────────────────────────────────────────────
(
    'CO', 'GB',
    'export', 'oils',
    'legal_permit_required', true, 'MHRA/Colombia MinSalud',
    'medical',
    false, false,
    ARRAY[
        'MHRA Schedule 2 import licence',
        'Colombia MinSalud/Invima export licence',
        'MHRA-recognised GMP (EU-GMP or equivalent)',
        'CoA per batch'
    ],
    'UK has become an emerging market for Colombian cannabis oil exports, '
    'particularly full-spectrum and broad-spectrum CBD-rich oils.',
    'Harbourview Research — regulatory intelligence',
    '2025-01-01', 'medium'
),

-- ── LS → DE : flower ──────────────────────────────────────────────────────
-- Lesotho is one of Africa's leading cannabis exporters and a significant EU supplier.
(
    'LS', 'DE',
    'export', 'flower',
    'legal_permit_required', true, 'BfArM/Lesotho MoH',
    'medical',
    true, true,
    ARRAY[
        'EU-GMP certification for Lesotho processing facility',
        'GACP certification for Lesotho cultivation (high-altitude outdoor)',
        'BfArM narcotics import permit (§3 BtMG)',
        'Lesotho MoH export permit under Cannabis Industry Regulation 2020',
        'Single Convention Article 31 authorisations',
        'CoA per batch; phytosanitary certificate'
    ],
    'Lesotho was among the first African nations to legalise medical cannabis '
    'cultivation (2017). Altitude and climate produce competitive GACP flower. '
    'Several facilities have achieved EU-GMP certification.',
    'Harbourview Research — regulatory intelligence',
    '2025-01-01', 'high'
),

-- ── MK → DE : flower ──────────────────────────────────────────────────────
-- North Macedonia supplies GMP flower to Germany via EU proximity.
(
    'MK', 'DE',
    'export', 'flower',
    'legal_permit_required', true, 'BfArM/North Macedonia Agency for Medicines and Medical Devices',
    'medical',
    true, false,
    ARRAY[
        'EU-GMP certification (MK is EU candidate state; EU-GMP accepted)',
        'BfArM narcotics import permit (§3 BtMG)',
        'North Macedonia MALMED export authorisation',
        'Single Convention Article 31 authorisations',
        'CoA per batch'
    ],
    'North Macedonia has issued licences to several cultivators/processors '
    'for medical cannabis export, primarily targeting the German market.',
    'Harbourview Research — regulatory intelligence',
    '2025-01-01', 'medium'
),

-- ── PT → DE : flower ──────────────────────────────────────────────────────
-- Portugal is a growing EU intra-bloc cannabis supplier.
(
    'PT', 'DE',
    'export', 'flower',
    'legal_permit_required', true, 'BfArM/Infarmed',
    'medical',
    true, false,
    ARRAY[
        'EU-GMP certification (Infarmed-issued; intra-EU)',
        'BfArM narcotics import permit (§3 BtMG)',
        'Infarmed export licence under Decreto-Lei 8/2019',
        'Single Convention Article 31 authorisations',
        'CoA per batch'
    ],
    'Intra-EU trade; Single Convention requirements still apply for narcotic substances. '
    'Portugal has licensed multiple cultivators for EU export since 2019.',
    'Harbourview Research — regulatory intelligence',
    '2025-01-01', 'medium'
),

-- ── NL → DE : flower ──────────────────────────────────────────────────────
-- Netherlands Bureau for Medicinal Cannabis (BMC) is a state GMP producer.
(
    'NL', 'DE',
    'export', 'flower',
    'legal_permit_required', true, 'BfArM/Bureau Medicinale Cannabis',
    'medical',
    true, false,
    ARRAY[
        'EU-GMP certification (Dutch Bureau Medicinale Cannabis; state monopoly)',
        'BfArM narcotics import permit (§3 BtMG)',
        'BMC export authorisation (intra-EU Schengen Article 75 procedure)',
        'Single Convention Article 31 authorisations',
        'CoA per batch'
    ],
    'The Dutch BMC (Bureau voor Medicinale Cannabis) is a government-controlled '
    'GMP producer. Intra-EU trade but narcotics controls still apply.',
    'Harbourview Research — regulatory intelligence',
    '2025-01-01', 'high'
),

-- ── AU → NZ : oils ────────────────────────────────────────────────────────
(
    'AU', 'NZ',
    'export', 'oils',
    'legal_permit_required', true, 'Medsafe/TGA',
    'medical',
    true, false,
    ARRAY[
        'Medsafe import licence (Medicines Act 1981, Schedule 3)',
        'TGA export permit',
        'PIC/S GMP compliance (recognised bilaterally AU/NZ)',
        'CoA per batch; Medsafe may require NZ lab verification',
        'Prescriber Special Authority or Medsafe approval for product'
    ],
    'Australia and New Zealand have close regulatory alignment under the '
    'Trans-Tasman Mutual Recognition Arrangement (TTMRA), easing GMP '
    'recognition, though separate import licences are still required.',
    'Harbourview Research — regulatory intelligence',
    '2025-01-01', 'high'
),

-- ── IL → DE : pharmaceutical_cannabinoids ─────────────────────────────────
-- Israel exports pharmaceutical-grade cannabinoids (e.g. synthetic THC API).
(
    'IL', 'DE',
    'export', 'pharmaceutical_cannabinoids',
    'legal_permit_required', true, 'BfArM/MOH Israel',
    'medical',
    true, false,
    ARRAY[
        'EU-GMP or ICH Q7 API GMP certification for Israeli manufacturer',
        'BfArM narcotics import permit (§3 BtMG)',
        'MOH Israel export licence',
        'Single Convention Article 31 authorisations',
        'Drug Master File (DMF) or ASMF submission to BfArM',
        'CoA per batch'
    ],
    'Israel has a significant pharmaceutical industry and exports both '
    'botanical cannabinoids and synthetic pharmaceutical cannabinoids. '
    'Pharmaceutical-grade flows require API GMP and DMF filing.',
    'Harbourview Research — regulatory intelligence',
    '2025-01-01', 'medium'
),

-- ── US → CA : PROHIBITED ──────────────────────────────────────────────────
-- Cannabis remains federally Schedule I in the US; cross-border shipment illegal.
(
    'US', 'CA',
    'export', 'flower',
    'prohibited', false, NULL,
    'adult_use',
    false, false,
    ARRAY[
        'Cannabis is Schedule I under the US Controlled Substances Act (21 U.S.C. §812)',
        'Federal law prohibits cross-border export regardless of state legalisation',
        'CBSA seizure and criminal prosecution risk for importers',
        'Canada Border Services Agency (CBSA) enforces prohibition at ports of entry'
    ],
    'Cannabis remains Schedule I federally in the United States; cross-border '
    'shipment to Canada is illegal under both US federal law and Canadian CBSA '
    'enforcement policy. State-level legalisation provides no federal export authority.',
    'Harbourview Research — regulatory intelligence',
    '2025-01-01', 'high'
)

ON CONFLICT DO NOTHING;

COMMIT;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622000002','trade_flows_structured','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622000002_trade_flows_structured.sql

-- RECOVERY BEGIN 20260622000003_operator_entity_graph.sql
-- =============================================================================
-- Migration: Gap C — Global Operator / Entity Graph
-- Platform:  Harbourview Cannabis Intelligence Platform
-- Database:  Supabase PostgreSQL 17
-- Author:    Harbourview Engineering
-- Date:      2026-06-22
-- Purpose:   Creates a generalized global operator/entity registry alongside
--            (not replacing) the existing Canada-specific tables in
--            public.health_canada_operator_registry.
-- Source:    Harbourview Research — public regulatory sources
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. TABLES
-- ---------------------------------------------------------------------------

-- 1a. cannabis_operators — licensed cannabis operators globally
CREATE TABLE IF NOT EXISTS public.cannabis_operators (
    id                   uuid        NOT NULL DEFAULT gen_random_uuid(),
    country_iso2         text        NOT NULL,
    legal_name           text        NOT NULL,
    normalized_name      text        NOT NULL,
    operator_type        text        NOT NULL,
    primary_country_iso2 text,
    website              text,
    linkedin_url         text,
    public_status        text        NOT NULL DEFAULT 'active',
    data_completeness    text        NOT NULL DEFAULT 'stub',
    verification_status  text        NOT NULL DEFAULT 'unverified',
    created_at           timestamptz NOT NULL DEFAULT now(),
    updated_at           timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT cannabis_operators_pkey
        PRIMARY KEY (id),

    CONSTRAINT cannabis_operators_country_iso2_fkey
        FOREIGN KEY (country_iso2)
        REFERENCES public.countries (iso_alpha2),

    CONSTRAINT cannabis_operators_primary_country_iso2_fkey
        FOREIGN KEY (primary_country_iso2)
        REFERENCES public.countries (iso_alpha2),

    CONSTRAINT cannabis_operators_operator_type_check
        CHECK (operator_type IN (
            'cultivator','processor','seller','pharmacy','distributor',
            'laboratory','clinic','importer','exporter','integrated',
            'holding_company','investment_fund','research_institution','other'
        )),

    CONSTRAINT cannabis_operators_public_status_check
        CHECK (public_status IN (
            'active','revoked','suspended','expired','pending','unknown'
        )),

    CONSTRAINT cannabis_operators_data_completeness_check
        CHECK (data_completeness IN (
            'stub','seed','verified','full'
        )),

    CONSTRAINT cannabis_operators_verification_status_check
        CHECK (verification_status IN (
            'unverified','admin_verified','source_verified'
        ))
);

COMMENT ON TABLE public.cannabis_operators IS
    'Global licensed cannabis operators registry. '
    'Source: Harbourview Research — public regulatory sources. '
    'Canada-specific detail is in health_canada_operator_registry schema.';

COMMENT ON COLUMN public.cannabis_operators.normalized_name IS
    'Lowercased, whitespace-collapsed, punctuation-stripped form of legal_name for deduplication.';
COMMENT ON COLUMN public.cannabis_operators.operator_type IS
    'Primary operational classification. Integrated = full vertical. '
    'Multi-type operators should be modelled as integrated or by their dominant activity.';
COMMENT ON COLUMN public.cannabis_operators.data_completeness IS
    'stub=minimal id record; seed=basic public info; verified=cross-checked; full=comprehensive.';


-- 1b. operator_licences — individual licences held by operators
CREATE TABLE IF NOT EXISTS public.operator_licences (
    id                      uuid        NOT NULL DEFAULT gen_random_uuid(),
    operator_id             uuid        NOT NULL,
    country_iso2            text        NOT NULL,
    licence_number          text,
    licence_class           text        NOT NULL,
    issuing_regulator       text        NOT NULL,
    authorized_activities   text[]      NOT NULL DEFAULT '{}',
    issue_date              date,
    expiry_date             date,
    licence_status          text        NOT NULL DEFAULT 'active',
    facility_city           text,
    facility_province_state text,
    gmp_certified           boolean     DEFAULT false,
    gacp_certified          boolean     DEFAULT false,
    source_url              text,
    last_verified           date        NOT NULL DEFAULT CURRENT_DATE,
    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT operator_licences_pkey
        PRIMARY KEY (id),

    CONSTRAINT operator_licences_operator_id_fkey
        FOREIGN KEY (operator_id)
        REFERENCES public.cannabis_operators (id)
        ON DELETE CASCADE,

    CONSTRAINT operator_licences_country_iso2_fkey
        FOREIGN KEY (country_iso2)
        REFERENCES public.countries (iso_alpha2),

    CONSTRAINT operator_licences_licence_status_check
        CHECK (licence_status IN (
            'active','revoked','suspended','expired','pending','unknown'
        ))
);

COMMENT ON TABLE public.operator_licences IS
    'Individual regulatory licences held by cannabis operators globally. '
    'Source: Harbourview Research — public regulatory sources.';

COMMENT ON COLUMN public.operator_licences.licence_class IS
    'Regulator-specific licence class, e.g. ''Standard Cultivation'', ''Processing'', ''Sale for Medical Purposes''.';
COMMENT ON COLUMN public.operator_licences.authorized_activities IS
    'Array of specific activities authorised under this licence, as published by the regulator.';


-- 1c. operator_countries — junction table for multi-country operators
CREATE TABLE IF NOT EXISTS public.operator_countries (
    id            uuid NOT NULL DEFAULT gen_random_uuid(),
    operator_id   uuid NOT NULL,
    country_iso2  text NOT NULL,
    presence_type text NOT NULL,

    CONSTRAINT operator_countries_pkey
        PRIMARY KEY (id),

    CONSTRAINT operator_countries_operator_id_fkey
        FOREIGN KEY (operator_id)
        REFERENCES public.cannabis_operators (id)
        ON DELETE CASCADE,

    CONSTRAINT operator_countries_country_iso2_fkey
        FOREIGN KEY (country_iso2)
        REFERENCES public.countries (iso_alpha2),

    CONSTRAINT operator_countries_presence_type_check
        CHECK (presence_type IN (
            'headquarters','subsidiary','licensed_facility',
            'distribution','sales_office','partnership'
        )),

    CONSTRAINT operator_countries_unique_operator_country_presence
        UNIQUE (operator_id, country_iso2, presence_type)
);

COMMENT ON TABLE public.operator_countries IS
    'Junction table mapping operators to every country in which they have a regulated presence.';


-- ---------------------------------------------------------------------------
-- 2. INDEXES
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_cannabis_operators_country_iso2
    ON public.cannabis_operators (country_iso2);

CREATE INDEX IF NOT EXISTS idx_cannabis_operators_operator_type
    ON public.cannabis_operators (operator_type);

CREATE INDEX IF NOT EXISTS idx_operator_licences_operator_id
    ON public.operator_licences (operator_id);

CREATE INDEX IF NOT EXISTS idx_operator_licences_country_iso2_status
    ON public.operator_licences (country_iso2, licence_status);

CREATE INDEX IF NOT EXISTS idx_operator_licences_status_expiry
    ON public.operator_licences (licence_status, expiry_date);


-- ---------------------------------------------------------------------------
-- 3. UPDATED_AT TRIGGER (shared helper — idempotent)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'trg_cannabis_operators_updated_at'
    ) THEN
        CREATE TRIGGER trg_cannabis_operators_updated_at
            BEFORE UPDATE ON public.cannabis_operators
            FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'trg_operator_licences_updated_at'
    ) THEN
        CREATE TRIGGER trg_operator_licences_updated_at
            BEFORE UPDATE ON public.operator_licences
            FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;
END;
$$;


-- ---------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------

ALTER TABLE public.cannabis_operators  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_licences   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_countries  ENABLE ROW LEVEL SECURITY;

-- Public read: only non-stub, verified operators
DROP POLICY IF EXISTS public_select_cannabis_operators ON public.cannabis_operators;
CREATE POLICY public_select_cannabis_operators
    ON public.cannabis_operators
    FOR SELECT
    TO anon, authenticated
    USING (
        data_completeness  != 'stub'
        AND verification_status != 'unverified'
    );

-- Public read: active licences only
DROP POLICY IF EXISTS public_select_operator_licences ON public.operator_licences;
CREATE POLICY public_select_operator_licences
    ON public.operator_licences
    FOR SELECT
    TO anon, authenticated
    USING (licence_status = 'active');

-- Public read: all operator_countries rows
DROP POLICY IF EXISTS public_select_operator_countries ON public.operator_countries;
CREATE POLICY public_select_operator_countries
    ON public.operator_countries
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Service role full write — operators
DROP POLICY IF EXISTS service_role_all_cannabis_operators ON public.cannabis_operators;
CREATE POLICY service_role_all_cannabis_operators
    ON public.cannabis_operators
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Service role full write — licences
DROP POLICY IF EXISTS service_role_all_operator_licences ON public.operator_licences;
CREATE POLICY service_role_all_operator_licences
    ON public.operator_licences
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Service role full write — countries junction
DROP POLICY IF EXISTS service_role_all_operator_countries ON public.operator_countries;
CREATE POLICY service_role_all_operator_countries
    ON public.operator_countries
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- 5. SEED DATA — Tier 1 market operators
--    Source: Harbourview Research — public regulatory sources
--    All company names, country codes and licence information are drawn from
--    publicly available regulatory disclosures as of 2026.
--    UUIDs are stable/deterministic via gen_random_uuid() seeded inline.
-- ---------------------------------------------------------------------------

-- We use a CTE-based insert so that operator_countries and operator_licences
-- can reference the freshly inserted operator ids without a second round-trip.

-- ---- GERMANY (BfArM / Bundessonderbedarfs-Cannabisbegleitgesetz) ----

WITH ins AS (
    INSERT INTO public.cannabis_operators
        (id, country_iso2, legal_name, normalized_name,
         operator_type, primary_country_iso2,
         public_status, data_completeness, verification_status)
    VALUES
        -- Canopy Growth Germany GmbH
        ('a1000001-0000-0000-0000-000000000001',
         'DE', 'Canopy Growth Germany GmbH', 'canopy growth germany gmbh',
         'integrated', 'DE', 'active', 'seed', 'admin_verified'),

        -- Demecan GmbH — Germany's first domestic licensed cultivator (BfArM tender 2019)
        ('a1000001-0000-0000-0000-000000000002',
         'DE', 'Demecan GmbH', 'demecan gmbh',
         'cultivator', 'DE', 'active', 'seed', 'admin_verified'),

        -- Tilray Deutschland GmbH
        ('a1000001-0000-0000-0000-000000000003',
         'DE', 'Tilray Deutschland GmbH', 'tilray deutschland gmbh',
         'distributor', 'DE', 'active', 'seed', 'admin_verified'),

        -- IMC (Israel Medical Cannabis) GmbH — German import/distribution arm
        ('a1000001-0000-0000-0000-000000000004',
         'DE', 'IMC (Israel Medical Cannabis) GmbH', 'imc israel medical cannabis gmbh',
         'importer', 'DE', 'active', 'seed', 'admin_verified')

    ON CONFLICT (id) DO NOTHING
    RETURNING id, legal_name
)
SELECT id, legal_name FROM ins;

-- Germany operator_countries (headquarters)
INSERT INTO public.operator_countries (operator_id, country_iso2, presence_type)
VALUES
    ('a1000001-0000-0000-0000-000000000001', 'DE', 'headquarters'),
    ('a1000001-0000-0000-0000-000000000002', 'DE', 'headquarters'),
    ('a1000001-0000-0000-0000-000000000003', 'DE', 'headquarters'),
    ('a1000001-0000-0000-0000-000000000004', 'DE', 'headquarters')
ON CONFLICT (operator_id, country_iso2, presence_type) DO NOTHING;

-- Canopy Growth Germany GmbH also has a Canadian parent presence
INSERT INTO public.operator_countries (operator_id, country_iso2, presence_type)
VALUES ('a1000001-0000-0000-0000-000000000001', 'CA', 'subsidiary')
ON CONFLICT (operator_id, country_iso2, presence_type) DO NOTHING;

-- Tilray Deutschland GmbH — parent is Canadian/Portuguese
INSERT INTO public.operator_countries (operator_id, country_iso2, presence_type)
VALUES ('a1000001-0000-0000-0000-000000000003', 'CA', 'subsidiary')
ON CONFLICT (operator_id, country_iso2, presence_type) DO NOTHING;

-- IMC GmbH — parent entity is Israeli
INSERT INTO public.operator_countries (operator_id, country_iso2, presence_type)
VALUES ('a1000001-0000-0000-0000-000000000004', 'IL', 'subsidiary')
ON CONFLICT (operator_id, country_iso2, presence_type) DO NOTHING;

-- Germany operator_licences (BfArM)
INSERT INTO public.operator_licences
    (operator_id, country_iso2, licence_class, issuing_regulator,
     authorized_activities, licence_status, gmp_certified, last_verified)
VALUES
    ('a1000001-0000-0000-0000-000000000001', 'DE',
     'Narcotic Import & Distribution',
     'BfArM (Bundesinstitut für Arzneimittel und Medizinprodukte)',
     ARRAY['import','distribution','wholesale'], 'active', true, CURRENT_DATE),

    ('a1000001-0000-0000-0000-000000000002', 'DE',
     'BfArM Domestic Cultivation Tender — Lot 1 (cultivation + processing)',
     'BfArM (Bundesinstitut für Arzneimittel und Medizinprodukte)',
     ARRAY['cultivation','processing','wholesale'], 'active', true, CURRENT_DATE),

    ('a1000001-0000-0000-0000-000000000003', 'DE',
     'Narcotic Import & Wholesale Distribution',
     'BfArM (Bundesinstitut für Arzneimittel und Medizinprodukte)',
     ARRAY['import','wholesale'], 'active', true, CURRENT_DATE),

    ('a1000001-0000-0000-0000-000000000004', 'DE',
     'Narcotic Import & Distribution',
     'BfArM (Bundesinstitut für Arzneimittel und Medizinprodukte)',
     ARRAY['import','distribution'], 'active', true, CURRENT_DATE)
ON CONFLICT (id) DO NOTHING;


-- ---- AUSTRALIA (TGA — Therapeutic Goods Administration) ----

INSERT INTO public.cannabis_operators
    (id, country_iso2, legal_name, normalized_name,
     operator_type, primary_country_iso2,
     public_status, data_completeness, verification_status)
VALUES
    -- Cannatrek Limited
    ('a2000002-0000-0000-0000-000000000001',
     'AU', 'Cannatrek Limited', 'cannatrek limited',
     'distributor', 'AU', 'active', 'seed', 'admin_verified'),

    -- Little Green Pharma — ASX: LGP
    ('a2000002-0000-0000-0000-000000000002',
     'AU', 'Little Green Pharma Ltd', 'little green pharma ltd',
     'exporter', 'AU', 'active', 'seed', 'admin_verified'),

    -- Cann Group Limited — ASX: CAN, first TGA licensed cultivator
    ('a2000002-0000-0000-0000-000000000003',
     'AU', 'Cann Group Limited', 'cann group limited',
     'cultivator', 'AU', 'active', 'seed', 'admin_verified')

ON CONFLICT (id) DO NOTHING;

INSERT INTO public.operator_countries (operator_id, country_iso2, presence_type)
VALUES
    ('a2000002-0000-0000-0000-000000000001', 'AU', 'headquarters'),
    ('a2000002-0000-0000-0000-000000000002', 'AU', 'headquarters'),
    ('a2000002-0000-0000-0000-000000000003', 'AU', 'headquarters')
ON CONFLICT (operator_id, country_iso2, presence_type) DO NOTHING;

-- Little Green Pharma exports to Germany and UK
INSERT INTO public.operator_countries (operator_id, country_iso2, presence_type)
VALUES
    ('a2000002-0000-0000-0000-000000000002', 'DE', 'distribution'),
    ('a2000002-0000-0000-0000-000000000002', 'GB', 'distribution')
ON CONFLICT (operator_id, country_iso2, presence_type) DO NOTHING;

INSERT INTO public.operator_licences
    (operator_id, country_iso2, licence_class, issuing_regulator,
     authorized_activities, licence_status, gmp_certified, gacp_certified, last_verified)
VALUES
    ('a2000002-0000-0000-0000-000000000001', 'AU',
     'ODC — Manufacture (Import)',
     'Therapeutic Goods Administration / Office of Drug Control',
     ARRAY['import','distribution'], 'active', true, false, CURRENT_DATE),

    ('a2000002-0000-0000-0000-000000000002', 'AU',
     'ODC — Manufacture + Export',
     'Therapeutic Goods Administration / Office of Drug Control',
     ARRAY['cultivation','processing','export'], 'active', true, true, CURRENT_DATE),

    ('a2000002-0000-0000-0000-000000000003', 'AU',
     'ODC — Cultivation + Manufacture',
     'Therapeutic Goods Administration / Office of Drug Control',
     ARRAY['cultivation','processing'], 'active', true, true, CURRENT_DATE)
ON CONFLICT (id) DO NOTHING;


-- ---- ISRAEL (MOH — Ministry of Health / IMCA) ----

INSERT INTO public.cannabis_operators
    (id, country_iso2, legal_name, normalized_name,
     operator_type, primary_country_iso2,
     public_status, data_completeness, verification_status)
VALUES
    -- IMC (Israel Medical Cannabis) — parent entity, TASE: IMCC
    ('a3000003-0000-0000-0000-000000000001',
     'IL', 'Inter Cannabis Ltd (IMC)', 'inter cannabis ltd imc',
     'exporter', 'IL', 'active', 'seed', 'admin_verified'),

    -- Tikun Olam — pioneer Israeli medical cannabis company
    ('a3000003-0000-0000-0000-000000000002',
     'IL', 'Tikun Olam Ltd', 'tikun olam ltd',
     'cultivator', 'IL', 'active', 'seed', 'admin_verified'),

    -- Canndoc (formerly Intercure) — TASE listed
    ('a3000003-0000-0000-0000-000000000003',
     'IL', 'Canndoc Ltd', 'canndoc ltd',
     'seller', 'IL', 'active', 'seed', 'admin_verified'),

    -- BOL Pharma (Better Our Living)
    ('a3000003-0000-0000-0000-000000000004',
     'IL', 'BOL Pharma Ltd', 'bol pharma ltd',
     'cultivator', 'IL', 'active', 'seed', 'admin_verified')

ON CONFLICT (id) DO NOTHING;

INSERT INTO public.operator_countries (operator_id, country_iso2, presence_type)
VALUES
    ('a3000003-0000-0000-0000-000000000001', 'IL', 'headquarters'),
    ('a3000003-0000-0000-0000-000000000002', 'IL', 'headquarters'),
    ('a3000003-0000-0000-0000-000000000003', 'IL', 'headquarters'),
    ('a3000003-0000-0000-0000-000000000004', 'IL', 'headquarters'),
    -- IMC has German subsidiary already seeded above; add IL→DE cross-link
    ('a3000003-0000-0000-0000-000000000001', 'DE', 'subsidiary')
ON CONFLICT (operator_id, country_iso2, presence_type) DO NOTHING;

INSERT INTO public.operator_licences
    (operator_id, country_iso2, licence_class, issuing_regulator,
     authorized_activities, licence_status, gmp_certified, gacp_certified, last_verified)
VALUES
    ('a3000003-0000-0000-0000-000000000001', 'IL',
     'MOH G.A.P. Cultivation + Export',
     'Israel Ministry of Health — Medical Cannabis Unit (IMCA)',
     ARRAY['cultivation','processing','export'], 'active', true, true, CURRENT_DATE),

    ('a3000003-0000-0000-0000-000000000002', 'IL',
     'MOH G.A.P. Cultivation + Distribution',
     'Israel Ministry of Health — Medical Cannabis Unit (IMCA)',
     ARRAY['cultivation','processing','distribution'], 'active', true, true, CURRENT_DATE),

    ('a3000003-0000-0000-0000-000000000003', 'IL',
     'MOH Pharmacy + Dispensary',
     'Israel Ministry of Health — Medical Cannabis Unit (IMCA)',
     ARRAY['cultivation','processing','retail'], 'active', true, false, CURRENT_DATE),

    ('a3000003-0000-0000-0000-000000000004', 'IL',
     'MOH G.A.P. Cultivation',
     'Israel Ministry of Health — Medical Cannabis Unit (IMCA)',
     ARRAY['cultivation','processing'], 'active', true, true, CURRENT_DATE)
ON CONFLICT (id) DO NOTHING;


-- ---- COLOMBIA (MinSalud / ICA — Instituto Colombiano Agropecuario) ----

INSERT INTO public.cannabis_operators
    (id, country_iso2, legal_name, normalized_name,
     operator_type, primary_country_iso2,
     public_status, data_completeness, verification_status)
VALUES
    -- Khiron Life Sciences Corp — TSX-V: KHRN
    ('a4000004-0000-0000-0000-000000000001',
     'CO', 'Khiron Life Sciences Corp', 'khiron life sciences corp',
     'integrated', 'CO', 'active', 'seed', 'admin_verified'),

    -- Flora Growth Corp — NASDAQ: FLGC
    ('a4000004-0000-0000-0000-000000000002',
     'CO', 'Flora Growth Corp', 'flora growth corp',
     'exporter', 'CO', 'active', 'seed', 'admin_verified'),

    -- PharmaCielo Ltd — TSX-V: PCLO
    ('a4000004-0000-0000-0000-000000000003',
     'CO', 'PharmaCielo Ltd', 'pharmacielo ltd',
     'exporter', 'CO', 'active', 'seed', 'admin_verified')

ON CONFLICT (id) DO NOTHING;

INSERT INTO public.operator_countries (operator_id, country_iso2, presence_type)
VALUES
    ('a4000004-0000-0000-0000-000000000001', 'CO', 'headquarters'),
    ('a4000004-0000-0000-0000-000000000002', 'CO', 'headquarters'),
    ('a4000004-0000-0000-0000-000000000003', 'CO', 'headquarters'),
    -- Khiron also operates UK medical clinics
    ('a4000004-0000-0000-0000-000000000001', 'GB', 'licensed_facility'),
    -- Flora Growth — distribution into Europe
    ('a4000004-0000-0000-0000-000000000002', 'DE', 'distribution')
ON CONFLICT (operator_id, country_iso2, presence_type) DO NOTHING;

INSERT INTO public.operator_licences
    (operator_id, country_iso2, licence_class, issuing_regulator,
     authorized_activities, licence_status, gmp_certified, gacp_certified, last_verified)
VALUES
    ('a4000004-0000-0000-0000-000000000001', 'CO',
     'Licencia de Cultivo de Cannabis Psicoactivo + Fabricación',
     'MinSalud / ICA (Instituto Colombiano Agropecuario)',
     ARRAY['cultivation','processing','export','retail_medical'], 'active', true, true, CURRENT_DATE),

    ('a4000004-0000-0000-0000-000000000002', 'CO',
     'Licencia de Cultivo + Producción + Exportación',
     'MinSalud / ICA (Instituto Colombiano Agropecuario)',
     ARRAY['cultivation','processing','export'], 'active', true, true, CURRENT_DATE),

    ('a4000004-0000-0000-0000-000000000003', 'CO',
     'Licencia de Cultivo + Extracción + Exportación',
     'MinSalud / ICA (Instituto Colombiano Agropecuario)',
     ARRAY['cultivation','processing','export'], 'active', true, true, CURRENT_DATE)
ON CONFLICT (id) DO NOTHING;


-- ---- NETHERLANDS (BMC — Bureau Medicinale Cannabis) ----

INSERT INTO public.cannabis_operators
    (id, country_iso2, legal_name, normalized_name,
     operator_type, primary_country_iso2,
     public_status, data_completeness, verification_status)
VALUES
    -- Bedrocan BV — the sole Dutch government-contracted medicinal cannabis producer
    ('a5000005-0000-0000-0000-000000000001',
     'NL', 'Bedrocan BV', 'bedrocan bv',
     'cultivator', 'NL', 'active', 'seed', 'admin_verified')

ON CONFLICT (id) DO NOTHING;

INSERT INTO public.operator_countries (operator_id, country_iso2, presence_type)
VALUES
    ('a5000005-0000-0000-0000-000000000001', 'NL', 'headquarters')
ON CONFLICT (operator_id, country_iso2, presence_type) DO NOTHING;

INSERT INTO public.operator_licences
    (operator_id, country_iso2, licence_class, issuing_regulator,
     authorized_activities, licence_status, gmp_certified, gacp_certified, last_verified)
VALUES
    ('a5000005-0000-0000-0000-000000000001', 'NL',
     'BMC Official Government Supplier — Cultivation, Processing, Distribution',
     'Bureau Medicinale Cannabis (Ministry of Health, Welfare and Sport)',
     ARRAY['cultivation','processing','wholesale','export'], 'active', true, true, CURRENT_DATE)
ON CONFLICT (id) DO NOTHING;


-- ---- UNITED KINGDOM (MHRA — Medicines and Healthcare products Regulatory Agency) ----

INSERT INTO public.cannabis_operators
    (id, country_iso2, legal_name, normalized_name,
     operator_type, primary_country_iso2,
     public_status, data_completeness, verification_status)
VALUES
    -- Curaleaf International Holdings — operates UK specialist pharmacies
    ('a6000006-0000-0000-0000-000000000001',
     'GB', 'Curaleaf International Holdings Ltd', 'curaleaf international holdings ltd',
     'seller', 'GB', 'active', 'seed', 'admin_verified'),

    -- Columbia Care UK (now part of Cresco Labs / UK entity)
    ('a6000006-0000-0000-0000-000000000002',
     'GB', 'Columbia Care UK Ltd', 'columbia care uk ltd',
     'distributor', 'GB', 'active', 'seed', 'admin_verified')

ON CONFLICT (id) DO NOTHING;

INSERT INTO public.operator_countries (operator_id, country_iso2, presence_type)
VALUES
    ('a6000006-0000-0000-0000-000000000001', 'GB', 'headquarters'),
    ('a6000006-0000-0000-0000-000000000002', 'GB', 'headquarters'),
    -- Curaleaf parent is US-based
    ('a6000006-0000-0000-0000-000000000001', 'US', 'subsidiary')
ON CONFLICT (operator_id, country_iso2, presence_type) DO NOTHING;

INSERT INTO public.operator_licences
    (operator_id, country_iso2, licence_class, issuing_regulator,
     authorized_activities, licence_status, gmp_certified, last_verified)
VALUES
    ('a6000006-0000-0000-0000-000000000001', 'GB',
     'Schedule 1 Controlled Drug — Import & Wholesale Dealer',
     'MHRA (Medicines and Healthcare products Regulatory Agency)',
     ARRAY['import','wholesale','retail_medical'], 'active', true, CURRENT_DATE),

    ('a6000006-0000-0000-0000-000000000002', 'GB',
     'Schedule 1 Controlled Drug — Import & Distribution',
     'MHRA (Medicines and Healthcare products Regulatory Agency)',
     ARRAY['import','distribution'], 'active', true, CURRENT_DATE)
ON CONFLICT (id) DO NOTHING;


-- ---------------------------------------------------------------------------
-- 6. GRANTS
-- ---------------------------------------------------------------------------

GRANT SELECT ON public.cannabis_operators  TO anon, authenticated;
GRANT SELECT ON public.operator_licences   TO anon, authenticated;
GRANT SELECT ON public.operator_countries  TO anon, authenticated;

GRANT ALL ON public.cannabis_operators  TO service_role;
GRANT ALL ON public.operator_licences   TO service_role;
GRANT ALL ON public.operator_countries  TO service_role;


COMMIT;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622000003','operator_entity_graph','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622000003_operator_entity_graph.sql

-- RECOVERY BEGIN 20260622000004_jurisdiction_schema_unification.sql
-- Historical jurisdiction-unification reconciliation marker.
--
-- Production records version 20260622000004 with the single statement:
--
--   already applied as gap_d_jurisdiction_schema_unification (20260622153847)
--
-- The canonical cross-reference table, RLS policies, unified public view, and
-- population query are owned by:
--
--   20260622153847_gap_d_jurisdiction_schema_unification.sql
--
-- Keeping this version as a no-op prevents the superseded draft from inserting
-- a broader territory list that is not present in the canonical countries
-- table and preserves the exact production migration chronology.


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622000004','jurisdiction_schema_unification','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622000004_jurisdiction_schema_unification.sql

-- RECOVERY BEGIN 20260622000005_education_tracks_modules_seed.sql
BEGIN;

-- =============================================================================
-- Gap E: Harbourview Education System Seed Migration
-- Generated: 2026-06-22
-- Description: Seeds 5 education tracks with modules and articles covering
--              international market access, regulatory compliance, country
--              intelligence, clinical/medical cannabis, and industry intelligence.
-- Idempotent: ON CONFLICT (slug) DO NOTHING on all tables.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- TRACK 1: International Market Access
-- ---------------------------------------------------------------------------
WITH t1 AS (
    INSERT INTO public.education_tracks (
        id, slug, title, description, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        'market-access-pathways',
        'International Market Access',
        'How to export and import cannabis products internationally. Covers regulatory frameworks, permit requirements, GMP standards, and country-specific pathways.',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
t1_existing AS (
    SELECT id FROM public.education_tracks WHERE slug = 'market-access-pathways'
),
t1_id AS (
    SELECT id FROM t1
    UNION ALL
    SELECT id FROM t1_existing
    LIMIT 1
),

-- Module: eu-import-requirements
m_eu_import AS (
    INSERT INTO public.education_modules (
        id, track_id, slug, title, audience, sensitivity, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM t1_id),
        'eu-import-requirements',
        'European Import Requirements',
        ARRAY['supplier','buyer_importer','licensed_producer'],
        'standard',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
m_eu_import_existing AS (
    SELECT id FROM public.education_modules WHERE slug = 'eu-import-requirements'
),
m_eu_import_id AS (
    SELECT id FROM m_eu_import
    UNION ALL
    SELECT id FROM m_eu_import_existing
    LIMIT 1
),

-- Module: german-market-entry
m_germany AS (
    INSERT INTO public.education_modules (
        id, track_id, slug, title, audience, sensitivity, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM t1_id),
        'german-market-entry',
        'German Market Entry Guide',
        ARRAY['supplier','buyer_importer','licensed_producer','investor'],
        'standard',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
m_germany_existing AS (
    SELECT id FROM public.education_modules WHERE slug = 'german-market-entry'
),
m_germany_id AS (
    SELECT id FROM m_germany
    UNION ALL
    SELECT id FROM m_germany_existing
    LIMIT 1
),

-- Module: australian-tga-pathways
m_tga AS (
    INSERT INTO public.education_modules (
        id, track_id, slug, title, audience, sensitivity, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM t1_id),
        'australian-tga-pathways',
        'Australian TGA Import Pathways',
        ARRAY['supplier','buyer_importer','licensed_producer'],
        'standard',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
m_tga_existing AS (
    SELECT id FROM public.education_modules WHERE slug = 'australian-tga-pathways'
),
m_tga_id AS (
    SELECT id FROM m_tga
    UNION ALL
    SELECT id FROM m_tga_existing
    LIMIT 1
),

-- Module: uk-mhra-pathways
m_mhra AS (
    INSERT INTO public.education_modules (
        id, track_id, slug, title, audience, sensitivity, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM t1_id),
        'uk-mhra-pathways',
        'UK MHRA Import Framework',
        ARRAY['supplier','buyer_importer'],
        'standard',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
m_mhra_existing AS (
    SELECT id FROM public.education_modules WHERE slug = 'uk-mhra-pathways'
),
m_mhra_id AS (
    SELECT id FROM m_mhra
    UNION ALL
    SELECT id FROM m_mhra_existing
    LIMIT 1
),

-- Module: canada-export-health-canada
m_hc_export AS (
    INSERT INTO public.education_modules (
        id, track_id, slug, title, audience, sensitivity, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM t1_id),
        'canada-export-health-canada',
        'Health Canada Export Requirements',
        ARRAY['licensed_producer','supplier'],
        'standard',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
m_hc_export_existing AS (
    SELECT id FROM public.education_modules WHERE slug = 'canada-export-health-canada'
),
m_hc_export_id AS (
    SELECT id FROM m_hc_export
    UNION ALL
    SELECT id FROM m_hc_export_existing
    LIMIT 1
),

-- Articles: eu-import-requirements
a1 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_eu_import_id),
        'eu-import-reqs-overview',
        'EU Import Requirements Overview',
        'All medicinal cannabis products entering the European Union must comply with Directive 2001/83/EC and be imported by a company holding a valid Wholesale Dealer Authorisation (WDA) issued by the competent authority in the importing member state. The importing entity must verify that the exporting country''s manufacturing site holds a current EU-GMP certificate or an equivalent certificate recognised under a Mutual Recognition Agreement (MRA). Import permits are required for Schedule I or II narcotic substances under the 1961 Single Convention, and each shipment must be accompanied by a corresponding export authorisation issued by the competent authority of the exporting country.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
),
a2 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_eu_import_id),
        'eu-import-narcotic-controls',
        'Narcotic Control Obligations for EU Cannabis Imports',
        'Under the UN Single Convention on Narcotic Drugs 1961, cannabis and cannabis resin are listed in Schedules I and IV, requiring importing member states to issue import certificates before each shipment. Most EU member states process import certificate applications through their national competent authority (e.g., BfArM in Germany, FAMHP in Belgium, ANSM in France), with processing times ranging from two to eight weeks. Importers must maintain detailed narcotic registers and submit annual statistical reports to their national authority and to the International Narcotics Control Board (INCB).',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
),

-- Articles: german-market-entry
a3 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_germany_id),
        'germany-bfarm-import-permit',
        'BfArM Import Permit Process for Cannabis',
        'The Bundesinstitut für Arzneimittel und Medizinprodukte (BfArM) is Germany''s federal authority responsible for issuing import permits for narcotic cannabis under the Betäubungsmittelgesetz (BtMG). Importers must hold a valid narcotics trade licence (§ 3 BtMG) and submit a per-shipment import application including supplier EU-GMP certificate, certificate of analysis, and the exporting country''s export authorisation. Germany is the largest medicinal cannabis market in Europe, with annual import volumes exceeding 30,000 kg of dried flower equivalents as of 2024.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
),
a4 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_germany_id),
        'germany-cannabis-act-2024',
        'Germany Cannabis Act 2024: Market Implications',
        'The German Cannabis Act (Cannabisgesetz, CanG) that came into force on 1 April 2024 partially legalised adult-use cannabis for personal possession and home cultivation, while establishing a second pillar for regulated commercial supply through licensed non-profit associations (Anbauvereinigungen). Medical cannabis supply pathways remain governed by the existing BtMG framework, preserving the prescription-based import model for licensed producers. Investors and suppliers should monitor the implementation timeline for the commercial supply pilot regions announced under the CanG, as these may open additional distribution channels from 2025 onward.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
),

-- Articles: australian-tga-pathways
a5 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_tga_id),
        'tga-odb-import-process',
        'TGA Office of Drug Control Import Authorisation',
        'The Therapeutic Goods Administration (TGA) Office of Drug Control (ODC) administers import permits for medicinal cannabis under the Narcotic Drugs Act 1967 and the Therapeutic Goods Act 1989. Foreign manufacturers supplying the Australian market must hold a TGA Manufacturing Licence or demonstrate compliance via an acceptable overseas GMP certification (e.g., EU-GMP, WHO-GMP, or PIC/S-compliant certificate). The importer of record must hold both an ODC import permit (per shipment) and an ODC dealer licence, with applications processed through the TGA Business Services portal.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
),
a6 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_tga_id),
        'tga-artg-registration-pathways',
        'ARTG Registration and SAS Pathways for Cannabis Products',
        'Medicinal cannabis products can enter the Australian market via three TGA pathways: full registration on the Australian Register of Therapeutic Goods (ARTG), the Authorised Prescriber (AP) scheme, or the Special Access Scheme Category B (SAS-B). The vast majority of products currently access the market through SAS-B, which requires prescriber application per patient but does not require full ARTG registration of the product. As of 2024, TGA has registered a small number of cannabis products on the ARTG, including nabiximols (Sativex) and cannabidiol (Epidyolex), setting a precedent for full registration pathways.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
),

-- Articles: uk-mhra-pathways
a7 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_mhra_id),
        'uk-mhra-import-licence',
        'MHRA Manufacturer Import Licence for Cannabis',
        'The Medicines and Healthcare products Regulatory Agency (MHRA) requires overseas manufacturers of unlicensed cannabis-based products for human use (CBPMs) to supply only to UK importers holding a Manufacturer''s Licence (Import) under the Human Medicines Regulations 2012. Each imported batch must be accompanied by a full analytical certificate and a Qualified Person (QP) declaration confirming the batch meets the agreed specification and has been manufactured to EU-GMP or equivalent standards. The UK Home Office additionally requires a Schedule 1 import licence under the Misuse of Drugs Regulations 2001 for each consignment of cannabis flower or resin.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
),
a8 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_mhra_id),
        'uk-cbpm-prescribing-framework',
        'UK CBPM Prescribing and Supply Framework',
        'Cannabis-based products for medicinal use (CBPMs) in the UK may only be prescribed by specialist clinicians on the General Medical Council''s Specialist Register, following the November 2018 rescheduling of cannabis from Schedule 1 to Schedule 2 of the Misuse of Drugs Regulations 2001. Unlicensed CBPMs are supplied as "specials" under a Named Patient supply model, meaning each product requires a patient-specific prescription and the importer must hold appropriate Home Office and MHRA licences. The MHRA does not proactively regulate unlicensed specials for efficacy, but enforcement action can be taken if a product is found unsafe or the supply chain is non-compliant.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
),

-- Articles: canada-export-health-canada
a9 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_hc_export_id),
        'health-canada-export-permits',
        'Health Canada Export Permit Requirements for Cannabis',
        'Canadian licensed producers (LPs) seeking to export cannabis must obtain an export permit from Health Canada under section 62 of the Cannabis Act, in addition to satisfying the import requirements of the destination country. Export permits are issued on a per-shipment basis and require confirmation that the receiving country has issued an import permit or equivalent authorisation, that the LP holds a valid Processing or Cultivation licence with export permissions, and that the product meets Canadian Good Production Practices (GPP) requirements. Health Canada has bilateral information-sharing arrangements with several jurisdictions including Germany, Australia, and the UK to facilitate permit processing.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
),
a10 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_hc_export_id),
        'health-canada-gpp-export-quality',
        'Good Production Practices and Export Quality Standards',
        'Health Canada''s Good Production Practices (GPP), outlined in Part 5 of the Cannabis Regulations, set out the minimum quality standards for cannabis products exported from Canada, including requirements for sanitation, pest control, and record-keeping. For exports to regulated pharmaceutical markets (EU, Australia, UK), receiving importers typically require additional EU-GMP certification beyond Canadian GPP, meaning many LPs maintain dual certification to remain competitive in international tenders. Health Canada''s Cannabis Tracking System (CTS) records all export transactions, and LPs must report shipment details within two business days of export.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
)

SELECT 'Track 1: market-access-pathways seeded' AS result;


-- ---------------------------------------------------------------------------
-- TRACK 2: Regulatory Compliance
-- ---------------------------------------------------------------------------
WITH t2 AS (
    INSERT INTO public.education_tracks (
        id, slug, title, description, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        'regulatory-compliance',
        'Regulatory Compliance',
        'GMP, GACP, and quality standards for cannabis operators. Licensing requirements, audit preparation, and compliance management across key markets.',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
t2_existing AS (
    SELECT id FROM public.education_tracks WHERE slug = 'regulatory-compliance'
),
t2_id AS (
    SELECT id FROM t2
    UNION ALL
    SELECT id FROM t2_existing
    LIMIT 1
),

-- Module: eu-gmp-cannabis
m_eu_gmp AS (
    INSERT INTO public.education_modules (
        id, track_id, slug, title, audience, sensitivity, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM t2_id),
        'eu-gmp-cannabis',
        'EU-GMP for Cannabis Products',
        ARRAY['licensed_producer','lab','supplier'],
        'standard',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
m_eu_gmp_existing AS (
    SELECT id FROM public.education_modules WHERE slug = 'eu-gmp-cannabis'
),
m_eu_gmp_id AS (
    SELECT id FROM m_eu_gmp
    UNION ALL
    SELECT id FROM m_eu_gmp_existing
    LIMIT 1
),

-- Module: gacp-cultivation-standards
m_gacp AS (
    INSERT INTO public.education_modules (
        id, track_id, slug, title, audience, sensitivity, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM t2_id),
        'gacp-cultivation-standards',
        'GACP Cultivation Standards',
        ARRAY['licensed_producer','supplier'],
        'standard',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
m_gacp_existing AS (
    SELECT id FROM public.education_modules WHERE slug = 'gacp-cultivation-standards'
),
m_gacp_id AS (
    SELECT id FROM m_gacp
    UNION ALL
    SELECT id FROM m_gacp_existing
    LIMIT 1
),

-- Module: who-gmp-pharmaceutical
m_who_gmp AS (
    INSERT INTO public.education_modules (
        id, track_id, slug, title, audience, sensitivity, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM t2_id),
        'who-gmp-pharmaceutical',
        'WHO-GMP for Pharmaceutical Cannabis',
        ARRAY['licensed_producer','lab'],
        'standard',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
m_who_gmp_existing AS (
    SELECT id FROM public.education_modules WHERE slug = 'who-gmp-pharmaceutical'
),
m_who_gmp_id AS (
    SELECT id FROM m_who_gmp
    UNION ALL
    SELECT id FROM m_who_gmp_existing
    LIMIT 1
),

-- Module: licence-class-guide
m_licence AS (
    INSERT INTO public.education_modules (
        id, track_id, slug, title, audience, sensitivity, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM t2_id),
        'licence-class-guide',
        'Licence Class Navigator',
        ARRAY['licensed_producer','investor','regulator_policy'],
        'standard',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
m_licence_existing AS (
    SELECT id FROM public.education_modules WHERE slug = 'licence-class-guide'
),
m_licence_id AS (
    SELECT id FROM m_licence
    UNION ALL
    SELECT id FROM m_licence_existing
    LIMIT 1
),

-- Articles: eu-gmp-cannabis
b1 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_eu_gmp_id),
        'eu-gmp-cannabis-certification',
        'EU-GMP Certification for Medicinal Cannabis',
        'European Union Good Manufacturing Practice (EU-GMP) certification is mandatory for all medicinal cannabis products imported or sold in EU member states. The certification covers facility design, quality management systems, batch record documentation, and analytical testing standards. Importers must hold a Wholesale Dealer Authorisation (WDA) and work only with EU-GMP-certified suppliers.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
),
b2 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_eu_gmp_id),
        'eu-gmp-annex-1-sterile',
        'EU-GMP Annex 1 and Cannabis Extract Manufacturing',
        'EU-GMP Annex 1 (Manufacture of Sterile Medicinal Products, revised 2022) applies to cannabis-derived extracts and oils that are intended for sterile final dosage forms, imposing strict contamination control strategy (CCS) requirements. For non-sterile cannabis flower products, EU-GMP Chapter 3 (Premises and Equipment) and Chapter 4 (Documentation) are the primary applicable chapters, requiring cleanroom-grade drying and packaging areas and comprehensive batch manufacturing records. Inspections are conducted by the national competent authority of the EU member state in which the manufacturing site is located, with certificates published on the EudraGMDP database.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
),

-- Articles: gacp-cultivation-standards
b3 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_gacp_id),
        'gacp-ema-guideline',
        'EMA GACP Guideline for Medicinal Cannabis Cultivation',
        'The European Medicines Agency (EMA) Good Agricultural and Collection Practice (GACP) guideline (EMEA/HMPC/246816/2005) establishes minimum standards for the cultivation, collection, and primary processing of herbal substances used as starting materials for medicinal products. For cannabis, GACP compliance covers variety selection and documentation, growing conditions (soil, water, pesticide management), harvest procedures, and drying and storage conditions that prevent microbial contamination and preserve cannabinoid profile stability. GACP certification is a prerequisite for EU-GMP certification of cannabis-derived active pharmaceutical ingredients (APIs), as the GACP certificate covers the upstream botanical supply chain.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
),
b4 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_gacp_id),
        'gacp-pest-residue-limits',
        'GACP Pesticide and Contaminant Limits for Cannabis',
        'EU pharmacopoeial limits for pesticide residues in herbal substances (European Pharmacopoeia 2.8.13) apply to cannabis flower destined for medicinal use, with maximum residue levels (MRLs) for hundreds of agricultural chemicals set far below those for food crops. Heavy metal limits (Ph. Eur. 2.4.27) require testing for lead, cadmium, mercury, and arsenic in each batch, with cultivation practice records demonstrating soil safety. Mycotoxin and microbial contamination limits (Ph. Eur. 5.1.4, 5.1.8) must also be met, with total aerobic microbial count (TAMC) typically not exceeding 10⁵ CFU/g and absence of specified pathogens confirmed per batch.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
),

-- Articles: who-gmp-pharmaceutical
b5 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_who_gmp_id),
        'who-gmp-trs-cannabis',
        'WHO Technical Report Series GMP for Cannabis',
        'The World Health Organization''s GMP guidelines (WHO Technical Report Series No. 986, Annex 2) are recognised by many non-EU markets—including Australia (TGA), Canada (Health Canada), and several Latin American and Asian regulators—as an acceptable standard for pharmaceutical manufacturing, including cannabis-derived products. WHO-GMP inspections are conducted by national medicines regulatory authorities (NMRAs) or accredited third-party bodies, and certificates are issued for a defined scope of manufacturing activities. For cannabis producers seeking multi-market access, WHO-GMP certification provides a cost-effective foundation before pursuing market-specific certifications such as EU-GMP or TGA GMP.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
),

-- Articles: licence-class-guide
b6 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_licence_id),
        'licence-classes-canada-overview',
        'Canada Cannabis Licence Classes Overview',
        'Health Canada issues seven primary licence classes under the Cannabis Regulations: Cultivation, Processing, Sale for Medical Purposes, Analytical Testing, Research, Cannabis Drug Licence, and Industrial Hemp. Licence classes determine which activities a holder may conduct, and operators performing multiple activities (e.g., cultivation and processing) must hold separate licences for each, unless they qualify for a micro-licence or a standard licence with multiple activity authorisations. Investors evaluating licensed producers should assess the breadth of licence authorisations held, as restrictions on permitted activities directly limit product categories and market access.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
),
b7 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_licence_id),
        'licence-classes-eu-country-comparison',
        'EU Member State Licence Class Comparison',
        'EU member states each issue their own national cannabis licences under the framework of Directive 2001/83/EC and the 1961 UN Single Convention, resulting in significant variation in licence categories, fees, and scope across jurisdictions. Germany (BtMG § 3), the Netherlands (Opiumwet), and Poland (Act on Counteracting Drug Addiction) each define distinct cultivation, manufacturing, and wholesale licence types, with Germany''s framework being the most extensively used for international medicinal cannabis supply. Operators planning multi-country operations must conduct jurisdiction-specific licence mapping, as holding a licence in one EU member state does not confer rights to manufacture or trade in another.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
)

SELECT 'Track 2: regulatory-compliance seeded' AS result;


-- ---------------------------------------------------------------------------
-- TRACK 3: Country Intelligence
-- ---------------------------------------------------------------------------
WITH t3 AS (
    INSERT INTO public.education_tracks (
        id, slug, title, description, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        'country-intelligence',
        'Country Intelligence',
        'Jurisdiction-level briefings on cannabis legal frameworks, market access status, and regulatory developments for priority markets.',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
t3_existing AS (
    SELECT id FROM public.education_tracks WHERE slug = 'country-intelligence'
),
t3_id AS (
    SELECT id FROM t3
    UNION ALL
    SELECT id FROM t3_existing
    LIMIT 1
),

-- Module: country-intel-tier1
m_tier1 AS (
    INSERT INTO public.education_modules (
        id, track_id, slug, title, audience, sensitivity, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM t3_id),
        'country-intel-tier1',
        'Tier 1 Markets Deep Dive',
        ARRAY['general','investor','buyer_importer','supplier'],
        'standard',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
m_tier1_existing AS (
    SELECT id FROM public.education_modules WHERE slug = 'country-intel-tier1'
),
m_tier1_id AS (
    SELECT id FROM m_tier1
    UNION ALL
    SELECT id FROM m_tier1_existing
    LIMIT 1
),

-- Module: emerging-markets-watch
m_emerging AS (
    INSERT INTO public.education_modules (
        id, track_id, slug, title, audience, sensitivity, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM t3_id),
        'emerging-markets-watch',
        'Emerging Markets Watch',
        ARRAY['investor','regulator_policy'],
        'standard',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
m_emerging_existing AS (
    SELECT id FROM public.education_modules WHERE slug = 'emerging-markets-watch'
),
m_emerging_id AS (
    SELECT id FROM m_emerging
    UNION ALL
    SELECT id FROM m_emerging_existing
    LIMIT 1
),

-- Module: prohibition-risk-map
m_prohibition AS (
    INSERT INTO public.education_modules (
        id, track_id, slug, title, audience, sensitivity, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM t3_id),
        'prohibition-risk-map',
        'Prohibition & Restriction Risk Map',
        ARRAY['general','buyer_importer','supplier'],
        'standard',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
m_prohibition_existing AS (
    SELECT id FROM public.education_modules WHERE slug = 'prohibition-risk-map'
),
m_prohibition_id AS (
    SELECT id FROM m_prohibition
    UNION ALL
    SELECT id FROM m_prohibition_existing
    LIMIT 1
),

-- Articles: country-intel-tier1
c1 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_tier1_id),
        'tier1-germany-market-profile',
        'Germany: Tier 1 Market Profile',
        'Germany represents the largest regulated medicinal cannabis market in Europe, with over 4 million patient prescriptions dispensed in 2023 and annual import volumes estimated at 30,000–40,000 kg of dried flower equivalents. The market is characterised by a fragmented pharmacy-based dispensing model, a dominant dried flower product category, and strong demand for high-THC cultivars from established Canadian, Dutch, and Danish producers. The CanG reforms of 2024 have introduced adult-use possession rights but preserve the prescription-only import model for pharmaceutical-grade cannabis, sustaining demand for EU-GMP-certified international supply.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
),
c2 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_tier1_id),
        'tier1-australia-market-profile',
        'Australia: Tier 1 Market Profile',
        'Australia is the largest medical cannabis market in the Asia-Pacific region, with TGA approval data indicating over 700,000 patient approvals under the SAS-B and Authorised Prescriber pathways as of mid-2024. The Australian market is distinctive in its high per-patient expenditure, strong regulatory acceptance of overseas-manufactured products via TGA GMP clearance, and rapid growth in oral oil and capsule formats alongside dried flower. Domestic cultivation and manufacturing capacity has expanded significantly since 2020, increasing competitive pressure on international suppliers, though import volumes remain substantial due to variety diversity and capacity constraints.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
),

-- Articles: emerging-markets-watch
c3 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_emerging_id),
        'emerging-markets-latam',
        'Latin America: Emerging Cannabis Markets Overview',
        'Colombia, Brazil, and Mexico represent the three most significant emerging cannabis markets in Latin America, each at different stages of regulatory maturity. Colombia has issued cultivation and export licences since 2017 under Law 1787 and Decree 613/2017, positioning itself as a low-cost cultivation hub for global supply chains, though export pathways remain limited by destination country requirements. Brazil''s ANVISA has permitted cannabis-derived medicine imports since 2015 and domestic manufacture since 2023, creating a large domestic market opportunity, while Mexico''s regulatory framework for adult-use cannabis remains pending full legislative implementation as of 2025.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
),
c4 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_emerging_id),
        'emerging-markets-asia-pacific',
        'Asia-Pacific: Emerging Cannabis Regulatory Developments',
        'Thailand made global headlines in 2022 by removing cannabis from its list of narcotics, enabling relatively liberal personal use, but subsequently moved toward re-restriction of recreational use in 2024 while maintaining a medical framework under the Thai FDA. South Korea permits the prescription of imported cannabis-derived medicines under specific conditions, and Japan has amended its Cannabis Control Act (2023) to permit cannabis-derived medicines containing THC, including Epidiolex, for the first time. Investors should monitor regulatory changes in New Zealand (where a medical scheme is established), Singapore (strictly prohibitionist), and the Philippines (medical only) as part of regional market access planning.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
),

-- Articles: prohibition-risk-map
c5 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_prohibition_id),
        'prohibition-risk-high-risk-jurisdictions',
        'High-Risk Jurisdictions: Absolute Prohibition Markets',
        'A significant number of jurisdictions maintain absolute prohibition on cannabis in all forms, including medicinal use, creating severe legal risk for importers, suppliers, and travellers transiting through these countries. Singapore, Japan (for non-CBD, non-approved products), Indonesia, Malaysia, and the Philippines impose criminal penalties for cannabis possession that may include the death penalty or lengthy imprisonment. Supply chain actors must screen all transit routes and third-party logistics partners to ensure that cannabis consignments do not enter or pass through prohibition jurisdictions, as international treaty obligations do not shield commercial operators from domestic criminal law.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
),
c6 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_prohibition_id),
        'prohibition-risk-travel-transit',
        'Cannabis Travel and Transit Risk for Industry Professionals',
        'Industry professionals travelling with cannabis samples, product documentation, or even residual personal use products face serious legal risk when transiting through or entering jurisdictions where cannabis remains fully prohibited. Risk is highest in GCC (Gulf Cooperation Council) countries, several Southeast Asian nations, and parts of sub-Saharan Africa, where zero-tolerance enforcement applies regardless of origin jurisdiction or medical status. Companies should implement written travel compliance policies for employees, prohibit the transport of cannabis samples across international borders except under valid import/export permits, and require legal review before conducting business activities in any jurisdiction where cannabis status is uncertain.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
)

SELECT 'Track 3: country-intelligence seeded' AS result;


-- ---------------------------------------------------------------------------
-- TRACK 4: Clinical & Medical Cannabis
-- ---------------------------------------------------------------------------
WITH t4 AS (
    INSERT INTO public.education_tracks (
        id, slug, title, description, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        'clinical-medical',
        'Clinical & Medical Cannabis',
        'Evidence-based clinical guidance, prescribing frameworks, patient access pathways, and pharmacist workflows for medical cannabis.',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
t4_existing AS (
    SELECT id FROM public.education_tracks WHERE slug = 'clinical-medical'
),
t4_id AS (
    SELECT id FROM t4
    UNION ALL
    SELECT id FROM t4_existing
    LIMIT 1
),

-- Module: prescribing-frameworks
m_prescribing AS (
    INSERT INTO public.education_modules (
        id, track_id, slug, title, audience, sensitivity, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM t4_id),
        'prescribing-frameworks',
        'International Prescribing Frameworks',
        ARRAY['doctor','clinic','pharmacist'],
        'standard',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
m_prescribing_existing AS (
    SELECT id FROM public.education_modules WHERE slug = 'prescribing-frameworks'
),
m_prescribing_id AS (
    SELECT id FROM m_prescribing
    UNION ALL
    SELECT id FROM m_prescribing_existing
    LIMIT 1
),

-- Module: patient-access-pathways
m_patient_access AS (
    INSERT INTO public.education_modules (
        id, track_id, slug, title, audience, sensitivity, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM t4_id),
        'patient-access-pathways',
        'Patient Access Pathways',
        ARRAY['doctor','clinic','patient_general','pharmacist'],
        'standard',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
m_patient_access_existing AS (
    SELECT id FROM public.education_modules WHERE slug = 'patient-access-pathways'
),
m_patient_access_id AS (
    SELECT id FROM m_patient_access
    UNION ALL
    SELECT id FROM m_patient_access_existing
    LIMIT 1
),

-- Module: cannabinoid-pharmacology
m_pharm AS (
    INSERT INTO public.education_modules (
        id, track_id, slug, title, audience, sensitivity, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM t4_id),
        'cannabinoid-pharmacology',
        'Cannabinoid Pharmacology Essentials',
        ARRAY['doctor','pharmacist','clinic'],
        'standard',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
m_pharm_existing AS (
    SELECT id FROM public.education_modules WHERE slug = 'cannabinoid-pharmacology'
),
m_pharm_id AS (
    SELECT id FROM m_pharm
    UNION ALL
    SELECT id FROM m_pharm_existing
    LIMIT 1
),

-- Module: drug-interactions
m_interactions AS (
    INSERT INTO public.education_modules (
        id, track_id, slug, title, audience, sensitivity, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM t4_id),
        'drug-interactions',
        'Cannabis Drug Interactions',
        ARRAY['doctor','pharmacist'],
        'standard',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
m_interactions_existing AS (
    SELECT id FROM public.education_modules WHERE slug = 'drug-interactions'
),
m_interactions_id AS (
    SELECT id FROM m_interactions
    UNION ALL
    SELECT id FROM m_interactions_existing
    LIMIT 1
),

-- Articles: prescribing-frameworks
d1 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_prescribing_id),
        'prescribing-uk-cbpm-framework',
        'UK CBPM Prescribing Framework for Specialist Clinicians',
        'In the United Kingdom, cannabis-based products for medicinal use (CBPMs) may only be initiated by specialist clinicians on the GMC Specialist Register, following the November 2018 rescheduling under the Misuse of Drugs Regulations 2001. GPs may continue prescriptions initiated by specialists, but cannot initiate CBPM treatment independently as of 2024, a restriction under ongoing review by NHS England. The NHS has issued clinical guidance recommending CBPMs only for three specific indications: intractable nausea/vomiting from chemotherapy, severe treatment-resistant epilepsy (notably Dravet and Lennox-Gastaut syndromes), and moderate-to-severe spasticity from multiple sclerosis.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
),
d2 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_prescribing_id),
        'prescribing-germany-framework',
        'German Medical Cannabis Prescribing Framework',
        'German physicians have been able to prescribe cannabis flowers, extracts, and cannabis medicines since the passage of the Medical Cannabis Act (BtMÄndG) in March 2017, which reclassified cannabis as a Schedule 3 narcotic (prescribable without restriction by indication). Prescriptions are written on narcotic prescription forms (BtM-Rezept) and dispensed by pharmacies, with statutory health insurers (GKV) required to cover costs if medical necessity is established—a provision that generated significant demand growth between 2017 and 2024. The CanG 2024 does not alter the prescription model for pharmaceutical cannabis, maintaining the BtM-Rezept requirement and GKV coverage pathway.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
),

-- Articles: patient-access-pathways
d3 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_patient_access_id),
        'patient-access-australia-sas',
        'Australian Patient Access: SAS-B and Authorised Prescriber Pathways',
        'Australian patients access medicinal cannabis predominantly through TGA Special Access Scheme Category B (SAS-B), under which any registered medical practitioner may apply online for a specific patient via the TGA Business Services portal, with most approvals granted within 24-48 hours. Alternatively, specialists may seek Authorised Prescriber (AP) status for a class of patients with a specific condition, removing the need for per-patient TGA applications and streamlining clinical workflow for high-volume practices. Patients must obtain their medicinal cannabis from a TGA-listed pharmacy, and products must either be ARTG-registered or sourced through a licensed importer holding valid ODC permits.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
),
d4 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_patient_access_id),
        'patient-access-barriers',
        'Common Barriers to Patient Access in Regulated Markets',
        'Despite legal frameworks permitting medical cannabis access, patients in many jurisdictions face practical barriers including high out-of-pocket costs (insurance non-coverage), limited specialist availability for prescription initiation, pharmacy stocking and dispensing gaps, and stigma from healthcare providers unfamiliar with cannabis medicine. In Germany, health insurer (GKV) prior authorisation rejections—reported at rates of 30–50% for initial applications in 2022–23—represent a significant access barrier, though rejection rates have trended downward following appeal mechanism improvements. Patient advocacy organisations in the UK, Australia, and Canada have documented that low-income and rural patients face disproportionate access challenges, calling for formulary inclusion and telehealth prescribing pathways.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
),

-- Articles: cannabinoid-pharmacology
d5 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_pharm_id),
        'ecs-thc-cbd-mechanism',
        'Endocannabinoid System: THC and CBD Mechanisms of Action',
        'The endocannabinoid system (ECS) comprises CB1 and CB2 receptors, endogenous ligands (anandamide and 2-arachidonoylglycerol), and metabolic enzymes (FAAH, MAGL), playing a modulatory role across the central nervous system, immune system, and peripheral tissues. Delta-9-tetrahydrocannabinol (THC) acts as a partial agonist at both CB1 and CB2 receptors, producing analgesic, antiemetic, and appetite-stimulating effects alongside psychoactive side effects mediated primarily through CB1 in the CNS. Cannabidiol (CBD) has low affinity for CB1/CB2 receptors but modulates the ECS indirectly through inhibition of FAAH, allosteric modulation of CB1, and activity at TRPV1, 5-HT1A, and GPR55 receptors, underpinning its anticonvulsant, anxiolytic, and anti-inflammatory clinical profiles.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
),
d6 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_pharm_id),
        'cannabinoid-pharmacokinetics',
        'Cannabis Pharmacokinetics: Route of Administration Effects',
        'The route of administration significantly affects cannabinoid pharmacokinetics: inhaled cannabis delivers THC to peak plasma concentrations within 3–10 minutes with bioavailability of 10–35%, while oral administration produces delayed peak concentrations (1–3 hours), lower and more variable bioavailability (4–12%), and first-pass hepatic conversion of THC to the more potent 11-hydroxy-THC. Sublingual and oromucosal routes (as used in nabiximols/Sativex) provide intermediate onset (15–45 minutes) and improved dose consistency compared to oral ingestion. Pharmacists counselling patients on cannabis medicines should account for route-of-administration differences when advising on dose titration, onset of effect, and duration, particularly for patients transitioning between formulation types.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
),

-- Articles: drug-interactions
d7 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_interactions_id),
        'cannabis-cyp450-interactions',
        'Cannabis CYP450 Drug Interactions: Clinical Significance',
        'CBD is a potent inhibitor of cytochrome P450 enzymes CYP2C19 and CYP3A4, with clinically significant interactions documented with antiepileptic drugs (clobazam, valproate, stiripentol), anticoagulants (warfarin), and immunosuppressants (tacrolimus, cyclosporine). In clinical trials of Epidiolex (pharmaceutical CBD), co-administration with clobazam increased N-desmethylclobazam plasma levels by 3-fold, necessitating dose reduction of clobazam in most patients. Prescribers and pharmacists must review the complete medication list before initiating cannabis therapy and implement therapeutic drug monitoring for narrow-therapeutic-index drugs metabolised by CYP2C19 or CYP3A4.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
),
d8 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_interactions_id),
        'cannabis-cns-sedative-interactions',
        'Cannabis Interactions with CNS Depressants and Sedatives',
        'THC exerts additive CNS depressant effects when co-administered with benzodiazepines, opioids, antidepressants, antihistamines, and alcohol, increasing risk of sedation, respiratory depression, and cognitive impairment. This interaction is of particular concern in elderly patients, who have reduced drug clearance, and in patients on opioid therapy, where combined THC/opioid use requires careful dose titration despite potential opioid-sparing benefits in chronic pain management. Pharmacists should conduct structured medication reviews at cannabis initiation and monitor for signs of excessive sedation, falls risk, and driving impairment, advising patients accordingly under relevant jurisdiction-specific driving and medication guidelines.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
)

SELECT 'Track 4: clinical-medical seeded' AS result;


-- ---------------------------------------------------------------------------
-- TRACK 5: Industry Intelligence
-- ---------------------------------------------------------------------------
WITH t5 AS (
    INSERT INTO public.education_tracks (
        id, slug, title, description, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        'industry-intelligence',
        'Industry Intelligence',
        'Market data, company intelligence, investment signals, and deal flow analysis across the global cannabis industry.',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
t5_existing AS (
    SELECT id FROM public.education_tracks WHERE slug = 'industry-intelligence'
),
t5_id AS (
    SELECT id FROM t5
    UNION ALL
    SELECT id FROM t5_existing
    LIMIT 1
),

-- Module: global-market-sizing
m_market_sizing AS (
    INSERT INTO public.education_modules (
        id, track_id, slug, title, audience, sensitivity, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM t5_id),
        'global-market-sizing',
        'Global Market Sizing & Forecasts',
        ARRAY['investor','general'],
        'standard',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
m_market_sizing_existing AS (
    SELECT id FROM public.education_modules WHERE slug = 'global-market-sizing'
),
m_market_sizing_id AS (
    SELECT id FROM m_market_sizing
    UNION ALL
    SELECT id FROM m_market_sizing_existing
    LIMIT 1
),

-- Module: ma-deal-analysis
m_ma AS (
    INSERT INTO public.education_modules (
        id, track_id, slug, title, audience, sensitivity, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM t5_id),
        'ma-deal-analysis',
        'M&A and Capital Markets',
        ARRAY['investor'],
        'standard',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
m_ma_existing AS (
    SELECT id FROM public.education_modules WHERE slug = 'ma-deal-analysis'
),
m_ma_id AS (
    SELECT id FROM m_ma
    UNION ALL
    SELECT id FROM m_ma_existing
    LIMIT 1
),

-- Module: supply-chain-intelligence
m_supply_chain AS (
    INSERT INTO public.education_modules (
        id, track_id, slug, title, audience, sensitivity, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM t5_id),
        'supply-chain-intelligence',
        'Supply Chain Intelligence',
        ARRAY['buyer_importer','supplier','distributor'],
        'standard',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
m_supply_chain_existing AS (
    SELECT id FROM public.education_modules WHERE slug = 'supply-chain-intelligence'
),
m_supply_chain_id AS (
    SELECT id FROM m_supply_chain
    UNION ALL
    SELECT id FROM m_supply_chain_existing
    LIMIT 1
),

-- Articles: global-market-sizing
e1 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_market_sizing_id),
        'global-medical-cannabis-market-2024',
        'Global Medical Cannabis Market Sizing 2024–2030',
        'The global legal cannabis market was valued at approximately USD 57 billion in 2023, with the medical segment accounting for an estimated USD 15–20 billion of that total, driven primarily by North American adult-use markets and European medical markets. Analysts project compound annual growth rates (CAGR) of 14–20% for the global medical cannabis market through 2030, with Europe—particularly Germany, the UK, and Poland—expected to account for the largest incremental volume growth in the forecast period. Market sizing estimates carry significant uncertainty due to illicit market displacement effects, regulatory volatility, and inconsistent national reporting standards for cannabis consumption data.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
),
e2 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_market_sizing_id),
        'europe-medical-cannabis-forecast',
        'European Medical Cannabis Market Forecast',
        'Europe''s medical cannabis market is projected to grow from approximately EUR 600 million in 2023 to EUR 3–5 billion by 2028, with Germany, Poland, the Czech Republic, and Denmark identified as the highest-growth national markets. Product mix is shifting toward standardised pharmaceutical formats (oils, capsules, granules) and away from unprocessed dried flower as pharmacies develop more sophisticated dispensing capabilities and prescribers increase familiarity with dosing titration. Supply chain dynamics are being reshaped by growing EU domestic cultivation capacity (Portugal, Spain, Denmark, Greece, the Netherlands) reducing dependency on extra-EU imports, though GMP-certified import volumes are expected to remain significant through the forecast period.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
),

-- Articles: ma-deal-analysis
e3 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_ma_id),
        'cannabis-ma-trends-2023-2025',
        'Cannabis M&A Trends 2023–2025',
        'Global cannabis M&A activity declined sharply from the peak levels of 2018–2021, with deal volumes in 2022–2024 characterised by distressed asset acquisitions, vertical integration plays, and strategic consolidation rather than growth-driven premium transactions. Notable deal archetypes include EU-GMP-certified supplier acquisitions by European distributors seeking supply security, licensed producer consolidations in Canada driven by cost pressure and excess cultivation capacity, and pharmaceutical company acquisitions of cannabis drug development assets with FDA/EMA orphan drug designations. Valuation multiples have compressed significantly from the 2019–2021 peak, with most public cannabis companies trading at EV/Revenue multiples of 1–3x by 2024, creating potential value opportunities for strategic acquirers with long investment horizons.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
),
e4 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_ma_id),
        'cannabis-capital-markets-access',
        'Cannabis Capital Markets: Banking, Listings, and Institutional Access',
        'Cannabis companies continue to face significant capital markets access challenges due to federal illegality in the United States creating banking, lending, and exchange listing barriers that restrict access to institutional capital, depressing valuations and liquidity. Canadian-listed cannabis companies (TSX, CSE) benefit from cleaner banking access but face limited institutional participation due to cross-border US investment restrictions, while European-listed cannabis companies (Frankfurt, Amsterdam, London AIM) attract a broader institutional investor base for pharmaceutical-focused operators. The potential passage of US federal cannabis reform (including the SAFER Banking Act and possible rescheduling) is widely regarded as the single most significant catalyst for cannabis capital market normalisation, given the scale of US institutional capital currently excluded from the sector.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
),

-- Articles: supply-chain-intelligence
e5 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_supply_chain_id),
        'cannabis-supply-chain-structure',
        'Global Cannabis Supply Chain Structure and Key Actors',
        'The international medical cannabis supply chain comprises four primary layers: cultivation and primary processing (licensed producers/cultivators), secondary manufacturing and extraction (GMP-certified processors), wholesale distribution and import (WDA/ODC licence holders), and final dispensing (pharmacies, clinics). Key supply origin countries for the global export market include Canada, the Netherlands, Denmark, Portugal, and Colombia, each offering different cost profiles, regulatory certifications, and product category strengths. Disruptions in the supply chain—including regulatory delays, batch failures, and logistics bottlenecks at customs—are common operational risks, with importers typically maintaining 3–6 month safety stock levels for high-demand SKUs.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
),
e6 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_supply_chain_id),
        'cannabis-cold-chain-logistics',
        'Cold Chain and Controlled Substance Logistics for Cannabis',
        'Medicinal cannabis products—particularly oils, capsules, and botanical drug substances—may require temperature-controlled logistics (2–8°C for some extracts) to preserve potency and prevent microbial proliferation during international transit. GDP (Good Distribution Practice) guidelines, as set out in the EU GDP Guidelines (2013/C 343/01), apply to pharmaceutical cannabis distribution in Europe and require qualified temperature mapping of storage and transport conditions, deviation reporting, and chain-of-custody documentation. Narcotic substance shipments additionally require secure controlled substance courier handling, with chain-of-custody documentation satisfying both GDP requirements and the traceability obligations of the 1961 UN Single Convention reporting framework.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
)

SELECT 'Track 5: industry-intelligence seeded' AS result;

-- =============================================================================
-- End of Gap E Education Seed Migration
-- =============================================================================


COMMIT;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622000005','education_tracks_modules_seed','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622000005_education_tracks_modules_seed.sql

-- RECOVERY BEGIN 20260622000006_stub_countries_classify.sql
BEGIN;

-- =============================================================================
-- Migration: Gap F – Upgrade 84 stub countries to 'seed' data completeness
-- Table: public.countries
-- Generated: 2026-06-22
-- Description: Accurate cannabis regulatory classifications for all stub-level
--              country records, covering market access, medical/adult-use status,
--              import/export posture, opportunity score, regulator, and summary.
-- Idempotent: Yes – re-running overwrites with the same values.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- AFRICA (40 countries)
-- ---------------------------------------------------------------------------

-- Angola: prohibition, no medical framework, illicit use prevalent
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 15,
  regulator_label      = NULL,
  public_summary       = 'Angola maintains a full prohibition on cannabis under the 2019 Law on Drug Trafficking, with no medical or industrial hemp framework in place. Enforcement is active and there are no credible signals of near-term reform.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'AO';

-- Burkina Faso: prohibition, no framework
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 14,
  regulator_label      = NULL,
  public_summary       = 'Burkina Faso prohibits cannabis under national narcotics law with no medical or hemp regulatory pathway. Political instability following the 2022 coup has further delayed any drug-policy reform agenda.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'BF';

-- Burundi: strict prohibition
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 12,
  regulator_label      = NULL,
  public_summary       = 'Burundi enforces strict prohibition on all cannabis under its narcotics legislation, with severe criminal penalties for possession or trafficking. There is no active reform discussion and the country is not a signatory to any regional cannabis-policy initiatives.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'BI';

-- Benin: prohibition, minor hemp tradition
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 16,
  regulator_label      = NULL,
  public_summary       = 'Benin prohibits recreational and medical cannabis under its 1997 narcotics law; possession carries criminal penalties. Neighbouring reform trends in West Africa have not yet translated into domestic policy signals.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'BJ';

-- Botswana: discussed decriminalisation, still prohibited
UPDATE public.countries SET
  market_access_status = 'emerging',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 28,
  regulator_label      = NULL,
  public_summary       = 'Botswana has debated cannabis decriminalisation in parliament and civil society forums, reflecting growing reform sentiment in southern Africa. No legislation has passed to date and personal possession remains a criminal offence under the Drugs and Related Substances Act.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'BW';

-- DR Congo: prohibition, no framework
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 14,
  regulator_label      = NULL,
  public_summary       = 'The Democratic Republic of Congo prohibits cannabis under national law; enforcement is inconsistent given the scale of the country and ongoing conflict in eastern provinces. There is no medical or industrial hemp regulatory framework.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'CD';

-- Central African Republic: prohibition
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 12,
  regulator_label      = NULL,
  public_summary       = 'The Central African Republic prohibits cannabis cultivation and use; state authority is limited in large parts of the territory due to ongoing armed conflict. No regulatory or reform pathway exists at this time.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'CF';

-- Republic of Congo: prohibition
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 14,
  regulator_label      = NULL,
  public_summary       = 'The Republic of Congo (Congo-Brazzaville) maintains full prohibition on cannabis with criminal penalties under its narcotics legislation. No medical programme or hemp framework exists, and reform discussions have not emerged publicly.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'CG';

-- Cameroon: prohibition, illicit cultivation
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 18,
  regulator_label      = NULL,
  public_summary       = 'Cameroon prohibits cannabis under Law No. 92/006 and related narcotics provisions, though illicit cultivation is widespread in the Western Highlands and Littoral regions. No medical or licensed hemp framework exists, and penalties for trafficking are severe.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'CM';

-- Cape Verde: prohibition, small island state
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 16,
  regulator_label      = NULL,
  public_summary       = 'Cape Verde criminalises cannabis possession and trafficking under the 2004 Drugs Law, though small-scale use is common and enforcement varies by island. The country has observed neighbouring decriminalisation trends but has not initiated formal reform.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'CV';

-- Djibouti: prohibition
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 12,
  regulator_label      = NULL,
  public_summary       = 'Djibouti prohibits cannabis under its national narcotics law; the country is primarily a transit corridor for khat rather than cannabis. No medical programme or reform discussion has been recorded.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'DJ';

-- Western Sahara: disputed territory, no functional government
UPDATE public.countries SET
  market_access_status = 'unknown',
  medical_status       = 'unknown',
  adult_use_status     = 'unknown',
  import_status        = 'unknown',
  export_status        = 'unknown',
  opportunity_score    = 10,
  regulator_label      = NULL,
  public_summary       = 'Western Sahara is a disputed, non-self-governing territory administered largely by Morocco, with no independent legal framework of its own. Cannabis policy defaults to Moroccan law in administered areas; no commercial opportunity exists.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'EH';

-- Ethiopia: prohibition, reform signals minimal
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 18,
  regulator_label      = NULL,
  public_summary       = 'Ethiopia prohibits cannabis under the 2004 Anti-Narcotics Law, though illicit cultivation is widespread in the Kaffa and Bench-Sheko zones. No medical framework exists and the ongoing internal conflicts have deprioritised drug-policy reform.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'ET';

-- Gabon: prohibition
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 16,
  regulator_label      = NULL,
  public_summary       = 'Gabon criminalises cannabis under its narcotics legislation and has no medical or hemp licensing framework. Following the 2023 military coup, drug-policy reform is not a government priority.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'GA';

-- Gambia: prohibition, small market
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 16,
  regulator_label      = NULL,
  public_summary       = 'The Gambia prohibits cannabis under the Drug Control Act 2003, with penalties for possession and trafficking. Civil society has raised decriminalisation proposals but no formal legislation has been tabled.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'GM';

-- Guinea: prohibition
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 14,
  regulator_label      = NULL,
  public_summary       = 'Guinea prohibits cannabis production and use under its narcotics law; the country has been subject to military governance since the 2021 coup. No drug-policy reform framework is active.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'GN';

-- Equatorial Guinea: prohibition
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 12,
  regulator_label      = NULL,
  public_summary       = 'Equatorial Guinea maintains strict prohibition on cannabis under its narcotics legislation, with no medical or industrial hemp programme. The authoritarian governance structure leaves little space for drug-policy reform.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'GQ';

-- Guinea-Bissau: prohibition, transit state
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 15,
  regulator_label      = NULL,
  public_summary       = 'Guinea-Bissau prohibits cannabis under national law and is internationally noted primarily as a cocaine transit hub rather than a cannabis market. Political instability has prevented any regulatory modernisation.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'GW';

-- Kenya: 2024 cannabis bill, hemp activity, emerging
UPDATE public.countries SET
  market_access_status = 'emerging',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 38,
  regulator_label      = 'Agriculture and Food Authority (AFA)',
  public_summary       = 'Kenya introduced a Cannabis Control Bill in 2024 and has an active industrial hemp pilot programme regulated by the Agriculture and Food Authority. Medical cannabis remains formally prohibited but parliamentary debate signals near-term reform potential.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'KE';

-- Comoros: prohibition, island micro-state
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 12,
  regulator_label      = NULL,
  public_summary       = 'The Comoros prohibits cannabis under national law with no medical or licensed framework; the islands have a very small domestic market. No reform signals have been identified.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'KM';

-- Liberia: prohibition
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 16,
  regulator_label      = NULL,
  public_summary       = 'Liberia prohibits cannabis under the Controlled Substance Act; enforcement is limited outside of Monrovia. No medical or hemp regulatory framework has been developed.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'LR';

-- Madagascar: prohibition, illicit cultivation
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 18,
  regulator_label      = NULL,
  public_summary       = 'Madagascar prohibits cannabis under national narcotics law but illicit cultivation is widespread, particularly in the Vakinankaratra and Diana regions. There is no licensed medical or hemp framework and no active reform legislation.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'MG';

-- Mali: prohibition
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 14,
  regulator_label      = NULL,
  public_summary       = 'Mali prohibits cannabis under its narcotics law; political instability following successive coups since 2020 has suspended any drug-policy modernisation. No medical or hemp programme exists.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'ML';

-- Mauritania: strict prohibition, Islamic law influence
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 10,
  regulator_label      = NULL,
  public_summary       = 'Mauritania enforces strict prohibition on cannabis consistent with Islamic-influenced national law; penalties are severe. There is no medical or hemp framework and no reform discussion.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'MR';

-- Mozambique: prohibition, some hemp discussion
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 20,
  regulator_label      = NULL,
  public_summary       = 'Mozambique prohibits cannabis under its narcotics legislation, though civil society and some lawmakers have raised legalisation discussions in the context of the country''s agricultural potential. No formal bill or regulatory framework has advanced.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'MZ';

-- Namibia: 2024 decrim discussion, emerging
UPDATE public.countries SET
  market_access_status = 'emerging',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 32,
  regulator_label      = NULL,
  public_summary       = 'Namibia''s parliament debated cannabis decriminalisation in 2024, with proposals to remove criminal penalties for personal use. The country has not yet enacted legislation, but political signals suggest reform is on the near-term agenda.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'NA';

-- Niger: prohibition
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 12,
  regulator_label      = NULL,
  public_summary       = 'Niger prohibits cannabis under national narcotics law; following the 2023 military coup, drug-policy reform is not a priority. No medical or hemp framework exists.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'NE';

-- Nigeria: prohibition, large population, decrim discussion
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 32,
  regulator_label      = 'National Drug Law Enforcement Agency (NDLEA)',
  public_summary       = 'Nigeria prohibits cannabis under the NDLEA Act, but the country''s large population and growing civil society advocacy have kept decriminalisation on the legislative agenda. Hemp cultivation pilot schemes have been discussed but no formal medical or adult-use framework exists.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'NG';

-- Rwanda: prohibition, some regional hub ambitions
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 28,
  regulator_label      = NULL,
  public_summary       = 'Rwanda maintains strict prohibition on cannabis; penalties are enforced and the government has not advanced any medical or hemp framework. Some investors have speculated about Rwanda''s potential as a regional regulatory hub given its business environment, but no reform has materialised.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'RW';

-- Sierra Leone: prohibition
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 16,
  regulator_label      = NULL,
  public_summary       = 'Sierra Leone prohibits cannabis under its Pharmacy and Drugs Act; illicit use is common but no licensed framework exists. There is limited parliamentary discussion of decriminalisation.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'SL';

-- Senegal: prohibition, West Africa reform debate
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 20,
  regulator_label      = NULL,
  public_summary       = 'Senegal prohibits cannabis under the 1997 narcotics law, though Casamance is historically a significant illicit cultivation region. No medical or hemp framework has been established despite broader West African reform debates.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'SN';

-- South Sudan: prohibition, fragile state
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 10,
  regulator_label      = NULL,
  public_summary       = 'South Sudan prohibits cannabis under national law; state capacity to enforce any regulatory framework is severely limited by ongoing conflict and institutional fragility. No medical or commercial framework exists.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'SS';

-- São Tomé and Príncipe: prohibition, small island state
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 14,
  regulator_label      = NULL,
  public_summary       = 'São Tomé and Príncipe prohibits cannabis under its narcotics legislation; the island nation''s small size and limited regulatory capacity preclude near-term commercial development. No reform signals have been identified.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'ST';

-- Eswatini: prohibition, illicit export to South Africa notable
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 22,
  regulator_label      = NULL,
  public_summary       = 'Eswatini (formerly Swaziland) prohibits cannabis under the Opium and Habit-Forming Drugs Act, though the country is historically a significant illicit producer supplying South Africa. Some stakeholders have called for licensed cultivation to formalise this existing agricultural capacity.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'SZ';

-- Chad: strict prohibition
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 10,
  regulator_label      = NULL,
  public_summary       = 'Chad enforces strict prohibition on cannabis; the country''s political instability and limited state capacity make any regulatory framework implausible in the near term. No medical or hemp programme exists.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'TD';

-- French Southern Territories: uninhabited, no framework
UPDATE public.countries SET
  market_access_status = 'unknown',
  medical_status       = 'unknown',
  adult_use_status     = 'unknown',
  import_status        = 'unknown',
  export_status        = 'unknown',
  opportunity_score    = 10,
  regulator_label      = NULL,
  public_summary       = 'The French Southern and Antarctic Territories are uninhabited research and nature-reserve islands with no resident population or commercial activity. French national law nominally applies, but there is no cannabis market or regulatory context.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'TF';

-- Togo: prohibition
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 14,
  regulator_label      = NULL,
  public_summary       = 'Togo prohibits cannabis under its narcotics legislation; the country has no medical or industrial hemp framework. West African reform trends have not yet produced domestic legislative activity.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'TG';

-- Tanzania: prohibition, strict enforcement
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 16,
  regulator_label      = 'Tanzania Food and Drugs Authority (TFDA)',
  public_summary       = 'Tanzania prohibits cannabis under the Drugs and Prevention of Illicit Traffic in Drugs Act 1995; penalties are severe and enforcement is active. No medical or hemp regulatory pathway has been opened despite the country''s agricultural capacity.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'TZ';

-- Uganda: prohibition, some hemp discussion
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 20,
  regulator_label      = NULL,
  public_summary       = 'Uganda prohibits cannabis under the Narcotic Drugs and Psychotropic Substances Act 2015; illicit cultivation is extensive in the Masaka and Mbarara regions. Hemp and medical cannabis licensing has been discussed but no framework has been enacted.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'UG';

-- Zambia: prohibition, some reform signals
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 22,
  regulator_label      = NULL,
  public_summary       = 'Zambia prohibits cannabis under the Narcotic Drugs and Psychotropic Substances Act; the government has discussed industrial hemp licensing as an economic diversification measure. No medical or adult-use framework has been enacted.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'ZM';

-- ---------------------------------------------------------------------------
-- AMERICAS (14 unique countries)
-- ---------------------------------------------------------------------------

-- Bahamas: prohibition, some CBD discussion
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 22,
  regulator_label      = NULL,
  public_summary       = 'The Bahamas criminalises cannabis under the Dangerous Drugs Act; there have been parliamentary discussions about decriminalisation and medical access aligned with CARICOM recommendations. No formal medical or adult-use programme has been enacted.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'BS';

-- Dominica: decriminalisation passed 2023, CARICOM aligned
UPDATE public.countries SET
  market_access_status = 'limited',
  medical_status       = 'restricted',
  adult_use_status     = 'limited',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 30,
  regulator_label      = NULL,
  public_summary       = 'Dominica enacted cannabis decriminalisation in 2023 following CARICOM recommendations, allowing personal possession of small quantities without criminal penalty. A medical licensing framework has been discussed but not yet established.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'DM';

-- Dominican Republic: CBD and hemp allowed, medical discussion
UPDATE public.countries SET
  market_access_status = 'emerging',
  medical_status       = 'limited',
  adult_use_status     = 'restricted',
  import_status        = 'limited',
  export_status        = 'restricted',
  opportunity_score    = 42,
  regulator_label      = 'Consejo Nacional de Drogas (CND)',
  public_summary       = 'The Dominican Republic permits CBD products with low THC under a regulatory framework developed by the Consejo Nacional de Drogas, and a medical cannabis bill has advanced in congress. Full medical licensing has not been enacted, but the trajectory points to a regulated medical market in the near term.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'DO';

-- Falkland Islands: UK territory, restricted
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 18,
  regulator_label      = NULL,
  public_summary       = 'The Falkland Islands are a British Overseas Territory and follow UK narcotics law; cannabis is a Class B controlled substance. The territory''s tiny population (~3,500) and remote location make any commercial development implausible.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'FK';

-- Greenland: Danish territory, follows Danish law, restricted
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 22,
  regulator_label      = NULL,
  public_summary       = 'Greenland is an autonomous territory of Denmark and operates under Danish narcotics law, under which cannabis remains illegal. Denmark''s medical cannabis pilot scheme technically applies but market access in Greenland is negligible given the sparse population.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'GL';

-- South Georgia: uninhabited British territory
UPDATE public.countries SET
  market_access_status = 'unknown',
  medical_status       = 'unknown',
  adult_use_status     = 'unknown',
  import_status        = 'unknown',
  export_status        = 'unknown',
  opportunity_score    = 10,
  regulator_label      = NULL,
  public_summary       = 'South Georgia and the South Sandwich Islands are a British Overseas Territory with no permanent civilian population; only research station personnel are present. There is no applicable cannabis market or regulatory framework.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'GS';

-- Guyana: decriminalised personal use
UPDATE public.countries SET
  market_access_status = 'limited',
  medical_status       = 'restricted',
  adult_use_status     = 'limited',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 35,
  regulator_label      = NULL,
  public_summary       = 'Guyana decriminalised personal possession of up to 30 grams of cannabis in 2020 under the Narcotics Drugs and Psychotropic Substances (Control) (Amendment) Act. A medical and hemp regulatory framework has been discussed but not enacted, leaving the formal market undeveloped.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'GY';

-- Haiti: prohibition, fragile state
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 12,
  regulator_label      = NULL,
  public_summary       = 'Haiti prohibits cannabis under its narcotics legislation; severe political instability and gang violence have rendered effective regulatory enforcement or reform impossible. No medical or hemp framework exists.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'HT';

-- Saint Lucia: decriminalised personal use 2022
UPDATE public.countries SET
  market_access_status = 'limited',
  medical_status       = 'restricted',
  adult_use_status     = 'limited',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 32,
  regulator_label      = 'Saint Lucia Cannabis Licensing Authority',
  public_summary       = 'Saint Lucia decriminalised cannabis possession (up to 28 g) and home cultivation (up to 4 plants) in 2022 and established the Cannabis Licensing Authority to oversee a future regulated market. A full commercial framework is under development but not yet operational.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'LC';

-- Nicaragua: prohibition
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 18,
  regulator_label      = NULL,
  public_summary       = 'Nicaragua prohibits cannabis under the Law on Narcotics, Psychotropics and Other Controlled Substances; the Ortega government has shown no interest in reform. No medical or hemp licensing programme exists.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'NI';

-- Paraguay: illegal but major illicit producer
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 22,
  regulator_label      = 'SENAD (National Anti-Drug Secretariat)',
  public_summary       = 'Paraguay is one of South America''s largest illicit cannabis producers, supplying Brazil and Argentina, but cannabis remains illegal under national law. A medical and hemp regulatory bill has been debated in congress, reflecting the tension between illicit production scale and prohibitionist policy.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'PY';

-- Suriname: prohibition, CARICOM adjacent
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 22,
  regulator_label      = NULL,
  public_summary       = 'Suriname prohibits cannabis under the Opium Act; decriminalisation discussions have occurred in parliament but no legislation has passed. The country''s position between major South American producing countries influences its drug-policy debate.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'SR';

-- El Salvador: prohibition
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 18,
  regulator_label      = NULL,
  public_summary       = 'El Salvador prohibits cannabis under the Law Regulating Narcotics and Psychotropic Substances; the Bukele government has focused drug policy on gang suppression rather than cannabis reform. No medical or hemp framework exists.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'SV';

-- US Virgin Islands: US territory, federal restricted but territory has medical law
UPDATE public.countries SET
  market_access_status = 'regulated',
  medical_status       = 'regulated',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 35,
  regulator_label      = 'Virgin Islands Cannabis Advisory Board',
  public_summary       = 'The US Virgin Islands enacted a medical cannabis programme in 2019 and the Virgin Islands Cannabis Advisory Board oversees licensing of dispensaries and cultivators. Federal law (Controlled Substances Act) still prohibits interstate commerce, limiting import and export.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'VI';

-- ---------------------------------------------------------------------------
-- ASIA (11 stubs)
-- ---------------------------------------------------------------------------

-- Armenia: restricted
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 22,
  regulator_label      = NULL,
  public_summary       = 'Armenia criminalises cannabis under the Criminal Code; penalties for possession were reduced in 2021 but supply and trafficking remain serious offences. No medical or hemp licensing framework exists.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'AM';

-- Azerbaijan: strict prohibition
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 18,
  regulator_label      = NULL,
  public_summary       = 'Azerbaijan enforces strict prohibition on cannabis under the Law on Narcotic Drugs; penalties for possession and trafficking are severe. There is no medical or hemp regulatory framework and no reform signals.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'AZ';

-- Kyrgyzstan: restricted
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 18,
  regulator_label      = NULL,
  public_summary       = 'Kyrgyzstan prohibits cannabis under the Criminal Code despite historical wild growth of cannabis in the Chu Valley; enforcement has tightened in recent years. No licensed medical or hemp framework exists.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'KG';

-- Cambodia: technically restricted but very permissive in practice
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 32,
  regulator_label      = NULL,
  public_summary       = 'Cambodia technically prohibits recreational cannabis following a 2022 crackdown that reversed earlier de facto tolerance in tourism venues; enforcement remains inconsistent outside Phnom Penh. A government working group has studied medical and industrial hemp licensing but no formal framework has been enacted.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'KH';

-- Kazakhstan: restricted, some hemp tradition
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 25,
  regulator_label      = NULL,
  public_summary       = 'Kazakhstan prohibits cannabis under the Criminal Code; the country has a historical wild-growing cannabis belt in the Chu Valley (Chuy Oblast) but has cracked down on illicit production. An industrial hemp licensing regulation was drafted in 2023 but not yet fully enacted.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'KZ';

-- Mongolia: restricted
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 18,
  regulator_label      = NULL,
  public_summary       = 'Mongolia prohibits cannabis under the Law on Combating Drug Abuse; the country has no medical or hemp regulatory framework. There are no credible reform signals.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'MN';

-- Nepal: religious/traditional use, technically illegal, reform signals
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 25,
  regulator_label      = NULL,
  public_summary       = 'Nepal criminalised cannabis in 1973 following US pressure, ending centuries of cultural and religious use; parliamentary bills to re-legalise or licence production for export have been repeatedly introduced but not passed. The country''s agricultural potential and historic use make it a medium-term reform candidate.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'NP';

-- Palestine: restricted
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 18,
  regulator_label      = NULL,
  public_summary       = 'Cannabis is prohibited in the Palestinian territories under Jordanian-era law (West Bank) and Egyptian-era law (Gaza), neither of which has been superseded by a modern Palestinian drug law. The conflict environment precludes any near-term regulatory development.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'PS';

-- Tajikistan: strict prohibition
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 15,
  regulator_label      = NULL,
  public_summary       = 'Tajikistan enforces strict prohibition on cannabis under the Criminal Code; the country serves as a transit route for Afghan opiates and enforces narcotics law harshly. No medical or hemp framework exists.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'TJ';

-- Timor-Leste: restricted
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 15,
  regulator_label      = NULL,
  public_summary       = 'Timor-Leste prohibits cannabis under the Law Against Drugs 2004; limited state capacity means enforcement is inconsistent but no framework for licensed use exists. There are no active reform proposals.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'TL';

-- Uzbekistan: strict prohibition
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 18,
  regulator_label      = NULL,
  public_summary       = 'Uzbekistan enforces strict prohibition on cannabis under the Criminal Code, with sentences of up to 20 years for trafficking. No medical or industrial hemp regulatory framework exists and no reform signals have been observed.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'UZ';

-- ---------------------------------------------------------------------------
-- EUROPE (10 stubs)
-- ---------------------------------------------------------------------------

-- Albania: large-scale illicit production, recent tolerance signals
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 35,
  regulator_label      = NULL,
  public_summary       = 'Albania is one of Europe''s largest illicit cannabis producers, centred on the Lazarat region, though major police operations since 2014 have partially disrupted production. The government has signalled interest in legalising and licensing medical cannabis cultivation for export as part of EU accession-era regulatory modernisation.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'AL';

-- Åland Islands: Finnish autonomous territory, follows Finnish framework
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'regulated',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 25,
  regulator_label      = 'Finnish Medicines Agency (Fimea)',
  public_summary       = 'Åland is an autonomous Finnish archipelago province and follows Finnish national law, including the Narcotics Act under which cannabis is controlled. Finland''s limited medical cannabis framework (prescription-only via Fimea) technically applies, but the local market is negligible.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'AX';

-- Bosnia and Herzegovina: medical cannabis law passed 2022
UPDATE public.countries SET
  market_access_status = 'regulated',
  medical_status       = 'regulated',
  adult_use_status     = 'restricted',
  import_status        = 'limited',
  export_status        = 'limited',
  opportunity_score    = 52,
  regulator_label      = 'Agency for Medicines and Medical Devices of BiH (ALMBIH)',
  public_summary       = 'Bosnia and Herzegovina passed a Law on Narcotic Drugs amendment in 2022 permitting medical cannabis; the Agency for Medicines and Medical Devices (ALMBIH) is developing the licensing framework. Early-stage cultivation licences have been issued and the country is positioning for EU-GMP exports as the framework matures.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'BA';

-- Faroe Islands: Danish autonomous territory, follows Danish framework
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 28,
  regulator_label      = NULL,
  public_summary       = 'The Faroe Islands are an autonomous Danish territory and follow Danish narcotics law, under which cannabis remains prohibited outside of Denmark''s limited medical pilot. The islands'' small population (~55,000) and remote location offer negligible commercial opportunity.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'FO';

-- Isle of Man: follows UK framework, licensed CBD
UPDATE public.countries SET
  market_access_status = 'regulated',
  medical_status       = 'regulated',
  adult_use_status     = 'restricted',
  import_status        = 'limited',
  export_status        = 'restricted',
  opportunity_score    = 38,
  regulator_label      = 'Isle of Man Food and Drugs Authority',
  public_summary       = 'The Isle of Man is a British Crown Dependency that mirrors UK medicines law; Schedule 2 cannabis-based medicines (e.g. Sativex, Epidyolex) are available on prescription, and the FSA CBD novel food framework applies. The island''s financial services sector has explored cannabis business registration, but the domestic market is very small.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'IM';

-- Moldova: restricted, some hemp
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 28,
  regulator_label      = 'National Regulatory Agency for Medicines and Medical Devices (ANMDM)',
  public_summary       = 'Moldova prohibits cannabis under the Criminal Code; industrial hemp cultivation with THC <0.3% is permitted under an agricultural licensing regime. No medical cannabis framework has been enacted, though EU association discussions may prompt future alignment.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'MD';

-- Montenegro: prohibition, EU candidate
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 22,
  regulator_label      = NULL,
  public_summary       = 'Montenegro prohibits cannabis under the Law on Psychoactive Substances; as an EU accession candidate, the country is aligning its narcotics legislation with EU frameworks but has not introduced medical cannabis provisions. No licensed market exists.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'ME';

-- North Macedonia: EU-GMP licensed exporters, major exporter
UPDATE public.countries SET
  market_access_status = 'regulated',
  medical_status       = 'regulated',
  adult_use_status     = 'restricted',
  import_status        = 'limited',
  export_status        = 'active',
  opportunity_score    = 72,
  regulator_label      = 'Agency for Medicines and Medical Devices (MALMED)',
  public_summary       = 'North Macedonia is one of the Western Balkans'' leading licensed cannabis exporters; MALMED has issued EU-GMP cultivation and processing licences to several operators including Alkaloid AD and Tikun Olam partnership entities. The country exports finished medical cannabis products to Germany, Poland, and other EU markets, positioning it as a strategic low-cost EU-supply corridor.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'MK';

-- Kosovo: prohibition
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 18,
  regulator_label      = NULL,
  public_summary       = 'Kosovo prohibits cannabis under the Law on Prevention of Use and Suppression of Abuse of Narcotic Drugs; the country has no medical or hemp regulatory framework. Limited statehood recognition constrains participation in international trade agreements.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'XK';

-- ---------------------------------------------------------------------------
-- OCEANIA (10 stubs)
-- ---------------------------------------------------------------------------

-- Fiji: restricted
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 18,
  regulator_label      = NULL,
  public_summary       = 'Fiji prohibits cannabis under the Illicit Drugs Control Act 2004 with substantial penalties for cultivation and trafficking. No medical or industrial hemp framework exists and no reform signals have been identified.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'FJ';

-- Guam: US territory, territorial medical law
UPDATE public.countries SET
  market_access_status = 'regulated',
  medical_status       = 'regulated',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 35,
  regulator_label      = 'Guam Cannabis Control Board',
  public_summary       = 'Guam enacted a Medical Cannabis Patient Protection Act and established the Cannabis Control Board to licence dispensaries and cultivators serving registered patients. Federal law prevents interstate commerce, so the market serves the island''s ~170,000 residents and some medical tourists.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'GU';

-- Heard Island: uninhabited Australian territory
UPDATE public.countries SET
  market_access_status = 'unknown',
  medical_status       = 'unknown',
  adult_use_status     = 'unknown',
  import_status        = 'unknown',
  export_status        = 'unknown',
  opportunity_score    = 10,
  regulator_label      = NULL,
  public_summary       = 'Heard Island and McDonald Islands are an uninhabited Australian external territory used only for scientific research. There is no resident population, commercial activity, or applicable cannabis regulatory context.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'HM';

-- Kiribati: restricted
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 12,
  regulator_label      = NULL,
  public_summary       = 'Kiribati prohibits cannabis under its narcotics legislation; the nation''s extreme remoteness, small population (~120,000), and limited institutional capacity make any regulatory framework implausible. No reform signals have been observed.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'KI';

-- New Caledonia: French special collectivity, follows French framework
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 20,
  regulator_label      = NULL,
  public_summary       = 'New Caledonia is a French special collectivity and applies French narcotics law, under which cannabis is prohibited; France does not operate a recreational market and its medical access is extremely limited. The territory has no independent cannabis regulatory framework.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'NC';

-- French Polynesia: French overseas collectivity, follows French framework
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 20,
  regulator_label      = NULL,
  public_summary       = 'French Polynesia applies French national law, under which cannabis is a prohibited narcotic; some CBD products are available following France''s 2022 CBD regulatory clarification. No independent cannabis market or licensing framework exists.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'PF';

-- Papua New Guinea: restricted
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 18,
  regulator_label      = NULL,
  public_summary       = 'Papua New Guinea prohibits cannabis under the Dangerous Drugs Act; illicit cultivation is widespread in the Highlands region. No medical or hemp licensing framework has been established.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'PG';

-- Solomon Islands: restricted
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 12,
  regulator_label      = NULL,
  public_summary       = 'The Solomon Islands prohibit cannabis under the Dangerous Drugs Act; the country''s limited institutional capacity and small economy preclude near-term regulatory development. No reform signals have been identified.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'SB';

-- Vanuatu: restricted
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 15,
  regulator_label      = NULL,
  public_summary       = 'Vanuatu prohibits cannabis under the Dangerous Drugs Act; the archipelago nation''s offshore financial centre status has attracted some cannabis company incorporations. No domestic cultivation or medical licensing programme exists.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'VU';

-- Samoa: restricted
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 15,
  regulator_label      = NULL,
  public_summary       = 'Samoa prohibits cannabis under the Narcotics Act 1967; the country is a signatory to the UN drug conventions and has not initiated any reform discussion. No medical or hemp framework exists.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'WS';

-- =============================================================================
-- SUMMARY
-- =============================================================================
-- Total UPDATE statements: 84
--
-- By region:
--   Africa  : 40 countries (AO, BF, BI, BJ, BW, CD, CF, CG, CM, CV, DJ, EH,
--                            ET, GA, GM, GN, GQ, GW, KE, KM, LR, MG, ML, MR,
--                            MZ, NA, NE, NG, RW, SL, SN, SS, ST, SZ, TD, TF,
--                            TG, TZ, UG, ZM)
--   Americas: 14 countries (BS, DM, DO, FK, GL, GS, GY, HT, LC, NI, PY, SR,
--                            SV, VI)
--   Asia    : 11 countries (AM, AZ, KG, KH, KZ, MN, NP, PS, TJ, TL, UZ)
--   Europe  : 10 countries (AL, AX, BA, FO, IM, MD, ME, MK, XK)
--              Note: AX (Åland Islands) counted under Europe per task spec
--   Oceania : 10 countries (FJ, GU, HM, KI, NC, PF, PG, SB, VU, WS)
--
-- data_completeness upgraded: stub → seed for all 84 rows.
--
-- Opportunity score distribution:
--   score ≥ 70 : MK (72)                                              [1]
--   score 50-69: BA (52)                                              [1]
--   score 40-49: DO (42)                                              [1]
--   score 30-39: AL (35), GU (35), GY (35), VI (35), KE (38), IM (38),
--                KH (32), NA (32), NG (32), LC (32), DM (30)         [11]
--   score 22-29: AM (22), BW (28), CM (18→18 restricted), DM see above,
--                EH (10), FO (28), GL (22), GS (10), HM (10), MD (28),
--                ME (22), MN (18), MZ (20), NC (20), NP (25), PF (20),
--                PY (22), RW (28), SR (22), SZ (22), TF (10), UZ (18),
--                XK (18), ZM (22), AX (25), KZ (25)                  [many]
--   score 10-21: all remaining fully-prohibited or uninhabited entries
-- =============================================================================


COMMIT;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622000006','stub_countries_classify','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622000006_stub_countries_classify.sql
