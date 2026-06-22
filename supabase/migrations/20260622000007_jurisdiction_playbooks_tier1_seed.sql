-- =============================================================================
-- Gap G: jurisdiction_playbooks seed migration
-- Markets: DE, AU, GB, CA, IL, NL, CO, US, UY, TH, MT, PT
-- Idempotent: ON CONFLICT (country_iso2) DO UPDATE SET ...
-- Generated: 2026-06-22
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Germany (DE)
-- -----------------------------------------------------------------------------
INSERT INTO public.jurisdiction_playbooks (
  country_iso2, country_name, difficulty, typical_timeline_months,
  estimated_cost_range, legal_framework_summary, steps, key_regulators,
  common_pitfalls, status, last_reviewed
) VALUES (
  'DE',
  'Germany',
  'very_high',
  18,
  '€500K–€2M+ first year',
  'Germany distinguishes between medical cannabis (governed by the Betäubungsmittelgesetz/BtMG and the 2024 Cannabisgesetz/CanG) and the 2024 non-medical adult-use framework. Medical cannabis imports require a BfArM narcotic import authorisation under §3 BtMG. All medicinal products must comply with EU-GMP (EudraLex Vol. 4). Exporters based outside the EU must hold a GMP certificate recognised by the relevant EU competent authority plus an export permit from their country of origin (e.g. DEA Form 161 for US exporters). German wholesale and distribution requires a Wholesale Distribution Authorisation (WDA) held by the local importer. Products must meet German Arzneimittelgesetz (AMG) packaging and labelling requirements, including German-language patient information leaflets. The 2024 CanG introduced a social-club (Anbauvereinigungen) adult-use framework but does not create a commercial import pathway for non-medical cannabis.',
  '[
    {"step": 1, "title": "Identify German importer/distributor partner", "description": "Engage a German pharmaceutical wholesaler holding both a WDA (Großhandelserlaubnis §52a AMG) and a BtM handling authorisation. The partner will act as the import sponsor and local quality responsible person (QP). Verify their BfArM narcotics registration and EU-GMP compliance status before signing. Negotiate territory, exclusivity, and minimum order terms.", "estimated_weeks": 8, "required": true},
    {"step": 2, "title": "Obtain EU-GMP certificate for manufacturing site", "description": "Commission an EU-GMP audit of the origin manufacturing site by the competent authority in the exporter''s country (e.g. Health Canada, ODC Australia) or engage a recognised EU notified body. The resulting GMP certificate must be accepted by BfArM. EU member state inspectorates (e.g. ZLG, RP Darmstadt) may conduct a direct inspection. Certificate issuance typically takes 6–12 months from audit.", "estimated_weeks": 24, "required": true},
    {"step": 3, "title": "Apply for BfArM §3 BtMG narcotic import authorisation", "description": "The German importer submits the import authorisation application to BfArM (Bundesopiumstelle). Required documents: product specification, certificate of analysis, EU-GMP certificate, importer WDA, exporter licence, bilateral agreement or INCB import/export declaration forms (P1/P2). BfArM processing time is typically 12–16 weeks. Authorisation is per product and per importer; it is not per shipment. Per-shipment import certificates (UN Yellow/Pink forms) are issued subsequently.", "estimated_weeks": 16, "required": true},
    {"step": 4, "title": "Register product or confirm dispensing pathway", "description": "Full AMG marketing authorisation (via EMA centralised or BfArM national procedure) typically takes 2+ years. Most importers use the ''Rezeptursubstanz'' (magistral/extemporaneous) or ''Fertigarzneimittel'' route. Confirm with German importer which pathway applies to the product form (flower, extract, oil). Dronabinol APIs follow the Rezeptursubstanz pathway; finished dose forms require Fertigarzneimittel registration.", "estimated_weeks": 12, "required": true},
    {"step": 5, "title": "Establish quality agreement and batch release process", "description": "Execute a Quality Technical Agreement (QTA) between exporting manufacturer and German QP. Define batch release testing requirements, reference standards, and COA templates to German Pharmacopoeia (DAB) standards where applicable. Establish a qualified person (QP) for batch certification in the EU. Each batch must be QP-released before dispatch.", "estimated_weeks": 6, "required": true},
    {"step": 6, "title": "Execute first commercial shipments under validated cold chain", "description": "Obtain per-shipment INCB import/export certificates (BfArM issues import certificate; origin country issues export authorisation). Validate cold chain logistics (2–8°C for most extracts; ambient for some dried flower with humidity controls). Ensure CITES documentation is not required (cannabis is not CITES-listed but verify for any carrier requirements). Customs clearance at German port of entry under T1 transit bond if applicable.", "estimated_weeks": 4, "required": true}
  ]'::jsonb,
  '[
    {"name": "BfArM (Bundesinstitut für Arzneimittel und Medizinprodukte)", "role": "Primary regulator for narcotic import authorisations (§3 BtMG), product registration of medicinal cannabis, and Bundesopiumstelle narcotics control", "website": "https://www.bfarm.de", "country": "DE"},
    {"name": "Paul-Ehrlich-Institut (PEI)", "role": "Regulates biological medicinal products; relevant for any cannabis-derived biologics", "website": "https://www.pei.de", "country": "DE"},
    {"name": "BAFA (Bundesamt für Wirtschaft und Ausfuhrkontrolle)", "role": "German export licensing authority; relevant for re-export scenarios and dual-use goods controls", "website": "https://www.bafa.de", "country": "DE"},
    {"name": "ZLG (Zentralstelle der Länder für Gesundheitsschutz)", "role": "Coordinates GMP inspections across German Länder; issues GMP certificates for German manufacturers", "website": "https://www.zlg.de", "country": "DE"}
  ]'::jsonb,
  ARRAY[
    'BfArM processing delays frequently exceed published 12-week timelines, especially during high-volume periods; plan for 16–20 weeks',
    'Batch release failures due to EU-GMP non-conformances on heavy metals, pesticide residues, or microbiological limits; pre-qualify batches against DAB/Ph.Eur. monographs',
    'Distributor exclusive territory conflicts — German distributors often negotiate broad exclusivity; negotiate carve-outs for direct hospital tenders',
    'German-specific packaging and labelling rules under AMG §10–11: German-language PIL mandatory, package size restrictions for BtM products',
    'CanG 2024 adult-use clubs (Anbauvereinigungen) do not create a commercial import pathway; foreign companies cannot supply adult-use market directly',
    'Reclassification of cannabis under BtMG Anlage III (prescribable narcotic) means any deviation in product specification triggers re-authorisation',
    'Import authorisation is product- and importer-specific; changing distributors requires full re-application to BfArM'
  ],
  'published',
  '2026-06-22'
)
ON CONFLICT (country_iso2) DO UPDATE SET
  country_name             = EXCLUDED.country_name,
  difficulty               = EXCLUDED.difficulty,
  typical_timeline_months  = EXCLUDED.typical_timeline_months,
  estimated_cost_range     = EXCLUDED.estimated_cost_range,
  legal_framework_summary  = EXCLUDED.legal_framework_summary,
  steps                    = EXCLUDED.steps,
  key_regulators           = EXCLUDED.key_regulators,
  common_pitfalls          = EXCLUDED.common_pitfalls,
  status                   = EXCLUDED.status,
  last_reviewed            = EXCLUDED.last_reviewed,
  updated_at               = now();

-- -----------------------------------------------------------------------------
-- 2. Australia (AU)
-- -----------------------------------------------------------------------------
INSERT INTO public.jurisdiction_playbooks (
  country_iso2, country_name, difficulty, typical_timeline_months,
  estimated_cost_range, legal_framework_summary, steps, key_regulators,
  common_pitfalls, status, last_reviewed
) VALUES (
  'AU',
  'Australia',
  'high',
  12,
  'A$200K–A$800K',
  'Australia regulates medicinal cannabis under the Narcotic Drugs Act 1967 and the Therapeutic Goods Act 1989. The Office of Drug Control (ODC) within the Department of Health oversees cultivation, production, manufacture, import, and export licences and permits. The Therapeutic Goods Administration (TGA) regulates product access through: (1) ARTG registration/listing, (2) Special Access Scheme Category B (SAS-B) for unapproved therapeutic goods, or (3) the Authorised Prescriber (AP) scheme. Importers must hold an ODC import licence (a standing licence) and must apply for a separate ODC import permit for each consignment. The TGA sponsors the product on the ARTG or manages SAS/AP access. As of 2023, Australia is one of the world''s largest medical cannabis import markets, with over 500 products notified. Most imported products access patients via SAS-B (patient-by-patient prescriber application), which does not require full ARTG registration but does require a TGA-acknowledged notification. Dried flower products remain the dominant import category.',
  '[
    {"step": 1, "title": "Engage TGA-licensed importer/sponsor", "description": "Identify an Australian entity holding an ODC Importer Licence under the Narcotic Drugs Act. This entity will act as the Australian sponsor and is responsible for TGA regulatory submissions, product notifications, and pharmacovigilance. Sponsors must be Australian-based companies. Negotiate a Sponsor Agreement covering product lines, territory, minimum purchase obligations, and regulatory responsibilities. Verify the sponsor''s ODC licence scope (flower, extract, capsules etc.).", "estimated_weeks": 6, "required": true},
    {"step": 2, "title": "Prepare TGA product dossier and access pathway determination", "description": "With your sponsor, determine the appropriate access pathway: (a) SAS Category B — prescriber-by-prescriber notification to TGA, fastest route, no pre-market approval needed but product must meet TGA manufacturing standards; (b) ARTG registration — full product dossier to CTD format, requires clinical data, 12–24 months processing; (c) Authorised Prescriber — single prescriber treats a class of patients. For most imported products, SAS-B is the launch pathway. Prepare product technical file: composition, COA, manufacturing information, overseas GMP certificate.", "estimated_weeks": 8, "required": true},
    {"step": 3, "title": "Obtain TGA GMP clearance for overseas manufacturer", "description": "The TGA requires overseas manufacturers to hold a TGA GMP clearance. Apply via TGA''s overseas GMP verification process: submit the manufacturer''s current GMP certificate (EU-GMP, Health Canada GMP, or equivalent) to TGA for recognition, or request a TGA inspection. TGA accepts EU-GMP certificates from recognised EU NCAs (e.g. BfArM, MHRA, HPRA) under MRA provisions. Processing: 3–6 months. Without GMP clearance, product cannot be supplied in Australia.", "estimated_weeks": 20, "required": true},
    {"step": 4, "title": "Apply for ODC import permit per consignment", "description": "Once ODC importer licence is held by the sponsor, apply for an ODC import permit for each consignment via the ODC Online Services Portal. Required: product details, quantity, origin country export permit, manufacturer details, purpose of import. ODC processes permits within 15 business days. The origin country must issue a corresponding export permit. Permits are valid for the specified consignment only; they cannot be reused.", "estimated_weeks": 3, "required": true},
    {"step": 5, "title": "Establish cold chain logistics to Australia", "description": "Australia''s biosecurity rules (DAFF) apply to all imports. Cannabis products do not require a biosecurity import permit (they are not plant matter in the traditional sense once manufactured), but dried flower may have specific requirements — confirm with DAFF. Validate cold chain for the product type (e.g. 2–8°C for oil extracts). Australian Customs (ABF) will inspect under the Customs Act; ensure all documentation is accurate and shipments are labelled per ODC permit conditions.", "estimated_weeks": 4, "required": true},
    {"step": 6, "title": "Launch prescriber network and SAS notification programme", "description": "Work with Australian distributor/sponsor to identify and educate prescribers eligible under SAS-B or AP scheme. GPs and specialists can apply for AP status from TGA for specific patient cohorts, enabling ongoing prescribing without per-patient TGA notification. Build a medical affairs team or engage a CRO with existing prescriber relationships. Track SAS notifications vs. AP applications to build volume predictability.", "estimated_weeks": 8, "required": true}
  ]'::jsonb,
  '[
    {"name": "TGA (Therapeutic Goods Administration)", "role": "Regulates therapeutic goods including medicinal cannabis: product registration (ARTG), SAS/AP prescriber access pathways, GMP clearance for overseas manufacturers", "website": "https://www.tga.gov.au", "country": "AU"},
    {"name": "ODC (Office of Drug Control)", "role": "Issues licences and permits for cultivation, manufacture, import, and export of narcotic drugs including cannabis under the Narcotic Drugs Act 1967", "website": "https://www.odc.gov.au", "country": "AU"},
    {"name": "DAFF (Department of Agriculture, Fisheries and Forestry)", "role": "Biosecurity controls on agricultural imports; relevant for dried cannabis flower import conditions", "website": "https://www.aff.gov.au", "country": "AU"},
    {"name": "ABF (Australian Border Force)", "role": "Customs and border enforcement; controls physical entry of goods including narcotics under import permits", "website": "https://www.abf.gov.au", "country": "AU"}
  ]'::jsonb,
  ARRAY[
    'TGA ARTG registration timelines of 12–24 months make SAS-B the only viable launch pathway; do not assume full registration is feasible at launch',
    'SAS-B volume is unpredictable and depends on individual prescriber adoption; build prescriber education programme early',
    'TGA GMP clearance for overseas manufacturers can take 3–6 months; begin this process before product launch planning is complete',
    'ODC import permits are consignment-specific — do not consolidate multiple product types into one permit unless explicitly permitted',
    'Dried cannabis flower may face DAFF biosecurity inspection delays; work with a customs broker experienced in controlled substances',
    'Australian sponsors typically demand significant commercial terms given regulatory burden; negotiate carefully on exclusivity scope and minimum volumes',
    'Cold chain validation for flower is not yet standardised in Australia; work with logistics partner familiar with TGA Good Distribution Practice requirements'
  ],
  'published',
  '2026-06-22'
)
ON CONFLICT (country_iso2) DO UPDATE SET
  country_name             = EXCLUDED.country_name,
  difficulty               = EXCLUDED.difficulty,
  typical_timeline_months  = EXCLUDED.typical_timeline_months,
  estimated_cost_range     = EXCLUDED.estimated_cost_range,
  legal_framework_summary  = EXCLUDED.legal_framework_summary,
  steps                    = EXCLUDED.steps,
  key_regulators           = EXCLUDED.key_regulators,
  common_pitfalls          = EXCLUDED.common_pitfalls,
  status                   = EXCLUDED.status,
  last_reviewed            = EXCLUDED.last_reviewed,
  updated_at               = now();

