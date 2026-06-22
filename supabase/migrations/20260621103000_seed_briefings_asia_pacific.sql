-- Seed country-level cannabis regulatory briefings: Asia Pacific
-- Countries: BD, BT, BN, KH, CN, FJ, HK, IN, ID, JP, KI, KP, KR, LA, MY, MV, MH, MN, MM, NP, NZ, NR, PW, PG, PH, WS, SG, SB, LK, TW, TL, TV, VN, VU

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'bangladesh','country','BD','Prohibited',
'Cannabis is prohibited in Bangladesh under the Narcotics Control Act 1990. Penalties include significant imprisonment and fines. Cannabis (locally known as ganja) has traditional use in some communities and is associated with Hindu religious practices, but the legal framework maintains prohibition. There is no medical cannabis program.',
'No legal patient access pathway exists. Cannabis-based medicines are unavailable through official Bangladeshi healthcare channels.',
'Bangladeshi physicians cannot prescribe cannabis under the existing legal framework.',
'No licensed cannabis market exists. Informal cannabis use has some cultural and religious roots, but no legal commercial activity exists.',
'No reform is anticipated. Bangladesh''s drug policy maintains strict prohibition with no visible political momentum for change.',
'Department of Narcotics Control (DNC) handles drug enforcement. Directorate General of Drug Administration (DGDA) oversees pharmaceutical regulation.',
'Bangladesh Narcotics Control Act 1990; DNC enforcement data; DGDA pharmaceutical registry','Current as of Q2 2026','Annual','Country-level briefing noting prohibition with traditional use context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='BD' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'bhutan','country','BT','Prohibited',
'Cannabis is prohibited in Bhutan under the Narcotic Drugs, Psychotropic Substances and Substance Abuse Act 2015. Bhutan''s legal framework maintains strict prohibition despite the plant growing wild in many regions of the country. There is no medical cannabis program. Bhutan''s Gross National Happiness policy framework emphasizes wellbeing but has not extended to cannabis reform.',
'No legal patient access pathway exists. Cannabis-based medicines are unavailable through official Bhutanese healthcare channels.',
'Bhutanese physicians cannot prescribe cannabis under the existing legal framework.',
'No licensed cannabis market exists. Wild cannabis growth is widespread but not commercially exploited. Traditional use exists in some communities.',
'No reform is anticipated. Bhutan''s conservative social and legal framework does not currently accommodate cannabis policy reform.',
'Royal Bhutan Police and the Ministry of Health handle drug enforcement and pharmaceutical regulation respectively.',
'Bhutan Narcotic Drugs Act 2015; Royal Bhutan Police data; Ministry of Health pharmaceutical policy','Current as of Q2 2026','Annual','Country-level briefing noting prohibition with wild cannabis context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='BT' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'brunei','country','BN','Prohibited; Death Penalty for Trafficking',
'Cannabis is prohibited in Brunei under the Misuse of Drugs Act, with severe penalties including the death penalty for trafficking above threshold amounts. Brunei operates under a dual legal system where Sharia law applies to Muslims, adding religious dimensions to drug prohibitions. There is no medical cannabis program. Brunei maintains one of Southeast Asia''s strictest drug enforcement regimes.',
'No legal patient access exists. Cannabis-based medicines are completely unavailable through official Brunei healthcare channels.',
'Brunei physicians cannot prescribe cannabis under any existing legal framework.',
'No licensed cannabis market exists. Brunei''s enforcement is extremely strict with no tolerance for cannabis activity.',
'No reform is anticipated. Brunei''s Sharia-influenced legal system and conservative governance make cannabis liberalization essentially impossible in the foreseeable future.',
'Royal Brunei Police Force handles drug enforcement. Ministry of Health oversees pharmaceutical regulation.',
'Brunei Misuse of Drugs Act; Ministry of Health pharmaceutical policy; ASEAN drug control coordination frameworks','Current as of Q2 2026','Annual','Country-level briefing noting severe prohibition including death penalty provisions',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='BN' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'cambodia','country','KH','Prohibited; Enforcement Variable',
'Cannabis is prohibited in Cambodia under the Law on the Control of Drugs 1997. However, enforcement has historically been inconsistent, and cannabis use in cooking (notably cannabis-infused dishes) was openly tolerated until a crackdown in the late 2010s. The government has pursued stricter enforcement since 2018, including in the tourism sector where cannabis restaurants had proliferated. There is no formal medical cannabis program.',
'No legal patient access pathway exists. Cannabis-based medicines are not available through official Cambodian healthcare channels.',
'Cambodian physicians cannot prescribe cannabis under the existing legal framework.',
'Cambodia had a thriving informal cannabis tourism economy, particularly in Phnom Penh and Sihanoukville, but government enforcement has significantly disrupted this market. No licensed commercial sector exists.',
'The government has signaled ongoing enforcement intentions. Some discussion of potential hemp agriculture for export has occurred but no framework has advanced. Medical cannabis legalization is not on the current agenda.',
'National Authority for Combating Drugs (NACD) coordinates drug policy. Ministry of Interior handles enforcement.',
'Cambodia Law on Control of Drugs 1997; NACD enforcement data; ASEAN drug control monitoring','Current as of Q2 2026','Annual','Country-level briefing noting prohibition with historical enforcement inconsistency and recent crackdown',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='KH' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'china','country','CN','Prohibited; Severe Penalties; Hemp Industrial Sector',
'Cannabis is strictly prohibited for personal use in China under the Law on Narcotics Control 2007. Penalties are severe, including lengthy imprisonment and capital punishment for large-scale trafficking. However, China has a significant and growing licensed industrial hemp sector, and Chinese companies dominate global CBD ingredient supply chains. The bifurcated approach — strict prohibition on THC-containing cannabis while developing a hemp/CBD industry — is a defining feature of Chinese drug policy.',
'No legal patient access to medical cannabis exists. Cannabis-derived pharmaceuticals are not accessible through Chinese healthcare channels. Epidiolex has not been approved for Chinese use.',
'Chinese physicians cannot prescribe cannabis or THC-containing products under any circumstances.',
'China is the world''s largest producer of licensed industrial hemp and a major source of CBD isolate and hemp-derived ingredients for global markets. Chinese companies supply European and North American CBD manufacturers. The hemp licensing system is regulated at the provincial level with Yunnan, Heilongjiang, and Jilin as major producing provinces.',
'China''s bifurcated policy is expected to continue: strict THC/cannabis prohibition alongside expanding hemp industrial policy. Medical cannabis legalization is not on the policy agenda. The hemp export sector will continue to grow as international CBD markets develop.',
'National Narcotics Control Commission (NNCC) handles drug policy coordination. Ministry of Public Security enforces drug laws. Industrial hemp is regulated at the provincial level with national oversight.',
'China Law on Narcotics Control 2007; NNCC enforcement data; industrial hemp provincial regulations; Chinese hemp export statistics','Current as of Q2 2026','Quarterly','Country-level briefing covering strict prohibition alongside dominant global hemp industrial sector',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='CN' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'fiji','country','FJ','Prohibited',
'Cannabis is prohibited in Fiji under the Illicit Drugs Control Act 2004. Penalties include imprisonment and fines. There is no medical cannabis program. Fiji''s drug policy is enforcement-focused with no visible reform movement. Cannabis is one of the most commonly seized illicit substances in Fiji.',
'No legal patient access pathway exists. Cannabis-based medicines are unavailable through official Fijian healthcare channels.',
'Fijian physicians cannot prescribe cannabis under the existing legal framework.',
'No licensed cannabis market exists. Fiji''s informal cannabis market is primarily domestic with some regional informal trade.',
'No reform is anticipated. Fiji''s drug policy maintains prohibition with no political momentum for change visible in 2026.',
'Fiji Police Force handles drug enforcement. Ministry of Health oversees pharmaceutical regulation.',
'Fiji Illicit Drugs Control Act 2004; Fiji Police Force drug seizure data; Ministry of Health pharmaceutical policy','Current as of Q2 2026','Annual','Country-level briefing noting prohibition status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='FJ' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'hong-kong','country','HK','Prohibited; Strict Enforcement',
'Cannabis is strictly prohibited in Hong Kong under the Dangerous Drugs Ordinance (Cap. 134). Penalties include up to life imprisonment for trafficking. As a Special Administrative Region of China, Hong Kong maintains its own drug laws under the Basic Law, which are aligned with international conventions. There is no medical cannabis program. Post-2020 governance changes have not altered the drug enforcement framework.',
'No legal patient access pathway exists. Cannabis-based medicines are unavailable through official Hong Kong healthcare channels.',
'Hong Kong physicians cannot prescribe cannabis under the existing legal framework.',
'No licensed cannabis market exists. Hong Kong enforces strict drug prohibition, and its status as a major international financial and transit hub shapes border enforcement priorities.',
'No reform is anticipated under the current SAR governance framework. Hong Kong''s drug policy alignment with mainland Chinese standards makes cannabis liberalization extremely unlikely.',
'Hong Kong Customs and Excise Department and the Hong Kong Police Force handle drug enforcement. Department of Health oversees pharmaceutical regulation.',
'Hong Kong Dangerous Drugs Ordinance Cap. 134; HKPF drug enforcement data; Department of Health pharmaceutical registry','Current as of Q2 2026','Annual','Country-level briefing noting strict prohibition as SAR of China',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='HK' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'india','country','IN','Complex — State-Level Variation; Bhang Traditionally Permitted',
'India''s cannabis legal landscape is uniquely complex. The Narcotic Drugs and Psychotropic Substances (NDPS) Act 1985 prohibits cannabis resin (charas) and cannabis flower/leaves when separated from the plant, but does not prohibit the seeds and leaves when used as whole plant. Bhang (a traditional cannabis preparation made from leaves) is culturally permitted under this framework and sold through licensed shops in many states. Several states have issued licenses for bhang sales. There is no modern medical cannabis program, but India''s government has increasingly discussed industrial hemp and cannabis research policy.',
'There is no modern medical cannabis patient access system. Bhang preparation is legally available through licensed shops in states that permit it. Patients seeking cannabis-based medications must navigate complex import authorization procedures or access unregulated markets.',
'Indian physicians cannot formally prescribe cannabis products under the NDPS Act framework. A few licensed pharmaceutical imports of CBD products have been permitted, but no systematic prescribing pathway exists.',
'India has a growing industrial hemp sector with hemp cultivation licensed in several states including Uttarakhand, Himachal Pradesh, and Uttar Pradesh. The traditional bhang market represents a legitimate, regulated commerce channel at the state level. International cannabis companies have shown interest in India as a potential production base.',
'India''s policy is gradually evolving. The central government has signaled interest in cannabis research and hemp industry development. Several state governments have been more progressive. Medical cannabis regulatory reform is under discussion in policy circles with potential for meaningful change over 2025–2028.',
'Central Bureau of Narcotics (CBN) under the Ministry of Finance administers NDPS Act licensing for cultivation. State Excise Departments regulate bhang sales. Ministry of Health and Family Welfare (MoHFW) oversees pharmaceutical regulation.',
'India NDPS Act 1985 and state amendments; CBN hemp cultivation license data; state excise bhang licensing records; MoHFW pharmaceutical circulars','Current as of Q2 2026; verified against CBN guidance','Quarterly','Country-level briefing covering complex NDPS Act framework, bhang tradition, hemp sector, and reform trajectory',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='IN' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'indonesia','country','ID','Prohibited; Death Penalty for Trafficking',
'Cannabis is prohibited in Indonesia under Law No. 35 of 2009 on Narcotics. Indonesia maintains some of the harshest drug laws in Southeast Asia, with trafficking in cannabis above threshold amounts carrying the death penalty. The country''s drug enforcement is aggressive, with well-publicized executions of drug traffickers. There is no medical cannabis program. Indonesia''s large population and geographic sprawl create enforcement challenges despite strong legal deterrents.',
'No legal patient access exists. Cannabis-based medicines are completely unavailable through official Indonesian healthcare channels.',
'Indonesian physicians cannot prescribe cannabis under any circumstances in the current legal framework.',
'No licensed cannabis market exists. Indonesia''s severe penalties and enforcement posture make commercial cannabis activity extremely risky.',
'No reform is expected. Indonesia''s drug enforcement leadership has resisted international pressure toward liberalization, and capital punishment for drug offenses is supported by significant portions of the political establishment.',
'National Narcotics Board (BNN) coordinates drug policy and enforcement. Ministry of Health oversees pharmaceutical regulation.',
'Indonesia Law No. 35/2009; BNN enforcement data; UN Special Rapporteur reports on drug-related executions; ASEAN drug control monitoring','Current as of Q2 2026','Annual','Country-level briefing noting severe prohibition with death penalty provisions',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='ID' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'japan','country','JP','Prohibited; 2023 Amendment for CBD/Medical Research',
'Japan has one of the world''s strictest drug enforcement regimes historically, but enacted a significant amendment to the Cannabis Control Act in 2023. The amendment, effective December 2023, permits medical use of cannabis-derived pharmaceutical products (primarily enabling Epidiolex/cannabidiol medicines). Simple possession was also criminalized for the first time (previously only production/trafficking was prohibited). Japan''s shift represents an incremental step toward medical access while simultaneously tightening personal use penalties.',
'Patients may access approved cannabis-derived pharmaceutical products (such as Epidiolex for epilepsy) through licensed medical facilities following the 2023 amendment. Products must receive PMDA approval. Access pathways are limited and primarily focused on severe neurological conditions.',
'Japanese physicians may prescribe PMDA-approved cannabis-derived pharmaceuticals for qualifying medical conditions following the 2023 amendment. Prescribing is limited to approved indications and regulated institutions.',
'Japan''s cannabis pharmaceutical market is nascent. The 2023 amendment opens a pathway for PMDA-approved products but no domestic cultivation for medical products is yet licensed. Global pharmaceutical manufacturers are pursuing PMDA approval pathways.',
'Japan''s 2023 amendment signals incremental openness to pharmaceutical cannabis products while maintaining strict prohibition on recreational use. Further medical access expansion, particularly for cancer and pain indications, is possible over 2025–2028 as PMDA approval processes mature.',
'Pharmaceuticals and Medical Devices Agency (PMDA) evaluates and approves medical cannabis products. Ministry of Health, Labour and Welfare (MHLW) administers the Cannabis Control Act. National Police Agency (NPA) handles drug enforcement.',
'Japan Cannabis Control Act 2023 Amendment; PMDA product approval database; MHLW regulatory guidance; NPA drug enforcement statistics','Current as of Q2 2026; verified against MHLW official guidance','Quarterly','Country-level briefing covering 2023 amendment enabling pharmaceutical cannabis while tightening personal use prohibition',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='JP' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'kiribati','country','KI','Prohibited',
'Cannabis is prohibited in Kiribati under the Dangerous Drugs Act. There is no medical cannabis program. Kiribati''s remote location, small population, and limited governance capacity mean drug enforcement is primarily focused on import prevention rather than domestic cultivation. No reform movement is evident.',
'No legal patient access pathway exists.',
'Kiribati physicians cannot prescribe cannabis under the existing legal framework.',
'No licensed cannabis market exists in this small Pacific island nation.',
'No reform is anticipated. Kiribati''s drug policy follows regional Pacific enforcement norms.',
'Kiribati Police Service handles drug enforcement. Ministry of Health oversees pharmaceutical regulation.',
'Kiribati Dangerous Drugs Act; Pacific regional drug monitoring','Current as of Q2 2026','Annual','Country-level briefing noting prohibition in small Pacific island context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='KI' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'north-korea','country','KP','Prohibited (Internally Inconsistent Enforcement)',
'Cannabis policy in North Korea is opaque due to the country''s extreme information restrictions. Credible reports from defectors have indicated that cannabis (locally called ip tambae or "leaf tobacco") has been widely used and was not consistently treated as a controlled substance, though opiates are more prominent in DPRK drug enforcement. Official North Korean law prohibits illicit drugs, but consistent enforcement of cannabis prohibition is uncertain.',
'No legal patient access information is available. The DPRK''s healthcare system is state-controlled and severely limited.',
'Information on physician prescribing is unavailable due to the closed nature of North Korean governance.',
'No licensed cannabis market exists under any recognized commercial framework. Informal cannabis use appears to have been tolerated in some regions based on defector accounts.',
'Given the DPRK''s closed political system, no reform pathway can be assessed. Drug policy information remains opaque.',
'Ministry of Public Health has nominal pharmaceutical oversight. Security Services handle drug enforcement enforcement.',
'UN Special Rapporteur DPRK reports; defector testimony compilations; limited open-source intelligence','Current as of Q2 2026; extremely limited verified data','Annual','Country-level briefing noting prohibition with significant informational uncertainty',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='KP' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'south-korea','country','KR','Medical Legal (Limited); No Adult-Use',
'South Korea became the first Asian country to legalize medical cannabis in November 2018, through an amendment to the Narcotics Control Act. The program allows import of foreign-manufactured cannabis-based medicines (such as Epidiolex, Sativex, and Marinol) for patients with conditions including epilepsy, cancer, and multiple sclerosis. Domestic cultivation and production for medical purposes is not yet authorized. The program has been limited in practice due to strict qualification requirements and reimbursement barriers.',
'Patients may access approved imported cannabis-based medicines through licensed hospital pharmacies with a specialist physician prescription and MFDS approval. The process involves individual import authorization for non-approved products. Patient numbers have grown slowly due to administrative barriers.',
'Specialist physicians at licensed hospitals may prescribe approved cannabis-based pharmaceutical products for qualifying medical conditions. General practitioners cannot prescribe. Specialist referral and MFDS authorization are required for non-standard products.',
'South Korea''s medical cannabis market is very limited in scale, with a small number of patients accessing imported products annually. Domestic cultivation for pharmaceutical production has been discussed but not yet authorized. Global cannabis pharmaceutical companies have engaged with the MFDS approval pathway.',
'South Korea is cautiously expanding its medical cannabis program. Further product approvals and potential domestic production authorization are possible over 2025–2027. Adult-use legalization is not on the political agenda and faces significant public resistance.',
'Ministry of Food and Drug Safety (MFDS/식품의약품안전처) manages cannabis-based medicine approvals and import authorizations. Health Insurance Review and Assessment Service (HIRA) influences reimbursement.',
'South Korea Narcotics Control Act 2018 amendment; MFDS approved product list; HIRA reimbursement guidelines; academic medical center prescribing data','Current as of Q2 2026; verified against MFDS official guidance','Quarterly','Country-level briefing covering landmark 2018 medical legalization as first in Asia and program status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='KR' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'laos','country','LA','Prohibited',
'Cannabis is prohibited in Laos under the Law on Narcotic Drugs 2000 and related legislation. Laos is a member of the Greater Mekong Subregion, which has historically been significant in illicit drug production (primarily opiates). Cannabis is also cultivated and traded informally. There is no medical cannabis program. Laos has undertaken some drug policy reforms related to treatment rather than strict enforcement, but cannabis legalization is not on the agenda.',
'No legal patient access pathway exists. Cannabis-based medicines are unavailable through official Lao healthcare channels.',
'Lao physicians cannot prescribe cannabis under the existing legal framework.',
'No licensed cannabis market exists. Some informal cultivation and trade occurs particularly in northern regions near Myanmar.',
'No reform is anticipated. Laos'' drug policy is influenced by ASEAN coordination norms and domestic enforcement priorities.',
'National Authority for Combating Drugs (NACD) coordinates drug policy. Ministry of Public Health oversees pharmaceutical regulation.',
'Laos Law on Narcotic Drugs 2000; NACD reports; UNODC Greater Mekong monitoring','Current as of Q2 2026','Annual','Country-level briefing noting prohibition in Greater Mekong drug production context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='LA' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'malaysia','country','MY','Prohibited; Death Penalty for Trafficking',
'Cannabis is strictly prohibited in Malaysia under the Dangerous Drugs Act 1952. Trafficking in cannabis above 200 grams carries a mandatory death penalty under Malaysian law. Personal use and possession carry significant imprisonment terms. There is no medical cannabis program. Malaysia maintains one of Southeast Asia''s harshest drug enforcement regimes. Some reform discussions began in 2022–2023 under the Anwar Ibrahim government, though no concrete cannabis-specific changes have been enacted.',
'No legal patient access exists. Cannabis-based medicines are completely unavailable through official Malaysian healthcare channels.',
'Malaysian physicians cannot prescribe cannabis under any circumstances in the current legal framework.',
'No licensed cannabis market exists. Malaysia''s death penalty for trafficking creates an extremely high-risk environment. Some reform discussions under the current government may eventually affect policy.',
'The Anwar Ibrahim government has signaled interest in drug policy reform, including reviewing mandatory death penalties. Cannabis-specific medical reform is being discussed in policy circles. Meaningful change is possible over 2025–2028, potentially starting with death penalty review and limited medical access.',
'Royal Malaysia Police (PDRM) Narcotics Division handles drug enforcement. Ministry of Health (MOH) oversees pharmaceutical regulation. National Anti-Drug Agency (AADK) coordinates policy.',
'Malaysia Dangerous Drugs Act 1952 and amendments; PDRM enforcement data; AADK policy documents; MOH pharmaceutical registry','Current as of Q2 2026','Quarterly','Country-level briefing noting severe prohibition with emerging reform discussion under current government',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='MY' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'maldives','country','MV','Prohibited; Severe Penalties',
'Cannabis is strictly prohibited in the Maldives under the Drug Act of Maldives (Law No. 17/2011). Penalties are severe, and the country has a strict Islamic legal framework that influences drug policy. There is no medical cannabis program. Tourism to the Maldives is significant, but cannabis prohibition applies to both residents and visitors.',
'No legal patient access exists. Cannabis-based medicines are unavailable through official Maldivian healthcare channels.',
'Maldivian physicians cannot prescribe cannabis under the existing legal framework.',
'No licensed cannabis market exists. The Maldives enforces strict drug prohibition, and its resort island model creates specific enforcement challenges for tourism management.',
'No reform is anticipated given the Maldives'' Islamic legal framework and conservative political environment.',
'Maldives Police Service handles drug enforcement. Ministry of Health oversees pharmaceutical regulation.',
'Maldives Drug Act Law No. 17/2011; Maldives Police Service drug enforcement data; Ministry of Health pharmaceutical policy','Current as of Q2 2026','Annual','Country-level briefing noting strict prohibition in Islamic legal context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='MV' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'marshall-islands','country','MH','Prohibited',
'Cannabis is prohibited in the Marshall Islands under the Health and Environment Protection Act and related drug control legislation. There is no medical cannabis program. The Marshall Islands'' compact relationship with the United States influences its legal framework, including drug policy.',
'No legal patient access pathway exists. Cannabis-based medicines are unavailable through official Marshallese healthcare channels.',
'Marshallese physicians cannot prescribe cannabis under the existing legal framework.',
'No licensed cannabis market exists. The Marshall Islands'' geographic remoteness and small population limit illicit market scale.',
'No reform is anticipated in the near term. The US compact relationship creates some alignment with US federal drug law positions.',
'Marshall Islands Police and the Ministry of Health handle drug enforcement and pharmaceutical regulation respectively.',
'Marshall Islands drug control legislation; Pacific regional drug monitoring; US Compact of Free Association drug policy dimensions','Current as of Q2 2026','Annual','Country-level briefing noting prohibition in US compact context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='MH' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'mongolia','country','MN','Prohibited',
'Cannabis is prohibited in Mongolia under the Law on Combating Drugs (2017 revision). There is no medical cannabis program. Mongolia''s drug policy challenge is primarily focused on opiates and methamphetamine transit from neighboring countries. Cannabis enforcement is present but secondary to these priorities.',
'No legal patient access pathway exists. Cannabis-based medicines are unavailable through official Mongolian healthcare channels.',
'Mongolian physicians cannot prescribe cannabis under the existing legal framework.',
'No licensed cannabis market exists. Informal cannabis use occurs in urban areas, particularly Ulaanbaatar.',
'No reform is anticipated. Mongolia''s drug policy priorities center on other substance categories, and cannabis reform is not a political discussion item.',
'General Police Department handles drug enforcement. Ministry of Health oversees pharmaceutical regulation.',
'Mongolia Law on Combating Drugs 2017; General Police Department enforcement data; UNODC Central Asia monitoring','Current as of Q2 2026','Annual','Country-level briefing noting prohibition',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='MN' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'myanmar','country','MM','Prohibited; Instability Context',
'Cannabis is prohibited in Myanmar under the Narcotic Drugs and Psychotropic Substances Law 1993. Myanmar is a major illicit drug producer, primarily opiates and methamphetamine in the Golden Triangle. Cannabis is also produced and traded informally. The 2021 military coup has severely disrupted governance, including drug enforcement, creating an increasingly fragmented control environment. There is no medical cannabis program under any recognized authority.',
'No legal patient access pathway exists under the military government or opposition frameworks.',
'Myanmar physicians cannot formally prescribe cannabis under any existing regulatory framework.',
'No licensed cannabis market exists. The political and security crisis has created significant governance gaps affecting all commercial activity, including informal cannabis trade.',
'Cannabis regulatory reform is not possible in the current political situation. Post-transition governance, whenever it occurs, may revisit drug policy as part of broader legal reforms.',
'The State Administration Council (SAC) nominally controls pharmaceutical regulation through the Food and Drug Administration. Drug enforcement is fragmented across military and various armed groups.',
'Myanmar Narcotic Drugs Law 1993; UNODC Greater Mekong monitoring; crisis governance assessments','Current as of Q2 2026','Annual','Country-level briefing noting prohibition in context of post-coup governance instability',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='MM' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'nepal','country','NP','Prohibited; Traditional Use History',
'Cannabis is prohibited in Nepal under the Narcotic Drug (Control) Act 1976. Nepal has a rich tradition of cannabis use, particularly in religious contexts related to Hinduism (cannabis is associated with the god Shiva), and Kathmandu was historically a major cannabis hub before international pressure led to prohibition in 1976. Some reform advocacy has emerged, including proposals to re-legalize cannabis for religious and economic purposes, but no legislative action has occurred.',
'No formal patient access pathway exists. Cannabis-based medicines are not available through official Nepali healthcare channels.',
'Nepali physicians cannot formally prescribe cannabis under the existing legal framework.',
'No licensed cannabis market exists. Informal cannabis use persists particularly in religious and rural contexts. Nepal''s Himalayan regions are known for producing high-quality cannabis resin.',
'There is growing advocacy for cannabis reform in Nepal, particularly around religious use decriminalization and hemp agricultural legalization for economic development. Reform is possible over the medium term (2026–2029).',
'Department of Drug Administration (DDA) under the Ministry of Health oversees pharmaceutical regulation. Nepal Police handles drug enforcement.',
'Nepal Narcotic Drug Control Act 1976; DDA pharmaceutical registry; reform advocacy documentation','Current as of Q2 2026','Annual','Country-level briefing noting prohibition with significant religious and traditional use history',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='NP' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'new-zealand','country','NZ','Medical Legal; Adult-Use Rejected (2020 Referendum)',
'New Zealand has a regulated medical cannabis scheme under the Misuse of Drugs (Medicinal Cannabis) Amendment Act 2018 and subsequent regulations. The scheme allows licensed domestic cultivation, manufacturing, and import of medical cannabis products to meet prescribed quality standards. In the 2020 general election referendum, 46.1% voted in favour of adult-use legalization — not a majority, so adult-use remains illegal. Medical market development has accelerated since 2020.',
'Patients access medical cannabis through licensed pharmacies with a prescription from a registered medical practitioner. Both prescribed and self-initiated access pathways exist for certain products. Costs are borne by patients as Pharmac does not currently fund medical cannabis. A range of licensed products including oils, capsules, and flower are available from domestic producers and via import.',
'Any registered medical practitioner may prescribe Schedule 1 medical cannabis products for any condition where they believe a therapeutic benefit exists. No specialist requirement. Medsafe-approved products follow standard prescribing, while unapproved products require prescriber attestation. The barrier to prescribing is low.',
'New Zealand has developed a domestic medical cannabis industry with multiple licensed cultivators, manufacturers, and importers. The market is valued in the tens of millions of NZD annually. Several New Zealand companies export to Australia and other jurisdictions. International companies including Canadian LPs have established local operations.',
'New Zealand''s medical cannabis market is maturing. Further regulatory refinements are expected. Adult-use legalization may return as a policy debate as Australian reforms demonstrate regional precedents. Pharmac reimbursement discussion is expected to intensify.',
'Medsafe (Ministry of Health) regulates medical cannabis products, standards, and licensing. Ministry of Health issues cultivation and manufacturing licenses. New Zealand Police handles enforcement.',
'Misuse of Drugs (Medicinal Cannabis) Amendment Act 2018; Medsafe product register; Ministry of Health licensing data; 2020 referendum results','Current as of Q2 2026; verified against Medsafe official guidance','Quarterly','Full country-level briefing covering medical scheme, domestic industry, referendum outcome, and future outlook',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='NZ' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'nauru','country','NR','Prohibited',
'Cannabis is prohibited in Nauru. There is no medical cannabis program. As a tiny Pacific island nation with a population of approximately 10,000, Nauru''s drug enforcement is primarily focused on importation prevention. No reform movement is evident.',
'No legal patient access pathway exists.',
'Nauru physicians cannot prescribe cannabis under the existing legal framework.',
'No licensed cannabis market exists in this micro-state.',
'No reform is anticipated. Nauru follows regional Pacific enforcement norms.',
'Nauru Police Force handles enforcement. Nauru Department of Health oversees pharmaceutical regulation.',
'Nauru drug control legislation; Pacific Islands Forum drug policy monitoring','Current as of Q2 2026','Annual','Country-level briefing noting prohibition in micro-state Pacific context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='NR' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'palau','country','PW','Prohibited',
'Cannabis is prohibited in Palau under the Palau National Code and related drug control legislation. There is no medical cannabis program. Palau''s Compact of Free Association with the United States influences its legal framework. Palau is notable for its strong environmental protection policies but has not engaged with cannabis reform.',
'No legal patient access pathway exists. Cannabis-based medicines are unavailable through official Palauan healthcare channels.',
'Palauan physicians cannot prescribe cannabis under the existing legal framework.',
'No licensed cannabis market exists in this small Pacific island nation.',
'No reform is anticipated. Palau''s relationship with the United States and its small scale limit drug policy independence.',
'Bureau of Public Safety handles drug enforcement. Ministry of Health oversees pharmaceutical regulation.',
'Palau National Code drug provisions; Pacific regional drug monitoring; US Compact of Free Association policy dimensions','Current as of Q2 2026','Annual','Country-level briefing noting prohibition',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='PW' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'papua-new-guinea','country','PG','Prohibited; Hemp Agriculture Interest',
'Cannabis is prohibited in Papua New Guinea under the Dangerous Drugs Act 1952. PNG has some of the weakest drug enforcement capacity in the Pacific due to resource constraints and geographic challenges. Cannabis is widely used informally in many communities. There is growing government and agricultural sector interest in hemp legalization as a cash crop for rural development, but no medical cannabis program exists and formal policy has not advanced.',
'No formal patient access pathway exists. Cannabis-based medicines are not available through official PNG healthcare channels.',
'PNG physicians cannot formally prescribe cannabis under the existing legal framework.',
'No licensed cannabis market exists. The informal market is extensive given enforcement limitations. Agricultural interest in hemp is driven by potential as a rural income source.',
'Reform advocacy, particularly around hemp agriculture, has grown. Medical cannabis may follow hemp legalization if PNG pursues an agricultural development pathway. No imminent legislative action is confirmed.',
'Papua New Guinea Police Force (RPNGC) handles drug enforcement. Department of Health oversees pharmaceutical regulation.',
'PNG Dangerous Drugs Act 1952; agricultural development policy documents; Pacific regional drug monitoring','Current as of Q2 2026','Annual','Country-level briefing noting prohibition with emerging hemp agriculture interest',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='PG' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'philippines','country','PH','Prohibited; Medical Bill Pending',
'Cannabis is strictly prohibited in the Philippines under Republic Act 9165 (Comprehensive Dangerous Drugs Act of 2002). The country''s drug enforcement under the Duterte administration (2016–2022) was marked by an extremely violent war on drugs. The Marcos Jr. administration has maintained prohibition while being slightly less aggressive on extrajudicial enforcement. A medical cannabis bill has been introduced in Congress multiple times and has gained traction, though no law has been enacted as of Q2 2026.',
'No legal patient access pathway exists. Cannabis-based medicines are not available through official Philippine healthcare channels despite growing legislative advocacy.',
'Philippine physicians cannot formally prescribe cannabis under RA 9165. Medical associations have begun supporting the pending medical cannabis legislation.',
'No licensed cannabis market exists. The informal market exists despite severe enforcement. Political dynamics suggest medical access may eventually be legislated.',
'Medical cannabis legalization in the Philippines is increasingly likely given legislative progress. A medical cannabis bill passed committee review in the previous Congress and is expected to be re-introduced. Adult-use legalization remains politically impossible given the country''s drug war context.',
'Philippine Drug Enforcement Agency (PDEA) handles drug enforcement. Food and Drug Administration (FDA Philippines) oversees pharmaceutical regulation.',
'Philippines RA 9165; PDEA enforcement data; medical cannabis bill legislative history; FDA Philippines pharmaceutical registry','Current as of Q2 2026','Quarterly','Country-level briefing noting strict prohibition with advancing medical cannabis legislation',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='PH' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'samoa','country','WS','Prohibited',
'Cannabis is prohibited in Samoa under the Narcotics Act 1967 and related legislation. There is no medical cannabis program. Samoa''s drug enforcement is primarily focused on methamphetamine, which has become a significant social problem, but cannabis remains prohibited.',
'No legal patient access pathway exists. Cannabis-based medicines are unavailable through official Samoan healthcare channels.',
'Samoan physicians cannot prescribe cannabis under the existing legal framework.',
'No licensed cannabis market exists. Cannabis use exists informally but enforcement focuses increasingly on methamphetamine.',
'No reform is anticipated. Samoa''s drug policy priorities focus on methamphetamine, though cannabis law remains unchanged.',
'Samoa Police Service handles drug enforcement. Ministry of Health oversees pharmaceutical regulation.',
'Samoa Narcotics Act 1967; Pacific regional drug monitoring; Ministry of Health pharmaceutical policy','Current as of Q2 2026','Annual','Country-level briefing noting prohibition',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='WS' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'singapore','country','SG','Prohibited; Death Penalty for Trafficking; Zero Tolerance',
'Singapore maintains one of the world''s most absolute zero-tolerance drug policies under the Misuse of Drugs Act (MDA). Trafficking in cannabis above 500 grams (cannabis resin above 200 grams) carries a mandatory death penalty. Singapore has executed individuals for cannabis trafficking. There is no medical cannabis program, no decriminalization, and no tolerance for any cannabis consumption. Singapore''s drug policy is a deliberately maintained social control mechanism and source of national identity differentiation.',
'No legal patient access exists. Even internationally licensed CBD products are classified as controlled substances in Singapore. Cannabis-based medicines are unavailable through any official channel.',
'Singapore physicians cannot prescribe cannabis under any circumstances. The HSA has not approved any cannabis-derived pharmaceutical product.',
'No licensed cannabis market exists. Singapore''s enforcement is among the most aggressive globally, with airport and border controls designed to eliminate any cannabis entry.',
'No reform is possible or anticipated. Singapore''s government has consistently and explicitly defended its death penalty for drug trafficking and zero-tolerance approach as a deliberate policy choice, and public political consensus supports this position.',
'Central Narcotics Bureau (CNB) under the Ministry of Home Affairs handles all drug enforcement. Health Sciences Authority (HSA) oversees pharmaceutical regulation.',
'Singapore Misuse of Drugs Act; CNB enforcement data; MDA mandatory minimum sentencing; UN Special Rapporteur reports on drug-related executions','Current as of Q2 2026','Annual','Country-level briefing noting absolute zero-tolerance with death penalty provisions',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='SG' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'solomon-islands','country','SB','Prohibited',
'Cannabis is prohibited in the Solomon Islands under the Dangerous Drugs Act 1990. There is no medical cannabis program. The country faces significant governance challenges, and drug enforcement capacity is limited. Cannabis is cultivated informally in some rural areas.',
'No legal patient access pathway exists. Cannabis-based medicines are unavailable through official Solomon Islands healthcare channels.',
'Solomon Islands physicians cannot prescribe cannabis under the existing legal framework.',
'No licensed cannabis market exists. Informal cultivation and use occurs particularly in rural areas with limited enforcement reach.',
'No reform is anticipated. The Solomon Islands'' limited governance capacity and immediate development priorities take precedence over drug policy reform.',
'Royal Solomon Islands Police Force handles drug enforcement. Ministry of Health oversees pharmaceutical regulation.',
'Solomon Islands Dangerous Drugs Act 1990; Pacific regional drug monitoring; Ministry of Health pharmaceutical policy','Current as of Q2 2026','Annual','Country-level briefing noting prohibition with limited enforcement capacity context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='SB' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'sri-lanka','country','LK','Prohibited; Hemp Reform Discussions',
'Cannabis (ganja) is prohibited in Sri Lanka under the Poisons, Opium and Dangerous Drugs Ordinance (PODDO) 1929, as amended. Sri Lanka has a tradition of cannabis use, particularly in Ayurvedic medicine contexts. The government has periodically considered hemp and medical cannabis reform, including a 2018 government announcement of potential reform that did not advance to legislation. Cannabis prohibition enforcement has been inconsistent.',
'No formal medical patient access exists. Ayurvedic practitioners may use certain cannabis preparations within traditional medicine frameworks, but modern medical prescribing is not possible.',
'Sri Lankan physicians cannot formally prescribe cannabis under the PODDO framework. Ayurvedic practitioners operate under separate regulations that have some traditional herb provisions.',
'No licensed modern cannabis market exists. Traditional use within Ayurvedic medicine creates a gray area. Industrial hemp agriculture has been discussed as a potential agricultural development opportunity.',
'The Sri Lankan government has shown periodic interest in hemp legalization for agricultural development. Medical cannabis reform discussions have occurred but not advanced. The post-economic-crisis development priorities may create space for hemp agriculture policy.',
'National Dangerous Drugs Control Board (NDDCB) under the Ministry of Justice handles drug policy. Sri Lanka Medical Council and Ministry of Health oversee pharmaceutical regulation.',
'Sri Lanka PODDO 1929 and amendments; NDDCB policy documents; Ayurvedic Drugs Corporation guidelines; reform advocacy records','Current as of Q2 2026','Annual','Country-level briefing noting prohibition with traditional Ayurvedic medicine context and hemp reform discussions',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='LK' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'taiwan','country','TW','Prohibited; CBD Gray Area',
'Cannabis is prohibited in Taiwan under the Narcotics Hazard Prevention Act, where it is classified as a Schedule 2 controlled substance. Taiwan has no medical cannabis program, and enforcement is strictly applied. CBD products occupy a complex legal space — while hemp-derived CBD with low THC is not explicitly prohibited in all forms, its legal status is uncertain and many products have been removed from sale. There is legislative and industry interest in clarifying the hemp/CBD regulatory space.',
'No formal medical patient access exists. Cannabis-derived pharmaceuticals including Epidiolex are not approved in Taiwan.',
'Taiwan physicians cannot prescribe cannabis or cannabis-derived products under the current framework.',
'No licensed cannabis market exists. CBD product market development has been halted pending regulatory clarification. Taiwan''s pharmaceutical industry has expressed interest in cannabis research.',
'Taiwan may develop a clearer hemp/CBD regulatory framework over 2025–2027. Medical cannabis legalization faces significant resistance but may follow regional Asian trends as South Korea and Japan develop their programs.',
'Ministry of Justice Investigation Bureau (MJIB) handles drug enforcement. Taiwan FDA (TFDA) oversees pharmaceutical regulation. Ministry of Health and Welfare (MOHW) sets health policy.',
'Taiwan Narcotics Hazard Prevention Act; TFDA regulatory guidance on CBD; MOHW pharmaceutical policy','Current as of Q2 2026','Quarterly','Country-level briefing noting prohibition with CBD regulatory gray area and emerging reform discussion',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='TW' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'timor-leste','country','TL','Prohibited',
'Cannabis is prohibited in Timor-Leste under the Law on Narcotic Drugs, Psychotropic Substances and Precursors. The country, one of Southeast Asia''s newest nations, has limited governance capacity, and drug enforcement is primarily focused on preventing importation from neighboring Indonesia. There is no medical cannabis program.',
'No legal patient access pathway exists. Cannabis-based medicines are unavailable through official Timorese healthcare channels.',
'Timorese physicians cannot prescribe cannabis under the existing legal framework.',
'No licensed cannabis market exists. Limited enforcement capacity means informal use may be present, but no commercial market has developed.',
'No reform is anticipated given Timor-Leste''s development priorities and governance capacity constraints.',
'Polícia Nacional de Timor-Leste (PNTL) handles drug enforcement. Ministry of Health oversees pharmaceutical regulation.',
'Timor-Leste narcotic drugs legislation; Ministry of Health pharmaceutical policy; Pacific/ASEAN drug monitoring','Current as of Q2 2026','Annual','Country-level briefing noting prohibition in nascent governance context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='TL' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'tuvalu','country','TV','Prohibited',
'Cannabis is prohibited in Tuvalu. There is no medical cannabis program. As one of the world''s smallest nations by population (approximately 11,000 people), Tuvalu''s drug policy concerns are primarily focused on preventing substance importation. Climate change and sea level rise dominate national policy priorities.',
'No legal patient access pathway exists.',
'Tuvalu physicians cannot prescribe cannabis under the existing legal framework.',
'No licensed cannabis market exists in this micro-state.',
'No reform is anticipated. Tuvalu follows regional Pacific enforcement norms with climate resilience as the dominant policy priority.',
'Tuvalu Police Service handles law enforcement including drug enforcement. Ministry of Health oversees pharmaceutical regulation.',
'Tuvalu drug control legislation; Pacific Islands Forum drug policy monitoring','Current as of Q2 2026','Annual','Country-level briefing noting prohibition in micro-state Pacific context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='TV' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'vietnam','country','VN','Prohibited; Severe Penalties',
'Cannabis is strictly prohibited in Vietnam under the Law on Narcotic Drugs 2000 (amended 2008). Trafficking above certain quantities carries the death penalty. Vietnam''s drug enforcement has traditionally been severe, though there has been policy emphasis on drug treatment alongside enforcement in recent years. There is no medical cannabis program. Hemp cultivation for industrial purposes has been under exploratory discussion but no framework has been enacted.',
'No legal patient access pathway exists. Cannabis-based medicines are unavailable through official Vietnamese healthcare channels.',
'Vietnamese physicians cannot prescribe cannabis under the existing legal framework.',
'No licensed cannabis market exists. Vietnam''s drug enforcement is strict. Some interest in industrial hemp agriculture has emerged from government and agricultural stakeholders.',
'No medical cannabis reform is anticipated in the near term. Some industrial hemp agricultural policy development is possible over 2025–2028 if government interest translates to legislation.',
'Ministry of Public Security handles drug enforcement. Ministry of Health and Drug Administration of Vietnam (DAV) oversee pharmaceutical regulation.',
'Vietnam Law on Narcotic Drugs 2000/2008; Ministry of Public Security enforcement data; DAV pharmaceutical registry','Current as of Q2 2026','Annual','Country-level briefing noting severe prohibition with emerging hemp agriculture interest',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='VN' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'vanuatu','country','VU','Prohibited; Cannabis Tourism Interest',
'Cannabis is prohibited in Vanuatu under the Dangerous Drugs Control Act 1987. However, Vanuatu has emerged as a notable case in Pacific drug policy discussions, with some political figures advocating for cannabis tourism as an economic development strategy given the country''s reputation for adventure tourism. No formal legalization has occurred, and enforcement capacity is limited.',
'No legal patient access pathway exists. Cannabis-based medicines are unavailable through official Vanuatu healthcare channels.',
'Vanuatu physicians cannot prescribe cannabis under the existing legal framework.',
'No licensed cannabis market exists. Limited enforcement capacity means informal use is widespread. Cannabis tourism advocacy has been raised by some politicians as an economic opportunity.',
'Cannabis tourism and potential legalization remain under political discussion in Vanuatu. Pacific regional reform trends and economic development pressures may produce policy change over the medium term (2026–2029).',
'Vanuatu Police Force handles drug enforcement. Ministry of Health oversees pharmaceutical regulation.',
'Vanuatu Dangerous Drugs Control Act 1987; Pacific Islands Forum drug monitoring; cannabis tourism policy advocacy documentation','Current as of Q2 2026','Annual','Country-level briefing noting prohibition with emerging cannabis tourism policy debate',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='VU' AND jurisdiction_type='country');
