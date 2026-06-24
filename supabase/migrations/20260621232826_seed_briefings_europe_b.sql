
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'greece','country','GR','Medical Legal (Since 2017); Licensed Export Industry',
'Greece legalised medical cannabis in 2017 and has systematically expanded its regulatory framework since then. Law 4523/2018 and subsequent updates established the basis for cannabis cultivation, processing, and export, with the National Organization for Medicines (EOF) administering the framework. Greece operates one of the more developed EU medical cannabis frameworks in Southern Europe. Personal cannabis use remains illegal, though small-quantity personal possession can result in administrative rather than criminal penalties. Greece attracted international cannabis investment early due to its agricultural advantages — climate, land availability, lower production costs — and EU membership. By 2026, Greece hosts multiple licensed EU-GMP cultivation facilities primarily focused on export to Germany, the UK, and other EU markets.',
'Greek patients may access medical cannabis through specialist prescription under EOF protocols. Approved indications include chronic pain, MS, epilepsy, and cancer-related symptoms. Prescriptions are dispensed through licensed pharmacies. Health insurance coverage is limited; significant out-of-pocket costs apply for most patients.',
'Greek physicians on the specialist register may prescribe medical cannabis for approved indications under EOF protocols. Neurologists, oncologists, pain specialists, and psychiatrists are the primary prescribers. EOF has issued prescribing guidelines and a physician registration requirement applies.',
'Greece has developed a significant medical cannabis cultivation sector. Several large-scale EU-GMP licensed facilities are operational, with production primarily intended for export. Greek agricultural companies and international cannabis firms have invested substantially. Domestic patient numbers are growing but the export industry dominates economically.',
'Greece is expected to continue expanding its medical cannabis export infrastructure. Regulatory alignment with EU standards will remain the primary driver. Domestic patient programme expansion is anticipated. The Greek government has been broadly supportive of the medical and export industry as an economic development vehicle.',
'National Organization for Medicines (EOF) — eof.gr; Ministry of Health — moh.gov.gr',
'EOF regulatory guidance; Greek Ministry of Health public communications; EMCDDA Greece country report; company investor disclosures',
'Based on EOF guidance, EMCDDA data, and published producer licensing information.',
'Quarterly','Medical programme legal framework; specialist prescribing; EOF oversight; export industry; EU-GMP production capacity; domestic patient access.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='GR' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'hungary','country','HU','Prohibited — Sativex Named-Patient Access Only',
'Hungary maintains one of the most restrictive drug policy approaches in the European Union. Cannabis is a Schedule I drug under the Criminal Code (Büntető Törvénykönyv), with criminal sanctions applicable even for small personal quantities. Hungary has not established a formal medical cannabis programme. The only legal cannabis-derived medicine available is Sativex, which may be obtained on an individual named-patient basis through the National Institute of Pharmacy and Nutrition (OGYÉI), but access is severely limited in practice. The government has shown no interest in cannabis reform, and CBD products exist in a legally uncertain environment — the government has periodically taken enforcement action against CBD retailers.',
'Patient access to cannabis-based medicines in Hungary is extremely limited. Named-patient import of Sativex can be requested through OGYÉI but requires substantial documentation and specialist approval. Health insurance does not cover cannabis medicines. Many Hungarian patients seek access through neighbouring Austria or Slovakia.',
'No prescribing right for cannabis beyond Sativex named-patient procedures exists. The medical community has had limited engagement with cannabis medicine given the restrictive policy environment. Neurologists may apply for named-patient Sativex access but face significant administrative barriers.',
'Hungary has no commercial medical cannabis market. Hemp fibre production exists under EU agricultural rules with strict THC controls. CBD products exist in a legally uncertain environment. No domestic medical cannabis production industry has developed.',
'No cannabis reform is anticipated under the current political framework. The government has explicitly opposed cannabis reform at EU level. Changes would likely require significant EU-level policy shifts. Hungary is likely to remain among the most restrictive EU member states for the foreseeable future.',
'National Institute of Pharmacy and Nutrition (OGYÉI) — ogyei.gov.hu; Ministry of the Interior — kormany.hu',
'OGYÉI regulatory guidance; EMCDDA Hungary country report',
'Based on OGYÉI public guidance and EMCDDA data. Limited transparency on named-patient approval rates.',
'Annual','Prohibition framework; named-patient Sativex pathway; CBD legal uncertainty; absence of medical programme; reform prospects.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='HU' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'iceland','country','IS','Medical — Limited Prescription; CBD Legal',
'Iceland permits cannabis-based medicines on a prescription basis, with the Icelandic Medicines Agency (Lyfjastofnun) responsible for product authorisation. Sativex is registered in Iceland and available through specialist prescription. Other cannabis-based products may be authorised on a named-patient basis. Iceland is not an EU member but participates in the EEA and aligns with EU pharmaceutical regulations. Personal cannabis use is prohibited; cultural attitudes have been slowly evolving, particularly among younger demographics. Iceland''s small population of approximately 370,000 limits market scale significantly.',
'Icelandic patients can access Sativex through neurologist or specialist prescription. Named-patient authorisation for other cannabis products is available through Lyfjastofnun. Health insurance coverage is limited. Patient numbers are very small given the population.',
'Icelandic physicians may prescribe Sativex and seek Lyfjastofnun authorisation for named-patient cannabis products. No general prescribing right for cannabis beyond authorised medicines exists. Specialist recommendation is required for most access pathways.',
'Iceland''s cannabis market is negligible in commercial terms. No domestic medical cannabis production. CBD imports from EU are the primary cannabis-adjacent retail activity. Iceland''s small population and geographic isolation limit market development.',
'No legislative cannabis reform is expected in Iceland in the near term. The country typically follows EU regulatory trends and could align with any EU-level medical cannabis harmonisation. Public health-focused drug policy discussions continue but have not translated into reform initiatives.',
'Icelandic Medicines Agency (Lyfjastofnun) — lyfjastofnun.is; Directorate of Health — landlaeknir.is',
'Lyfjastofnun guidance; EMCDDA Iceland reporting; Health Directorate publications',
'Based on Lyfjastofnun public guidance and available drug policy data.',
'Annual','Sativex access; named-patient pathway; CBD import status; small market context.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='IS' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'ireland','country','IE','Medical — MCAP Programme (Since 2019); Permanent Framework Established',
'Ireland established its Medical Cannabis Access Programme (MCAP) in 2019, administered by the Health Products Regulatory Authority (HPRA). MCAP allows specialist physicians to enrol patients with three specific conditions: refractory epilepsy, MS-related spasticity, and severe treatment-resistant nausea from chemotherapy. In 2023, Ireland progressed the Health (Amendment) Act establishing a permanent medical cannabis framework. Simultaneously, the government introduced a drugs diversion scheme for personal cannabis quantities, redirecting them to health services rather than criminal prosecution — a significant shift in Irish drug policy. Patient numbers under MCAP have grown to several hundred.',
'Irish patients can access cannabis under MCAP through specialist physician enrolment. Eligible conditions are refractory epilepsy, MS-related spasticity, and chemotherapy-induced nausea. Products must be on the HPRA approved list. Patients pay out-of-pocket as the HSE does not currently reimburse cannabis medicines under the Drug Payment Scheme.',
'Only specialist physicians may apply to enrol patients in MCAP. Specialists in neurology, neurosurgery, and medical oncology are the primary practitioners. The HPRA oversees the scheme. The permanent framework under the 2023 Act is expected to broaden physician access rules.',
'The Irish medical cannabis market is small and import-dependent. No significant domestic production has developed. Licensed importers supply approved products. The CBD market has grown under food law. Ireland''s EU membership creates import and re-export opportunities as the framework matures.',
'The permanent framework under the 2023 Act is being implemented and is expected to broaden both the eligible condition list and the prescriber base. The personal possession diversion scheme signals a broader policy re-evaluation. Ireland is likely to progressively expand medical cannabis access through 2026-2028.',
'Health Products Regulatory Authority (HPRA) — hpra.ie; Health Service Executive (HSE) — hse.ie; Department of Health — gov.ie/health',
'HPRA MCAP guidance; EMCDDA Ireland country report; Oireachtas records on Health Amendment Act 2023',
'Based on HPRA guidance, Oireachtas records, and EMCDDA data.',
'Quarterly','MCAP framework; specialist prescribing; approved conditions; HSE reimbursement status; permanent framework implementation; personal possession policy.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='IE' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'italy','country','IT','Medical — Prescription Programme; Military Farm Sole Domestic Cultivator',
'Italy has operated a medical cannabis programme since 2007, significantly expanded following the DM 9 November 2015 decree that simplified prescribing procedures. Any licensed Italian physician may prescribe medical cannabis without specialist restriction, making Italy one of the most accessible prescribing environments in the EU. The only licensed domestic cultivator is the Military Chemical-Pharmaceutical Plant (Stabilimento Chimico Farmaceutico Militare, SCFM) in Florence — a state military facility producing pharmaceutical-grade cannabis under strict GMP conditions. Despite SCFM production, supply is chronically insufficient to meet growing demand, requiring substantial imports from the Netherlands and other EU producers. Regional SSN reimbursement varies widely — some regions (Toscana, Puglia, Liguria) cover costs; others require full out-of-pocket payment. The CBD regulatory environment has been subject to significant legal uncertainty from conflicting court rulings.',
'Italian patients access medical cannabis through any licensed physician (medico curante) without specialist restriction. Prescriptions are filled at pharmacies that compound or dispense approved preparations. Regional reimbursement varies: some Italian regions cover cannabis medicines under the SSN; others require full out-of-pocket payment. Patient numbers are in the tens of thousands and growing.',
'Any Italian physician with a standard medical licence (iscrizione all''Albo dei Medici) may prescribe medical cannabis following DM 9 November 2015 protocols. No specialist restriction applies. AIFA provides prescribing guidance. This makes Italy one of the most open prescribing markets in the EU, embraced by GPs and specialists alike.',
'Italy''s medical cannabis market is characterised by demand chronically exceeding domestic supply. The SCFM produces limited quantities; imports from Netherlands, Portugal, Germany, and Canadian producers are essential. Private cannabis clinics have emerged in major cities. Industrial hemp cultivation is significant for food and cosmetic sectors.',
'Italy is expected to eventually expand domestic production capacity, potentially opening cultivation to private licensed producers beyond the SCFM monopoly — a reform repeatedly discussed but not yet enacted. The CBD regulatory environment may stabilise following definitive EU-level EFSA classification. Regional reimbursement disparities are a continuing policy challenge.',
'Italian Medicines Agency (AIFA) — aifa.gov.it; Stabilimento Chimico Farmaceutico Militare (SCFM); Ministry of Health — salute.gov.it',
'AIFA regulatory guidance; DM 9 November 2015; EMCDDA Italy country report; Italian court rulings on CBD; SCFM production reports',
'Based on AIFA guidance, ministerial decree text, EMCDDA data, and published court decisions.',
'Quarterly','Prescribing framework; SCFM domestic production; import dependency; regional reimbursement variation; CBD regulatory status; patient numbers.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='IT' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'kosovo','country','XK','Prohibited — No Medical Programme',
'Kosovo maintains cannabis prohibition under its Law on Prevention of and Fight Against Illicit Traffic in Narcotics, Psychotropic Substances and Precursors. Cannabis use and possession are criminal offences. Kosovo does not have a medical cannabis programme. As a partially recognised state and EU candidate, Kosovo''s long-term EU integration aspiration creates some external pressure for drug policy alignment, but no domestic reform initiative has been advanced. Kosovo''s close ties to neighbouring North Macedonia — which has a well-developed medical cannabis export industry — create awareness of cannabis policy developments, but this has not yet translated into legislative action.',
'No legal patient access exists. Some residents may access cannabis through informal cross-border channels from North Macedonia or Serbia.',
'No cannabis prescribing right exists for Kosovo physicians.',
'No legal cannabis market. No significant hemp cultivation industry.',
'EU integration aspirations over the long term may drive alignment with EU medical cannabis frameworks. North Macedonia''s experience is the most immediately relevant regional model. No near-term domestic reform anticipated.',
'Kosovo Ministry of Health — msh.rks-gov.net',
'Limited available data; EMCDDA indirect reporting',
'Based on available legislative information.',
'Annual','Prohibition framework; EU candidate context; no medical programme.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='XK' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'latvia','country','LV','Medical — Named Patient Only; CBD Legal',
'Latvia has a very limited medical cannabis framework under the Law on Narcotic and Psychotropic Substances and the Pharmacies Law. Cannabis-based medicinal products including Sativex may be authorised on a named-patient basis through the State Agency of Medicines (Zāļu valsts aģentūra, ZVA). No broad medical programme exists. Personal cannabis use is prohibited with criminal penalties. Latvia has one of the more conservative drug enforcement approaches among the Baltic states. Hemp cultivation for industrial fibre and seed is legal under EU rules. CBD products are available in retail in a legally ambiguous status.',
'Named-patient access through ZVA is the only legal pathway for medical cannabis in Latvia. Patient numbers are very small. Sativex is the primary product available. Out-of-pocket costs apply fully. No public reimbursement exists for cannabis medicines.',
'Latvian physicians may apply to ZVA for named-patient cannabis medicine authorisation. Neurologists and pain specialists are typical applicants. No general prescribing right exists. The authorisation process is administratively burdensome relative to the practical access it enables.',
'Latvia has no commercial medical cannabis market. Hemp industrial cultivation exists at modest scale. CBD retail operates without clear legal authorisation. No Latvian cannabis companies have achieved significant regional market presence.',
'Latvia is likely to follow broader EU regulatory developments without unilateral domestic reform. Any expansion of the medical cannabis framework would most plausibly come from EU-level harmonisation. Conservative drug policy is entrenched in the political consensus.',
'State Agency of Medicines (ZVA) — zva.gov.lv; Ministry of Health — vm.gov.lv',
'ZVA guidance; EMCDDA Latvia country report',
'Based on ZVA public guidance and EMCDDA data.',
'Annual','Named-patient Sativex access; absence of general medical programme; hemp status; CBD regulatory status.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='LV' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'liechtenstein','country','LI','Medical — Swiss Framework Alignment',
'Liechtenstein is a microstate of approximately 40,000 residents with close economic and regulatory ties to Switzerland via a customs union. Cannabis regulation in Liechtenstein broadly aligns with Swiss frameworks — cannabis-based medicines authorised in Switzerland may be accessible through equivalent channels. Liechtenstein has no independent cannabis regulatory authority of significance. Personal cannabis use is prohibited. The country''s tiny population and Swiss economic integration mean regulatory developments in Switzerland directly shape the Liechtenstein context, including any adult-use pilot developments.',
'Patient access in Liechtenstein is effectively via Swiss regulatory channels. Patients may seek medical cannabis through Swiss-style specialist prescriptions. Patient numbers are negligible given the population.',
'Liechtenstein physicians follow Swiss prescribing norms for controlled substances. Cannabis-based medicines authorised by Swissmedic are the primary available products.',
'No cannabis market of significance exists in Liechtenstein. Swiss retail dynamics apply by proximity.',
'Liechtenstein will follow Switzerland''s approach to cannabis reform, including adult-use pilot developments. No independent reform is anticipated.',
'Office for Food Control and Veterinary Affairs (Liechtenstein) — llv.li; Swissmedic (alignment reference) — swissmedic.ch',
'Swiss regulatory publications; limited Liechtenstein-specific guidance',
'Very limited data available; analysis relies on Swiss regulatory alignment.',
'Annual','Swiss regulatory alignment; microstate context; absence of independent programme.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='LI' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'lithuania','country','LT','Medical — Limited; CBD Legal; Decriminalisation Debated',
'Lithuania permits cannabis-based medicinal products via the State Medicines Control Agency (VASPVT). Sativex is authorised and named-patient access to other preparations is possible. The programme is small, similar in scale to Latvia and Estonia. Personal possession is criminalised. Hemp is cultivated industrially under EU rules. CBD products are in a regulatory grey zone. Lithuania has had more active parliamentary debate about drug policy reform than its Baltic neighbours, with discussions about decriminalisation and expanded medical access, but no legislative reform had been enacted as of 2026.',
'Named-patient authorisation and Sativex prescription are the primary access pathways. Patient numbers are very small. Out-of-pocket costs apply fully. Some Lithuanian patients access cannabis through informal channels or travel to Germany or the Netherlands.',
'Lithuanian physicians may prescribe authorised cannabis medicines and apply for named-patient access through VASPVT. No specialist restriction formally applies but physician familiarity with cannabis prescribing is low.',
'No significant commercial cannabis market. Hemp cultivation is present. CBD retail is growing but legally uncertain. A small number of Lithuanian companies have explored EU-GMP cannabis production prospects.',
'Lithuania is somewhat more reform-oriented than its Baltic peers in terms of political discussion. Decriminalisation has gathered parliamentary support. Medical programme expansion following EU trends is plausible in the 2026-2028 window.',
'State Medicines Control Agency (VASPVT) — vaspvt.gov.lt; Ministry of Health — sam.lrv.lt',
'VASPVT guidance; EMCDDA Lithuania country report',
'Based on VASPVT guidance and EMCDDA data.',
'Annual','Named-patient access; Sativex availability; reform discussion status; CBD legal status; hemp cultivation.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='LT' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'luxembourg','country','LU','Adult-Use Legal — Home Cultivation (Since 2023); First EU Member State',
'Luxembourg became the first European Union member state to legalise adult-use cannabis in July 2023 under the Loi du 8 avril 2023. Adults 18+ may grow up to four plants per household for personal use and possess up to 3 grams in public. Seeds may be purchased legally. A regulated commercial retail market was proposed but commercial sales to the general public had not yet launched as of mid-2026, given EU legal complexities and Schengen border concerns. Medical cannabis has been accessible for years via physician prescription under the Direction de la Santé framework. Luxembourg''s small population of approximately 660,000 limits domestic market scale, but its central EU location and EU institution presence give it disproportionate policy influence.',
'Adults 18+ in Luxembourg may legally possess up to 3 grams in public and cultivate up to 4 plants at home. Medical cannabis patients access treatment through physician prescription for approved cannabis medicines. No commercial retail for adult-use cannabis is currently available.',
'Luxembourg physicians may prescribe cannabis-based medicinal products without specialist restriction under standard controlled substance prescribing rules administered by the Direction de la Santé.',
'Luxembourg''s cannabis market is shaped by home cultivation legalisation rather than commercial sales, which have not yet launched. Cross-border concerns with France, Belgium, and Germany — all with varying legal frameworks — dominate the commercial policy discussion. Medical cannabis is available through licensed pharmacies.',
'Luxembourg''s adult-use framework is expected to evolve over 2026-2028, potentially incorporating commercial sales once political and legal frameworks are resolved. Medical access continues in parallel. Luxembourg''s experience as the first EU member-state adult-use legalisation will be closely observed across Europe.',
'Direction de la Santé (Luxembourg) — sante.public.lu; Luxembourg Ministry of Health — gouvernement.lu',
'Ministry of Health communications; Loi du 8 avril 2023 text; EMCDDA Luxembourg country report',
'Based on legal text, Ministry of Health guidance, and EMCDDA data.',
'Quarterly','Adult-use home cultivation legalisation; absence of commercial retail; medical prescription access; EU first-mover significance; cross-border policy implications.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='LU' AND jurisdiction_type='country');