-- -----------------------------------------------------------------------------
-- 3. United Kingdom (GB)
-- -----------------------------------------------------------------------------
INSERT INTO public.jurisdiction_playbooks (
  country_iso2, country_name, difficulty, typical_timeline_months,
  estimated_cost_range, legal_framework_summary, steps, key_regulators,
  common_pitfalls, status, last_reviewed
) VALUES (
  'GB',
  'United Kingdom',
  'high',
  14,
  '£300K–£1.5M',
  'Medicinal cannabis in the UK is classified as a Schedule 2 Controlled Drug under the Misuse of Drugs Regulations 2001 (amended 2018). Import requires a Home Office Controlled Drug import licence plus a per-shipment import authorisation. Products supplied as unlicensed medicines (''specials'') must comply with MHRA''s Human Medicines Regulations 2012. Post-Brexit, the UK operates its own GMP framework aligned with — but legally distinct from — EU-GMP; the MHRA issues GMP certificates to UK and overseas manufacturers. Distribution requires a Wholesale Dealer Authorisation (WDA) from MHRA with a specific Schedule 2 CD endorsement. The NHS does not reimburse cannabis-based products for human use (CBPMs) except in very narrow indications (e.g. Epidyolex for epilepsy); the market is primarily private clinic-based. The MHRA''s unlicensed medicine (specials) route is the primary access pathway; full marketing authorisation is pursued by few products due to clinical trial cost.',
  '[
    {"step": 1, "title": "Engage MHRA-licensed UK importer/distributor", "description": "Identify a UK entity holding: (a) MHRA Wholesale Dealer Authorisation (WDA(H)) with a controlled drugs endorsement for Schedule 2 substances, and (b) Home Office Controlled Drug Dealer/Broker licence. The importer must be named on the Home Office import licence. They are responsible for UK pharmacovigilance (Yellow Card reporting) and MHRA compliance. Verify their existing CBPM portfolio and prescriber relationships in private cannabis clinics.", "estimated_weeks": 6, "required": true},
    {"step": 2, "title": "Obtain MHRA GMP certificate for manufacturing site", "description": "The overseas manufacturer must hold an MHRA GMP certificate (''Site Master File'' accepted post-Brexit). MHRA recognises GMP inspections from: EU member state NCAs under bilateral arrangements, Health Canada, TGA, and others. Submit an overseas GMP inspection application to MHRA or request recognition of existing EU-GMP certificate. MHRA processing: 3–6 months. If the manufacturing site has never been MHRA-inspected, budget 6–9 months. Without MHRA GMP, specials cannot be lawfully supplied.", "estimated_weeks": 20, "required": true},
    {"step": 3, "title": "Apply for Home Office Controlled Drug import licence", "description": "The UK importer applies to the Home Office Drug & Firearms Licensing Unit (DFLU) for an import licence covering the specific product/compound (cannabis resin, cannabis extract, THC, CBD). Required documents: company details, WDA copy, intended products, security arrangements, Responsible Person details. Processing: 3–6 months. Once the standing import licence is granted, per-consignment import authorisations must be applied for from the Home Office (Form BL/IMP) alongside INCB Form P1 from the exporting country.", "estimated_weeks": 16, "required": true},
    {"step": 4, "title": "Secure MHRA unlicensed medicine (specials) approval", "description": "Most CBPMs are supplied as unlicensed medicines under Regulation 167 of the Human Medicines Regulations 2012. The ''specials'' route allows supply to meet the specific needs of individual patients when no licensed product is available. The importer/wholesaler must hold a Manufacturer''s Specials Licence (MS) or import specials under the WDA(H). Specials must still meet GMP standards. Prepare an Investigational Medicinal Product Dossier (IMPD) or product information file as required by MHRA. Certain products may qualify for a UK marketing authorisation (UKMA) via MHRA national procedure.", "estimated_weeks": 8, "required": true},
    {"step": 5, "title": "Apply for per-consignment Home Office import authorisation", "description": "For each shipment, the UK importer submits Form BL/IMP to DFLU, specifying product, quantity, origin, exporter details, and vessel/courier. DFLU issues an import certificate. Simultaneously, the exporting country''s competent authority issues an export authorisation (INCB P2 form). Both documents must accompany the shipment. Typical processing: 2–4 weeks per consignment. Plan shipment schedules to allow permit lead time.", "estimated_weeks": 4, "required": true},
    {"step": 6, "title": "Establish prescriber access and pharmacy dispensing network", "description": "UK CBPMs are prescribed by specialist doctors (consultants) only — GPs may not initiate CBPM prescriptions (NHS guidance; private practice differs). Build relationships with private cannabis clinics (e.g. Sapphire, Mamedica, Cantourage UK). Engage a specialist pharmacy chain capable of dispensing Schedule 2 CDs (Dispex, Pharma.Care, etc.). Develop a Named Patient Programme (NPP) or Patient Support Programme (PSP) where appropriate. MHRA pharmacovigilance reporting obligations apply from first supply.", "estimated_weeks": 10, "required": true}
  ]'::jsonb,
  '[
    {"name": "MHRA (Medicines and Healthcare products Regulatory Agency)", "role": "Regulates medicinal cannabis as unlicensed medicines or licensed products; issues GMP certificates, Wholesale Dealer Authorisations, and Manufacturer''s Specials Licences", "website": "https://www.gov.uk/government/organisations/medicines-and-healthcare-products-regulatory-agency", "country": "GB"},
    {"name": "Home Office Drug & Firearms Licensing Unit (DFLU)", "role": "Issues Controlled Drug import/export licences and per-consignment authorisations under the Misuse of Drugs Act 1971 and Regulations 2001", "website": "https://www.gov.uk/government/organisations/home-office", "country": "GB"},
    {"name": "Care Quality Commission (CQC)", "role": "Regulates private healthcare providers including cannabis clinics that prescribe CBPMs; relevant for distributor clinic partners", "website": "https://www.cqc.org.uk", "country": "GB"}
  ]'::jsonb,
  ARRAY[
    'Home Office import licence application takes 3–6 months; begin application as soon as the UK importer partner is confirmed — do not wait for product finalisation',
    'MHRA specials route imposes volume limits and patient-specific supply requirements; high-volume commercial supply may require full UKMA which takes 18–36 months',
    'NHS formulary exclusion means private prescribing is the only viable market; private clinic patient volumes are growing but remain small compared to OTC markets',
    'MHRA GMP certificate must specifically cover cannabis products at the relevant manufacturing site; certificates covering other pharmaceuticals do not automatically extend',
    'Post-Brexit divergence from EU-GMP is modest today but may increase; monitor MHRA consultations on GMP reform',
    'Specialist-only prescribing rule significantly limits addressable prescriber base; prioritise high-volume private cannabis clinics over GP outreach',
    'Per-consignment Home Office import authorisations require 2–4 weeks lead time; build into supply chain planning to avoid stockouts'
  ],
  'published',
  '2026-06-22'
)
ON CONFLICT (country_iso2) DO UPDATE SET
  country_name             = EXCLUDED.country_name,
  difficulty               = EXCLUDED.difficulty,
  typical_timeline_months  = EXCLUDED.typical_timeline_months,
  estimated_cost_range     = EXCLUDED.estimated_cost_range,
  legal_framework_summary  = EXCLUDED.legal_framework_summary,
  steps                    = EXCLUDED.steps,
  key_regulators           = EXCLUDED.key_regulators,
  common_pitfalls          = EXCLUDED.common_pitfalls,
  status                   = EXCLUDED.status,
  last_reviewed            = EXCLUDED.last_reviewed,
  updated_at               = now();

