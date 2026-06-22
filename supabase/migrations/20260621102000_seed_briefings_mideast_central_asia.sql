-- Seed country-level cannabis regulatory briefings: Middle East & Central Asia
-- Countries: AF, AM, AZ, BH, GE, IR, IQ, JO, KZ, KW, KG, LB, OM, PK, PS, QA, SA, SY, TJ, TM, UZ, YE, AE

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'afghanistan','country','AF','Prohibited',
'Cannabis is prohibited under Afghan law and under Taliban governance reinstated since 2021, which enforces strict prohibition across all drug categories including cannabis. Prior to 2021, Afghanistan was paradoxically one of the world''s largest illicit cannabis resin (hashish) producers, but the Taliban has publicly committed to eradicating cultivation, though enforcement varies by region.',
'No legal patient access pathway exists. Medical cannabis or cannabis-derived pharmaceuticals are not available through official channels.',
'Afghan physicians cannot prescribe cannabis as no regulatory pathway exists. Medical use is outside the legal framework.',
'The informal cannabis economy, particularly hashish production in northern provinces, historically generated significant agricultural income. Taliban enforcement has curtailed formal cultivation but informal production continues in some areas. No licensed commercial market exists.',
'No regulatory reform is anticipated under current Taliban governance. The international isolation of Afghanistan further limits policy development aligned with global medical cannabis trends.',
'The Taliban''s Ministry of Interior and Ministry of Public Health oversee drug policy enforcement.',
'UN ONODC Afghanistan country reports; Taliban drug enforcement decrees; regional security assessments','Current as of Q2 2026; limited official data due to governance context','Annual','Country-level briefing noting prohibition under Taliban governance and informal hashish production history',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='AF' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'armenia','country','AM','Prohibited; Decriminalization Debate',
'Cannabis is illegal in Armenia under the Law on Narcotic Drugs and Psychotropic Substances. Possession of small amounts may be addressed administratively rather than criminally in practice, but no formal decriminalization framework exists. There is no medical cannabis program. Civil society advocacy for reform has been growing, particularly following regional neighbors'' policy discussions.',
'No legal patient access pathway exists. Patients cannot obtain cannabis-based medicines through official Armenian healthcare channels.',
'Armenian physicians cannot prescribe cannabis. No regulatory framework for medical cannabis prescription exists.',
'No licensed cannabis market exists. Armenia''s informal cannabis use is present in urban areas. Geographic proximity to Georgia, which has a more permissive legal environment, influences cross-border dynamics.',
'Reform advocacy is increasing but no imminent legislative action is expected. Regional developments in Georgia and potential EU accession discussions may influence future policy direction.',
'Ministry of Health and the Police of the Republic of Armenia handle drug enforcement and health policy.',
'Armenian Law on Narcotic Drugs; Ministry of Health pharmaceutical registry; regional policy monitoring','Current as of Q2 2026','Annual','Country-level briefing covering prohibition status and emerging reform debate',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='AM' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'azerbaijan','country','AZ','Prohibited',
'Cannabis is strictly prohibited in Azerbaijan under the Law on Narcotic Drugs, Psychotropic Substances, and Precursors. Penalties for drug offenses are severe, including lengthy imprisonment. There is no medical cannabis program and no decriminalization framework. Azerbaijan''s position as a transit country for drug trafficking from Afghanistan through the South Caucasus shapes its enforcement priorities.',
'No legal patient access exists. Cannabis-based pharmaceuticals are not available through official channels.',
'Azerbaijani physicians cannot prescribe cannabis under the existing legal framework.',
'No licensed cannabis market exists. Azerbaijan''s drug policy focuses heavily on enforcement given its transit country status.',
'No reform is anticipated. Azerbaijan''s government has maintained a firm prohibition stance aligned with its broader drug enforcement priorities.',
'Ministry of Internal Affairs and the State Customs Committee handle drug enforcement. Ministry of Health oversees pharmaceutical policy.',
'Azerbaijan Law on Narcotic Drugs; UNODC South Caucasus monitoring; Ministry of Internal Affairs enforcement data','Current as of Q2 2026','Annual','Country-level briefing noting strict prohibition and transit country enforcement context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='AZ' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'bahrain','country','BH','Prohibited; Severe Penalties',
'Cannabis is strictly prohibited in Bahrain under Law No. 15 of 2007 on Combating Narcotics and Psychotropic Substances. Penalties include imprisonment of up to 15 years for trafficking and significant terms for possession. There is no medical cannabis program. Bahrain''s drug laws reflect the broader Gulf Cooperation Council consensus on strict drug prohibition.',
'No legal patient access pathway exists. Cannabis-based medicines are not available through Bahraini healthcare channels.',
'Bahraini physicians cannot prescribe cannabis. No medical cannabis regulatory framework exists.',
'No licensed cannabis market exists. Bahrain enforces strict drug prohibition aligned with GCC standards.',
'No reform is anticipated in the near term. Bahrain''s legal framework reflects GCC regional consensus on strict prohibition, with no political appetite for change visible.',
'Ministry of Interior and the National Committee for Combating Drugs handle enforcement. Ministry of Health oversees pharmaceutical regulation.',
'Bahrain Law No. 15/2007; GCC drug policy coordination frameworks; Ministry of Interior enforcement data','Current as of Q2 2026','Annual','Country-level briefing noting strict prohibition aligned with GCC standards',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='BH' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'georgia','country','GE','Decriminalized (Personal Use); No Medical Program',
'Georgia has a unique legal landscape for cannabis in the South Caucasus. A 2018 Constitutional Court ruling decriminalized personal possession and use of cannabis, following an earlier ruling in 2017. However, cultivation and sale remain illegal, and Parliament has not enacted a comprehensive medical or adult-use framework. The decriminalization is court-established rather than legislative.',
'No formal medical patient access pathway exists. Patients cannot obtain licensed cannabis medicines through Georgian healthcare channels despite the decriminalization of personal use.',
'Georgian physicians cannot formally prescribe cannabis. No medical regulatory framework exists.',
'The informal cannabis market operates given personal use decriminalization, but no licensed commercial sector exists. Georgia''s agricultural sector has expressed interest in industrial hemp, which has some separate regulatory provisions.',
'The Constitutional Court rulings have created an unusual decriminalization framework, but legislative follow-through for medical or commercial frameworks has been slow. EU association agreement dynamics may influence future policy.',
'Ministry of Internal Affairs handles drug enforcement within the Constitutional Court framework. Ministry of Health oversees pharmaceutical regulation.',
'Georgian Constitutional Court rulings (2017, 2018); Ministry of Justice drug policy analysis; EU Association Agreement monitoring','Current as of Q2 2026','Quarterly','Country-level briefing covering Constitutional Court decriminalization and absence of medical framework',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='GE' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'iran','country','IR','Prohibited; Death Penalty for Trafficking',
'Cannabis is prohibited in Iran under the Anti-Narcotics Law. Trafficking in cannabis above specified thresholds can carry the death penalty under Iranian law. Simple possession carries imprisonment and potential flogging. There is no medical cannabis program. Iran is a significant country for drug transit from Afghanistan, and drug enforcement is a major state activity.',
'No legal patient access pathway exists. Cannabis-based medicines are not available through official Iranian healthcare channels.',
'Iranian physicians cannot prescribe cannabis under the existing legal framework. No medical cannabis regulatory pathway exists.',
'No licensed cannabis market exists. Iran''s informal cannabis use exists despite severe penalties. The country''s position on Afghan drug trafficking routes creates significant enforcement challenges.',
'No reform is expected under current Iranian governance. The Islamic Republic''s drug policy is informed by religious law and national security priorities, making cannabis liberalization politically implausible in the near term.',
'The Drug Control Headquarters (DCHQ) under the President''s Office coordinates national drug policy. The Judiciary enforces criminal drug laws.',
'Iranian Anti-Narcotics Law; UNODC Iran country reports; Human Rights Watch drug enforcement documentation','Current as of Q2 2026','Annual','Country-level briefing noting prohibition with death penalty provisions and enforcement context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='IR' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'iraq','country','IQ','Prohibited',
'Cannabis is prohibited in Iraq under the Combating Narcotic Drugs and Psychotropic Substances Law No. 50 of 2017. Penalties include imprisonment and fines. There is no medical cannabis program. Iraq''s drug policy environment is shaped by political instability, sectarian governance challenges, and proximity to Iran and Afghanistan as major drug supply sources.',
'No legal patient access exists. Cannabis-based medicines are unavailable through official Iraqi healthcare channels.',
'Iraqi physicians cannot prescribe cannabis. No regulatory framework for medical cannabis exists.',
'No licensed cannabis market exists. Informal markets operate in major urban areas. Political instability and governance fragmentation complicate consistent enforcement across all regions.',
'No reform is expected in the near term given Iraq''s political priorities and security challenges. The Kurdistan Regional Government may have slightly different enforcement priorities but maintains formal prohibition.',
'Ministry of Health enforces pharmaceutical regulation. Ministry of Interior and federal police handle drug enforcement.',
'Iraq Law No. 50/2017; UNODC Iraq country assessments; Kurdistan Regional Government drug policy documentation','Current as of Q2 2026','Annual','Country-level briefing noting prohibition status in context of regional instability',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='IQ' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'jordan','country','JO','Prohibited',
'Cannabis is prohibited in Jordan under the Narcotic Drugs and Psychotropic Substances Law No. 11 of 1988 and its amendments. Penalties are significant, including imprisonment. There is no medical cannabis program. Jordan has been an active participant in international drug control treaty enforcement and maintains a conservative drug policy aligned with its neighboring Gulf states.',
'No legal patient access pathway exists. Cannabis-based pharmaceuticals are unavailable through Jordanian healthcare channels.',
'Jordanian physicians cannot prescribe cannabis. No medical cannabis regulatory framework exists.',
'No licensed cannabis market exists. Jordan enforces drug prohibition consistently. Proximity to Lebanon and Syria, which have illicit supply chains, creates cross-border enforcement challenges.',
'No reform is anticipated in the near term. Jordan''s conservative political environment and regional alignment with GCC drug enforcement norms make cannabis liberalization unlikely.',
'Jordan Food and Drug Administration (JFDA) oversees pharmaceutical regulation. Public Security Directorate handles drug enforcement.',
'Jordan Law No. 11/1988 and amendments; JFDA regulatory guidance; UNODC Middle East monitoring','Current as of Q2 2026','Annual','Country-level briefing noting prohibition aligned with regional enforcement norms',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='JO' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'kazakhstan','country','KZ','Prohibited',
'Cannabis is prohibited in Kazakhstan under the Code on Administrative Offenses and the Criminal Code. Possession of small amounts may be an administrative rather than criminal offense, but cultivation and supply carry criminal penalties. There is no medical cannabis program. Kazakhstan is an important country for drug transit from Afghanistan northward into Russia and Europe.',
'No formal patient access pathway exists. Cannabis-based medicines are not available through official Kazakhstani healthcare channels.',
'Kazakhstani physicians cannot prescribe cannabis under the existing legal framework.',
'No licensed cannabis market exists. Kazakhstan enforces drug prohibition with significant law enforcement resources given its transit country challenges.',
'No reform is anticipated under current Kazakhstani governance. The government''s drug policy is shaped by security considerations linked to Afghanistan-originated trafficking routes.',
'Ministry of Internal Affairs handles drug enforcement. Ministry of Health oversees pharmaceutical regulation.',
'Kazakhstan Criminal Code; Administrative Code; UNODC Central Asia drug monitoring; Ministry of Internal Affairs enforcement data','Current as of Q2 2026','Annual','Country-level briefing noting prohibition and transit country enforcement context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='KZ' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'kuwait','country','KW','Prohibited; Severe Penalties',
'Cannabis is strictly prohibited in Kuwait under Law No. 74 of 1983 on Combating Narcotics and Psychotropic Substances. Penalties are among the strictest in the Gulf region, including lengthy imprisonment for possession and trafficking, with potential death penalty for large-scale trafficking. There is no medical cannabis program. Kuwait maintains one of the most conservative drug enforcement postures in the GCC.',
'No legal patient access exists. Cannabis-based medicines are unavailable through official Kuwaiti healthcare channels.',
'Kuwaiti physicians cannot prescribe cannabis under the existing legal framework.',
'No licensed cannabis market exists. Kuwait''s enforcement posture is strict, with zero tolerance reflected in sentencing guidelines.',
'No reform is anticipated. Kuwait''s legal framework reflects its conservative political environment and GCC regional drug policy consensus.',
'Ministry of Interior and the Anti-Narcotics Agency handle drug enforcement. Ministry of Health oversees pharmaceutical regulation.',
'Kuwait Law No. 74/1983; Ministry of Interior drug enforcement data; GCC drug policy frameworks','Current as of Q2 2026','Annual','Country-level briefing noting severe prohibition consistent with GCC standards',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='KW' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'kyrgyzstan','country','KG','Prohibited',
'Cannabis is prohibited in Kyrgyzstan under the Criminal Code and related narcotic substances legislation. Kyrgyzstan has historically been noted for wild-growing cannabis in the Chuy Valley, which has been an informal source for Central Asian markets, but the government maintains formal prohibition. There is no medical cannabis program.',
'No legal patient access pathway exists. Cannabis-based pharmaceuticals are not available through official healthcare channels.',
'Kyrgyz physicians cannot prescribe cannabis under the existing legal framework.',
'No licensed cannabis market exists. The informal market related to wild-growing cannabis in the Chuy Valley has historically been significant, but formal enforcement maintains prohibition.',
'No reform is anticipated under current governance. Kyrgyzstan''s drug policy is influenced by its CSTO membership and alignment with Russian drug enforcement norms.',
'State Service for Drug Control (GKNN) handles drug enforcement. Ministry of Health oversees pharmaceutical regulation.',
'Kyrgyz Criminal Code; UNODC Central Asia drug monitoring; State Service for Drug Control reports','Current as of Q2 2026','Annual','Country-level briefing noting prohibition and informal cannabis cultivation history',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='KG' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'lebanon','country','LB','Medical Legal (First Arab Nation); Decriminalized',
'Lebanon made history in 2020 as the first Arab country to legalize medical cannabis cultivation, through Law 178 of 2020. The law legalizes cannabis cultivation for medical and industrial purposes under a licensing system. Personal possession of small amounts has been effectively decriminalized through prosecutorial discretion. Lebanon''s economic crisis has made agricultural cannabis a potential export revenue source, and the regulatory framework is being developed amid significant national challenges.',
'Patients can theoretically access medical cannabis through licensed medical channels, but implementation has been challenged by Lebanon''s economic and political crises. Imported CBD products have been available in some urban pharmacies.',
'Lebanese physicians registered with the Order of Physicians may recommend medical cannabis within the Law 178 framework. The formal prescription pathway is still being operationalized given implementation delays.',
'Lebanon''s economic devastation has paradoxically made cannabis agriculture attractive as a foreign currency earner. Several licensed cultivation operations have been established in the Bekaa Valley, Lebanon''s traditional cannabis-growing region. Export licenses for medical products are being developed.',
'Law 178/2020 implementation continues slowly given Lebanon''s political and economic paralysis. The potential for cannabis exports to generate foreign currency is a significant policy driver. Full commercial framework development is expected to continue through 2026–2027.',
'Ministry of Agriculture issues cultivation licenses under Law 178. Ministry of Public Health (MOPH) oversees medical product regulation. The Drug Enforcement Agency handles enforcement.',
'Lebanon Law 178/2020; Ministry of Agriculture licensing data; Order of Physicians guidance; MOPH pharmaceutical registry','Current as of Q2 2026','Quarterly','Country-level briefing covering landmark medical legalization as first Arab nation and implementation status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='LB' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'oman','country','OM','Prohibited; Severe Penalties',
'Cannabis is strictly prohibited in Oman under the Law on Combating Narcotic Drugs and Psychotropic Substances (Royal Decree 17/1999 and amendments). Penalties include lengthy imprisonment; trafficking can carry life imprisonment or death penalty in aggravated cases. There is no medical cannabis program. Oman maintains strict drug prohibition consistent with GCC norms.',
'No legal patient access pathway exists. Cannabis-based medicines are unavailable through official Omani healthcare channels.',
'Omani physicians cannot prescribe cannabis under the existing legal framework.',
'No licensed cannabis market exists. Oman enforces strict drug prohibition, and geographic position as a Gulf entry point shapes enforcement priorities.',
'No reform is anticipated. Oman''s drug policy reflects GCC regional consensus and conservative political values.',
'Royal Oman Police handles drug enforcement. Ministry of Health oversees pharmaceutical regulation.',
'Oman Royal Decree 17/1999 and amendments; Royal Oman Police drug enforcement data; GCC drug control frameworks','Current as of Q2 2026','Annual','Country-level briefing noting strict prohibition consistent with GCC standards',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='OM' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'pakistan','country','PK','Prohibited; Hemp Regulatory Development',
'Cannabis is prohibited in Pakistan under the Control of Narcotic Substances Act 1997. Penalties are severe for trafficking but personal use enforcement varies in practice. Pakistan has no medical cannabis program. However, Pakistan has significant informal cannabis cultivation, particularly in the Khyber Pakhtunkhwa province and tribal areas. A hemp regulatory framework has been under discussion given Pakistan''s agricultural potential.',
'No formal patient access pathway exists. Cannabis-based medicines are not available through official Pakistani healthcare channels.',
'Pakistani physicians cannot formally prescribe cannabis under the existing legal framework.',
'Pakistan has traditionally been one of the world''s significant informal cannabis producing countries, particularly for hashish (charas). No licensed commercial market exists. Hemp regulatory discussions have progressed slowly.',
'Pakistan''s government has shown some interest in hemp legalization for agricultural and industrial purposes but no comprehensive reform has advanced. Medical cannabis legalization is not on the near-term agenda.',
'Drug Regulatory Authority of Pakistan (DRAP) oversees pharmaceutical regulation. Anti-Narcotics Force (ANF) handles drug enforcement.',
'Pakistan Control of Narcotic Substances Act 1997; DRAP pharmaceutical registry; ANF enforcement data; UNODC Pakistan monitoring','Current as of Q2 2026','Annual','Country-level briefing noting prohibition with hemp development discussions',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='PK' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'palestine','country','PS','Prohibited',
'Cannabis is prohibited under Palestinian Authority law in the West Bank and under Hamas governance in Gaza. Palestinian Authority law generally follows Jordanian legal precedents from the pre-1967 era, supplemented by PA legislation. There is no medical cannabis program. The geopolitical situation creates significant complexity for regulatory development.',
'No legal patient access exists. Cannabis-based pharmaceuticals are not available through official Palestinian healthcare channels.',
'Palestinian physicians cannot formally prescribe cannabis under the existing legal framework.',
'No licensed cannabis market exists. The geopolitical fragmentation between West Bank (PA) and Gaza (Hamas) creates different enforcement environments but both maintain formal prohibition.',
'No reform is anticipated given the ongoing political and security situation. Cannabis regulatory development is far outside current Palestinian governance priorities.',
'Palestinian Authority Ministry of Health and the Palestinian Preventive Security Service handle health regulation and drug enforcement respectively in the West Bank.',
'Palestinian Authority drug control legislation; WHO Palestinian health system reports; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibition in context of complex governance situation',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='PS' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'qatar','country','QA','Prohibited; Severe Penalties',
'Cannabis is strictly prohibited in Qatar under Law No. 4 of 2009 on Combating Narcotics and Psychotropic Substances. Qatar enforces some of the strictest drug laws in the region, with significant prison terms for possession and trafficking. There is no medical cannabis program. Qatar''s high-profile international events and expatriate population have not led to any policy liberalization.',
'No legal patient access pathway exists. Cannabis-based medicines are unavailable through official Qatari healthcare channels.',
'Qatari physicians cannot prescribe cannabis under the existing legal framework.',
'No licensed cannabis market exists. Qatar enforces strict drug prohibition. Expatriates subject to Qatari law face severe consequences for drug offenses.',
'No reform is anticipated. Qatar''s drug policy reflects Islamic law principles and GCC regional consensus. High-profile international attention has not created liberalization momentum.',
'Ministry of Interior handles drug enforcement. Supreme Council of Health oversees pharmaceutical regulation.',
'Qatar Law No. 4/2009; Ministry of Interior enforcement data; GCC drug policy coordination frameworks','Current as of Q2 2026','Annual','Country-level briefing noting severe prohibition and GCC alignment',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='QA' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'saudi-arabia','country','SA','Prohibited; Severe Penalties Including Death',
'Cannabis is prohibited in Saudi Arabia under the Narcotics and Psychotropic Substances Control Law. Drug trafficking, including cannabis trafficking above certain thresholds, can carry the death penalty under Saudi law. Possession carries significant imprisonment and potential corporal punishment. There is no medical cannabis program. Saudi Arabia maintains the strictest drug enforcement regime in the Gulf.',
'No legal patient access exists. Cannabis-based medicines are absolutely unavailable through Saudi healthcare channels.',
'Saudi physicians cannot prescribe cannabis under any circumstances in the current legal framework.',
'No licensed cannabis market exists. Saudi Arabia''s enforcement is among the most stringent in the world, with executions for drug offenses regularly carried out.',
'No reform is anticipated under current governance. Saudi Arabia''s drug policy is rooted in Islamic law interpretation that treats intoxicants as prohibited, and Vision 2030 reforms have not extended to drug policy liberalization.',
'General Directorate of Narcotics Control (GDNC) under the Ministry of Interior handles drug enforcement. Ministry of Health oversees pharmaceutical regulation.',
'Saudi Narcotics Control Law; GDNC enforcement data; UN Special Rapporteur reports on drug-related executions','Current as of Q2 2026','Annual','Country-level briefing noting prohibition with death penalty provisions',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='SA' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'syria','country','SY','Prohibited',
'Cannabis is prohibited in Syria under the Narcotic Drugs and Psychotropic Substances Law. The ongoing civil conflict has significantly disrupted governance and enforcement capacity across much of Syrian territory. Syria has historically been a significant cannabis producer in the Bekaa Valley border region. There is no medical cannabis program under any recognized governing authority.',
'No legal patient access pathway exists under either the Syrian government or opposition-controlled territories.',
'Syrian physicians cannot formally prescribe cannabis under any existing regulatory framework.',
'Syria has been a significant cannabis producing country for regional illicit markets, particularly from the Lebanese border area. No licensed commercial market exists under any recognized authority.',
'Cannabis regulatory reform is not a policy priority given Syria''s ongoing conflict and reconstruction challenges.',
'The Syrian Arab Republic Ministry of Health nominally oversees pharmaceutical regulation in government-controlled areas. Enforcement varies significantly by territorial control.',
'Syrian Narcotic Drugs Law; UNODC Syria conflict-era monitoring; regional trade tracking','Current as of Q2 2026','Annual','Country-level briefing noting prohibition in context of ongoing conflict',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='SY' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'tajikistan','country','TJ','Prohibited; Severe Penalties',
'Cannabis is strictly prohibited in Tajikistan under the Law on Narcotic Drugs, Psychotropic Substances, and Precursors. Penalties are severe given Tajikistan''s position as a major drug transit country for Afghan-produced opiates and cannabis resin moving northward. There is no medical cannabis program. Tajikistan''s drug enforcement is a major national security priority.',
'No legal patient access pathway exists. Cannabis-based medicines are unavailable through official Tajik healthcare channels.',
'Tajik physicians cannot prescribe cannabis under the existing legal framework.',
'No licensed cannabis market exists. Tajikistan''s enforcement challenge is primarily managing transit trafficking rather than domestic production or use.',
'No reform is anticipated. Tajikistan''s drug policy is driven by transit country security concerns and alignment with Russian and CSTO drug enforcement norms.',
'Drug Control Agency under the President of Tajikistan handles national drug enforcement. Ministry of Health oversees pharmaceutical regulation.',
'Tajikistan Law on Narcotic Drugs; Drug Control Agency reports; UNODC Central Asia monitoring','Current as of Q2 2026','Annual','Country-level briefing noting strict prohibition and transit country enforcement priorities',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='TJ' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'turkmenistan','country','TM','Prohibited; Extreme Penalties',
'Cannabis is strictly prohibited in Turkmenistan, one of the world''s most isolated states. Drug trafficking carries extremely severe penalties including lengthy imprisonment. There is no medical cannabis program and no public discourse on reform. Turkmenistan''s closed political system and state-controlled media prevent independent assessment of drug policy enforcement.',
'No legal patient access exists. Cannabis-based medicines are unavailable through official Turkmen healthcare channels.',
'Turkmen physicians cannot prescribe cannabis under any existing legal framework.',
'No licensed cannabis market exists. Turkmenistan''s closed economy prevents any independent commercial activity in this sector.',
'No reform is possible in the near term given Turkmenistan''s highly controlled political environment.',
'Ministry of Internal Affairs handles drug enforcement. Ministry of Health oversees pharmaceutical regulation under state control.',
'Turkmenistan drug control legislation; UNODC Central Asia monitoring (limited data); State-controlled official sources','Current as of Q2 2026','Annual','Country-level briefing noting extreme prohibition in context of highly closed political system',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='TM' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'uzbekistan','country','UZ','Prohibited',
'Cannabis is prohibited in Uzbekistan under the Law on Narcotic Drugs. Uzbekistan has a history of significant cannabis cultivation and is a transit country for Afghan-origin narcotics. The government has maintained strict prohibition while also pursuing agricultural and economic reforms under President Mirziyoyev. There is no medical cannabis program.',
'No legal patient access pathway exists. Cannabis-based medicines are unavailable through official Uzbek healthcare channels.',
'Uzbek physicians cannot prescribe cannabis under the existing legal framework.',
'No licensed cannabis market exists. Uzbekistan''s reform agenda under Mirziyoyev has focused on economic liberalization in other sectors but has not extended to drug policy.',
'No cannabis reform is anticipated in the near term, though Uzbekistan''s broader economic reform trajectory may eventually create space for hemp agricultural policy discussion.',
'Agency for Drug Control under the Cabinet of Ministers handles national drug enforcement. Ministry of Health oversees pharmaceutical regulation.',
'Uzbekistan Law on Narcotic Drugs; Agency for Drug Control reports; UNODC Central Asia monitoring','Current as of Q2 2026','Annual','Country-level briefing noting prohibition with context of ongoing economic reform',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='UZ' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'yemen','country','YE','Prohibited',
'Cannabis is prohibited in Yemen under drug control legislation. The ongoing civil conflict between the Houthi movement and the internationally recognized government has severely fragmented governance and enforcement capacity. There is no medical cannabis program under any recognized authority. Yemen''s humanitarian crisis dominates all policy priorities.',
'No legal patient access pathway exists under any governing authority in Yemen.',
'Yemeni physicians cannot formally prescribe cannabis under any recognized regulatory framework.',
'No licensed cannabis market exists. The conflict economy has disrupted all formal commercial activity. Some informal cannabis use exists in conflict-affected populations.',
'Cannabis regulatory reform is completely outside Yemen''s policy priorities given the ongoing humanitarian emergency and conflict.',
'The internationally recognized Government of Yemen nominally maintains pharmaceutical regulation under the Ministry of Health, though capacity is severely limited by conflict.',
'Yemen drug control legislation; WHO Yemen humanitarian health assessments; UNODC Middle East monitoring','Current as of Q2 2026','Annual','Country-level briefing noting prohibition in context of ongoing humanitarian emergency',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='YE' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'united-arab-emirates','country','AE','Prohibited; Zero Tolerance; Trace Amount Prosecution',
'The United Arab Emirates maintains an extreme zero-tolerance policy toward cannabis under Federal Law No. 14 of 1995 on Narcotics and Psychotropic Substances. The UAE has prosecuted individuals for trace amounts of cannabis detected in blood or urine even when the substance was consumed legally abroad. There is no medical cannabis program. The UAE''s drug policy is one of the most stringent in the world, with minimum 4-year imprisonment for any drug offense.',
'No legal patient access exists. Cannabis-based medicines, including internationally licensed CBD products, are generally not permitted through UAE healthcare channels.',
'UAE physicians cannot prescribe cannabis under any circumstances. Even internationally licensed medical cannabis products are subject to UAE drug laws.',
'No licensed cannabis market exists. The UAE enforces zero-tolerance at airports and borders, making the country one of the most challenging jurisdictions for cannabis patients traveling internationally.',
'No reform is anticipated. The UAE''s drug policy is deeply embedded in its legal system and has not shown any movement toward medical programs. Its role as an international transit hub reinforces strict airport-based enforcement.',
'Ministry of Interior - General Department of Drug Control handles enforcement. Ministry of Health and Prevention oversees pharmaceutical regulation.',
'UAE Federal Law No. 14/1995; Ministry of Interior drug enforcement data; documented cases of trace-amount prosecutions; UNODC UAE reporting','Current as of Q2 2026','Annual','Country-level briefing noting extreme zero-tolerance policy including trace-amount prosecutions',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='AE' AND jurisdiction_type='country');
