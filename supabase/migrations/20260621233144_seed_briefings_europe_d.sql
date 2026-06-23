
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'slovakia','country','SK','Medical — Named Patient Only; CBD Legal',
'Slovakia has a very limited medical cannabis framework. Cannabis-based medicinal products including Sativex may be accessed on a named-patient basis through the State Institute for Drug Control (ŠÚKL). No broad medical cannabis programme exists. Personal cannabis use is prohibited with criminal sanctions. Slovakia is an EU member state and among the more conservative in drug policy. Hemp cultivation is legal under EU rules. Czechia''s developments, given geographic and cultural proximity, are closely observed by Slovak policymakers and patients.',
'Named-patient ŠÚKL authorisation and Sativex specialist prescription are the only access pathways. Patient numbers are negligible. Full out-of-pocket costs apply. Some Slovak patients access cannabis in neighbouring Czechia or Austria.',
'Slovak physicians may apply to ŠÚKL for named-patient cannabis medicine authorisation. No general prescribing right exists. Medical cannabis awareness is low among Slovak practitioners.',
'No commercial medical cannabis market. Hemp cultivation present. CBD retail operates in an ambiguous legal environment. No significant Slovak cannabis production industry.',
'Slovakia may follow EU harmonisation trends toward a more structured medical programme over time. No near-term unilateral reform anticipated. Czechia''s adult-use reform developments are observed with interest.',
'State Institute for Drug Control (ŠÚKL) — sukl.sk; Ministry of Health — health.gov.sk',
'ŠÚKL guidance; EMCDDA Slovakia country report',
'Based on ŠÚKL public guidance and EMCDDA data.',
'Annual','Named-patient access; absence of broad medical programme; Czechia comparison; hemp and CBD status.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='SK' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'slovenia','country','SI','Medical — Prescription Programme; CBD Legal',
'Slovenia permits medical cannabis prescription under the Medicines Act, with oversight by the Agency for Medicinal Products and Medical Devices (JAZMP). Cannabis-based medicines including Sativex are registered. Named-patient access to other preparations is possible. Slovenia has a somewhat more developed medical access framework than some Central European peers, with specialist prescribing rights and an established pharmacy dispensing system. Personal cannabis use is prohibited but Slovenia has had progressive drug policy reform discussions. CBD products are regulated under food law. Hemp cultivation is legal under EU rules.',
'Slovenian patients may access registered cannabis medicines including Sativex through specialist prescription. Named-patient access to other preparations requires JAZMP authorisation. The Health Insurance Institute of Slovenia (ZZZS) has limited reimbursement provisions for specific cannabis medicines. Patient numbers are in the hundreds.',
'Slovenian neurologists and relevant specialists may prescribe registered cannabis medicines. Named-patient authorisation from JAZMP is required for non-registered products. No general GP prescribing right for cannabis. Physician awareness of cannabis medicine options is growing.',
'Slovenia''s medical cannabis market is small. No significant domestic production for medical cannabis. EU-GMP imports from established producers supply the market. CBD retail is established under food law frameworks.',
'Slovenia may expand its medical programme access in alignment with EU trends. A broader prescribing right and expanded indication list are plausible outcomes of EU harmonisation. Adult-use reform is not a near-term political priority.',
'Agency for Medicinal Products and Medical Devices (JAZMP) — jazmp.si; Health Insurance Institute (ZZZS) — zzzs.si',
'JAZMP regulatory guidance; EMCDDA Slovenia country report',
'Based on JAZMP guidance and EMCDDA data.',
'Annual','Medical prescribing framework; JAZMP oversight; ZZZS reimbursement; named-patient pathway; hemp and CBD status.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='SI' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'sweden','country','SE','Medical — Very Limited (Sativex Only); CBD Legal; Reform Debated',
'Sweden maintains one of the most restrictive cannabis environments in Western Europe. The Narcotics Act (Narkotikastrafflagen) prohibits cannabis use, possession, and supply with significant criminal penalties. Sweden is notable for treating cannabis use itself as a criminal offence, unlike most EU peers who have moved toward administrative penalties for personal possession. Sativex is registered by the Medical Products Agency (Läkemedelsverket) and available through specialist prescription for MS-related spasticity, with Försäkringskassan reimbursement under the TLV formulary for qualifying MS patients. Swedish drug policy reform debate is active, with discussions on decriminalisation, but no reform has been enacted. Sweden has a strong emphasis on complete abstinence in its drug policy tradition.',
'Swedish MS patients may access Sativex through neurologist prescription with Försäkringskassan reimbursement under the TLV high-cost protection scheme. Other cannabis medicines are essentially inaccessible without exceptional individual circumstances. Patient numbers for cannabis medicines are very small.',
'Swedish neurologists specialising in MS may prescribe Sativex. Named-patient requests for other cannabis preparations face significant administrative barriers. The Medical Products Agency oversees controlled substance frameworks. Swedish physician culture has been resistant to cannabis prescribing beyond the narrow Sativex indication.',
'Sweden has no commercial medical cannabis market beyond the Sativex prescription segment. CBD products derived from hemp are regulated under food law. No domestic cannabis production for medical purposes. Sweden''s conservative policy has limited market development relative to its population and economic scale.',
'Sweden is likely to remain conservative on cannabis reform in the near term. EU harmonisation and the influence of neighbouring Denmark''s more accessible approach may eventually drive modest expansion. Sativex access for MS will continue as the primary cannabis medicine access point. A decriminalisation debate continues without near-term legislation.',
'Medical Products Agency (Läkemedelsverket) — lakemedelsverket.se; TLV — tlv.se; Försäkringskassan — forsakringskassan.se',
'Läkemedelsverket guidance; TLV formulary data; EMCDDA Sweden country report',
'Based on Läkemedelsverket guidance, TLV data, and EMCDDA reporting.',
'Annual','Sativex MS access and reimbursement; restrictive legal framework; CBD food law status; reform debate; no commercial medical market.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='SE' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'switzerland','country','CH','Medical Legal; Adult-Use Pilot Programmes (From 2025)',
'Switzerland has one of the most innovative cannabis policy environments in Europe, reflecting its tradition of evidence-based public health policy. Medical cannabis has been available through Swissmedic-authorised channels since 2011, with Sativex registered and a broader framework for medical cannabis products established from 2022. Switzerland launched canton-level adult-use cannabis pilot programmes from 2025 under the Federal Law on Research Pilots, with cities including Basel, Bern, Geneva, and Zurich operating or preparing controlled adult-use trials with registered adults using a structured research methodology. Switzerland is not an EU member, but its approach is closely observed by EU states. CBD products with less than 1% THC (higher than the EU 0.2% limit) are legal in Switzerland under hemp product rules, making Switzerland one of Europe''s most mature CBD retail markets.',
'Swiss patients may access Sativex and authorised medical cannabis preparations through physician prescription. Health insurance (Krankenversicherung) provides limited reimbursement for some cannabis medicines under specific conditions. Pilot programme participants receive cannabis products through regulated research channels for adult recreational use.',
'Swiss physicians can prescribe Sativex and authorised medical cannabis preparations under Swissmedic oversight. Pilot programme participants receive cannabis through regulated research channels rather than standard prescription. Swissmedic has issued prescribing guidance for medical applications.',
'Switzerland has a well-developed cannabis market across multiple segments. The CBD/hemp retail market is one of Europe''s most mature, with CBD products sold in pharmacies, supermarkets, and specialty stores. Medical cannabis imports are established. Adult-use pilot programmes are generating significant research data. Several Swiss companies are active in cannabis research and production.',
'Switzerland''s pilot programmes are expected to generate data supporting a permanent adult-use framework within a few years. Swissmedic will likely expand the medical cannabis product list. The 1% THC threshold for hemp gives Switzerland a more flexible CBD framework than most EU states. Swiss pilot programme outcomes will inform EU policy discussions.',
'Swissmedic — swissmedic.ch; Federal Office of Public Health (FOPH/BAG) — bag.admin.ch',
'Swissmedic regulatory guidance; FOPH pilot programme data; Federal Law on Research Pilots; EMCDDA Switzerland country report',
'Based on Swissmedic guidance, FOPH publications, and EMCDDA data. Pilot programme data from published research protocols.',
'Quarterly','Medical legal framework; adult-use pilot programmes; Swissmedic oversight; CBD 1% threshold; health insurance reimbursement; pilot data outcomes.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='CH' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'turkey','country','TR','Prohibited — Hemp Expansion Underway; No Medical Programme',
'Türkiye (Turkey) maintains a broadly prohibitory cannabis framework. Cannabis is a Schedule I drug under Turkish narcotics law, with significant criminal penalties for possession, use, and supply. No general medical cannabis programme exists. However, Türkiye has a long history of hemp (kendir) cultivation, and the government has been progressively expanding licensed hemp cultivation zones since 2018. Industrial hemp cultivation is expanding significantly, driven by government agricultural promotion and export opportunities. Türkiye has identified hemp as a strategic agricultural crop. CBD products derived from very low-THC hemp are increasingly available in a regulated framework controlled by the Tobacco and Alcohol Market Regulatory Authority (TAPDK) and relevant health ministries.',
'No medical cannabis patient access programme exists in Türkiye. Pharmaceutical cannabis preparations are not available through standard healthcare channels. Individual named-patient imports may be possible in exceptional circumstances through the Turkish Medicines and Medical Devices Agency (TMMDA), but this is extremely rare in practice.',
'No cannabis prescribing right exists for Turkish physicians. The healthcare system does not accommodate medical cannabis prescribing under current law.',
'Türkiye''s cannabis-adjacent market is characterised by hemp cultivation expansion. The country has significant agricultural capacity and is developing industrial hemp as an export crop. Several provinces have been designated for hemp cultivation. The domestic market for CBD products is limited by strict THC controls. International cannabis companies cannot operate in Türkiye for medical cannabis production under current law.',
'Türkiye''s trajectory is toward expanding industrial hemp and CBD frameworks rather than medical cannabis. No medical cannabis reform is currently on the official policy agenda. The government''s focus on hemp as an agricultural opportunity distinguishes Türkiye from a near-term medical reform trajectory.',
'Turkish Medicines and Medical Devices Agency (TMMDA) — titck.gov.tr; Ministry of Agriculture and Forestry — tarimorman.gov.tr',
'TMMDA guidance; Turkish agricultural ministry hemp cultivation statistics; EMCDDA Turkey country report',
'Based on TMMDA guidance, EMCDDA data, and Turkish agricultural ministry publications.',
'Annual','Hemp cultivation expansion; absence of medical cannabis programme; CBD framework status; criminal prohibition framework.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='TR' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'ukraine','country','UA','Medical — Reform Advanced (2023); Wartime Implementation',
'Ukraine legalised cannabis for medical purposes in 2023 under legislation passed by the Verkhovna Rada, with emphasis on addressing the healthcare needs of wounded military veterans with chronic pain, PTSD, and trauma-related conditions. Prior to the 2022 full-scale Russian invasion, Ukraine had active parliamentary discussions on cannabis legalisation for medical purposes. The veteran-focused policy rationale garnered broad political support across the spectrum. Implementation of the medical cannabis programme has proceeded under wartime conditions, with supply chains dependent on imports given disruption of domestic agricultural capacity.',
'Ukrainian patients — initially focused on wounded military veterans — are being integrated into the medical cannabis programme. The framework covers chronic pain, PTSD, and trauma-related disorders particularly relevant to the military context, as well as civilian conditions including epilepsy and oncology. Prescriptions are administered through healthcare providers under Ministry of Health guidelines.',
'Ukrainian physicians may prescribe medical cannabis under implementing regulations. Ministry of Health guidelines govern prescribing protocols. Given wartime conditions, implementation has been pragmatic. Specialist involvement in initial prescriptions is expected.',
'The Ukrainian medical cannabis market is in its earliest operational stages. Supply chains are dependent on imports. The post-war reconstruction scenario includes development of domestic cannabis cultivation as an agricultural recovery crop. Ukraine''s substantial agricultural capacity positions it as a potential future cannabis producer.',
'Ukraine''s medical cannabis programme is expected to expand significantly as the country stabilises and post-war reconstruction advances. The veteran-driven policy rationale has broad political support. Ukraine''s EU accession candidacy will drive regulatory alignment with EU standards over time.',
'Ukrainian Ministry of Health — moz.gov.ua; Verkhovna Rada — rada.gov.ua',
'Verkhovna Rada legislative records; Ministry of Health implementing regulations; international press reporting on programme implementation',
'Based on legislative records and Ministry of Health publications. Implementation data is limited due to wartime conditions.',
'Quarterly','Medical legalisation framework; veteran-priority implementation; wartime operational context; EU accession alignment; post-war expansion outlook.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='UA' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'albania','country','AL','Prohibited — No Medical Programme',
'Albania maintains strict cannabis prohibition under the Law on Narcotic and Psychotropic Substances. Cannabis use and possession carry criminal penalties. Albania does not have a medical cannabis programme. Albania is a EU candidate country and a NATO member. The country has historically been a significant source of illicitly produced cannabis supplying European markets — an issue that has drawn major law enforcement attention. Recent government efforts have focused on eradicating illicit cannabis cultivation, particularly in the Lazarat region which was historically a major production area.',
'No legal patient access exists. Patients seeking cannabis-based medicines must access through informal channels or travel to neighbouring countries with programmes (North Macedonia, Serbia, or Greece).',
'No cannabis prescribing right exists for Albanian physicians.',
'No legal cannabis market. Albania''s EU accession process may eventually drive alignment with EU medical cannabis frameworks.',
'EU accession process over the medium to long term is the primary potential driver of reform. No near-term domestic cannabis policy reform is expected. The government''s focus has been on eradicating illicit production rather than establishing licensed frameworks.',
'General Directorate of State Police — policia.gov.al; Ministry of Health — shendetesia.gov.al',
'EMCDDA Albania country report; government communications on illicit cultivation eradication',
'Based on EMCDDA data and legislative review.',
'Annual','Prohibition framework; illicit production history; no medical programme; EU accession context.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='AL' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'andorra','country','AD','Prohibited — No Medical Programme',
'Andorra is a microstate between France and Spain with a strictly prohibitory approach to cannabis. Cannabis use and possession are criminal offences under Andorran law. Andorra has no medical cannabis programme and no industrial hemp framework of significance. Andorra''s proximity to Spain (where cannabis social clubs are tolerated) and France means residents may access cannabis informally through cross-border means, but no domestic legal framework exists. Andorra''s economic relationship with the EU (customs union but not EU member) means pharmaceutical standards align with French or Spanish norms in practice, but no formal cannabis regulatory alignment has been implemented.',
'No legal patient access exists in Andorra. Residents may access cannabis through informal cross-border channels.',
'No cannabis prescribing right exists.',
'No legal cannabis market. Andorra''s primary economic activities are retail tourism and banking.',
'No near-term cannabis reform is anticipated. Any EU-level harmonisation would eventually influence domestic discussions. Andorra''s relationship with France and Spain means developments in those countries shape the context.',
'Ministry of Social Affairs, Justice and Interior (Andorra) — govern.ad',
'Limited available data; EMCDDA peripheral reporting',
'Very limited data available for this microstate.',
'Annual','Prohibition framework; microstate context; no medical programme.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='AD' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'belarus','country','BY','Prohibited — Strict Enforcement',
'Belarus maintains strict cannabis prohibition under the Law on Narcotic Drugs, Psychotropic Substances, and Analogues. Criminal penalties for cannabis possession, use, and supply are severe. Belarus is an authoritarian state with close ties to Russia and has shown no interest in cannabis law reform. No medical cannabis programme exists. Belarus is subject to Western sanctions related to human rights and political repression. Hemp cultivation has historically existed in Belarus for industrial fibre as part of state-controlled textile manufacturing.',
'No legal patient access exists. Cannabis medicines are entirely unavailable through healthcare channels.',
'No cannabis prescribing right exists for Belarusian physicians.',
'No legal cannabis market. Industrial hemp cultivation for state-controlled textile production is the only cannabis-adjacent industry.',
'No cannabis reform is anticipated under the current authoritarian government. Belarus is expected to maintain strict prohibition in alignment with Russian drug policy.',
'Ministry of Health (Belarus) — minzdrav.gov.by',
'Limited available data; EMCDDA peripheral reporting',
'Based on available legislative information and geopolitical context.',
'Annual','Strict prohibition; no medical programme; industrial hemp context; authoritarian government; sanctions environment.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='BY' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'san-marino','country','SM','Medical — Italian Framework Alignment',
'San Marino is a microstate of approximately 34,000 residents completely surrounded by Italy. Cannabis regulation in San Marino broadly follows Italian frameworks. Medical cannabis accessible under Italian AIFA protocols is the primary reference for San Marino residents. No independent San Marinese cannabis regulatory agency exists. The Republic of San Marino''s health authority (Segreteria di Stato per la Sanità) defers to Italian pharmaceutical standards for controlled substances in practice.',
'San Marino residents typically access medical cannabis through Italian medical channels given the geographic and regulatory relationship. A small number of San Marinese patients may be served through the Italian prescription framework.',
'Physicians in San Marino follow Italian prescribing norms. No independent cannabis prescribing framework exists.',
'No commercial cannabis market of significance in San Marino. Italian retail dynamics apply by proximity.',
'San Marino will follow Italian regulatory developments, including any expansion of domestic cultivation rights.',
'Segreteria di Stato per la Sanità (San Marino) — segreteria.sanita.sm',
'Italian AIFA frameworks; limited San Marinese specific guidance',
'Very limited independent data; analysis relies on Italian regulatory alignment.',
'Annual','Italian regulatory alignment; microstate context.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='SM' AND jurisdiction_type='country');