-- -----------------------------------------------------------------------------
-- 4. Canada (CA)
-- -----------------------------------------------------------------------------
INSERT INTO public.jurisdiction_playbooks (
  country_iso2, country_name, difficulty, typical_timeline_months,
  estimated_cost_range, legal_framework_summary, steps, key_regulators,
  common_pitfalls, status, last_reviewed
) VALUES (
  'CA',
  'Canada',
  'moderate',
  8,
  'C$150K–C$500K operational setup',
  'Canada''s Cannabis Act (SC 2018, c. 16) and Cannabis Regulations (SOR/2018-144) create a comprehensive federal licensing framework for cannabis cultivation, processing, and sale. Canada is both a significant producer and a regulated exporter of cannabis for medical and scientific purposes. Export is governed by Part 14 of the Cannabis Regulations: a Standard Processing licence (or Micro-Processing) with export authority is required. Each shipment requires: (1) a Health Canada export permit issued via the Cannabis Tracking and Licensing System (CTLS), and (2) a corresponding import permit from the destination country''s competent authority. Canada has established bilateral frameworks with several countries (Germany, Australia, UK) facilitating permit exchange. Canada does not permit export of cannabis for adult-use purposes — all exports must be for medical or scientific use. Cannabis products exported must meet the Cannabis Regulations product standards and, if the destination requires it, foreign GMP standards (EU-GMP, TGA GMP, etc.). Canada''s federal GMP standard (C.02.029 of the Food and Drugs Regulations) is broadly equivalent to ICH Q7 but not auto-recognised by all jurisdictions.',
  '[
    {"step": 1, "title": "Confirm or obtain Health Canada cannabis licence with export authority", "description": "Verify that the Processing licence (Standard or Micro) held includes export authority under the Cannabis Regulations. If not held, apply via the Cannabis Licensing Application (CLA) on Health Canada''s portal. New licence applications take 6–12 months. Existing licensees can apply for a licence amendment to add export authority, typically 3–6 months. The licence must specify the classes of cannabis to be exported (e.g. dried cannabis, cannabis extracts, cannabis topicals).", "estimated_weeks": 16, "required": true},
    {"step": 2, "title": "Obtain foreign GMP certification for destination market", "description": "Determine the GMP standard required by the destination country (EU-GMP for Germany/Netherlands/Malta/Portugal; TGA GMP clearance for Australia; MHRA GMP for UK). Engage the relevant foreign competent authority or inspection body. Budget 6–12 months for EU-GMP certification if not already held. EU-GMP audit must cover the specific product scope (active substance manufacturer or finished product manufacturer, as applicable). Simultaneously develop product specifications meeting destination country requirements.", "estimated_weeks": 24, "required": true},
    {"step": 3, "title": "Secure import permit from destination country regulator", "description": "Coordinate with the destination country licensed importer to obtain their national import permit (e.g. BfArM §3 authorisation for Germany, ODC import permit for Australia). Health Canada will not issue an export permit until the destination country''s import permit is in hand. Build import permit lead times into your supply planning timeline — EU permits typically take 8–16 weeks.", "estimated_weeks": 12, "required": true},
    {"step": 4, "title": "Apply for Health Canada export permit via CTLS", "description": "Submit the export permit application through the Cannabis Tracking and Licensing System (CTLS) at canada.ca. Required information: destination country, importer name and licence details, product description, quantity, purpose (medical/scientific), destination country import permit reference number and copy. Health Canada processing: 10–20 business days. Each shipment requires a separate export permit — permits are not reusable. Ensure shipment quantities do not exceed permit authorisations.", "estimated_weeks": 4, "required": true},
    {"step": 5, "title": "Ensure products meet destination country specifications", "description": "Confirm that the product formulation, labelling, and COA meet all destination country requirements before manufacturing export batches: THC/CBD potency limits, pesticide MRLs (EU vs. Canadian limits differ), heavy metals, microbiology, solvent residues, and packaging child-resistance. Engage a regulatory consultant in the destination country for a pre-submission product gap analysis. Batch COAs must be available in English and, for some jurisdictions, translated.", "estimated_weeks": 6, "required": true},
    {"step": 6, "title": "Execute shipment and file post-export report", "description": "Ship under dual export/import permits. CBSA (Canada Border Services) will verify the Health Canada export permit at point of exit. Shipment must use an approved carrier and secure logistics chain. Within 15 days of export, file a post-export report with Health Canada via CTLS confirming actual quantities shipped. Retain all shipping records for 2 years per Cannabis Regulations requirements.", "estimated_weeks": 2, "required": true}
  ]'::jsonb,
  '[
    {"name": "Health Canada — Cannabis Regulation", "role": "Federal regulator for all cannabis licences, export permits, and compliance enforcement under the Cannabis Act and Cannabis Regulations", "website": "https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis.html", "country": "CA"},
    {"name": "CTLS (Cannabis Tracking and Licensing System)", "role": "Health Canada''s online portal for licence applications, permit applications, reporting, and compliance submissions", "website": "https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/industry-licensees-applicants/licensing-tracking-system.html", "country": "CA"},
    {"name": "CBSA (Canada Border Services Agency)", "role": "Administers customs controls at Canadian ports of exit; verifies export permits for controlled substances", "website": "https://www.cbsa-asfc.gc.ca", "country": "CA"}
  ]'::jsonb,
  ARRAY[
    'Export permitted only for medical or scientific purposes — adult-use product cannot be exported even if legal domestically; clearly document medical purpose in all export applications',
    'Each shipment requires its own export permit — permits are not reusable; plan CTLS applications 3–4 weeks ahead of planned ship date',
    'Destination country import permit must be received and referenced before Health Canada will issue export permit; coordinate tightly with foreign importer on their permit timeline',
    'Canadian federal GMP standard is not automatically recognised by EU, Australia, or UK; budget additional time and cost for foreign GMP certification',
    'CTLS system can experience processing delays; do not assume 10-business-day turnaround during Health Canada high-volume periods (year-end, post-holiday)',
    'Post-export report is mandatory within 15 days; failure to file is a regulatory violation under the Cannabis Regulations',
    'Provincial distribution restrictions do not apply to exports, but ensure product formulations comply with destination country rules before committing to export batches'
  ],
  'published',
  '2026-06-22'
)
ON CONFLICT (country_iso2) DO UPDATE SET
  country_name             = EXCLUDED.country_name,
  difficulty               = EXCLUDED.difficulty,
  typical_timeline_months  = EXCLUDED.typical_timeline_months,
  estimated_cost_range     = EXCLUDED.estimated_cost_range,
  legal_framework_summary  = EXCLUDED.legal_framework_summary,
  steps                    = EXCLUDED.steps,
  key_regulators           = EXCLUDED.key_regulators,
  common_pitfalls          = EXCLUDED.common_pitfalls,
  status                   = EXCLUDED.status,
  last_reviewed            = EXCLUDED.last_reviewed,
  updated_at               = now();

-- -----------------------------------------------------------------------------
-- 5. Israel (IL)
-- -----------------------------------------------------------------------------
INSERT INTO public.jurisdiction_playbooks (
  country_iso2, country_name, difficulty, typical_timeline_months,
  estimated_cost_range, legal_framework_summary, steps, key_regulators,
  common_pitfalls, status, last_reviewed
) VALUES (
  'IL',
  'Israel',
  'high',
  14,
  '$250K–$1M',
  'Israel has one of the world''s most mature and research-intensive medical cannabis programmes, having operated a government-managed programme since 2007. The Israeli Medical Cannabis Agency (IMCA), operating under the Ministry of Health (MOH), now oversees the regulatory framework following reforms in 2022–2023 that transitioned from the older IMC framework. All cannabis imports and exports require MOH narcotics unit permits. Israel is aligned with EU-GMP standards for manufactured cannabis products — Israeli GMP (Israeli Standards Institute / SII) mirrors EU-GMP Vol. 4. Importers must be Israeli-registered entities with MOH narcotics dealer licences. Exported products must carry a Certificate of Analysis from the exporting country''s GMP-certified manufacturer. Israel is both a significant import market and an established exporter of medical cannabis to EU jurisdictions, particularly Germany. Ongoing regulatory reforms (2023–2025) have introduced pharmacy-direct distribution and expanded indication coverage, but also created transitional uncertainty.',
  '[
    {"step": 1, "title": "Register with Israeli MOH narcotics unit", "description": "The Israeli importer or the foreign company''s Israeli subsidiary must register with the MOH narcotics unit as a licensed cannabis dealer (importer/distributor). Registration requires: Israeli company registration, facility security plan meeting MOH standards, responsible pharmacist (Pharmacist-in-Charge) appointment, and submission of narcotics dealer licence application. Processing: 3–6 months. A separate application may be required for each additional product class.", "estimated_weeks": 16, "required": true},
    {"step": 2, "title": "Obtain IMCA import or export licence", "description": "Apply to IMCA for an import licence specifying the product type, intended therapeutic indication, and annual import volumes. IMCA reviews the application against current MOH policy on approved product types and market need. For exports from Israel, an IMCA export licence plus MOH narcotics export permit is required per shipment. IMCA may request clinical evidence of product equivalence or superiority to currently available Israeli products before granting import approval.", "estimated_weeks": 12, "required": true},
    {"step": 3, "title": "Submit product registration dossier to MOH", "description": "Medical cannabis products imported into Israel must be registered with the Israeli MOH Pharmaceutical Division or approved under a named-patient compassionate use pathway. A full registration dossier follows CTD structure: quality data (Module 3), nonclinical summaries (Module 4), and clinical data (Module 5). Israeli MOH clinical data requirements may be satisfied by EMA or FDA clinical review decisions via a reliance pathway. Alternatively, a named-patient import authorisation can be sought for limited volumes pending full registration.", "estimated_weeks": 20, "required": true},
    {"step": 4, "title": "Secure GMP certification aligned with EU/Israeli standards", "description": "The manufacturing site must hold a GMP certificate recognised by Israeli MOH. Israeli MOH accepts EU-GMP certificates from recognised EU NCAs, TGA certificates, and Health Canada GMP certificates. Submit the current GMP certificate with scope details (active substance, finished product, or both) to MOH for recognition. If GMP certificate scope does not cover cannabis specifically, a site-specific inspection may be required by Israeli GMP inspectors.", "estimated_weeks": 16, "required": true},
    {"step": 5, "title": "Establish Israeli distributor partnership", "description": "Engage an Israeli distribution partner holding an MOH narcotics distribution licence. The distributor manages pharmacy relationships, patient access programmes, and regulatory reporting. Israeli distribution is concentrated among a small number of licensed entities. Negotiate territory, product allocation, minimum purchase commitments, and pharmacovigilance responsibilities. Israeli distributors typically require exclusivity; negotiate indication-specific or channel-specific carve-outs.", "estimated_weeks": 8, "required": true},
    {"step": 6, "title": "Apply for per-shipment narcotics import/export permits", "description": "For each import shipment, the Israeli importer applies to the MOH narcotics unit for an import permit (INCB Form P1). The exporting country must issue a corresponding export permit. Simultaneously, customs documentation must include a narcotics import declaration. Israeli customs (Israel Tax Authority customs division) will verify the MOH import permit at port of entry. Permits are specific to product, quantity, and shipment; no reuse.", "estimated_weeks": 4, "required": true}
  ]'::jsonb,
  '[
    {"name": "IMCA (Israel Medical Cannabis Agency)", "role": "Oversees medical cannabis licensing, import/export authorisations, and market oversight under the Ministry of Health", "website": "https://www.health.gov.il/English/Topics/Cannabis/Pages/default.aspx", "country": "IL"},
    {"name": "Israeli Ministry of Health — Pharmaceutical Division", "role": "Product registration authority for medicinal cannabis products; issues marketing authorisations and manages named-patient import approvals", "website": "https://www.health.gov.il", "country": "IL"},
    {"name": "Israeli Standards Institute (SII)", "role": "Publishes Israeli GMP standards (aligned with EU-GMP); relevant for local manufacturers and imported product quality benchmarks", "website": "https://www.sii.org.il", "country": "IL"}
  ]'::jsonb,
  ARRAY[
    'MOH processing timelines are unpredictable and can extend significantly during regulatory reform periods (2023–2025 transition from IMC to IMCA framework)',
    'Israeli product labelling requirements mandate Hebrew-language labels; labelling artwork must be submitted and approved before shipment — plan for artwork development and MOH review time',
    'Israeli distributors operate in a small, concentrated market and expect exclusive arrangements; negotiate carefully to preserve future channel flexibility',
    'Ongoing regulatory reform (IMCA framework evolution 2023–2025) creates policy uncertainty — approved import categories and clinical evidence requirements may change mid-process',
    'Named-patient import volumes are tightly controlled; scale requires full MOH product registration which demands clinical data package',
    'Israeli import market is highly price-sensitive due to competition from domestic licensed producers; conduct thorough pricing analysis before committing to market',
    'MOH may require comparative effectiveness or clinical equivalence data if a similar product is already available on the Israeli market'
  ],
  'published',
  '2026-06-22'
)
ON CONFLICT (country_iso2) DO UPDATE SET
  country_name             = EXCLUDED.country_name,
  difficulty               = EXCLUDED.difficulty,
  typical_timeline_months  = EXCLUDED.typical_timeline_months,
  estimated_cost_range     = EXCLUDED.estimated_cost_range,
  legal_framework_summary  = EXCLUDED.legal_framework_summary,
  steps                    = EXCLUDED.steps,
  key_regulators           = EXCLUDED.key_regulators,
  common_pitfalls          = EXCLUDED.common_pitfalls,
  status                   = EXCLUDED.status,
  last_reviewed            = EXCLUDED.last_reviewed,
  updated_at               = now();

