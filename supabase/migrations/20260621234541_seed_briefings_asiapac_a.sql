
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
