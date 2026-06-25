
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