-- -----------------------------------------------------------------------------
-- 6. Netherlands (NL)
-- -----------------------------------------------------------------------------
INSERT INTO public.jurisdiction_playbooks (
  country_iso2, country_name, difficulty, typical_timeline_months,
  estimated_cost_range, legal_framework_summary, steps, key_regulators,
  common_pitfalls, status, last_reviewed
) VALUES (
  'NL',
  'Netherlands',
  'high',
  18,
  '€300K–€1M',
  'The Netherlands operates a uniquely centralised medical cannabis supply system. The Bureau voor Medicinale Cannabis (BMC), a government body within the Ministry of Health, Welfare and Sport (VWS), holds a statutory monopoly on the domestic supply of pharmaceutical-grade medicinal cannabis to Dutch pharmacies. BMC contracts with Bedrocan Nederland B.V. as the sole licensed cultivator/manufacturer. Foreign producers cannot directly supply the Dutch medical cannabis market unless invited to participate in a BMC tender. Products supplied through BMC must meet pharmaceutical grade specifications equivalent to the Dutch Pharmacopoeia. Dutch pharmacies dispense Bedrocan products on prescription. A separate toleration policy (gedoogbeleid) covers cannabis sold in coffeeshops, but this involves domestically grown product under the ''regulated experiment'' (wiet-experiment) and is not open to foreign companies. As an EU member state, the Netherlands applies EU-GMP and EU Pharmacopeia standards to all medicinal cannabis products. The CBG (College ter Beoordeling van Geneesmiddelen — Medicines Evaluation Board) oversees medicinal product authorisations, and IGJ (Inspectie Gezondheidszorg en Jeugd) enforces GMP and distribution standards.',
  '[
    {"step": 1, "title": "Monitor BMC tender process and register interest", "description": "BMC conducts infrequent public tenders for medicinal cannabis supply contracts. Monitor the BMC website (minvws.nl) and the Dutch Government tender platform (TenderNed) for announcements. Register company and manufacturing site details with BMC in advance of tender publication. Engage a Dutch regulatory consultant to monitor tender developments and advise on application timing. Note: no tender has been open to foreign competition on equal terms to date; engagement is preparatory.", "estimated_weeks": 8, "required": true},
    {"step": 2, "title": "Achieve Bedrocan-equivalent pharmaceutical quality standards", "description": "BMC requires products that are equivalent in quality to Bedrocan''s pharmaceutical-grade cannabis: standardised cannabinoid content, defined terpene profiles, microbiological limits per Ph.Eur., pesticide MRLs per EU MRL regulations (EC 396/2005), heavy metals per Ph.Eur. 2.4.27, solvent residues if applicable. Commission a full Ph.Eur.-aligned analytical panel on production batches. Engage a Dutch Qualified Person (QP) or EU-based regulatory consultancy to assess compliance gaps.", "estimated_weeks": 16, "required": true},
    {"step": 3, "title": "Obtain EU-GMP certification covering cannabis products", "description": "All medicinal cannabis supplied in the Netherlands must be manufactured under EU-GMP. Obtain a GMP certificate from a recognised EU competent authority covering the manufacturing scope (active substance manufacture, finished product manufacture, or both). For non-EU manufacturers, this requires an inspection by an EU member state GMP authority or recognition of a third-country GMP inspection. Submit the GMP certificate to BMC as part of tender documentation.", "estimated_weeks": 24, "required": true},
    {"step": 4, "title": "Submit product samples and quality dossier to BMC", "description": "Upon tender opening, submit a full quality dossier to BMC: Manufacturing Site Master File (SMF), Product Quality Review (PQR) for at least 3 batches, analytical methods and validation data, stability data (ICH Q1 conditions), and Certificate of Analysis for submitted samples. BMC conducts a technical evaluation over several months. Physical product samples are required for independent laboratory analysis by BMC.", "estimated_weeks": 20, "required": true},
    {"step": 5, "title": "Negotiate supply terms with BMC and initiate pharmacy distribution", "description": "If selected in the tender, negotiate the BMC supply agreement covering pricing, delivery schedule, quality specifications, recall procedures, and pharmacovigilance obligations. BMC sets the wholesale price and retail price to pharmacies. Distribution to Dutch pharmacies is managed exclusively through BMC''s logistics arrangements — there is no independent distribution channel. Ensure packaging meets Dutch pharmacy labelling requirements under the Geneesmiddelenwet (Medicines Act).", "estimated_weeks": 8, "required": true}
  ]'::jsonb,
  '[
    {"name": "BMC (Bureau voor Medicinale Cannabis)", "role": "Government-mandated monopoly supplier of pharmaceutical-grade medicinal cannabis to Dutch pharmacies; conducts supplier tenders", "website": "https://www.minvws.nl/onderwerpen/medicinale-cannabis/bureau-voor-medicinale-cannabis", "country": "NL"},
    {"name": "CBG (College ter Beoordeling van Geneesmiddelen)", "role": "Dutch Medicines Evaluation Board; oversees medicinal product marketing authorisations and product assessments", "website": "https://www.cbg-meb.nl", "country": "NL"},
    {"name": "IGJ (Inspectie Gezondheidszorg en Jeugd)", "role": "Healthcare and GMP inspectorate; enforces EU-GMP compliance and distribution standards for medicinal cannabis", "website": "https://www.igj.nl", "country": "NL"},
    {"name": "TenderNed", "role": "Dutch government tender platform where BMC publishes supply contract tenders", "website": "https://www.tenderned.nl", "country": "NL"}
  ]'::jsonb,
  ARRAY[
    'BMC monopoly is absolute for the medical market — there is no alternative pathway to supply Dutch pharmacies outside of a BMC tender selection',
    'Tender windows are infrequent and unpredictable; the Netherlands should be treated as a long-term market entry requiring years of preparation',
    'Bedrocan product specifications are extremely precise (e.g. Bedrocan: 22% THC ±1%, Bediol: 6.3% THC ±1%, 8% CBD ±1%); competing products must match this precision',
    'The wiet-experiment (regulated adult-use pilot in select municipalities) does not accept imported products; all supply must come from licensed Dutch growers',
    'EU-GMP certification must specifically cover cannabis — a GMP certificate for a different product class does not automatically qualify',
    'BMC sets prices; there is no opportunity to negotiate retail pricing with pharmacies or set premium pricing independently',
    'Dutch INCB narcotics import documentation requirements apply even to BMC-contracted shipments; ensure per-shipment narcotics certificates are prepared'
  ],
  'published',
  '2026-06-22'
)
ON CONFLICT (country_iso2) DO UPDATE SET
  country_name             = EXCLUDED.country_name,
  difficulty               = EXCLUDED.difficulty,
  typical_timeline_months  = EXCLUDED.typical_timeline_months,
  estimated_cost_range     = EXCLUDED.estimated_cost_range,
  legal_framework_summary  = EXCLUDED.legal_framework_summary,
  steps                    = EXCLUDED.steps,
  key_regulators           = EXCLUDED.key_regulators,
  common_pitfalls          = EXCLUDED.common_pitfalls,
  status                   = EXCLUDED.status,
  last_reviewed            = EXCLUDED.last_reviewed,
  updated_at               = now();

