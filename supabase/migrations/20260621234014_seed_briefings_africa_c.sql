
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'ghana','country','GH','Prohibited; Medical Reform Under Discussion',
'Cannabis is prohibited in Ghana under the Narcotic Drugs (Control, Enforcement and Sanctions) Law of 1990. However, the Narcotics Control Commission (NCC) Act of 2020 modernized the regulatory framework and the government has been publicly exploring medical cannabis licensing for export purposes. Ghana has not yet enacted a medical cannabis program but is one of the more active reformers in West Africa.',
'No formal patient access pathway currently exists. Parliamentary debates on medical cannabis access have occurred. Future medical program implementation is possible pending legislation.',
'Physicians cannot prescribe cannabis under the current legal framework. Medical professionals have participated in policy consultations.',
'No licensed cannabis market currently exists. Ghana''s government has expressed interest in licensing medical cannabis cultivation primarily for export to EU markets. Agricultural infrastructure and a professional regulatory culture position Ghana as a potential West African cannabis hub when legislation advances.',
'Ghana is one of the more likely near-term African medical cannabis legalizers. Parliamentary support has been expressed. Legislation enabling export-oriented medical cannabis cultivation is anticipated in the 2025–2027 policy window.',
'Narcotics Control Commission (NCC) under the Ministry of Interior. Food and Drugs Authority (FDA) for pharmaceutical matters.',
'Narcotic Drugs Law 1990; NCC Act 2020; parliamentary cannabis committee proceedings; FDA pharmaceutical guidelines','Current as of Q2 2026','Quarterly','Country-level briefing covering prohibition with active medical reform discussion and export potential',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='GH' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'guinea','country','GN','Prohibited',
'Cannabis is prohibited in Guinea. Political instability and governance challenges have constrained regulatory capacity across all sectors. No medical cannabis program exists.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority given governance challenges. No legislative action is anticipated.',
'Ministry of Public Health; Gendarmerie Nationale for enforcement.',
'Guinean drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='GN' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'guinea-bissau','country','GW','Prohibited; Limited Enforcement',
'Cannabis is prohibited in Guinea-Bissau but enforcement is extremely limited. The country faces significant governance and capacity challenges. Guinea-Bissau is a noted transit point for South American cocaine destined for Europe. Cannabis prohibition nominally stands but domestic use is largely unaddressed by enforcement.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. Informal cannabis cultivation and use occurs with minimal enforcement.',
'Cannabis reform is not a current policy priority given governance challenges. No legislative action is anticipated.',
'Polícia Judiciária; Ministry of Health.',
'Guinea-Bissau drug laws; limited official data','Current as of Q2 2026','Annual','Country-level briefing noting limited enforcement context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='GW' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'kenya','country','KE','Prohibited; Export Licensing Under Discussion',
'Cannabis is prohibited in Kenya under the Narcotic Drugs and Psychotropic Substances (Control) Act of 1994. However, Kenya has been actively exploring medical cannabis export licensing, with the government issuing statements about potential licensing for export to regulated markets. No domestic medical program exists for patients as of 2026, but export-oriented cultivation licensing is under regulatory development.',
'No formal patient access pathway exists domestically. The policy discussion is primarily oriented toward export-oriented production.',
'Physicians cannot prescribe cannabis as no medical regulatory framework for domestic use exists.',
'No licensed commercial market exists yet. Kenya''s strong agricultural infrastructure, established export channels (particularly cut flowers and tea), and proximity to European markets make it an attractive production base. Several international companies have engaged with Kenyan authorities about cultivation licenses.',
'Kenya is positioned to be a significant East African cannabis producer for export markets. Regulatory frameworks for export cultivation are under development. A domestic medical access program may follow. The timeline for licensing operationalization is the key uncertainty.',
'Pharmacy and Poisons Board (PPB) under Ministry of Health. National Police Service for enforcement.',
'Narcotic Drugs and Psychotropic Substances (Control) Act 1994; PPB cannabis export framework consultations; government ministerial statements','Current as of Q2 2026','Quarterly','Country-level briefing covering prohibition with active export licensing development',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='KE' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'lesotho','country','LS','Medical Legal; Export-Oriented Pioneer',
'Lesotho became the first African country to issue a medical cannabis cultivation license when it licensed Medi Kingdom (now Medigrow) in 2017. Since then, additional cultivation licenses have been issued. Lesotho''s high-altitude growing conditions are ideal for cannabis cultivation. The regulatory framework is administered by the Lesotho Ministry of Health and the newly established Lesotho Cannabis Authority. Products are primarily exported to international pharmaceutical markets.',
'Domestic patient access to medical cannabis products is limited. The program is primarily export-oriented rather than serving a domestic medical market.',
'Domestic physician prescription pathways are in development but not yet fully operational. The medical regulatory framework focuses more on production licensing than domestic clinical access.',
'Lesotho''s cannabis sector is one of the most developed in sub-Saharan Africa by regulatory maturity. Multiple licensed cultivators produce cannabis for export, particularly to the UK and EU. The sector provides significant employment in a country with limited economic opportunities. EU GMP compliance is a key focus for exporters.',
'Lesotho''s Cannabis Authority is working to streamline licensing and improve GMP compliance for major export market access. A domestic medical access program is expected to be developed alongside the export industry. Further investment and additional license grants are anticipated.',
'Lesotho Cannabis Authority (LCA); Ministry of Health for medical matters.',
'Lesotho Cannabis Authority regulations; Pharmacy Order 2008 (amended); Ministry of Health cannabis guidelines','Current as of Q2 2026; verified against LCA official guidance','Quarterly','Full country-level briefing covering pioneer African medical cannabis status and export-oriented market',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='LS' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'liberia','country','LR','Prohibited',
'Cannabis is prohibited in Liberia under the Revised Narcotic Drug Law. No medical cannabis program exists. Liberia''s post-conflict recovery context has not included cannabis policy reform as a legislative priority.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Drug Enforcement Agency (DEA) of Liberia; Ministry of Health.',
'Revised Narcotic Drug Law; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='LR' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'libya','country','LY','Prohibited; Political Instability',
'Cannabis is prohibited in Libya under strict drug laws. The country''s ongoing political fragmentation and conflict between rival governments make coherent drug policy enforcement difficult. Cannabis use is prevalent in some areas. No medical cannabis program exists and no reform is being considered.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. Political instability affects all regulatory functions.',
'Cannabis reform is not a current policy priority given Libya''s political fragmentation. No legislative action is anticipated.',
'Multiple competing state structures; LPHO (Libyan Pharmaceutical Health Organization) where operational.',
'Libyan drug laws; regional comparative analysis; conflict monitoring','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status and political context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='LY' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'madagascar','country','MG','Prohibited; Informal Production Prevalent',
'Cannabis is prohibited in Madagascar but informal cultivation is widespread, particularly in the north and northwest of the island. Madagascar is one of Africa''s significant informal cannabis producers. No medical cannabis program exists and no formal reform is underway, though enforcement against cultivation is uneven.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. Informal cultivation and domestic/regional trade occurs.',
'Cannabis reform has not been formalized legislatively. Economic arguments for a licensed cannabis cultivation industry have been made given existing informal production capacity, but no action has been taken.',
'Brigade Centrale de Lutte contre les Stupéfiants; Ministry of Public Health.',
'Malagasy drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status with significant informal cultivation',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='MG' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'malawi','country','MW','Medical and Industrial Cultivation Licensed; Emerging Market',
'Malawi enacted the Cannabis Regulation Act and Industrial Hemp Act in 2020, establishing a licensing framework for medical cannabis and industrial hemp cultivation. Malawi Cannabis Regulatory Authority (MCRA) was established to license and regulate the sector. The program is primarily oriented toward export to international medical and industrial markets. Malawi is one of the more progressive sub-Saharan African countries on cannabis policy.',
'Domestic patient access pathways are limited. The program focuses on export-oriented cultivation. Medical access for Malawian patients is an expected future development as the domestic regulatory framework matures.',
'Domestic physician prescription pathways are not yet well-established. The focus is on cultivation and export licensing.',
'Malawi''s cannabis sector is developing with multiple cultivation licenses issued under the MCRA framework. The country''s existing tobacco farming infrastructure and expertise create a natural fit for cannabis cultivation. Several international cannabis companies have established Malawian partnerships or operations. Export certification processes are ongoing.',
'The MCRA is refining regulatory standards to meet EU and UK GMP requirements for export access. A domestic medical access program is expected to be developed in parallel. Malawi is well-positioned as a significant African cannabis producer.',
'Malawi Cannabis Regulatory Authority (MCRA); Ministry of Health for medical matters.',
'Cannabis Regulation Act 2020; Industrial Hemp Act 2020; MCRA licensing registry and guidance','Current as of Q2 2026; verified against MCRA official guidance','Quarterly','Full country-level briefing covering licensed medical cannabis sector and export development',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='MW' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'mali','country','ML','Prohibited; Enforcement Limited by Instability',
'Cannabis is prohibited in Mali but enforcement is severely constrained by the country''s ongoing political instability and security challenges in large parts of the territory. Mali is a transit country for Saharan drug routes. No medical cannabis program exists.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. Informal trade occurs through transit corridors.',
'Cannabis reform is not a current policy priority given Mali''s security situation. No legislative action is anticipated.',
'Direction des Stupéfiants et de la Police Judiciaire; Ministère de la Santé.',
'Mali drug laws; regional comparative analysis; security monitoring','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status and security context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='ML' AND jurisdiction_type='country');
