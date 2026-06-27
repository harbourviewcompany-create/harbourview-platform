
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'malta','country','MT','Adult-Use — Personal Cultivation Legal (Since 2021); First EU Adult-Use State',
'Malta became the first EU member state to legalise personal cannabis use in 2021 under the Cannabis Reform Act (Att dwar ir-Riforma tal-Cannabis). Adults 18+ may possess up to 7 grams in public, grow up to 4 plants at home, and participate in licensed cannabis associations (non-commercial clubs of up to 500 members) that can collectively grow cannabis for members. Medical cannabis has been available since 2018 under the Medical Cannabis Programme administered by the Medicines Authority, with approved products dispensed through licensed pharmacies. Malta''s small population of approximately 530,000 limits market scale, but the framework is significant as a pioneering EU model. The cannabis association (club) approach has influenced discussions in France, Belgium, and other EU states.',
'Adults 18+ in Malta may legally possess up to 7 grams, cultivate up to 4 plants, and join licensed cannabis associations. Medical cannabis patients access treatment through physician prescription under the Medical Cannabis Programme, covering epilepsy, multiple sclerosis, chronic pain, and cancer-related conditions. Products are dispensed through licensed pharmacies.',
'Maltese physicians may prescribe medical cannabis under the Medical Cannabis Programme for approved indications. The Medicines Authority oversees prescribing. No specialist restriction is specified for the medical programme.',
'Malta''s cannabis market is shaped by the association model. Licensed cannabis associations operate providing a non-commercial supply chain for adult members. No commercial retail cannabis sales occur. The medical market is served by imported pharmaceutical products. CBD and hemp markets follow EU frameworks.',
'Malta''s framework is stable and established. Commercial adult-use sales remain legally prohibited and no near-term launch is planned. The association model is under ongoing evaluation. EU harmonisation discussions will be influenced by Malta''s experience. Medical programme expansion with broader indication coverage is possible in 2026-2028.',
'Medicines Authority (Malta) — medicinesauthority.gov.mt; Authority for the Responsible Use of Cannabis (ARUC) — aruc.gov.mt',
'Medicines Authority guidance; Cannabis Reform Act 2021; EMCDDA Malta country report; ARUC public communications',
'Based on legislative text, Medicines Authority guidance, and EMCDDA data.',
'Quarterly','Adult-use home cultivation and association model; medical prescription programme; no commercial retail; EU first-mover significance; Medicines Authority oversight.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='MT' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'moldova','country','MD','Prohibited — No Medical Programme',
'Moldova maintains cannabis as a prohibited substance under its drug control law, with criminal penalties for possession and use. No medical cannabis programme has been established. Moldova is a candidate country for EU accession and will face pressure to align drug policies with EU standards over time, though this is a long-term prospect. Hemp cultivation for industrial fibre is permitted in Moldova under regulations aligned with EU standards for low-THC varieties. CBD products exist in limited quantities in a legally ambiguous environment.',
'No legal patient access pathway exists in Moldova. Patients must seek access through informal channels or travel to neighbouring Romania or other EU states with medical programmes.',
'No cannabis prescribing right exists for Moldovan physicians. Medical practitioners cannot legally recommend cannabis medicines.',
'No commercial cannabis market. Hemp industrial cultivation exists at a small scale. No cannabis investment activity of note in Moldova.',
'EU accession trajectory over the long term is the primary reform driver. No near-term change anticipated. Romania''s developing medical programme may eventually be emulated.',
'Ministry of Health (Moldova) — msmps.gov.md',
'EMCDDA Moldova reporting; national drug control legislation',
'Based on EMCDDA country data and legislative review.',
'Annual','Prohibition framework; absence of medical programme; hemp cultivation; EU accession trajectory.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='MD' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'monaco','country','MC','Medical — French Framework Alignment',
'Monaco is a microstate of approximately 39,000 residents with close economic and administrative ties to France. Cannabis regulation in Monaco broadly aligns with French law and practice. Cannabis remains generally prohibited for non-medical use. Medical cannabis accessible under French ANSM frameworks may be accessible for Monaco residents through French medical channels. No independent Monégasque cannabis regulatory body or programme exists. Patient access is negligible given the population size.',
'Monaco residents with medical needs may access cannabis through French medical channels. No Monaco-specific patient programme exists.',
'Physicians in Monaco follow French prescribing frameworks for controlled substances. No independent cannabis prescribing framework.',
'No commercial cannabis market of significance in Monaco. Proximity to France and Italy means any regulatory development follows these neighbours.',
'Monaco will follow French regulatory developments on medical cannabis as the permanent framework emerges from the pilot evaluation. No independent reform expected.',
'Monaco Ministry of State (Health) — gouv.mc',
'French ANSM frameworks (applicable by alignment); limited Monaco-specific guidance',
'Very limited data; relies on French regulatory alignment.',
'Annual','French regulatory alignment; microstate context; negligible independent programme.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='MC' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'montenegro','country','ME','Medical — Limited; EU Accession Candidate',
'Montenegro has limited medical cannabis provisions under its narcotics legislation. Cannabis-based medicinal products including Sativex are accessible on a named-patient basis through the Agency for Medicines and Medical Devices of Montenegro (CALIMS). No broad medical programme exists. Montenegro is a candidate country for EU accession and has been developing drug policy in alignment with EU standards. Cannabis for non-medical use is prohibited with significant personal possession penalties. Montenegro has been monitoring regional Balkan developments in Serbia and North Macedonia regarding medical cannabis frameworks and export industry development.',
'Named-patient access through CALIMS is the only legal pathway. Patient numbers are negligible. Out-of-pocket costs apply. Some patients access cannabis through neighbouring markets.',
'Montenegrin physicians may apply for named-patient authorisation through CALIMS. No general prescribing right exists. Medical familiarity with cannabis medicines is limited.',
'No commercial cannabis market. Hemp cultivation is present at small scale. No cannabis investment activity of significance. EU accession process may catalyse reform.',
'EU accession and alignment with regional Balkan states that have more developed frameworks (North Macedonia, Serbia) are the primary reform drivers. A medical programme legislation similar to neighbouring countries is plausible in the 2026-2028 window.',
'Agency for Medicines and Medical Devices (CALIMS) — calims.gov.me; Ministry of Health — gov.me',
'CALIMS guidance; EMCDDA Montenegro reporting',
'Based on CALIMS guidance and EMCDDA data.',
'Annual','Named-patient access; absence of broad medical programme; EU accession context; regional comparison.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='ME' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'north-macedonia','country','MK','Medical Legal — Established Programme and Export Industry',
'North Macedonia legalised medical cannabis in 2016 under amendments to the Law on Control of Narcotic Drugs and Psychotropic Substances. The Agency for Medicines and Medical Devices (MALMED) oversees licensing of cannabis cultivation, processing, and product manufacturing. Any licensed physician may prescribe medical cannabis for medically appropriate conditions. North Macedonia has become one of the notable medical cannabis cultivation and export hubs in the Western Balkans, supplying EU markets including Germany, Switzerland, and the UK. The country has EU accession candidate status, and its cannabis regulatory framework has been developed with EU-GMP standards in mind to facilitate export. Personal cannabis use remains prohibited.',
'North Macedonian patients access medical cannabis through licensed physician prescription. Neurologists, oncologists, and pain specialists are primary prescribers. The Republican Health Insurance Fund does not currently cover cannabis medicines; out-of-pocket costs apply. Patient access is improving as the programme matures.',
'Any North Macedonian physician with a valid licence from the Medical Chamber may prescribe medical cannabis. No specialist restriction applies. MALMED prescribing guidance is available. Physician education on cannabis medicine is growing.',
'North Macedonia has developed a growing medical cannabis production sector. Multiple EU-GMP standard facilities cultivate and process cannabis primarily for export. Key export markets include Germany, Switzerland, and the UK. The domestic patient market is expanding. North Macedonia is positioned as a cost-effective, quality-compliant supplier within the European supply network.',
'North Macedonia will continue expanding its production and export capacity as EU market demand grows. Domestic patient access is expected to improve. EU accession will drive further regulatory harmonisation. The country is well-positioned as a cost-efficient EU-standard producer.',
'Agency for Medicines and Medical Devices (MALMED) — malmed.gov.mk; Ministry of Health — zdravstvo.gov.mk',
'MALMED regulatory guidance; EMCDDA North Macedonia reporting; company export disclosures',
'Based on MALMED guidance and EMCDDA data. Export volumes from company public disclosures.',
'Quarterly','Medical legal framework; general physician prescribing; export production industry; EU-GMP compliance; domestic patient access.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='MK' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'norway','country','NO','Medical — Prescription Programme; CBD Legal',
'Norway permits medical cannabis under the Medicines Act, administered by the Norwegian Medicines Agency (NoMA, Legemiddelverket). Cannabis-based medicines including Sativex are registered, and named-patient access to other preparations is available through NoMA''s pre-approval system. Norway is not an EU member but participates in the EEA and aligns closely with EU pharmaceutical standards. Personal cannabis use is prohibited. Norway conducted a significant drug policy reform debate — a government-commissioned committee recommended decriminalisation in 2019, and Parliament debated but narrowly rejected this. CBD products are regulated under food law frameworks similar to EU Novel Food guidelines.',
'Norwegian patients may access Sativex through neurologist or MS specialist prescription with potential Helfo reimbursement under specific criteria. Other cannabis medicines require individual NoMA pre-approval. Patient numbers are modest. Out-of-pocket costs are a barrier for non-reimbursed products.',
'Norwegian neurologists, oncologists, and pain specialists may prescribe Sativex and apply for NoMA pre-approval for other cannabis preparations. GPs can continue prescriptions initiated by specialists. The prescribing environment is moderately accessible for licensed products.',
'Norway''s medical cannabis market is small but served by EU imports. Sativex is the primary product. CBD products are a growing retail category under food law. No domestic cannabis production for medical purposes. Norwegian patients with means sometimes seek consultation in the Netherlands or Germany.',
'Norway is likely to progressively expand medical cannabis access, consistent with its evidence-based healthcare approach. Full adult-use legalisation is not expected in the near term. EEA membership ensures alignment with evolving EU pharmaceutical cannabis standards.',
'Norwegian Medicines Agency (Legemiddelverket) — legemiddelverket.no; Helfo — helfo.no',
'NoMA regulatory guidance; Helfo reimbursement criteria; EMCDDA Norway country report',
'Based on NoMA guidance and EMCDDA data.',
'Quarterly','Medical prescription access; Sativex reimbursement; NoMA named-patient pathway; decriminalisation debate; CBD food law status.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='NO' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'poland','country','PL','Medical — General Prescription Programme (Since 2017)',
'Poland legalised medical cannabis in November 2017 under the Act on Counteracting Drug Addiction, permitting any licensed physician to prescribe cannabis-based medicines for medically appropriate conditions without restriction to specific indications or specialists. This created one of the most permissive prescribing frameworks in the EU on paper, though patient access has been constrained by high costs, lack of insurance reimbursement, limited physician familiarity, and a supply chain dependent on imports from Canada, the Netherlands, Germany, and other licensed exporters. The Polish medical cannabis market has grown steadily since 2017, becoming one of the faster-growing import markets in Europe. Personal cannabis use remains illegal, though CBD products are permitted under food law.',
'Polish patients access medical cannabis through any physician prescription without condition restriction. Prescriptions must be filled at licensed pharmacies. The National Health Fund (NFZ) does not reimburse cannabis medicines, making out-of-pocket costs a significant barrier (typically PLN 500-2000 per month). Online medical services and cannabis clinics have emerged to serve demand.',
'Any Polish physician with a valid licence from the Supreme Medical Council may prescribe medical cannabis without specialist restriction. Despite broad access rights, physician education on cannabis is variable. A growing number of private cannabis clinics and online consultation platforms serve patients.',
'Poland''s medical cannabis market is one of the fastest-growing in Europe from a low base. Imports from Canada and EU producers are the primary supply. Annual import volumes have grown significantly each year since 2017. Private cannabis clinics operate in Warsaw, Kraków, Gdańsk, and other cities. Several Polish companies have obtained cultivation licences but domestic production remains marginal.',
'Poland is expected to continue growing as a significant EU cannabis import market. Domestic production may expand if the licensing framework becomes more accessible. NFZ reimbursement for specific conditions is a policy priority for patient advocacy groups. Adult-use reform is not politically supported by the current government but decriminalisation discussions are active.',
'Main Pharmaceutical Inspectorate (GIF) — gif.gov.pl; Supreme Medical Council — nil.org.pl; National Health Fund (NFZ) — nfz.gov.pl',
'GIF regulatory guidance; NFZ communications; EMCDDA Poland country report; licensed importer disclosures',
'Based on GIF guidance, EMCDDA data, and published importer market data.',
'Quarterly','Medical prescribing access; absence of NFZ reimbursement; import market size; domestic cultivation status; physician education landscape.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='PL' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'portugal','country','PT','Medical Legal (Since 2018); Personal Use Decriminalised (Since 2001)',
'Portugal is internationally recognised for its landmark 2001 decriminalisation of all drugs for personal use (possession of up to a 10-day personal supply), widely cited as a harm-reduction success. Medical cannabis was legalised separately in June 2018 under Law 33/2018, permitting the cultivation, production, distribution, and export of medicinal cannabis. INFARMED (Autoridade Nacional do Medicamento e dos Produtos de Saúde) oversees the medical cannabis framework. Portugal has attracted significant investment in cannabis cultivation and production, leveraging its agricultural climate, EU membership, and export-friendly framework. Multiple EU-GMP cannabis facilities have been established, primarily targeting export markets. Portugal''s combination of the longest-standing personal use decriminalisation in Europe with a developed medical programme makes it one of the most complete policy frameworks globally.',
'Portuguese patients access medical cannabis through specialist physician prescription for approved indications including chronic pain, MS spasticity, epilepsy, and oncology indications. INFARMED oversees product authorisation. The National Health Service (SNS) provides limited reimbursement. Private sector access is more readily available. Patient numbers are in the low tens of thousands and growing.',
'Portuguese physicians — primarily neurologists, oncologists, and pain specialists — may prescribe medical cannabis for approved conditions. INFARMED has issued prescribing protocols. The prescribing framework has been progressively expanded since 2018. GPs may continue prescriptions initiated by specialists.',
'Portugal is a significant EU cannabis production country. Multiple large-scale EU-GMP cultivation and processing operations have been established, particularly in the Alentejo region, taking advantage of excellent growing climate and lower production costs. Export markets include Germany, the UK, and other EU states. Major international producers including Tilray operate facilities in Portugal.',
'Portugal is expected to continue expanding as a cannabis production and export hub within the EU. Medical programme access will likely broaden. The country''s unique 2001 decriminalisation legacy positions it well for any EU-level harmonisation on drug policy. Portugal''s production capacity will increasingly serve the growing German market.',
'INFARMED — infarmed.pt; Direcção-Geral da Saúde (DGS) — dgs.pt; Institute of Drugs and Drug Addiction (SICAD) — sicad.pt',
'INFARMED regulatory guidance; Law 33/2018; EMCDDA Portugal country report; EU-GMP producer disclosures',
'Based on INFARMED guidance, law text, EMCDDA data, and company production disclosures.',
'Quarterly','Medical legal framework; specialist prescribing; SNS reimbursement; export production industry; 2001 decriminalisation context.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='PT' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'romania','country','RO','Medical — Limited (Sativex); CBD Legal',
'Romania permits cannabis-based medicines in a limited framework. Sativex is registered in Romania and available through specialist prescription for MS spasticity. Named-patient access to other cannabis preparations is possible through the National Agency for Medicines and Medical Devices (ANMDM). Romania does not have a broad-access medical cannabis programme. Personal cannabis use is prohibited with criminal sanctions. Romania is an EU member state and will be influenced by EU-level regulatory harmonisation trends. Hemp cultivation is legal for industrial purposes. No near-term domestic reform is politically indicated.',
'Named-patient and Sativex specialist prescription are the only access pathways. Neurologists treating MS patients are the primary prescribers of Sativex. ANMDM authorisation is required for other preparations. Reimbursement is not provided by CNAS (National Health Insurance). Patient numbers are very small.',
'Romanian neurologists may prescribe Sativex. Named-patient import authorisation for other preparations must be sought from ANMDM. No general prescribing right exists. Physician awareness of cannabis medicine options is limited.',
'No commercial medical cannabis market exists in Romania. Hemp is cultivated for industrial purposes. CBD products are available through retail channels. Romanian agricultural conditions are suitable for hemp but no medical cannabis production industry has developed.',
'Romania will follow EU regulatory trends on medical cannabis harmonisation. A formal medical programme expansion is more likely to come from EU-level direction than domestic political initiative. Conservative drug policy consensus is stable.',
'National Agency for Medicines and Medical Devices (ANMDM) — anm.ro; National Health Insurance House (CNAS) — cnas.ro',
'ANMDM guidance; EMCDDA Romania country report',
'Based on ANMDM public guidance and EMCDDA data.',
'Annual','Named-patient access; Sativex availability; absence of broad medical programme; hemp cultivation; CBD legal status.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='RO' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'serbia','country','RS','Medical — General Prescription Programme (Since 2019); Export Industry',
'Serbia legalised medical cannabis in 2019 under amendments to the Law on Psychoactive Controlled Substances, administered by the Medicines and Medical Devices Agency of Serbia (ALIMS). Any licensed physician may prescribe medical cannabis for medically appropriate conditions. Serbia is not an EU member but is an EU accession candidate, and its cannabis regulatory framework has been developed with EU-GMP standards in mind to facilitate export to EU markets. The export industry is a significant economic driver. Personal cannabis use remains prohibited. Hemp cultivation for industrial purposes is permitted under standard frameworks.',
'Serbian patients access medical cannabis through licensed physician prescription. Neurologists, oncologists, and pain specialists are primary prescribers. The Republican Health Insurance Fund (RFZO) does not currently cover cannabis medicines; out-of-pocket costs apply. Patient access is improving as the programme matures.',
'Any Serbian physician with a valid licence from the Serbian Medical Chamber may prescribe medical cannabis without specialist restriction. ALIMS prescribing guidance is available. Physician education on cannabis medicine is growing, supported by professional association programmes.',
'Serbia has developed a growing medical cannabis production sector. Multiple EU-GMP standard facilities cultivate and process cannabis primarily for export to Germany, Switzerland, and the UK. The domestic patient market is expanding. Serbia is positioned as a cost-effective, quality-compliant producer within the European supply network.',
'Serbia will continue expanding its production and export capacity as EU market demand grows. Domestic patient access is expected to improve. EU accession will drive further regulatory harmonisation. RFZO reimbursement is a medium-term policy discussion.',
'Medicines and Medical Devices Agency of Serbia (ALIMS) — alims.gov.rs; Serbian Medical Chamber — lekarskomorba.rs; Ministry of Health — zdravlje.gov.rs',
'ALIMS regulatory guidance; EMCDDA Serbia reporting; company export disclosures',
'Based on ALIMS guidance and EMCDDA data. Export volumes from company public disclosures.',
'Quarterly','Medical legal framework; general physician prescribing; export production industry; EU-GMP compliance; domestic patient access.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='RS' AND jurisdiction_type='country');