-- -----------------------------------------------------------------------------
-- 7. Colombia (CO)
-- -----------------------------------------------------------------------------
INSERT INTO public.jurisdiction_playbooks (
  country_iso2, country_name, difficulty, typical_timeline_months,
  estimated_cost_range, legal_framework_summary, steps, key_regulators,
  common_pitfalls, status, last_reviewed
) VALUES (
  'CO',
  'Colombia',
  'moderate',
  10,
  '$100K–$400K',
  'Colombia legalised medical and scientific cannabis through Law 1787 of 2016 and its implementing Decree 613 of 2017 (and subsequent amendments, including Decree 811/2021 expanding industrial hemp). Colombia is one of the world''s largest licensed cannabis producers, leveraging favourable climate, lower labour costs, and a maturing export regulatory infrastructure. Regulation is split between two agencies: INVIMA (Instituto Nacional de Vigilancia de Medicamentos y Alimentos) oversees pharmaceutical manufacture, product registration, and export authorisation for processed cannabis products; ICA (Instituto Colombiano Agropecuario) oversees cultivation licences, seed-to-harvest compliance, and export of raw material. For pharmaceutical-grade exports to EU markets, EU-GMP or WHO-GMP certification is required. Colombia''s FTA with the EU (2012) facilitates market access but does not provide automatic GMP recognition. Exports require a dual INVIMA + ICA export authorisation plus the receiving country''s import permit. Colombia has executed successful bilateral export programmes to Germany, Australia, and the UK.',
  '[
    {"step": 1, "title": "Obtain ICA cannabis cultivation/processing licence", "description": "Apply to ICA (Instituto Colombiano Agropecuario) for a cannabis cultivation or seed/plant production licence. Application submitted via ICA''s online platform (ica.gov.co). Licence categories: seeds for fibre use, cultivation of psychoactive cannabis (THC >1%), cultivation of non-psychoactive cannabis (THC ≤1%), manufacturing/transformation. Facility must meet ICA''s Good Agricultural and Collection Practices (GACP). Processing time: 3–6 months for initial licence; annual renewal required.", "estimated_weeks": 12, "required": true},
    {"step": 2, "title": "Obtain INVIMA pharmaceutical manufacturing and export authorisation", "description": "Apply to INVIMA for a cannabis manufacturing licence (for extracts, oils, capsules) and an export authorisation. INVIMA requires: facility compliance inspection, pharmaceutical quality management system (QMS) aligned with INVIMA GMP standards (based on ICH Q10), a Pharmaceutical Technical Director (Director Técnico Farmacéutico). For EU export, INVIMA GMP may not be sufficient alone — EU-GMP certification from a recognised EU authority is also required. INVIMA processing: 4–8 months.", "estimated_weeks": 20, "required": true},
    {"step": 3, "title": "Achieve EU-GMP or WHO-GMP certification for export products", "description": "Engage an EU GMP inspection body (or an EU member state NCA willing to inspect Colombian facilities) to conduct a site inspection and issue a GMP certificate. Alternatively, pursue WHO-GMP (PIC/S) certification, which is accepted by some non-EU markets. EU-GMP inspection in Colombia may be conducted by: Spanish AEMPS, German ZLG, or other EU NCAs with international inspection authority. Budget €50K–€150K for GMP gap remediation and inspection. Timeline: 12–18 months from gap analysis to certificate.", "estimated_weeks": 32, "required": true},
    {"step": 4, "title": "Identify and contract EU-licensed importer", "description": "Identify a licensed pharmaceutical importer in the target EU market (Germany, UK, Netherlands, etc.) who holds the relevant import licences and controlled substance authorisations. Execute a commercial supply agreement, quality technical agreement, and pharmacovigilance agreement. Provide full product dossier to the EU importer for their regulatory submission. Confirm that the importer''s existing licence scope covers cannabis imports from Colombia.", "estimated_weeks": 8, "required": true},
    {"step": 5, "title": "Apply for per-shipment export permits from INVIMA and ICA", "description": "For each export shipment, submit a joint INVIMA/ICA export permit application. Required documents: INVIMA export certificate, ICA export permit (Form 4-0042 or equivalent), product COA, import permit from destination country, shipping details. Both agencies must countersign before the export permit is issued. Processing: 2–4 weeks per shipment. Permits are not batch-reusable.", "estimated_weeks": 4, "required": true},
    {"step": 6, "title": "Establish quality-controlled export logistics chain", "description": "Export from Colombia via Bogotá El Dorado (BOG) or Medellín José María Córdova (MDE) airports with GDP-compliant pharmaceutical logistics providers. Validate temperature excursion monitoring for all shipments. DIAN (Colombian tax/customs authority) will inspect exported goods against the INVIMA/ICA export permit. Engage a customs broker with experience in Colombian narcotics exports. Document chain of custody from cultivation through export for regulatory audit trail.", "estimated_weeks": 6, "required": true}
  ]'::jsonb,
  '[
    {"name": "INVIMA (Instituto Nacional de Vigilancia de Medicamentos y Alimentos)", "role": "Regulates pharmaceutical manufacturing, product registration, and export authorisation for processed cannabis products", "website": "https://www.invima.gov.co", "country": "CO"},
    {"name": "ICA (Instituto Colombiano Agropecuario)", "role": "Regulates cannabis cultivation licences, seed-to-harvest compliance, and raw material export permits", "website": "https://www.ica.gov.co", "country": "CO"},
    {"name": "DIAN (Dirección de Impuestos y Aduanas Nacionales)", "role": "Colombian customs authority; processes export declarations and verifies INVIMA/ICA export documentation", "website": "https://www.dian.gov.co", "country": "CO"}
  ]'::jsonb,
  ARRAY[
    'EU-GMP certification is demanding for Colombian producers and many are still in the certification process; verify GMP status rigorously before committing to EU supply agreements',
    'Dual INVIMA + ICA export permit requirement means delays at either agency can block an entire shipment; build buffer time into shipment schedules',
    'Colombian peso volatility affects contract USD/EUR pricing; use appropriate FX hedging if contracts are in COP',
    'Logistics complexity for perishable products (especially dried flower) from Colombia to EU: long transit times, humidity controls, and GDP compliance are critical',
    'Colombian regulatory environment continues to evolve (Decree 811/2021 hemp framework, 2022 export rule amendments); maintain local regulatory counsel',
    'Not all Colombian GMP-certified facilities have been inspected by EU NCAs; do not assume INVIMA GMP certification = EU-GMP recognition',
    'Product shelf-life must accommodate long supply chains (Colombia to EU is typically air freight, 3–5 days, but regulatory hold times can add weeks)'
  ],
  'published',
  '2026-06-22'
)
ON CONFLICT (country_iso2) DO UPDATE SET
  country_name             = EXCLUDED.country_name,
  difficulty               = EXCLUDED.difficulty,
  typical_timeline_months  = EXCLUDED.typical_timeline_months,
  estimated_cost_range     = EXCLUDED.estimated_cost_range,
  legal_framework_summary  = EXCLUDED.legal_framework_summary,
  steps                    = EXCLUDED.steps,
  key_regulators           = EXCLUDED.key_regulators,
  common_pitfalls          = EXCLUDED.common_pitfalls,
  status                   = EXCLUDED.status,
  last_reviewed            = EXCLUDED.last_reviewed,
  updated_at               = now();

-- -----------------------------------------------------------------------------
-- 8. United States (US)
-- -----------------------------------------------------------------------------
INSERT INTO public.jurisdiction_playbooks (
  country_iso2, country_name, difficulty, typical_timeline_months,
  estimated_cost_range, legal_framework_summary, steps, key_regulators,
  common_pitfalls, status, last_reviewed
) VALUES (
  'US',
  'United States',
  'very_high',
  24,
  '$1M–$5M+ per state',
  'Cannabis remains a Schedule I controlled substance under the federal Controlled Substances Act (CSA, 21 U.S.C. §811). Consequently, there is no federal licensing pathway for cannabis commerce; all legal frameworks operate exclusively at the state level. As of mid-2025, 24 states plus DC have enacted adult-use (recreational) cannabis markets, and 38 states have medical cannabis programmes. Interstate commerce in cannabis is prohibited regardless of the legal status in each state, creating a fully balkanised market requiring independent licensing, supply chains, and compliance programmes in each state entered. The DEA''s proposed rescheduling of cannabis to Schedule III (NPRM published 2024) is under review and, if finalised, would not create an interstate commerce pathway but would remove the 280E federal tax burden. Banking access remains severely restricted under FinCEN guidance and the Bank Secrecy Act, though the SAFER Banking Act has been introduced in successive Congresses. Each state regulatory authority (e.g. California DCC, Colorado MED, Michigan CRA, Illinois IDFPR) independently sets licensing categories, application windows, caps, operating requirements, social equity provisions, and seed-to-sale tracking mandates.',
  '[
    {"step": 1, "title": "Select target state(s) and assess licensing landscape", "description": "Prioritise states based on: market size (California ~$5B retail, Colorado ~$1.8B, Michigan ~$3B, Illinois ~$2B annual sales), licence availability (open vs. capped), application window timing, competition density, and social equity requirements. Commission a state-by-state licensing feasibility study with a cannabis licensing attorney. Pay particular attention to licence caps (Arizona, New York, New Jersey have capped certain categories), application merit scoring criteria, and residency or ownership restrictions (some states require majority in-state ownership).", "estimated_weeks": 8, "required": true},
    {"step": 2, "title": "Research state licence category, application window, and operational requirements", "description": "Each state has distinct licence categories (cultivator, processor, retailer, distributor, microbusiness, vertically integrated). Some states (e.g. California) have separate distributor licences; others require vertical integration. Obtain the state''s licensing regulations, application form, and scoring rubric. Identify: background check requirements (personal disclosures for all >5% owners), facility requirements (security, zoning, ventilation), financial capability thresholds, and social equity eligibility criteria that may provide application scoring advantages.", "estimated_weeks": 6, "required": true},
    {"step": 3, "title": "Engage state cannabis attorney and compliance consultant", "description": "Retain a licensed attorney in each target state with demonstrated cannabis licensing and compliance experience. Regulatory frameworks change frequently via legislative amendment, regulatory guidance updates, and court decisions. The attorney will manage background check submissions, review all regulatory filings, and advise on local zoning approvals (municipalities often have separate approval requirements beyond the state licence). A compliance consultant can develop the Standard Operating Procedures (SOPs) required by state applications.", "estimated_weeks": 4, "required": true},
    {"step": 4, "title": "Prepare and submit state licence application", "description": "Cannabis licence applications typically require: business entity formation and ownership disclosure, facility lease or purchase documentation, security plan, employee training plan, environmental compliance plan, SOPs for all operations, seed-to-sale tracking system vendor selection (METRC in most states), financial statements, and — increasingly — a social equity plan. Application fees range from $5,000 to $50,000+. Merit-based review states (vs. lottery states) require robust application narratives. Budget 3–6 months of attorney and consultant time for application preparation.", "estimated_weeks": 20, "required": true},
    {"step": 5, "title": "Implement seed-to-sale tracking system (METRC or state-specific)", "description": "METRC (Marijuana Enforcement Tracking Reporting Compliance) is used in 20+ states as the mandated seed-to-sale tracking platform. METRC API integration is required for all licensed operators. Some states (e.g. California via BioTrack, Washington via LEAF) use alternative systems. Budget for METRC licensing fees, hardware (RFID tags, scanners), IT integration, and staff training. Compliance failures in seed-to-sale tracking are among the most common violations leading to licence suspension.", "estimated_weeks": 8, "required": true},
    {"step": 6, "title": "Establish state-compliant banking and financial infrastructure", "description": "Most major banks and credit unions do not serve cannabis businesses due to federal Schedule I status. Identify state-chartered banks or credit unions with active cannabis banking programmes (there are ~700 nationwide per FinCEN). Establish a dedicated cannabis bank account, cash management protocols, and armoured courier service for cash handling. Engage a cannabis-specialised accountant familiar with IRS Code §280E (which disallows federal deductions for Schedule I trafficking businesses) until DEA rescheduling is finalised.", "estimated_weeks": 6, "required": true},
    {"step": 7, "title": "Await licence approval and build state-compliant supply chain", "description": "Licence approval timelines vary dramatically: California (DCC) may take 3–12 months; Michigan CRA 3–6 months; Illinois IDFPR 6–24 months for adult-use. During the waiting period: finalise facility build-out, hire and train staff, negotiate vendor agreements (packaging, inputs, ancillaries), and prepare for state inspections. Upon licence issuance, conduct a pre-opening inspection with the state regulator before commencing operations. Each state supply chain must be fully closed-loop within state borders.", "estimated_weeks": 40, "required": true}
  ]'::jsonb,
  '[
    {"name": "California DCC (Department of Cannabis Control)", "role": "Regulates cultivation, distribution, manufacturing, testing, and retail in California — the largest US cannabis market", "website": "https://cannabis.ca.gov", "country": "US"},
    {"name": "Colorado MED (Marijuana Enforcement Division)", "role": "State regulator for adult-use and medical cannabis licensing, enforcement, and seed-to-sale tracking in Colorado", "website": "https://sbg.colorado.gov/med", "country": "US"},
    {"name": "Michigan CRA (Cannabis Regulatory Agency)", "role": "State regulator for Michigan''s adult-use and medical cannabis markets, one of the fastest-growing in the US", "website": "https://www.michigan.gov/cra", "country": "US"},
    {"name": "Illinois IDFPR (Department of Financial and Professional Regulation)", "role": "Oversees cannabis licensing and compliance in Illinois for both dispensary and cultivation/processing operations", "website": "https://idfpr.illinois.gov", "country": "US"},
    {"name": "DEA (Drug Enforcement Administration)", "role": "Federal enforcement of the Controlled Substances Act; managing Schedule III rescheduling NPRM process for cannabis as of 2024–2025", "website": "https://www.dea.gov", "country": "US"}
  ]'::jsonb,
  ARRAY[
    'No interstate commerce is legal — even between two legal adult-use states; each state requires fully independent operations, licences, and supply chains',
    'IRS §280E prohibits federal tax deductions for Schedule I cannabis businesses; effective tax rates of 60–70% are common; budget accordingly until DEA rescheduling is resolved',
    'Banking access is severely restricted; plan for cash-heavy operations and the associated security and compliance costs',
    'Licence caps and lotteries in many states (New York, New Jersey, Ohio) mean application approval is not guaranteed even with a strong application',
    'Social equity requirements vary significantly by state; in some states (Illinois, California) social equity applicants receive priority processing and fee waivers — structure ownership accordingly',
    'State regulations change frequently via legislative session and regulatory guidance; compliance obligations can shift after licensing, requiring ongoing legal monitoring',
    'METRC seed-to-sale tracking violations are among the leading causes of licence suspension; invest heavily in staff training and IT integration from day one',
    'DEA Schedule III rescheduling, if finalised, removes 280E burden but does NOT legalise interstate commerce or create a federal licence pathway'
  ],
  'published',
  '2026-06-22'
)
ON CONFLICT (country_iso2) DO UPDATE SET
  country_name             = EXCLUDED.country_name,
  difficulty               = EXCLUDED.difficulty,
  typical_timeline_months  = EXCLUDED.typical_timeline_months,
  estimated_cost_range     = EXCLUDED.estimated_cost_range,
  legal_framework_summary  = EXCLUDED.legal_framework_summary,
  steps                    = EXCLUDED.steps,
  key_regulators           = EXCLUDED.key_regulators,
  common_pitfalls          = EXCLUDED.common_pitfalls,
  status                   = EXCLUDED.status,
  last_reviewed            = EXCLUDED.last_reviewed,
  updated_at               = now();

-- -----------------------------------------------------------------------------
-- 9. Uruguay (UY)
-- -----------------------------------------------------------------------------
INSERT INTO public.jurisdiction_playbooks (
  country_iso2, country_name, difficulty, typical_timeline_months,
  estimated_cost_range, legal_framework_summary, steps, key_regulators,
  common_pitfalls, status, last_reviewed
) VALUES (
  'UY',
  'Uruguay',
  'high',
  18,
  '$200K–$600K',
  'Uruguay was the first country in the world to fully legalise and regulate the adult-use cannabis market through Law 19.172 (2013) and its implementing regulations (Decree 120/014). The market is regulated by IRCCA (Instituto de Regulación y Control del Cannabis), which operates under JUNASA/MSP (Ministry of Public Health). Three access channels exist: (1) pharmacy sales (registered users, max 40g/month, citizens and permanent residents only), (2) cannabis clubs (non-profit member associations, 15–45 members, domestic cultivation only), and (3) home grow (up to 6 plants per household). The IRCCA monitoring system (SACCA — Sistema de Análisis y Control del Cannabis) tracks all legal cannabis transactions. Critically, Uruguay currently does not authorise cannabis exports — the legal framework is purely domestic. Foreign companies wishing to operate in Uruguay must establish a local legal entity and cannot supply through foreign parent companies. Product pricing is set or heavily influenced by IRCCA policy (pharmacy channel prices are government-set). Plain packaging and strict anti-advertising rules apply. The medical cannabis sector is underdeveloped relative to the adult-use channel.',
  '[
    {"step": 1, "title": "Establish Uruguayan legal entity", "description": "Incorporate a Uruguayan Sociedad Anónima (S.A.) or Sociedad de Responsabilidad Limitada (S.R.L.) via the Agencia para el Desarrollo del Gobierno de Gestión Electrónica y la Sociedad de la Información y del Conocimiento (AGESIC) e-government portal or through a local notary. Foreign ownership is permitted but beneficial ownership must be disclosed. Engage a Uruguayan legal counsel specialising in corporate and cannabis law. Obtain RUT (tax ID) from DGI (Dirección General Impositiva) and register with BPS (social security) for any employees.", "estimated_weeks": 8, "required": true},
    {"step": 2, "title": "Apply for IRCCA cultivation or processing licence", "description": "Submit a licence application to IRCCA for the appropriate activity: (a) grower-importer for pharmacy supply, (b) industrial hemp cultivator, or (c) cannabis club (separate non-profit framework). The grower-importer licence for pharmacy supply is the most commercially significant; applicants must demonstrate: Uruguayan entity, facility (land or indoor), security plan, quality management capability, and compliance with IRCCA''s Technical Standards (Normas Técnicas). IRCCA may conduct a pre-application consultation. Processing: 6–12 months.", "estimated_weeks": 24, "required": true},
    {"step": 3, "title": "Register in IRCCA monitoring system (SACCA)", "description": "All licensed operators must integrate with SACCA, IRCCA''s seed-to-sale and transaction monitoring system. SACCA registration involves: technical integration with IRCCA''s data platform, assignment of unique plant and lot identifiers, and mandatory real-time reporting of cultivation, harvest, processing, and sales data. Engage an IT provider experienced with SACCA integration. Non-compliance with SACCA reporting is a serious regulatory violation.", "estimated_weeks": 8, "required": true},
    {"step": 4, "title": "Comply with IRCCA quality and packaging standards", "description": "Products for pharmacy supply must meet IRCCA Normas Técnicas quality standards: standardised THC content, microbiological limits, pesticide limits, and packaging specifications (plain packaging with no branding beyond product name and IRCCA batch code). Packaging must include health warnings per MSP requirements. Labels must be in Spanish. Engage an Uruguayan pharmaceutical laboratory for batch testing. Establish internal QMS aligned with IRCCA standards.", "estimated_weeks": 12, "required": true},
    {"step": 5, "title": "Supply through IRCCA-approved pharmacy distribution channel", "description": "Products may only be sold to registered Uruguayan citizens/residents through pharmacies that have enrolled in the IRCCA programme. There are approximately 16 participating pharmacies nationally. IRCCA controls the allocation of supply between licensed producers and pharmacies. Negotiate supply agreements with IRCCA as intermediary. Pharmacy channel pricing is set by government at approximately USD $1.30/gram (as of 2023 pricing) — well below international market prices.", "estimated_weeks": 6, "required": true},
    {"step": 6, "title": "Annual licence renewal and ongoing IRCCA audits", "description": "IRCCA licences require annual renewal with continued demonstration of compliance: updated facility inspection, SACCA reporting review, batch testing results, and financial compliance with DGI tax obligations. IRCCA may conduct unannounced audits. Maintain detailed records of all cultivation, processing, inventory, and sales activities. Any non-compliance can result in licence suspension or revocation. Engage an ongoing regulatory compliance consultant.", "estimated_weeks": 4, "required": true}
  ]'::jsonb,
  '[
    {"name": "IRCCA (Instituto de Regulación y Control del Cannabis)", "role": "Primary regulator for all cannabis activities in Uruguay: licensing, monitoring (SACCA system), quality standards, and market oversight", "website": "https://www.ircca.gub.uy", "country": "UY"},
    {"name": "MSP (Ministerio de Salud Pública)", "role": "Ministry of Public Health; sets health policy for cannabis including packaging health warnings and pharmacy channel oversight", "website": "https://www.gub.uy/ministerio-salud-publica", "country": "UY"},
    {"name": "DGI (Dirección General Impositiva)", "role": "Uruguayan tax authority; administers IRAE corporate tax and IVA/VAT for cannabis businesses", "website": "https://www.dgi.gub.uy", "country": "UY"}
  ]'::jsonb,
  ARRAY[
    'Cannabis export from Uruguay is currently not authorised; Uruguay cannot serve as a source country for exports to other markets under current law',
    'Foreign direct investment restrictions and local entity requirement increase operational complexity and cost for non-Uruguayan companies',
    'Government-set pharmacy prices (~USD $1.30/gram) are far below international medical or premium adult-use pricing; margin compression is severe',
    'Market size is inherently limited: Uruguay population ~3.5 million; only registered citizens/residents can purchase through pharmacies, and only 16 pharmacies participate',
    'SACCA integration is technically demanding and mandatory from day one of operations; budget for IT integration and ongoing compliance',
    'IRCCA licence processing timelines of 6–12 months are variable and opaque; engage local legal counsel who has existing IRCCA relationships',
    'Plain packaging and advertising prohibition means brand differentiation is minimal; compete primarily on quality consistency and supply reliability'
  ],
  'published',
  '2026-06-22'
)
ON CONFLICT (country_iso2) DO UPDATE SET
  country_name             = EXCLUDED.country_name,
  difficulty               = EXCLUDED.difficulty,
  typical_timeline_months  = EXCLUDED.typical_timeline_months,
  estimated_cost_range     = EXCLUDED.estimated_cost_range,
  legal_framework_summary  = EXCLUDED.legal_framework_summary,
  steps                    = EXCLUDED.steps,
  key_regulators           = EXCLUDED.key_regulators,
  common_pitfalls          = EXCLUDED.common_pitfalls,
  status                   = EXCLUDED.status,
  last_reviewed            = EXCLUDED.last_reviewed,
  updated_at               = now();

-- -----------------------------------------------------------------------------
-- 10. Thailand (TH)
-- -----------------------------------------------------------------------------
INSERT INTO public.jurisdiction_playbooks (
  country_iso2, country_name, difficulty, typical_timeline_months,
  estimated_cost_range, legal_framework_summary, steps, key_regulators,
  common_pitfalls, status, last_reviewed
) VALUES (
  'TH',
  'Thailand',
  'moderate',
  10,
  '$150K–$500K',
  'Thailand delisted cannabis from its narcotics list in June 2022 via an amendment to the Narcotic Drugs Act B.E. 2522 (1979), making Thailand the first Southeast Asian country to do so. However, the regulatory situation has remained complex and in flux. As of 2025: cannabis extracts containing >0.2% THC (including resin, oil, and other high-THC extracts) remain controlled substances under the Narcotics Code. Dried cannabis flower (non-extract) is no longer a controlled substance but commercial sale for recreational purposes remains legally ambiguous. The Thai FDA (Food and Drug Administration, Ministry of Public Health) regulates medical cannabis products, which must be registered as herbal medicinal products or pharmaceutical products. A comprehensive Cannabis and Hemp Act has been under parliamentary deliberation since 2023 and, if passed, would establish clearer frameworks for both medical and commercial use while likely re-restricting recreational cannabis. Foreign investors may participate through joint ventures with Thai entities. GMP certification from Thai FDA is required for manufacturing. Export of medical cannabis requires Thai FDA export licence and narcotics export permit for controlled extracts.',
  '[
    {"step": 1, "title": "Register with Thai FDA as medical cannabis importer/exporter", "description": "Register the company (or Thai joint venture entity) with the Thai FDA''s Cannabis and Hemp Division. Foreign companies must operate through a Thai-registered entity or joint venture (JV) due to Foreign Business Act B.E. 2542 restrictions on foreign majority ownership in certain sectors. The Thai entity must be registered with DBD (Department of Business Development) with appropriate business category codes for pharmaceutical trading. Apply for a medical cannabis import/export licence from the Thai FDA narcotics control division.", "estimated_weeks": 12, "required": true},
    {"step": 2, "title": "Obtain GMP certification from Thai FDA for manufacturing site", "description": "All cannabis products supplied in Thailand must be manufactured at a Thai FDA GMP-certified facility. For imported products, Thai FDA may recognise GMP certificates from WHO-GMP-accredited authorities (PIC/S members, EU NCAs). Apply for Thai FDA manufacturing site recognition by submitting: current GMP certificate, Site Master File, and product quality dossier. Thai FDA conducts desk-based review; physical inspection of overseas sites is uncommon but possible. Processing: 3–6 months.", "estimated_weeks": 16, "required": true},
    {"step": 3, "title": "Apply for product registration or special import certificate", "description": "Medical cannabis products must be registered with Thai FDA as Traditional Herbal Products, Modern Traditional Medicine, or Pharmaceutical Products depending on the formulation and claims. Alternatively, for imports for specific medical use, a Special Import Certificate (SIC) may be obtained for patient-specific or hospital formulary supply without full product registration. Product registration requires: quality data, clinical evidence (Thai FDA may accept foreign regulatory decisions), and labelling in Thai language.", "estimated_weeks": 16, "required": true},
    {"step": 4, "title": "Establish Thai local partner or distributor", "description": "Engage a Thai pharmaceutical distributor or hospital pharmacy system as the commercial distribution partner. Thai FDA licensed pharmaceutical wholesalers must hold a Drug Store Licence (Type 3 for wholesale) from the provincial health authority. The local partner manages prescriber and hospital relationships, regulatory reporting, and pharmacovigilance. Given JV requirements, structuring commercial agreements must consider Thai foreign ownership limitations. Negotiate distribution scope, pricing, and exclusivity terms.", "estimated_weeks": 8, "required": true},
    {"step": 5, "title": "Apply for per-shipment export/import permits", "description": "For products containing >0.2% THC (controlled extracts), each shipment requires: a Thai FDA narcotics export/import permit, an INCB export/import certificate from both origin and destination countries, and customs clearance documentation. For non-controlled flower products, standard pharmaceutical import documentation applies without narcotics permits. Thai Customs (Royal Thai Customs Department) processes import declarations; ensure HS code classification aligns with current Thai customs tariff schedule for cannabis products.", "estimated_weeks": 4, "required": true}
  ]'::jsonb,
  '[
    {"name": "Thai FDA — Cannabis and Hemp Division (Ministry of Public Health)", "role": "Primary regulator for cannabis and hemp products; issues manufacturing licences, product registrations, and import/export permits", "website": "https://fda.moph.go.th", "country": "TH"},
    {"name": "Ministry of Public Health (MOPH)", "role": "Oversees health policy including cannabis medical use framework; parent ministry of Thai FDA", "website": "https://www.moph.go.th", "country": "TH"},
    {"name": "DBD (Department of Business Development)", "role": "Registers Thai business entities including JVs with foreign ownership; administers Foreign Business Act compliance", "website": "https://www.dbd.go.th", "country": "TH"},
    {"name": "Royal Thai Customs Department", "role": "Administers import/export customs clearance including narcotics documentation for cannabis shipments", "website": "https://www.customs.go.th", "country": "TH"}
  ]'::jsonb,
  ARRAY[
    'Regulatory framework is rapidly changing: monitor 2025 Cannabis and Hemp Act status closely — it may re-restrict recreational cannabis and alter the medical cannabis import pathway significantly',
    'THC extract restrictions (>0.2% THC remains controlled) significantly limit importable product types; most commercial medical cannabis products exceed this threshold',
    'Foreign Business Act restrictions mean foreign companies cannot hold majority ownership in Thai cannabis operations without a Foreign Business Licence (difficult to obtain)',
    'Tourism-focused recreational cannabis retail (open since 2022) is legally ambiguous and may be prohibited under the forthcoming Cannabis Act; do not build business models on recreational retail assumptions',
    'GMP standards are not yet fully harmonised with EU or ICH standards; Thai FDA may require additional testing beyond what EU certificates cover',
    'Thai FDA processing timelines for product registration are long (12–18 months for full registration); plan for SIC route as the launch pathway',
    'Joint venture partners with strong hospital and clinic relationships are scarce; thorough due diligence on Thai partner is essential before committing to market entry'
  ],
  'published',
  '2026-06-22'
)
ON CONFLICT (country_iso2) DO UPDATE SET
  country_name             = EXCLUDED.country_name,
  difficulty               = EXCLUDED.difficulty,
  typical_timeline_months  = EXCLUDED.typical_timeline_months,
  estimated_cost_range     = EXCLUDED.estimated_cost_range,
  legal_framework_summary  = EXCLUDED.legal_framework_summary,
  steps                    = EXCLUDED.steps,
  key_regulators           = EXCLUDED.key_regulators,
  common_pitfalls          = EXCLUDED.common_pitfalls,
  status                   = EXCLUDED.status,
  last_reviewed            = EXCLUDED.last_reviewed,
  updated_at               = now();

-- -----------------------------------------------------------------------------
-- 11. Malta (MT)
-- -----------------------------------------------------------------------------
INSERT INTO public.jurisdiction_playbooks (
  country_iso2, country_name, difficulty, typical_timeline_months,
  estimated_cost_range, legal_framework_summary, steps, key_regulators,
  common_pitfalls, status, last_reviewed
) VALUES (
  'MT',
  'Malta',
  'moderate',
  12,
  '€150K–€500K',
  'Malta legalised personal adult-use cannabis possession and home cultivation through the Cannabis Reform Authorisation Act (Act LV of 2021), making it the first EU country to do so. The Malta Authority on the Responsible Use of Cannabis (ARUC) was established to oversee adult-use cannabis clubs (non-profit, members only). For medicinal cannabis, Malta operates under the EU pharmaceutical framework: products require EU-GMP certification and must be authorised by the Malta Medicines Authority (MMA) — either through a national marketing authorisation procedure or via EMA centralised procedure. Malta is positioning itself as an EU cannabis regulatory hub and export gateway, with the government actively encouraging licensed cannabis operators to establish EU-based entities in Malta for passporting regulatory approvals across the EU. The MMA issues import licences and wholesale dealer authorisations. Malta''s membership in the EU means all EU pharmaceutical directives, EU-GMP requirements, and EU narcotics control frameworks (UN Single Convention, Schengen Agreement drug import/export protocols) apply fully. Import of medical cannabis into Malta from a non-EU country requires an EU Schengen Zone narcotics import certificate issued by MMA.',
  '[
    {"step": 1, "title": "Obtain Malta Medicines Authority import and wholesale licence", "description": "Apply to the Malta Medicines Authority (MMA) for: (a) a Wholesale Dealer Licence (WDL) under Article 42 of the Medicines Act (Chapter 458 of the Laws of Malta), which must specifically cover controlled substances (Schedule 1 narcotics), and (b) an import licence for medicinal cannabis. Application requires: Maltese company registration (or EU subsidiary), Qualified Person (QP) appointment, GDP-compliant storage facility in Malta, and a responsible person for narcotics. MMA processing: 3–6 months. Malta is an EU member state — QP must be EU-qualified.", "estimated_weeks": 16, "required": true},
    {"step": 2, "title": "Ensure EU-GMP certification for all products and manufacturing sites", "description": "All medicinal cannabis products supplied in Malta must be manufactured under EU-GMP as governed by EudraLex Volume 4. The manufacturing site GMP certificate must be issued by an EU competent authority or be recognised under an EU Mutual Recognition Agreement (MRA). For non-EU manufacturers, pursue EU-GMP certification via an EU member state NCA inspection. The GMP certificate must be listed in the EudraGMDP database. Scope must specifically cover cannabis product manufacture.", "estimated_weeks": 24, "required": true},
    {"step": 3, "title": "Register medicinal product with MMA or via EMA", "description": "Submit a medicinal product marketing authorisation application to MMA (national procedure) or to EMA (centralised procedure). National procedure dossier: CTD Modules 1–5. MMA may use the Mutual Recognition Procedure (MRP) if the product is already approved in another EU member state (e.g. Germany, Netherlands). MMA processing for national procedure: 12–18 months. For products with existing EU approvals, a recognition/decentralised procedure is significantly faster. Alternatively, confirm eligibility for a pharmacy magistral preparation (compounding) pathway.", "estimated_weeks": 20, "required": true},
    {"step": 4, "title": "Obtain EU Schengen narcotics import certificate from MMA", "description": "For each shipment from a non-EU/non-Schengen country, the Malta importer applies to MMA for an EU Schengen import certificate (Form S). MMA issues the certificate which is presented to the exporting country''s competent authority for their corresponding export authorisation. EU Schengen drug import certificates are valid for one consignment. Processing: 2–4 weeks per certificate. Shipments within the EU Schengen area between member states do not require INCB certificates but require EU intra-Community drug transfer documentation.", "estimated_weeks": 4, "required": true},
    {"step": 5, "title": "Engage Malta-licensed wholesale distributor and pharmacy network", "description": "Identify a Malta-based pharmaceutical wholesale distributor holding a WDL with controlled substance endorsement. Malta has a small pharmacy network (~250 pharmacies nationwide). Engage the Malta Chamber of Pharmacists for prescriber and pharmacy outreach. Malta''s small domestic market means that most commercially viable Malta operations are structured to leverage Malta as an EU entry point for broader EU distribution, rather than as an end-market in itself.", "estimated_weeks": 8, "required": true}
  ]'::jsonb,
  '[
    {"name": "MMA (Malta Medicines Authority)", "role": "Regulates medicinal products in Malta including marketing authorisations, import licences, wholesale dealer licences, and EU Schengen narcotics import certificates", "website": "https://medicinesauthority.gov.mt", "country": "MT"},
    {"name": "ARUC (Authority for the Responsible Use of Cannabis)", "role": "Oversees Malta''s adult-use cannabis clubs under the Cannabis Reform Authorisation Act 2021; distinct from the medicinal cannabis regulatory pathway", "website": "https://aruc.gov.mt", "country": "MT"},
    {"name": "MCCAA (Malta Competition and Consumer Affairs Authority)", "role": "Consumer protection and market competition oversight; relevant for cannabis product advertising and consumer claims compliance", "website": "https://mccaa.org.mt", "country": "MT"}
  ]'::jsonb,
  ARRAY[
    'Malta''s domestic market is small (~500K population); commercial viability typically depends on using Malta as an EU regulatory gateway for broader EU distribution rather than as a standalone market',
    'EU-GMP certification is mandatory — non-EU manufacturers without EU-GMP cannot access Malta or any EU market for medicinal cannabis',
    'Product registration via MMA national procedure takes 12–18 months; plan for MRP or DCP reliance pathway if the product is already approved in another EU member state',
    'QP requirement is non-negotiable; if the company does not have an EU-based QP, this must be contracted through a third-party QP service provider, adding cost and complexity',
    'Malta pharmacy network is small; prescribing community is developing — do not expect high patient volumes from domestic market alone',
    'ARUC adult-use club framework does not create a commercial import pathway; imported products cannot be supplied to adult-use clubs',
    'Schengen narcotics import certificates are per-consignment; build 4-week lead time into supply chain planning for each shipment'
  ],
  'published',
  '2026-06-22'
)
ON CONFLICT (country_iso2) DO UPDATE SET
  country_name             = EXCLUDED.country_name,
  difficulty               = EXCLUDED.difficulty,
  typical_timeline_months  = EXCLUDED.typical_timeline_months,
  estimated_cost_range     = EXCLUDED.estimated_cost_range,
  legal_framework_summary  = EXCLUDED.legal_framework_summary,
  steps                    = EXCLUDED.steps,
  key_regulators           = EXCLUDED.key_regulators,
  common_pitfalls          = EXCLUDED.common_pitfalls,
  status                   = EXCLUDED.status,
  last_reviewed            = EXCLUDED.last_reviewed,
  updated_at               = now();

-- -----------------------------------------------------------------------------
-- 12. Portugal (PT)
-- -----------------------------------------------------------------------------
INSERT INTO public.jurisdiction_playbooks (
  country_iso2, country_name, difficulty, typical_timeline_months,
  estimated_cost_range, legal_framework_summary, steps, key_regulators,
  common_pitfalls, status, last_reviewed
) VALUES (
  'PT',
  'Portugal',
  'moderate',
  12,
  '€200K–€700K',
  'Portugal legalised medicinal cannabis through Law 33/2018 and Decree-Law 8/2019, establishing a regulatory framework for cultivation, production, import, export, and medicinal use. INFARMED (Autoridade Nacional do Medicamento e Produtos de Saúde, I.P.) is the competent authority for all medicinal cannabis market authorisations, import licences, and export licences. Portugal has taken advantage of its EU membership and historically liberal drug policy (personal use decriminalisation since 2001 under Law 30/2000) to develop a growing licensed cannabis cultivation and export sector. Portuguese-grown cannabis is exported to Germany and other EU markets. For imported products, EU-GMP certification is required. All medicinal cannabis products must be authorised via INFARMED marketing authorisation or supplied as magistral preparations (extemporaneous compounding by pharmacies). Portugal does not have an adult-use commercial cannabis market — Law 30/2000 decriminalised personal possession but did not legalise commercial sale. INFARMED issues narcotics import licences (licença de importação de estupefacientes) under Decree-Law 15/93 for individual consignments. Prescribing requires specialist physician authorisation (médico especialista).',
  '[
    {"step": 1, "title": "Identify INFARMED-licensed Portuguese importer/distributor", "description": "Engage a Portuguese pharmaceutical wholesale company holding an INFARMED Wholesale Distribution Authorisation (ACD — Autorização de Comércio por Grosso) with a controlled substances endorsement for estupefacientes (narcotics). The importer is responsible for INFARMED regulatory submissions, pharmacovigilance reporting (under Portuguese Decree-Law 176/2006 — Estatuto do Medicamento), and narcotics import permit applications. Verify the importer''s existing cannabis product portfolio and INFARMED relationship. Negotiate commercial terms, territory scope, and minimum purchase volumes.", "estimated_weeks": 6, "required": true},
    {"step": 2, "title": "Obtain EU-GMP certification for manufacturing site", "description": "All medicinal cannabis products imported into Portugal must be manufactured under EU-GMP (EudraLex Vol. 4). Obtain a GMP certificate from a recognised EU competent authority (or third-country authority covered by EU MRA). The GMP certificate must be registered in EudraGMDP. INFARMED may conduct or request a GMP inspection of the manufacturing site. For non-EU manufacturers without existing EU-GMP, engage a partner EU NCA for inspection scheduling. Processing: 6–12 months from audit to certificate.", "estimated_weeks": 24, "required": true},
    {"step": 3, "title": "Apply for INFARMED narcotics import authorisation", "description": "The Portuguese importer applies to INFARMED''s Narcotics and Psychotropics Unit (Unidade de Estupefacientes e Psicotrópicos) for an import authorisation (licença de importação) for the specific product. Required documents: product identification, manufacturer GMP certificate, importer ACD, intended therapeutic use, annual import quantity, and import country export authorisation (or confirmation it will be provided). INFARMED processing: 6–9 months for new product authorisations. Annual renewal required. Per-shipment import certificates are then issued within 2–4 weeks per consignment.", "estimated_weeks": 28, "required": true},
    {"step": 4, "title": "Register medicinal product with INFARMED or confirm magistral pathway", "description": "For commercial scale, pursue INFARMED marketing authorisation (AIM — Autorização de Introdução no Mercado) via national procedure or MRP/DCP (if already approved in another EU member state). AIM processing: 12–18 months national, 6–12 months MRP reliance. Alternatively, magistral (compounding) preparations can be supplied to pharmacies on a named-patient basis without a full AIM — this is the most common route for imported cannabis flower and extracts. For magistral preparations, INFARMED listing as an active pharmaceutical ingredient (API) in the Formulário Galénico Português may be required.", "estimated_weeks": 20, "required": true},
    {"step": 5, "title": "Establish prescriber and pharmacy distribution network", "description": "Medicinal cannabis in Portugal requires a specialist physician prescription (receita médica especial for controlled substances). Build relationships with oncologists, pain specialists, and neurologists — the primary prescribing specialties. Engage pharmacy chains and hospital pharmacy services. Portugal has approximately 3,000 pharmacies nationwide. Develop a Medical Affairs programme (within Portuguese pharmaceutical marketing regulations — INFARMED Circular No. 2/CD/2016) to support prescriber education. Pharmacovigilance reporting to INFARMED is mandatory from first supply.", "estimated_weeks": 10, "required": true}
  ]'::jsonb,
  '[
    {"name": "INFARMED (Autoridade Nacional do Medicamento e Produtos de Saúde, I.P.)", "role": "Primary national competent authority for medicinal cannabis: marketing authorisations, import/export licences, narcotics control, GMP inspections, and pharmacovigilance", "website": "https://www.infarmed.pt", "country": "PT"},
    {"name": "SICAD (Serviço de Intervenção nos Comportamentos Aditivos e nas Dependências)", "role": "Manages harm reduction and addiction monitoring; oversees statistics on cannabis use; relevant for compliance with national drug policy requirements", "website": "https://www.sicad.pt", "country": "PT"},
    {"name": "APIFARMA (Associação Portuguesa da Indústria Farmacêutica)", "role": "Industry association for pharmaceutical companies in Portugal; provides regulatory guidance and industry intelligence relevant to cannabis market entry", "website": "https://www.apifarma.pt", "country": "PT"}
  ]'::jsonb,
  ARRAY[
    'INFARMED narcotics import authorisation processing takes 6–9 months for new products; this is the critical path item and must be initiated as early as possible',
    'Prescribing community for cannabis remains small and developing; Portugal does not yet have the specialist cannabis clinic infrastructure seen in UK or Germany — prescriber education investment is essential',
    'Reimbursement by the SNS (Serviço Nacional de Saúde) is absent for cannabis products; market is entirely out-of-pocket or private insurance, limiting patient volumes',
    'Competition from domestic Portuguese cannabis cultivators/producers who have established INFARMED relationships and lower logistics costs than importers',
    'Magistral preparation pathway volumes are limited by the capacity of compounding pharmacies and the requirement for individual prescriptions — not suitable for high-volume commercial supply',
    'Annual renewal of narcotics import authorisation requires ongoing compliance documentation; any lapse in GMP certificate or product changes requires re-notification to INFARMED',
    'Portuguese pharmaceutical marketing regulations are strict; ensure all prescriber communications comply with INFARMED Circular No. 2/CD/2016 on promotional activities'
  ],
  'published',
  '2026-06-22'
)
ON CONFLICT (country_iso2) DO UPDATE SET
  country_name             = EXCLUDED.country_name,
  difficulty               = EXCLUDED.difficulty,
  typical_timeline_months  = EXCLUDED.typical_timeline_months,
  estimated_cost_range     = EXCLUDED.estimated_cost_range,
  legal_framework_summary  = EXCLUDED.legal_framework_summary,
  steps                    = EXCLUDED.steps,
  key_regulators           = EXCLUDED.key_regulators,
  common_pitfalls          = EXCLUDED.common_pitfalls,
  status                   = EXCLUDED.status,
  last_reviewed            = EXCLUDED.last_reviewed,
  updated_at               = now();

COMMIT;
