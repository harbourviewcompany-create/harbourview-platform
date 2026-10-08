
-- RECOVERY BEGIN 20260622000007_jurisdiction_playbooks_tier1_seed.sql
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


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622000007','jurisdiction_playbooks_tier1_seed','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622000007_jurisdiction_playbooks_tier1_seed.sql

-- RECOVERY BEGIN 20260622020340_add_education_module_sections.sql
create table if not exists education_module_sections (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references education_modules(id) on delete cascade,
  section_order int not null,
  heading text not null,
  body text not null,
  block_type text not null default 'text',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_id, section_order)
);

alter table education_module_sections enable row level security;

create policy "public read sections of published modules"
on education_module_sections
for select
to anon, authenticated
using (
  exists (
    select 1 from education_modules m
    where m.id = education_module_sections.module_id
    and m.publication_state = 'published'
  )
);

create index if not exists idx_education_module_sections_module_id
on education_module_sections (module_id, section_order);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622020340','add_education_module_sections','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622020340_add_education_module_sections.sql

-- RECOVERY BEGIN 20260622090000_intelligence_worker_v2_distributed_safety.sql
-- Intelligence engine v2 worker: distributed-safety primitives (part 2).
--
-- acquire_crawl_targets() already exists in production (created by a
-- concurrent session while this migration was being drafted) and is a
-- correct, equivalent FOR UPDATE SKIP LOCKED implementation -- not
-- recreated here. This migration adds the two pieces that don't exist yet:
-- a shared (cross-instance) domain circuit breaker, and a worker heartbeat
-- table.

create or replace function public.is_hv_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from user_roles
    where user_roles.user_id = auth.uid()
      and user_roles.role in ('admin', 'operator', 'analyst')
  );
$$;

revoke all on function public.is_hv_staff() from public, authenticated;
grant execute on function public.is_hv_staff() to service_role;

create table if not exists public.crawl_domain_circuit_state (
  domain text primary key,
  consecutive_failures int not null default 0,
  locked_until timestamptz,
  last_failure_at timestamptz,
  last_success_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.crawl_domain_circuit_state enable row level security;

drop policy if exists crawl_domain_circuit_state_staff_read on public.crawl_domain_circuit_state;
create policy crawl_domain_circuit_state_staff_read on public.crawl_domain_circuit_state
  for select using (is_hv_staff());

create index if not exists idx_crawl_domain_circuit_state_locked
  on public.crawl_domain_circuit_state (locked_until)
  where locked_until is not null;

create table if not exists public.worker_heartbeats (
  worker_id text primary key,
  status text not null default 'starting',
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  targets_processed_total bigint not null default 0,
  last_error text,
  updated_at timestamptz not null default now()
);

alter table public.worker_heartbeats enable row level security;

drop policy if exists worker_heartbeats_staff_read on public.worker_heartbeats;
create policy worker_heartbeats_staff_read on public.worker_heartbeats
  for select using (is_hv_staff());


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622090000','intelligence_worker_v2_distributed_safety','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622090000_intelligence_worker_v2_distributed_safety.sql

-- RECOVERY BEGIN 20260622091003_seed_subnational_canada.sql

-- Canada: 10 provinces + 3 territories (all Adult-Use Legal since Oct 17, 2018)

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'ontario','state','CA','CA-ON','Adult-Use Legal; Medical Legal',
'Ontario is Canada''s largest and most commercially developed provincial cannabis market. The province launched adult-use sales on April 1, 2019 under a licensed private retail model overseen by the Alcohol and Gaming Commission of Ontario (AGCO). From fewer than 25 stores at launch, Ontario grew to over 1,800 licensed retail locations by 2026, making it one of the world''s largest regulated cannabis retail ecosystems. Minimum purchase age is 19. Adults may possess up to 30 grams in public and cultivate up to four plants at home under federal rules.',
'Medical patients access cannabis through federally licensed producers (LPs) under Health Canada''s medical access framework, with products delivered by mail or dispensed at LP storefronts. Adult-use consumers purchase from AGCO-licensed private retail stores or the Ontario Cannabis Store (OCS) online. OCS operates as the province''s wholesale distributor to all retail stores and also sells directly to consumers online.',
'Healthcare practitioners registered with Health Canada''s medical program may authorize cannabis for patients without a specific list of qualifying conditions — clinical judgement determines appropriateness. The College of Physicians and Surgeons of Ontario (CPSO) provides guidance encouraging evidence-based authorization.',
'Ontario generates the largest provincial cannabis revenue in Canada, with annual retail sales exceeding CAD 2.5 billion as of 2025. Over 1,800 licensed private retail stores compete in a highly competitive market. OCS handles provincial wholesale distribution. The sector employs tens of thousands and generates significant provincial tax revenue.',
'Ontario''s mature retail market is entering a consolidation phase as smaller operators face competition from multi-location retailers and established chains. OCS continues refining its wholesale distribution and direct online sales model. Regulatory streamlining to reduce licensing friction is ongoing.',
'Alcohol and Gaming Commission of Ontario (AGCO) licenses and regulates retail stores and cannabis employees. Ontario Cannabis Store (OCS) operates provincial wholesale and direct online sales. Health Canada administers federal medical access.',
'AGCO retail licensing database; OCS wholesale data; Health Canada medical program statistics; Ontario Ministry of Finance cannabis tax reports','Current as of Q2 2026; verified against AGCO official data','Quarterly','Full provincial briefing covering private retail model, OCS wholesale, and market scale',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='CA' AND state_iso2='CA-ON');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'british-columbia','state','CA','CA-BC','Adult-Use Legal; Medical Legal',
'British Columbia launched adult-use cannabis retail in November 2018 with a hybrid model combining government-operated BC Cannabis Stores and licensed private retail. BC has developed a sophisticated market that reflects its long pre-legalization culture of cannabis use and craft production. Minimum age is 19. Adults may possess up to 30 grams publicly and cultivate up to four plants at home. BC has positioned itself as a craft cannabis production hub with a strong independent producer community.',
'Medical patients access federally licensed producer products via mail or LP storefronts. Adult-use consumers purchase from BC Cannabis Stores (government-operated) or licensed private retailers throughout the province. Online delivery is available through government and select private channels.',
'Healthcare practitioners may authorize medical cannabis for patients under Health Canada''s framework without a prescribed qualifying conditions list. The BC College of Physicians and Surgeons provides guidance on evidence-based practice.',
'BC''s cannabis market is among Canada''s most developed, with hundreds of licensed private retailers complementing government stores. The province has a strong craft producer sector with many small-batch producers licensed under Health Canada''s micro-license category. Annual retail sales are estimated at CAD 800 million and growing.',
'BC is developing enhanced craft cannabis branding and appellations to support its independent producer community. Retail consolidation is ongoing. Regulatory frameworks supporting cannabis tourism and on-site consumption are under development.',
'BC Liquor Distribution Branch (LCRB) licenses private retail stores. BC Cannabis Stores (government retail) operated by BCLDB. Health Canada administers federal medical and producer licensing.',
'LCRB retail licensing data; BCLDB annual reports; Health Canada producer registry; BC cannabis revenue statistics','Current as of Q2 2026; verified against LCRB official data','Quarterly','Full provincial briefing covering hybrid retail model and craft production sector',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='CA' AND state_iso2='CA-BC');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'alberta','state','CA','CA-AB','Adult-Use Legal; Medical Legal',
'Alberta was the first Canadian province to fully commit to a private retail model for adult-use cannabis, launching sales on October 17, 2018 — Canada''s federal legalization day. With a minimum purchase age of 18 (the lowest in Canada), Alberta operates a fully private retail system with no government stores, making it the most market-liberal province. The Alberta Gaming, Liquor and Cannabis Commission (AGLC) serves as the provincial wholesaler and licensing authority. Alberta has over 800 licensed retail stores as of 2026.',
'Medical patients access federally licensed producer products through Health Canada''s program. Adult-use consumers purchase from AGLC-licensed private retail stores, which are the only point-of-sale channel. AGLC operates myALBERTA cannabis as the provincial wholesale platform supplying all licensed retailers.',
'Healthcare practitioners authorize medical cannabis under Health Canada''s framework. The College of Physicians and Surgeons of Alberta (CPSA) provides guidance encouraging evidence-based authorization.',
'Alberta''s fully private retail market has produced one of Canada''s most competitive cannabis retail environments. Over 800 stores compete for market share. Annual retail sales exceed CAD 800 million. Alberta is home to several major cannabis retail chains that have expanded nationally and internationally.',
'Alberta''s private retail model is mature and financially stable. AGLC continues refining the wholesale distribution and licensing system. Further market consolidation among retailers is expected. Cannabis tourism interest has grown given the 18+ minimum age.',
'Alberta Gaming, Liquor and Cannabis Commission (AGLC) licenses retailers and operates provincial wholesale. Health Canada administers federal medical and producer licensing.',
'AGLC retail licensing data and wholesale statistics; Health Canada producer registry; Alberta cannabis revenue data; AGLC annual reports','Current as of Q2 2026; verified against AGLC official data','Quarterly','Full provincial briefing covering fully private retail model and market-liberal framework',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='CA' AND state_iso2='CA-AB');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'quebec','state','CA','CA-QC','Adult-Use Legal (Restrictive); Medical Legal',
'Quebec operates Canada''s most restrictive provincial adult-use framework. The Société québécoise du cannabis (SQDC) holds a government monopoly on retail sales. Quebec set the minimum purchase age at 21 (raised from 18 in 2020), the highest in Canada. Home cultivation is prohibited by provincial law (though contested against the federal Cannabis Act). Cannabis consumption in public spaces is subject to more restrictions than most provinces. Despite restrictions, the SQDC has grown to over 100 locations province-wide and generates significant revenue.',
'Medical patients access federally licensed producer products through Health Canada''s program independent of the SQDC. Adult-use consumers must purchase exclusively from SQDC stores or the SQDC website with provincial delivery. No private retail is permitted.',
'Healthcare practitioners authorize medical cannabis under Health Canada''s federal framework. Quebec''s medical system follows federal guidelines, with the Collège des médecins du Québec providing provincial guidance.',
'SQDC operates a government monopoly with over 100 retail locations as of 2026 and growing online sales. Annual revenues exceed CAD 500 million. Despite restrictive policies, Quebec''s large population makes it a significant market. The prohibition on home cultivation and minimum age of 21 differentiates Quebec from all other provinces.',
'SQDC expansion continues. Home cultivation prohibition has faced constitutional challenge — federal Cannabis Act permits cultivation, creating legal tension that may eventually require Quebec to align with federal law. The 21+ minimum age may face legal challenge under Charter equality arguments.',
'Société québécoise du cannabis (SQDC) operates retail monopoly. Régie des alcools, des courses et des jeux (RACJ) oversees compliance. Health Canada administers federal medical framework.',
'SQDC annual reports and store data; RACJ regulatory guidance; Health Canada federal program statistics; home cultivation constitutional litigation monitoring','Current as of Q2 2026; verified against SQDC and RACJ official data','Quarterly','Provincial briefing covering government retail monopoly, age-21 restriction, and home cultivation prohibition',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='CA' AND state_iso2='CA-QC');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'manitoba','state','CA','CA-MB','Adult-Use Legal; Medical Legal',
'Manitoba adopted a private retail model for adult-use cannabis with the Manitoba Liquor and Lotteries (MLL) Commission overseeing licensing, wholesale distribution, and compliance. Sales launched October 17, 2018. Minimum age is 19. Adults may cultivate up to four plants at home. Manitoba''s market is smaller than Ontario, BC, and Alberta but has developed a stable retail network.',
'Medical patients use Health Canada''s federal program. Adult-use consumers purchase from MLL-licensed private retail stores. MLL operates the provincial wholesale platform and enforces retail regulations.',
'Healthcare practitioners authorize medical cannabis under Health Canada''s federal framework. The College of Physicians and Surgeons of Manitoba provides provincial guidance.',
'Manitoba has a growing number of licensed private cannabis retailers serving the province. Market size is proportional to population (approximately 1.4 million). Annual retail sales are estimated in the range of CAD 120–150 million. Competition between retailers is established.',
'Manitoba''s market is mature at provincial scale. Regulatory refinements continue as the retail sector stabilizes. On-site consumption licensing may be considered in future regulatory reviews.',
'Manitoba Liquor and Lotteries (MLL) licenses retailers and operates wholesale distribution. Health Canada administers federal programs.',
'MLL retail licensing data; Health Canada producer registry; Manitoba cannabis revenue statistics','Current as of Q2 2026','Quarterly','Provincial briefing covering private retail model',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='CA' AND state_iso2='CA-MB');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'saskatchewan','state','CA','CA-SK','Adult-Use Legal; Medical Legal',
'Saskatchewan was one of the first provinces to operationalize a fully private retail model when adult-use cannabis launched October 17, 2018. The Saskatchewan Liquor and Gaming Authority (SLGA) oversees licensing and acts as provincial wholesaler. Minimum age is 19. Adults may cultivate up to four plants at home. Saskatchewan has developed an efficient private retail network serving both urban centres and rural communities.',
'Medical patients use Health Canada''s federal program. Adult-use consumers purchase from SLGA-licensed private retail stores. SLGA manages provincial wholesale distribution to all licensed retailers.',
'Healthcare practitioners authorize medical cannabis under Health Canada''s federal framework. The College of Physicians and Surgeons of Saskatchewan provides provincial guidance.',
'Saskatchewan''s market serves a population of approximately 1.2 million. The fully private retail model has resulted in competitive pricing and distribution coverage across urban and rural areas. Annual retail sales are estimated in the range of CAD 100–130 million.',
'Saskatchewan''s established private retail market continues to operate steadily. Further rural retail coverage development is ongoing. Regulatory efficiency improvements are expected.',
'Saskatchewan Liquor and Gaming Authority (SLGA) licenses retailers and operates wholesale. Health Canada administers federal programs.',
'SLGA retail licensing data; Health Canada producer registry; Saskatchewan cannabis revenue statistics','Current as of Q2 2026','Quarterly','Provincial briefing covering private retail model',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='CA' AND state_iso2='CA-SK');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'nova-scotia','state','CA','CA-NS','Adult-Use Legal; Medical Legal',
'Nova Scotia launched adult-use cannabis retail through the Nova Scotia Liquor Corporation (NSLC), which initially operated as a government monopoly before introducing limited private retail licensing. Minimum age is 19. Adults may cultivate up to four plants at home. The NSLC operates brick-and-mortar stores and an online delivery platform.',
'Medical patients use Health Canada''s federal program. Adult-use consumers purchase from NSLC-operated stores or licensed private retailers. NSLC manages provincial wholesale.',
'Healthcare practitioners authorize under Health Canada''s federal framework. Nova Scotia College of Physicians and Surgeons provides provincial guidance.',
'Nova Scotia''s market serves a population of approximately 1 million. NSLC has expanded its cannabis retail footprint while introducing private retail competition. Annual retail sales are estimated at CAD 80–100 million.',
'Nova Scotia continues to mature its hybrid government/private retail model. Further private retail licensing is expected as the market develops.',
'Nova Scotia Liquor Corporation (NSLC) operates retail and wholesale. Health Canada administers federal programs.',
'NSLC annual reports; Health Canada producer registry; Nova Scotia cannabis revenue data','Current as of Q2 2026','Quarterly','Provincial briefing covering hybrid government/private retail model',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='CA' AND state_iso2='CA-NS');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'new-brunswick','state','CA','CA-NB','Adult-Use Legal; Medical Legal',
'New Brunswick launched adult-use cannabis through Cannabis NB, a Crown corporation. Cannabis NB operates a network of government retail stores and an online platform. Minimum age is 19. Adults may cultivate up to four plants at home. Cannabis NB serves as both retailer and provincial wholesaler.',
'Medical patients use Health Canada''s federal program. Adult-use consumers purchase from Cannabis NB stores or the Cannabis NB website. No private retail operates alongside the government monopoly.',
'Healthcare practitioners authorize under Health Canada''s federal framework. The College of Physicians and Surgeons of New Brunswick provides provincial guidance.',
'New Brunswick''s market serves a bilingual (French/English) population of approximately 800,000. Cannabis NB operates a stable retail network. Annual retail sales are estimated at CAD 60–80 million.',
'Cannabis NB continues operating as the provincial retail monopoly. Private retail licensing has been discussed but not yet implemented. Further store expansions are planned.',
'Cannabis NB (Crown Corporation) operates retail and wholesale. Health Canada administers federal programs.',
'Cannabis NB annual reports; Health Canada producer registry; New Brunswick cannabis revenue data','Current as of Q2 2026','Quarterly','Provincial briefing covering government retail monopoly',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='CA' AND state_iso2='CA-NB');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'newfoundland-and-labrador','state','CA','CA-NL','Adult-Use Legal; Medical Legal',
'Newfoundland and Labrador launched adult-use cannabis retail on October 17, 2018 with a private retail model under the Newfoundland and Labrador Liquor Corporation (NLC) oversight. The province was one of the first to authorize private retail stores. Minimum age is 19. Adults may cultivate up to four plants at home.',
'Medical patients use Health Canada''s federal program. Adult-use consumers purchase from NLC-licensed private retail stores or the NLC online store. NLC operates provincial wholesale.',
'Healthcare practitioners authorize under Health Canada''s federal framework. The Newfoundland and Labrador Medical Association provides provincial guidance.',
'Newfoundland and Labrador''s market serves a population of approximately 540,000 including remote coastal communities. Private retail stores operate in major urban areas. Annual retail sales are estimated at CAD 45–60 million.',
'The province continues developing its private retail network with increasing coverage in smaller communities. NLC''s oversight framework continues to mature.',
'Newfoundland and Labrador Liquor Corporation (NLC) licenses retailers and operates wholesale. Health Canada administers federal programs.',
'NLC licensing data; Health Canada producer registry; NL cannabis revenue statistics','Current as of Q2 2026','Quarterly','Provincial briefing covering private retail model',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='CA' AND state_iso2='CA-NL');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'prince-edward-island','state','CA','CA-PE','Adult-Use Legal; Medical Legal',
'Prince Edward Island operates adult-use cannabis through the PEI Cannabis Management Corporation, a government entity managing retail and wholesale. The province launched cannabis retail on October 17, 2018. Minimum age is 19. Adults may cultivate up to four plants at home. PEI is the smallest province by population, with a seasonal tourism industry that creates unique market dynamics.',
'Medical patients use Health Canada''s federal program. Adult-use consumers purchase from PEI Cannabis Management Corporation stores or online. The corporation manages provincial retail and wholesale.',
'Healthcare practitioners authorize under Health Canada''s federal framework. The PEI College of Physicians provides provincial guidance.',
'PEI''s market serves a year-round population of approximately 170,000 with significant seasonal tourist influx. Annual retail sales are estimated at CAD 20–30 million with seasonal variation. The small market size supports a limited number of government retail locations.',
'PEI''s government retail model is stable. Tourism seasonality continues to influence sales patterns. Regulatory alignment with federal updates is ongoing.',
'PEI Cannabis Management Corporation operates retail and wholesale. Health Canada administers federal programs.',
'PEI Cannabis Management Corporation reports; Health Canada producer registry; PEI cannabis revenue data','Current as of Q2 2026','Annual','Provincial briefing covering government retail model in smallest Canadian province',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='CA' AND state_iso2='CA-PE');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'yukon','state','CA','CA-YT','Adult-Use Legal; Medical Legal',
'Yukon launched adult-use cannabis sales through Cannabis Yukon, a government-operated retailer and wholesaler, on October 17, 2018. The territory also introduced private retail licensing to supplement government stores. Minimum age is 19. Adults may cultivate up to four plants at home. Cannabis Yukon serves a small, geographically dispersed population including First Nations communities, some of which have implemented their own access policies.',
'Medical patients use Health Canada''s federal program. Adult-use consumers purchase from Cannabis Yukon government stores or licensed private retailers. Cannabis Yukon operates provincial wholesale.',
'Healthcare practitioners authorize under Health Canada''s federal framework. The Yukon Medical Association provides guidance relevant to northern healthcare delivery contexts.',
'Yukon''s market serves a population of approximately 45,000, primarily in Whitehorse. Annual retail sales are estimated at CAD 15–25 million. First Nations self-governance arrangements create some variation in access across communities.',
'Cannabis Yukon continues operating government retail alongside a small number of private licenses. First Nations engagement on cannabis governance continues.',
'Cannabis Yukon (Yukon Liquor Corporation) operates retail and wholesale. Health Canada administers federal programs. First Nations self-governance arrangements are respected.',
'Cannabis Yukon annual reports; Health Canada producer registry; First Nations cannabis governance documentation','Current as of Q2 2026','Annual','Territorial briefing covering government retail with private supplement in northern context',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='CA' AND state_iso2='CA-YT');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'northwest-territories','state','CA','CA-NT','Adult-Use Legal; Medical Legal',
'Northwest Territories launched adult-use cannabis retail through the NT Liquor and Cannabis Commission (NTLCC), operating government stores in Yellowknife and other communities. Private retail was also licensed to serve the geographically dispersed territory. Minimum age is 19. Adults may cultivate up to four plants at home. Community-level consultation with Indigenous governments has shaped access policies in some communities.',
'Medical patients use Health Canada''s federal program. Adult-use consumers purchase from NTLCC-operated stores or licensed private retailers. NTLCC manages territorial wholesale.',
'Healthcare practitioners authorize under Health Canada''s federal framework, with northern and remote healthcare delivery context acknowledged.',
'The NWT market serves a population of approximately 45,000 spread across a vast territory. Annual retail sales are modest given the small population. Remote community access is a significant logistical challenge.',
'NTLCC continues developing retail coverage for remote communities. Indigenous governance engagement on cannabis access is ongoing.',
'NT Liquor and Cannabis Commission (NTLCC) operates retail and wholesale. Health Canada administers federal programs. Indigenous self-governance arrangements are respected.',
'NTLCC annual reports; Health Canada producer registry; NWT Indigenous governance cannabis documentation','Current as of Q2 2026','Annual','Territorial briefing covering government retail in northern remote context',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='CA' AND state_iso2='CA-NT');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'nunavut','state','CA','CA-NU','Adult-Use Legal; Medical Legal',
'Nunavut launched adult-use cannabis retail through Cannabis Nunavut and licensed private retailers in Iqaluit and other communities. Minimum age is 19. Adults may cultivate up to four plants at home, though growing conditions in the Arctic make home cultivation impractical for most residents. Community-level access policies vary across Nunavut''s 25 communities, some of which have implemented local restrictions under Inuit self-governance frameworks.',
'Medical patients use Health Canada''s federal program. Adult-use consumers purchase from Cannabis Nunavut or licensed private retailers. Logistics in remote communities create access challenges.',
'Healthcare practitioners authorize under Health Canada''s federal framework, with Nunavut''s unique northern and Inuit healthcare context acknowledged.',
'Nunavut''s market serves a population of approximately 40,000 in 25 communities across an enormous territory. Annual retail sales are small given population and logistical constraints. Supply chain management is a significant operational challenge.',
'Cannabis Nunavut and licensed retailers continue developing access in Iqaluit and other communities. Inuit self-governance engagement on cannabis access policies is ongoing and will shape the long-term framework.',
'Nunavut Liquor and Cannabis Commission (NULC) oversees retail and wholesale. Health Canada administers federal programs. Inuit self-governance bodies have authority over community access policies.',
'NULC annual reports; Health Canada producer registry; Nunavut Inuit governance cannabis consultation documentation','Current as of Q2 2026','Annual','Territorial briefing covering adult-use retail in Arctic Inuit context with community variation',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='CA' AND state_iso2='CA-NU');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622091003','seed_subnational_canada','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622091003_seed_subnational_canada.sql

-- RECOVERY BEGIN 20260622091050_harden_internal_functions_and_subscriptions.sql
-- Lock internal SECURITY DEFINER functions to their intended execution roles.
-- Historical deployments contain different subsets and overloads, so every
-- change is applied only when the exact routine signature exists.

do $internal_function_hardening$
declare
  signature text;
begin
  foreach signature in array array[
    'public.hv_search_artifacts(vector,vector,uuid,integer,text)',
    'public.hv_search_artifacts(vector,vector,uuid,integer,text,vector)',
    'public.acquire_crawl_targets(integer,text)',
    'public.hv_artifact_publish_to_feed()',
    'public.hv_staging_backfill_country_iso()',
    'public.sync_signal_to_ia_signals()',
    'public.auto_create_dashboard_preferences()'
  ]
  loop
    if to_regprocedure(signature) is not null then
      execute format(
        'revoke execute on function %s from public, anon, authenticated',
        signature
      );
      execute format(
        'grant execute on function %s to service_role',
        signature
      );
    end if;
  end loop;

  if to_regprocedure('public.get_platform_health()') is not null then
    execute 'revoke execute on function public.get_platform_health() from public, anon';
    execute 'grant execute on function public.get_platform_health() to authenticated, service_role';
  end if;

  foreach signature in array array[
    'public.set_jurisdiction_playbooks_updated_at()',
    'public.set_hv_professionals_updated_at()',
    'public.set_deal_rooms_updated_at()',
    'public.touch_updated_at()'
  ]
  loop
    if to_regprocedure(signature) is not null then
      execute format('alter function %s set search_path = public', signature);
    end if;
  end loop;
end
$internal_function_hardening$;

-- service_role bypasses RLS, so removing the historical permissive ALL policy
-- keeps Stripe webhook writes functional while closing browser-role writes.
do $subscription_policy_hardening$
begin
  if to_regclass('public.subscriptions') is not null then
    execute 'drop policy if exists "Service role manages subscriptions" on public.subscriptions';
  end if;
end
$subscription_policy_hardening$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622091050','harden_internal_functions_and_subscriptions','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622091050_harden_internal_functions_and_subscriptions.sql

-- RECOVERY BEGIN 20260622091118_seed_subnational_australia.sql

-- Australia: 6 states + 2 territories

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'australian-capital-territory','state','AU','AU-ACT','Medical Legal; Decriminalized (Personal Use)',
'The Australian Capital Territory (ACT) enacted landmark legislation in September 2019, effective January 31, 2020, decriminalizing personal cannabis use and home cultivation for adults. Under the Drugs of Dependence (Personal Cannabis Use) Amendment Act 2019, adults may possess up to 50 grams of dried cannabis or 150 grams of fresh cannabis, and cultivate up to two plants per person (maximum four per household). Importantly, this creates a dual legal status: ACT law decriminalizes personal use, but Commonwealth (federal) law under the Criminal Code still technically prohibits it — meaning ACT Police exercise discretion but federal agencies could theoretically prosecute. In practice, personal use and home cultivation are effectively decriminalized. Medical cannabis follows the federal TGA pathway.',
'Medical patients in the ACT access TGA-approved cannabis products through the Therapeutic Goods Administration''s Special Access Scheme (SAS-B) or Authorised Prescriber (AP) pathways, obtaining products from licensed pharmacies. Adult personal use is decriminalized per ACT law, allowing possession and home cultivation within defined limits without criminal penalty.',
'Medical practitioners in the ACT register with TGA as Authorised Prescribers or submit individual Special Access Scheme applications for medical cannabis products. No specialist restriction — GPs can prescribe. The ACT Medical Board provides supplementary guidance.',
'The ACT is home to Canberra, Australia''s capital, with a population of approximately 460,000. The medical cannabis market follows the national TGA-regulated model. The decriminalization framework has not created a formal commercial adult-use market but has normalized personal cultivation and use. Several licensed medical cannabis clinics operate in Canberra.',
'The ACT''s decriminalization framework is unique in Australia and has been watched closely by other states considering similar reforms. NSW has reviewed ACT''s model. The dual state/federal legal status creates ongoing legal ambiguity that a future Commonwealth reform would resolve. ACT is expected to maintain its progressive position.',
'ACT Health oversees territory health regulation. ACT Policing (AFP) exercises discretion under the decriminalization framework. TGA administers national medical cannabis approvals.',
'ACT Drugs of Dependence (Personal Cannabis Use) Amendment Act 2019; TGA SAS-B and AP approval data; ACT Health pharmaceutical guidance; ACT Policing enforcement data','Current as of Q2 2026; verified against ACT Health and TGA guidance','Quarterly','Full territory briefing covering landmark decriminalization and federal medical framework',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='AU' AND state_iso2='AU-ACT');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'new-south-wales','state','AU','AU-NSW','Medical Legal; Recreational Prohibited',
'New South Wales is Australia''s most populous state and its largest medical cannabis market by patient volume. NSW follows the federal Therapeutic Goods Administration (TGA) framework for medical cannabis, with doctors prescribing TGA-approved products through the Special Access Scheme (SAS-B) or as Authorised Prescribers. Recreational cannabis remains prohibited under the Drug Misuse and Trafficking Act 1985. NSW had over 100,000 approved medical cannabis access pathways as of 2025, making it a dominant state market.',
'Medical patients access TGA-approved cannabis products through registered medical practitioners with SAS-B approval or via Authorised Prescribers. Products are dispensed through licensed pharmacies. Telehealth cannabis clinics have significantly improved patient access across the state, including rural and remote areas.',
'NSW medical practitioners access medical cannabis via TGA SAS-B applications or by registering as Authorised Prescribers. No specialist-only requirement — GPs are a major prescribing group. The Medical Council of NSW provides guidance on evidence-based cannabis prescribing.',
'NSW accounts for a substantial share of national medical cannabis approvals given its population of approximately 8.3 million. Multiple licensed medical cannabis clinics, both physical and telehealth-based, serve the NSW market. International and domestic licensed producers supply the NSW pharmacy channel. Annual patient spending on medical cannabis in NSW is estimated in the hundreds of millions of AUD.',
'NSW is developing a review of its drug enforcement approach. The NSW Drug Summit recommendations have included review of low-level cannabis offenses. The ACT decriminalization model is referenced in NSW reform discussions. Medical program expansion, particularly through telehealth, is expected to continue.',
'NSW Health (Ministry of Health) oversees state pharmaceutical regulation and health policy. NSW Police enforce recreational drug laws. TGA administers national medical cannabis approvals.',
'TGA SAS-B and AP approval data; NSW Health pharmaceutical guidance; NSW Police enforcement data; NSW Drug Summit reports','Current as of Q2 2026; verified against NSW Health and TGA guidance','Quarterly','Full state briefing covering large medical market and ongoing reform discussion',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='AU' AND state_iso2='AU-NSW');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'victoria','state','AU','AU-VIC','Medical Legal; Recreational Prohibited',
'Victoria is Australia''s second most populous state and a major medical cannabis market. The state follows the federal TGA framework for medical cannabis access. Recreational cannabis is prohibited under the Drugs, Poisons and Controlled Substances Act 1981. Victoria''s large population (approximately 6.7 million) and metropolitan Melbourne cannabis market make it a key market for licensed producers and telehealth cannabis clinics. Victoria has also explored drug harm reduction policy more broadly.',
'Medical patients access TGA-approved products through registered practitioners via SAS-B or Authorised Prescriber pathways, with dispensing through licensed pharmacies. Telehealth cannabis clinics serve patients across metropolitan and regional Victoria.',
'Victorian medical practitioners access cannabis prescribing through TGA SAS-B or Authorised Prescriber registration. The Medical Board of Australia and Medical Practitioners Board of Victoria provide guidance. No specialist-only requirement.',
'Victoria has a significant medical cannabis patient population. Melbourne-based medical cannabis clinics (both physical and telehealth) are prominent nationally. Multiple licensed producers have Victorian operations or supply Victorian pharmacies. Annual patient spending is estimated in the hundreds of millions of AUD.',
'Victoria is expected to continue growing its medical cannabis market. Broader drug law reform discussions include harm reduction measures. The state government has signaled support for harm reduction approaches that could eventually include personal use decriminalization.',
'Department of Health Victoria oversees state pharmaceutical and health policy. Victoria Police enforce drug laws. TGA administers national medical cannabis approvals.',
'TGA SAS-B and AP data; Department of Health Victoria pharmaceutical guidance; Victoria Police enforcement statistics; harm reduction policy documents','Current as of Q2 2026; verified against Department of Health Victoria and TGA guidance','Quarterly','State briefing covering major medical market and harm reduction policy trajectory',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='AU' AND state_iso2='AU-VIC');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'queensland','state','AU','AU-QLD','Medical Legal; Recreational Prohibited',
'Queensland follows the federal TGA medical cannabis framework. Recreational cannabis is prohibited under the Drugs Misuse Act 1986. Queensland''s large geographic area and population of approximately 5.5 million create a diverse market including major urban centres (Brisbane, Gold Coast) and extensive rural and remote areas. Telehealth cannabis clinics have been particularly impactful in rural Queensland where GP density is lower.',
'Medical patients access TGA-approved products through registered practitioners via SAS-B or Authorised Prescriber pathways. Queensland Health oversees pharmaceutical dispensing. Telehealth services have expanded rural access significantly.',
'Queensland medical practitioners access cannabis prescribing through TGA SAS-B or AP registration. The Medical Board of Australia provides national guidance. No specialist-only restriction.',
'Queensland has a growing medical cannabis patient population. Brisbane-based and telehealth clinics serve the state. The state''s large agriculture sector has also driven interest in hemp cultivation, with Queensland farmers among Australia''s licensed hemp producers.',
'Queensland''s medical cannabis market continues expanding. Drug law reform advocacy has grown but no imminent decriminalization legislation is confirmed. Hemp agricultural sector development is ongoing.',
'Queensland Health oversees state pharmaceutical and health policy. Queensland Police enforce drug laws. TGA administers national medical cannabis approvals.',
'TGA SAS-B and AP data; Queensland Health pharmaceutical guidance; Queensland Police enforcement data; Queensland hemp cultivation statistics','Current as of Q2 2026','Quarterly','State briefing covering medical market and rural access context',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='AU' AND state_iso2='AU-QLD');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'western-australia','state','AU','AU-WA','Medical Legal; Recreational Prohibited',
'Western Australia follows the federal TGA medical cannabis framework. Recreational cannabis is prohibited under the Misuse of Drugs Act 1981. WA''s large geographic area (the largest Australian state) with a population of approximately 2.9 million creates significant rural and remote access challenges. Perth is the dominant urban market. WA has also been a significant licensed hemp cultivation state.',
'Medical patients access TGA-approved products through registered practitioners via SAS-B or Authorised Prescriber pathways. WA Health oversees state pharmaceutical dispensing. Remote access is a challenge given the state''s vast geography.',
'WA medical practitioners access cannabis prescribing through TGA pathways. The Medical Board of Australia and WA Medical Board provide guidance. No specialist-only restriction.',
'WA''s medical cannabis market is growing. Perth clinics serve the urban population while telehealth addresses remote areas. WA is also a significant hemp agricultural producer. Annual patient spending is growing.',
'WA''s medical cannabis market is expected to continue growing. Drug reform advocacy is present but no imminent legislative change is expected.',
'Western Australia Department of Health oversees pharmaceutical policy. WA Police enforce drug laws. TGA administers national medical cannabis approvals.',
'TGA SAS-B and AP data; WA Department of Health pharmaceutical guidance; WA Police enforcement data; WA hemp cultivation statistics','Current as of Q2 2026','Quarterly','State briefing covering medical market in large remote state',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='AU' AND state_iso2='AU-WA');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'south-australia','state','AU','AU-SA','Medical Legal; Decriminalized (Expiation Notices)',
'South Australia has a unique cannabis enforcement framework — possession of up to 100 grams is subject to a cannabis expiation notice (CEN, effectively a civil fine) rather than criminal prosecution under the Controlled Substances Act 1984. This is Australia''s longest-standing decriminalization-adjacent framework, established in 1987. Cultivation for personal use is also subject to expiation notices for small quantities. Medical cannabis follows the federal TGA framework.',
'Medical patients access TGA-approved products through registered practitioners via SAS-B or Authorised Prescriber pathways, with pharmacy dispensing. The expiation notice framework means adult personal use is effectively decriminalized in practice.',
'SA medical practitioners access cannabis prescribing through TGA pathways. No specialist-only restriction. SA Health provides guidance aligned with national standards.',
'South Australia''s medical cannabis market follows national growth trends. The long-standing expiation notice framework for personal use has created a pragmatic enforcement environment. Telehealth cannabis clinics serve both Adelaide and regional SA populations.',
'SA''s expiation notice framework is well-established and politically stable. Medical program expansion continues. Broader reform toward formal personal use legalization is possible given SA''s existing pragmatic approach.',
'SA Health oversees pharmaceutical and health policy. South Australia Police enforce drug laws under the expiation notice framework. TGA administers national medical cannabis approvals.',
'SA Controlled Substances Act 1984 and expiation notice framework; TGA SAS-B and AP data; SA Health pharmaceutical guidance; SA Police enforcement statistics','Current as of Q2 2026; verified against SA Health and TGA guidance','Quarterly','State briefing covering unique expiation notice framework and medical program',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='AU' AND state_iso2='AU-SA');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'tasmania','state','AU','AU-TAS','Medical Legal; Recreational Prohibited',
'Tasmania follows the federal TGA medical cannabis framework. Recreational cannabis is prohibited under the Misuse of Drugs Act 2001. Tasmania has a small population of approximately 570,000 concentrated in Hobart and Launceston. The state has a significant agricultural sector including licensed hemp cultivation. Tasmania''s isolated island geography creates some unique supply chain characteristics for the medical cannabis market.',
'Medical patients access TGA-approved products through registered practitioners via SAS-B or Authorised Prescriber pathways. Pharmacy dispensing is available in major urban areas. Telehealth cannabis clinics serve rural populations.',
'Tasmanian medical practitioners access cannabis prescribing through TGA pathways. No specialist-only restriction. The Medical Council of Tasmania provides supplementary guidance.',
'Tasmania''s small medical cannabis market is served by both locally based practitioners and national telehealth platforms. The state''s agricultural capacity includes licensed hemp cultivation. Annual patient spending is modest given population size.',
'Tasmania''s medical market will continue modest growth. Hemp agricultural sector development is ongoing. No significant recreational reform is anticipated in the near term.',
'Department of Health Tasmania oversees pharmaceutical and health policy. Tasmania Police enforce drug laws. TGA administers national medical cannabis approvals.',
'TGA SAS-B and AP data; Department of Health Tasmania pharmaceutical guidance; Tasmania Police enforcement data; Tasmania hemp cultivation statistics','Current as of Q2 2026','Annual','State briefing covering medical program in small island state',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='AU' AND state_iso2='AU-TAS');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'northern-territory','state','AU','AU-NT','Medical Legal; Recreational Prohibited',
'The Northern Territory follows the federal TGA medical cannabis framework. Recreational cannabis is prohibited under the Misuse of Drugs Act 1990. The NT has a population of approximately 250,000 with a significant Indigenous Australian population (approximately 30% of the territory). Remote communities face significant healthcare access challenges. The NT''s Indigenous community context creates unique considerations for cannabis policy and enforcement.',
'Medical patients access TGA-approved products through registered practitioners via SAS-B or Authorised Prescriber pathways. Access in remote Indigenous communities is a significant challenge requiring telehealth and outreach solutions.',
'NT medical practitioners access cannabis prescribing through TGA pathways. The NT Medical Board and Aboriginal Medical Services provide context-specific guidance for remote and Indigenous healthcare delivery.',
'The NT medical cannabis market is small given the population, with particular access challenges in remote communities. Darwin and Alice Springs are the primary urban markets. Aboriginal Medical Services play a critical role in healthcare delivery including cannabis access pathways.',
'NT medical cannabis access is expected to grow, particularly through telehealth. Indigenous community-specific healthcare frameworks require culturally appropriate access pathways. Broader drug policy reform discussions acknowledge the NT''s unique demographic context.',
'NT Health oversees pharmaceutical and health policy. NT Police enforce drug laws. TGA administers national medical cannabis approvals. Aboriginal Medical Services provide community-based healthcare.',
'TGA SAS-B and AP data; NT Health pharmaceutical guidance; NT Police enforcement statistics; Aboriginal Medical Services documentation','Current as of Q2 2026','Annual','Territory briefing covering medical program with significant Indigenous community context',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='AU' AND state_iso2='AU-NT');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622091118','seed_subnational_australia','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622091118_seed_subnational_australia.sql

-- RECOVERY BEGIN 20260622091242_seed_subnational_germany_a.sql

-- Germany Länder batch A: BY BW BE BB HH HB HE MV (Bavaria through Mecklenburg-Vorpommern)
-- Federal CanG (Cannabis Act) in force from April 1, 2024: adults 18+, up to 25g in public, 50g at home, 3 plants, no commercial dispensaries yet, Cannabis Social Clubs (Anbauvereinigungen) licensed by Länder authorities

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'bavaria','state','DE','DE-BY','Adult-Use (Federal CanG); Medical Legal; Restrictive State Enforcement',
'Bavaria (Bayern) is Germany''s largest state by area and second largest by population (approximately 13.4 million), governed by the conservative CSU party. Despite the federal Cannabis Act (CanG) taking effect April 1, 2024, Bavaria has implemented the most restrictive enforcement posture of any German Land. The Bavarian state government actively opposed cannabis legalization during the legislative process and has pursued aggressive enforcement of buffer zone rules (200m prohibition near schools, playgrounds, and pedestrian zones). Cannabis Social Clubs (Anbauvereinigungen) face stringent licensing requirements in Bavaria, with the state issuing comparatively few approvals. Adult-use possession rights under federal law still apply in Bavaria, but practical access through clubs is more limited than in progressive Länder. Medical cannabis follows the federal framework and is available via prescription at all Bavarian pharmacies.',
'Medical patients access pharmacy-dispensed medical cannabis via physician prescription throughout Bavaria, including major cities (Munich, Nuremberg, Augsburg). TK, AOK Bayern, and other statutory health insurers provide partial reimbursement for specific indications under the federal medical framework. Adult-use consumers access cannabis via licensed Cannabis Social Clubs or home cultivation (3 plants maximum).',
'Bavarian physicians may prescribe medical cannabis under the federal framework without specialist restriction. The Bayerische Landesärztekammer (Bavarian Medical Association) has issued conservative guidance encouraging careful evidence assessment but does not restrict prescribing.',
'Bavaria''s cannabis market is significant given its population but constrained by the state government''s restrictive approach to Cannabis Social Club licensing. Medical cannabis prescribing has grown substantially. Munich, Germany''s third largest city, has a significant patient and adult-use consumer base. The restrictive CSC licensing environment means consumers often access cannabis through home cultivation or clubs in neighboring Länder.',
'Bavaria''s CSU-led government is expected to maintain its maximally restrictive interpretation of the CanG. Legal challenges to Bavaria''s enforcement of buffer zones have been filed. The second phase of cannabis reform (commercial dispensary pilot programs) will face additional resistance from the Bavarian state government.',
'Bayerisches Staatsministerium für Gesundheit und Pflege (Bavarian State Ministry of Health and Care) oversees pharmaceutical regulation. Bayerische Polizei enforces drug laws. Cannabis Social Club licensing falls under state authorities per CanG.',
'German CanG federal legislation; Bavarian state enforcement guidance; Bayerische Landesärztekammer prescribing guidance; Cannabis Social Club licensing data; BFARM medical cannabis pharmacy data','Current as of Q2 2026; verified against Bavarian Ministry of Health guidance','Quarterly','Full Land briefing covering restrictive CSU enforcement posture within federal CanG framework',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='DE' AND state_iso2='DE-BY');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'berlin','state','DE','DE-BE','Adult-Use (Federal CanG); Medical Legal; Progressive Enforcement',
'Berlin, Germany''s capital city-state with a population of approximately 3.8 million, operates under the federal Cannabis Act (CanG) with a distinctly more progressive implementation than conservative Länder. Berlin was among the first German cities to issue Cannabis Social Club (Anbauvereinigung) licenses, and the city''s culture of liberal tolerance has shaped a pragmatic enforcement approach. The SPD/Greens-led Berlin Senate has facilitated club licensing and is participating in the federal commercial pilot dispensary program. Berlin''s international reputation and large young adult population make it a prominent early adopter market for adult-use cannabis.',
'Medical patients access pharmacy-dispensed cannabis via physician prescription throughout Berlin. Multiple cannabis specialist clinics operate in the city. Major statutory health insurers provide reimbursement for approved indications. Adult-use consumers access licensed Cannabis Social Clubs or home cultivation.',
'Berlin physicians prescribe medical cannabis under the federal framework. The Ärztekammer Berlin has issued supportive guidance. Telehealth cannabis prescribing is widely available to Berlin patients.',
'Berlin has a dynamic medical and adult-use cannabis ecosystem. Multiple licensed Cannabis Social Clubs operate, with more under application review. The Berlin cannabis club sector has attracted significant media attention as a model for adult-use access under CanG. Medical cannabis clinics and pharmacies are well-established. Berlin is among the cities applying to participate in Phase 2 commercial dispensary pilot programs.',
'Berlin''s progressive Senate is expected to be an early participant in Phase 2 commercial dispensary pilots under CanG. Cannabis club density will continue growing. Berlin''s experience will be a critical reference for broader German commercial cannabis policy.',
'Senatsverwaltung für Wissenschaft, Gesundheit und Pflege (Berlin Senate Department for Health) oversees pharmaceutical regulation. Berliner Polizei enforces CanG with a stated pragmatic approach. Cannabis Social Club licensing managed by Berlin district authorities.',
'German CanG; Berlin Senate Health Department guidance; Berlin Cannabis Social Club licensing data; BFARM medical cannabis statistics; Berlin pilot dispensary program documentation','Current as of Q2 2026; verified against Berlin Senate Health guidance','Quarterly','Full city-state briefing covering progressive CanG implementation and Cannabis Social Club ecosystem',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='DE' AND state_iso2='DE-BE');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'hamburg','state','DE','DE-HH','Adult-Use (Federal CanG); Medical Legal; Progressive Enforcement',
'Hamburg, Germany''s second largest city and major port (population approximately 1.9 million), operates under the federal CanG with a progressive SPD-led Senate implementing a cooperative approach to Cannabis Social Club licensing. Hamburg has applied to participate in Phase 2 commercial dispensary pilot programs and has been an active voice for pragmatic cannabis implementation at the federal level. The city''s liberal urban culture and significant international population create strong adult-use demand.',
'Medical patients access pharmacy-dispensed cannabis throughout Hamburg via physician prescription. Multiple medical cannabis practices operate. Major health insurers provide reimbursement for approved indications. Adult-use consumers access licensed Cannabis Social Clubs or cultivate at home.',
'Hamburg physicians prescribe under the federal framework. The Ärztekammer Hamburg has issued constructive guidance for evidence-based prescribing. Telehealth services serve Hamburg patients.',
'Hamburg has a growing Cannabis Social Club sector under CanG. Medical cannabis prescribing is well-established with multiple specialist practices. Hamburg''s application for Phase 2 commercial pilot participation positions it as a potential early commercial dispensary market.',
'Hamburg is expected to be among the first German cities with licensed commercial cannabis dispensaries if Phase 2 proceeds. The SPD Senate''s supportive posture will drive progressive implementation.',
'Behörde für Wissenschaft und Gesundheit Hamburg (Hamburg Senate Authority for Health) oversees pharmaceutical regulation. Hamburgische Polizei enforces CanG. Cannabis Social Club licensing managed by Hamburg district authorities.',
'German CanG; Hamburg Senate Health Authority guidance; Cannabis Social Club licensing data; Phase 2 pilot program application; BFARM medical cannabis statistics','Current as of Q2 2026; verified against Hamburg Senate Health guidance','Quarterly','City-state briefing covering progressive CanG implementation and Phase 2 commercial pilot ambition',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='DE' AND state_iso2='DE-HH');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'north-rhine-westphalia','state','DE','DE-NW','Adult-Use (Federal CanG); Medical Legal; Moderate Enforcement',
'North Rhine-Westphalia (NRW) is Germany''s most populous Land with approximately 18 million residents, making it the largest single cannabis market in Germany. NRW is governed by a CDU-led coalition, which has taken a moderate rather than aggressively restrictive approach to CanG implementation, contrasting with Bavaria. The state has processed Cannabis Social Club applications and enforces federal law pragmatically. Major urban centres including Cologne, Düsseldorf, Dortmund, and Essen drive significant medical and adult-use demand.',
'Medical patients access pharmacy-dispensed cannabis throughout NRW via physician prescription. Given NRW''s large population and urban density, cannabis prescribing volumes are among Germany''s highest. Major health insurers provide reimbursement for approved indications.',
'NRW physicians prescribe under the federal framework. The Ärztekammer Nordrhein and Ärztekammer Westfalen-Lippe have issued guidance supporting evidence-based prescribing. No specialist restriction applies.',
'NRW''s cannabis market is Germany''s largest by population scale. Multiple Cannabis Social Clubs have been licensed across the state''s major cities. Medical cannabis prescribing volumes are substantial. The state''s large working-age population creates strong demand across both medical and adult-use channels.',
'NRW''s CDU-led government is expected to implement CanG pragmatically rather than obstructively. Phase 2 commercial pilot dispensary participation is likely in Cologne, Düsseldorf, or other major NRW cities. Market scale will make NRW critical to German cannabis policy outcomes.',
'NRW Ministerium für Arbeit, Gesundheit und Soziales (Ministry of Labour, Health and Social Affairs) oversees pharmaceutical regulation. NRW Polizei enforces CanG. Cannabis Social Club licensing managed by state district authorities.',
'German CanG; NRW Ministry of Health guidance; Cannabis Social Club licensing data NRW; BFARM medical cannabis statistics; Phase 2 pilot program documentation','Current as of Q2 2026; verified against NRW Ministry of Health guidance','Quarterly','Full Land briefing covering Germany''s most populous cannabis market',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='DE' AND state_iso2='DE-NW');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'baden-wurttemberg','state','DE','DE-BW','Adult-Use (Federal CanG); Medical Legal; Moderate-Restrictive Enforcement',
'Baden-Württemberg, Germany''s third largest Land by population (approximately 11.3 million), is governed by a Green-CDU coalition. The Green party component of the coalition has tempered what might otherwise be a more restrictive CDU approach, resulting in moderate implementation of CanG. Major cities include Stuttgart, Mannheim, and Freiburg. Cannabis Social Club licensing has proceeded at a measured pace. The state has a significant pharmaceutical and life sciences industry, which gives medical cannabis commercial development some institutional support.',
'Medical patients access pharmacy-dispensed cannabis throughout Baden-Württemberg via physician prescription. Multiple specialist cannabis practices operate in Stuttgart, Mannheim, and other cities. Health insurers provide reimbursement for approved indications.',
'BW physicians prescribe under the federal framework. The Landesärztekammer Baden-Württemberg has issued guidance supporting evidence-based prescribing. Freiburg, near the Swiss border, benefits from proximity to Switzerland''s legal cannabis pilot context.',
'Baden-Württemberg''s cannabis market is significant given its population. Cannabis Social Club licensing is processing. Medical cannabis is well-established through pharmacies and specialist practices. The state''s pharmaceutical industry base creates potential for cannabis product development.',
'The Green party influence in the BW coalition is expected to produce progressive Phase 2 engagement. Stuttgart and Freiburg are potential Phase 2 pilot dispensary cities. The pharmaceutical industry presence may influence medical cannabis production and product innovation.',
'Ministerium für Soziales, Gesundheit und Integration Baden-Württemberg (Ministry for Social Affairs, Health and Integration) oversees pharmaceutical regulation. Polizei Baden-Württemberg enforces CanG.',
'German CanG; BW Ministry of Health guidance; Cannabis Social Club licensing data BW; BFARM medical cannabis statistics','Current as of Q2 2026; verified against BW Ministry of Health guidance','Quarterly','Land briefing covering moderate Green-CDU coalition implementation of CanG',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='DE' AND state_iso2='DE-BW');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'hesse','state','DE','DE-HE','Adult-Use (Federal CanG); Medical Legal',
'Hesse (Hessen) is a central German Land with approximately 6.4 million residents, governed by a CDU-SPD coalition. Frankfurt, Germany''s financial capital and major international hub, is Hesse''s largest city. Cannabis Social Club licensing under CanG has proceeded at a measured pace under CDU leadership. Frankfurt''s international status creates demand from a diverse population including significant expatriate and tourist communities. The medical cannabis market is well-developed given the population and economic base.',
'Medical patients access pharmacy-dispensed cannabis throughout Hesse via physician prescription. Frankfurt has multiple medical cannabis specialist practices. Health insurers provide reimbursement for approved indications.',
'Hessian physicians prescribe under the federal framework. The Landesärztekammer Hessen has issued relevant guidance. Frankfurt''s international healthcare institutions are familiar with global medical cannabis standards.',
'Hesse''s cannabis market benefits from Frankfurt''s economic activity and international population. Cannabis Social Clubs are operating in Frankfurt and other cities. Medical cannabis prescribing is growing. Frankfurt''s airport status creates specific enforcement considerations for international travelers.',
'Hesse is expected to take a pragmatic approach to Phase 2 commercial pilot dispensary participation given the SPD component of the coalition. Frankfurt is likely to be among Germany''s Phase 2 pilot cities.',
'Hessisches Ministerium für Arbeit, Integration, Jugend und Soziales (Hesse Ministry of Labour and Health) oversees pharmaceutical regulation. Hessische Polizei enforces CanG.',
'German CanG; Hesse Ministry of Health guidance; Cannabis Social Club licensing data Hesse; BFARM medical cannabis statistics','Current as of Q2 2026','Quarterly','Land briefing covering Frankfurt-centric market under CDU-SPD coalition CanG implementation',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='DE' AND state_iso2='DE-HE');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'lower-saxony','state','DE','DE-NI','Adult-Use (Federal CanG); Medical Legal',
'Lower Saxony (Niedersachsen) is a large northern German Land with approximately 8.1 million residents, governed by an SPD-Green coalition. Hannover is the state capital. The SPD-Green coalition has taken a cooperative approach to CanG implementation, facilitating Cannabis Social Club licensing and expressing support for Phase 2 commercial pilot participation. The state has a significant agricultural sector relevant to potential hemp and cannabis cultivation.',
'Medical patients access pharmacy-dispensed cannabis throughout Lower Saxony via physician prescription. Hannover has medical cannabis specialist practices. Health insurers provide reimbursement for approved indications.',
'Lower Saxony physicians prescribe under the federal framework. The Ärztekammer Niedersachsen has issued supportive guidance for evidence-based prescribing.',
'Lower Saxony''s SPD-Green coalition has created a supportive environment for Cannabis Social Club development. Hannover and other cities have clubs under operation or licensing. Medical cannabis prescribing is established. Agricultural interests in hemp are relevant to future cultivation licensing.',
'Lower Saxony is expected to participate actively in Phase 2 commercial dispensary pilots given the SPD-Green coalition''s supportive posture. Hannover is a likely pilot city.',
'Niedersächsisches Ministerium für Soziales, Arbeit, Gesundheit und Gleichstellung (Hanover, Lower Saxony Ministry of Health) oversees pharmaceutical regulation. Niedersächsische Polizei enforces CanG.',
'German CanG; Lower Saxony Ministry of Health guidance; Cannabis Social Club licensing data; BFARM medical cannabis statistics','Current as of Q2 2026','Quarterly','Land briefing covering SPD-Green supportive CanG implementation',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='DE' AND state_iso2='DE-NI');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'mecklenburg-vorpommern','state','DE','DE-MV','Adult-Use (Federal CanG); Medical Legal',
'Mecklenburg-Vorpommern is a northeastern German Land with approximately 1.6 million residents, governed by an SPD-Left coalition. The state is one of Germany''s less densely populated Länder with significant rural areas and the Baltic Sea coast. The SPD-led government has taken a cooperative approach to CanG implementation. Cannabis Social Club licensing is proceeding. The state''s smaller urban centers (Schwerin, Rostock) have developing medical cannabis markets.',
'Medical patients access pharmacy-dispensed cannabis throughout Mecklenburg-Vorpommern via physician prescription. Rostock and Schwerin have medical cannabis prescribing practices. Health insurers provide reimbursement for approved indications.',
'MV physicians prescribe under the federal framework. The Landesärztekammer Mecklenburg-Vorpommern provides relevant guidance.',
'Mecklenburg-Vorpommern has a smaller cannabis market proportional to population. Cannabis Social Club licensing is proceeding in Rostock and Schwerin. Medical cannabis prescribing is growing from a lower base than in major urban Länder. The Baltic Sea coast''s tourism sector creates some seasonal demand dynamics.',
'The SPD-Left coalition is expected to support Phase 2 commercial dispensary participation. Tourism-related demand dynamics in coastal resort areas may create specific regulatory considerations.',
'Ministerium für Wirtschaft, Infrastruktur, Tourismus und Arbeit Mecklenburg-Vorpommern and Ministerium für Soziales und Gesundheit (Ministry of Social Affairs and Health) oversee pharmaceutical regulation. Landespolizei enforces CanG.',
'German CanG; MV Ministry of Health guidance; Cannabis Social Club licensing data MV; BFARM medical cannabis statistics','Current as of Q2 2026','Annual','Land briefing covering CanG implementation in rural northeastern context',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='DE' AND state_iso2='DE-MV');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622091242','seed_subnational_germany_a','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622091242_seed_subnational_germany_a.sql

-- RECOVERY BEGIN 20260622091345_seed_subnational_germany_b.sql

-- Germany Länder batch B: BB RP SL SN ST SH TH (Brandenburg through Thuringia)

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'brandenburg','state','DE','DE-BB','Adult-Use (Federal CanG); Medical Legal',
'Brandenburg surrounds Berlin and has approximately 2.6 million residents, governed by an SPD-CDU coalition. The state''s proximity to Berlin creates significant cross-border cannabis market dynamics, with Brandenburg residents accessing Berlin''s more developed Cannabis Social Club ecosystem. Potsdam is the state capital. Brandenburg''s largely rural character and flat plains distinguish its market from major urban Länder.',
'Medical patients access pharmacy-dispensed cannabis via physician prescription. Potsdam and Brandenburg an der Havel have medical cannabis prescribing practices. Berlin proximity gives Brandenburg residents easy access to a wider clinical ecosystem.',
'Brandenburg physicians prescribe under the federal framework. The Landesärztekammer Brandenburg provides relevant guidance.',
'Brandenburg''s cannabis market is closely linked to Berlin''s given geographic proximity. Cannabis Social Clubs in Potsdam and other towns supplement Berlin club access for Brandenburg residents. Medical prescribing is developing.',
'Brandenburg is expected to implement CanG cooperatively. Berlin''s Phase 2 commercial dispensary program, if successful, will directly influence Brandenburg consumer patterns given the state''s encirclement of Berlin.',
'Ministerium für Soziales, Gesundheit, Integration und Verbraucherschutz Brandenburg (Ministry of Social Affairs and Health) oversees pharmaceutical regulation. Polizei Brandenburg enforces CanG.',
'German CanG; Brandenburg Ministry of Health guidance; Cannabis Social Club licensing data; BFARM medical cannabis statistics','Current as of Q2 2026','Annual','Land briefing covering Berlin-adjacent market dynamics',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='DE' AND state_iso2='DE-BB');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'rhineland-palatinate','state','DE','DE-RP','Adult-Use (Federal CanG); Medical Legal',
'Rhineland-Palatinate (Rheinland-Pfalz) has approximately 4.1 million residents and is governed by an SPD-Green-FDP coalition — the coalition that originally advanced the federal CanG at national level. Mainz is the state capital. The state has strongly supportive leadership for cannabis reform, with significant political ownership of the CanG legislation. Wine-growing culture and proximity to France, Luxembourg, and Belgium give the state a liberal orientation toward regulatory reform.',
'Medical patients access pharmacy-dispensed cannabis throughout the state via physician prescription. Mainz and Kaiserslautern have medical cannabis specialist practices. Health insurers provide reimbursement for approved indications.',
'Rhineland-Palatinate physicians prescribe under the federal framework. The Landesärztekammer Rheinland-Pfalz has issued supportive guidance.',
'Rhineland-Palatinate has a politically supportive environment for cannabis development. Cannabis Social Clubs are active in major cities. Medical cannabis prescribing is growing. Cross-border dynamics with Luxembourg (adult-use home cultivation legal) and France are relevant.',
'Given RLP''s SPD-Green-FDP coalition — the original architects of CanG — the state is positioned as one of Germany''s most active Phase 2 commercial dispensary participants. Mainz is a likely pilot city.',
'Ministerium für Wissenschaft und Gesundheit Rheinland-Pfalz (RLP Ministry of Science and Health) oversees pharmaceutical regulation. Polizei RLP enforces CanG.',
'German CanG; RLP Ministry of Health guidance; Cannabis Social Club licensing data RLP; BFARM medical cannabis statistics; RLP cannabis policy documentation','Current as of Q2 2026','Quarterly','Land briefing covering CanG''s politically home state and progressive implementation',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='DE' AND state_iso2='DE-RP');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'saarland','state','DE','DE-SL','Adult-Use (Federal CanG); Medical Legal',
'Saarland is Germany''s smallest Land by area (excluding city-states) with approximately 980,000 residents, governed by a CDU-led coalition. It borders France and Luxembourg, creating unique cross-border cannabis market dynamics — Luxembourg''s home cultivation legalization and proximity to French consumer patterns influence the Saarland market. Saarbrücken is the state capital. The CDU-led government has taken a moderate approach to CanG implementation.',
'Medical patients access pharmacy-dispensed cannabis via physician prescription. Saarbrücken has medical cannabis prescribing practices. Cross-border access to Luxembourg''s legal home cultivation framework creates informational cross-pollination.',
'Saarland physicians prescribe under the federal framework. The Ärztekammer des Saarlandes provides relevant guidance.',
'Saarland''s cannabis market is small but influenced by its borders with Luxembourg and France. Cannabis Social Club licensing is proceeding. Cross-border market dynamics with Luxembourg are notable.',
'Saarland''s CDU government will implement CanG moderately. Cross-border dynamics with Luxembourg may create some pressure for pragmatic enforcement given resident cross-border behaviors.',
'Ministerium für Arbeit, Soziales, Frauen und Gesundheit Saarland (Ministry of Labour, Social Affairs, Women and Health) oversees pharmaceutical regulation. Saarländische Polizei enforces CanG.',
'German CanG; Saarland Ministry of Health guidance; Cannabis Social Club licensing data; BFARM medical cannabis statistics; Luxembourg cross-border dynamics','Current as of Q2 2026','Annual','Land briefing covering small cross-border market adjacent to Luxembourg',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='DE' AND state_iso2='DE-SL');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'saxony','state','DE','DE-SN','Adult-Use (Federal CanG); Medical Legal; Variable Enforcement',
'Saxony (Sachsen) has approximately 4 million residents and is governed by a CDU-SPD-Green coalition. Leipzig and Dresden are the major cities with distinct cannabis market profiles. Dresden has seen high-profile enforcement operations against informal markets since CanG implementation. Leipzig, with a younger population and more liberal culture, has developed a more active Cannabis Social Club ecosystem. The CDU component of the coalition creates some tension with progressive implementation.',
'Medical patients access pharmacy-dispensed cannabis via physician prescription. Leipzig and Dresden have medical cannabis specialist practices. Health insurers provide reimbursement for approved indications.',
'Saxony physicians prescribe under the federal framework. The Sächsische Landesärztekammer provides relevant guidance.',
'Saxony''s cannabis market varies significantly between Dresden (more enforcement-focused) and Leipzig (more progressive CSC ecosystem). Medical prescribing is growing across the state. Cannabis Social Clubs in Leipzig are among the more active in eastern Germany.',
'Saxony''s CDU-led enforcement approach creates variable implementation. Leipzig is likely to be a strong Phase 2 commercial dispensary candidate given its demographics and political culture.',
'Sächsisches Staatsministerium für Soziales und Gesellschaftlichen Zusammenhalt (Saxon State Ministry for Social Affairs) oversees pharmaceutical regulation. Polizei Sachsen enforces CanG.',
'German CanG; Saxony Ministry of Health guidance; Cannabis Social Club licensing data Saxony; BFARM medical cannabis statistics; Dresden/Leipzig enforcement comparison','Current as of Q2 2026','Quarterly','Land briefing covering variable Dresden/Leipzig enforcement and market dynamics',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='DE' AND state_iso2='DE-SN');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'saxony-anhalt','state','DE','DE-ST','Adult-Use (Federal CanG); Medical Legal',
'Saxony-Anhalt has approximately 2.1 million residents and is governed by a CDU-SPD-FDP coalition. Halle and Magdeburg are the major cities. The CDU-led government has taken a moderate approach to CanG implementation. Saxony-Anhalt is one of the less economically dynamic eastern German Länder, with demographic and economic challenges relevant to market development.',
'Medical patients access pharmacy-dispensed cannabis via physician prescription. Halle and Magdeburg have medical cannabis prescribing practices.',
'Saxony-Anhalt physicians prescribe under the federal framework. The Ärztekammer Sachsen-Anhalt provides relevant guidance.',
'Saxony-Anhalt''s cannabis market is developing. Cannabis Social Club licensing is proceeding. Medical prescribing is growing from a lower base.',
'Saxony-Anhalt is expected to implement CanG moderately. Phase 2 commercial dispensary participation is possible through Halle or Magdeburg.',
'Ministerium für Arbeit, Soziales, Gesundheit und Gleichstellung Sachsen-Anhalt (Ministry of Labour, Social Affairs, Health and Equality) oversees pharmaceutical regulation. Polizei Sachsen-Anhalt enforces CanG.',
'German CanG; Saxony-Anhalt Ministry of Health guidance; Cannabis Social Club licensing data; BFARM medical cannabis statistics','Current as of Q2 2026','Annual','Land briefing covering CanG implementation in eastern German context',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='DE' AND state_iso2='DE-ST');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'schleswig-holstein','state','DE','DE-SH','Adult-Use (Federal CanG); Medical Legal',
'Schleswig-Holstein is a northern German Land bordering Denmark, with approximately 2.9 million residents, governed by a CDU-led government. Kiel is the state capital, and Lübeck and Flensburg are notable cities. The Danish border creates cross-border market dynamics — Denmark has an established medical cannabis pilot program. The CDU government has taken a moderate approach to CanG implementation, with Cannabis Social Club licensing proceeding.',
'Medical patients access pharmacy-dispensed cannabis via physician prescription. Kiel, Lübeck, and Flensburg have medical cannabis prescribing practices. Cross-border dynamics with Denmark''s medical program are relevant for patients near the Danish border.',
'Schleswig-Holstein physicians prescribe under the federal framework. The Ärztekammer Schleswig-Holstein provides relevant guidance.',
'Schleswig-Holstein''s cannabis market benefits from its urban centers and border dynamics with Denmark. Cannabis Social Clubs are being licensed. Medical prescribing is growing.',
'The CDU government is expected to implement CanG moderately. Border dynamics with Denmark and proximity to Hamburg''s more progressive ecosystem will influence market development.',
'Ministerium für Soziales, Gesundheit, Jugend, Familie und Senioren Schleswig-Holstein (Ministry of Social Affairs and Health) oversees pharmaceutical regulation. Polizei Schleswig-Holstein enforces CanG.',
'German CanG; Schleswig-Holstein Ministry of Health guidance; Cannabis Social Club licensing data; BFARM medical cannabis statistics; Denmark border dynamics','Current as of Q2 2026','Annual','Land briefing covering CanG implementation with Denmark border dynamics',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='DE' AND state_iso2='DE-SH');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'thuringia','state','DE','DE-TH','Adult-Use (Federal CanG); Medical Legal',
'Thuringia (Thüringen) has approximately 2.1 million residents, governed by an SPD-BSW-CDU coalition following complex 2024 state elections. Erfurt is the state capital. The complex coalition dynamics have created some uncertainty in state-level CanG implementation. Thuringia is a centrally located Land with connections to Bavaria, Saxony, and Hessen. Medical cannabis prescribing has developed in Erfurt and other cities.',
'Medical patients access pharmacy-dispensed cannabis via physician prescription. Erfurt has medical cannabis prescribing practices. Health insurers provide reimbursement for approved indications.',
'Thuringia physicians prescribe under the federal framework. The Landesärztekammer Thüringen provides relevant guidance.',
'Thuringia''s cannabis market is developing. Cannabis Social Club licensing is proceeding under the complex coalition government. Medical prescribing is growing.',
'The complex BSW-SPD-CDU coalition creates some uncertainty about the pace of Phase 2 commercial dispensary engagement. Implementation of CanG is expected to continue at a moderate pace.',
'Thüringer Ministerium für Arbeit, Soziales, Gesundheit, Frauen und Familie (Thuringia Ministry of Social Affairs and Health) oversees pharmaceutical regulation. Polizei Thüringen enforces CanG.',
'German CanG; Thuringia Ministry of Health guidance; Cannabis Social Club licensing data TH; BFARM medical cannabis statistics','Current as of Q2 2026','Annual','Land briefing covering CanG implementation under complex coalition government',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='DE' AND state_iso2='DE-TH');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'bremen','state','DE','DE-HB','Adult-Use (Federal CanG); Medical Legal; Progressive Enforcement',
'Bremen is Germany''s smallest Land by population (approximately 680,000), consisting of the cities of Bremen and Bremerhaven, governed by an SPD-Green-Volt coalition — one of Germany''s most progressive state governments. Bremen''s SPD-Green government has been among the most vocal Land-level supporters of cannabis reform. Cannabis Social Club licensing has proceeded quickly in Bremen, and the state has actively pursued Phase 2 commercial dispensary pilot participation.',
'Medical patients access pharmacy-dispensed cannabis via physician prescription. Multiple medical cannabis practices operate in Bremen. Health insurers provide reimbursement for approved indications.',
'Bremen physicians prescribe under the federal framework. The Ärztekammer Bremen has issued supportive guidance.',
'Bremen''s small but progressive market is one of Germany''s most per-capita active Cannabis Social Club locations. Medical prescribing is well-established. The state''s SPD-Green government has been the Land most publicly supportive of cannabis reform.',
'Bremen is expected to be among the first German Länder to operationalize Phase 2 commercial dispensary pilot programs. Its progressive coalition makes it a model Land for monitoring how commercial adult-use dispensaries function in Germany.',
'Senatorin für Gesundheit (Senator for Health, Free Hanseatic City of Bremen) oversees pharmaceutical regulation. Polizei Bremen enforces CanG.',
'German CanG; Bremen Senate Health guidance; Cannabis Social Club licensing data Bremen; BFARM medical cannabis statistics; Phase 2 pilot dispensary documentation','Current as of Q2 2026; verified against Bremen Senate Health guidance','Quarterly','City-state briefing covering Germany''s most progressive Land-level CanG implementation',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='DE' AND state_iso2='DE-HB');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622091345','seed_subnational_germany_b','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622091345_seed_subnational_germany_b.sql

-- RECOVERY BEGIN 20260622091458_seed_territories_and_dependencies.sql

-- Territories and dependencies: UK Crown Dependencies, British Overseas Territories, Dutch Caribbean, Danish territories, French overseas, Macao

-- Jersey (JE)
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'jersey','country','JE','Medical Legal (Limited); CBD Available',
'Jersey, a British Crown Dependency in the English Channel, enacted the Misuse of Drugs (Amendment No. 7) (Jersey) Law 2021, introducing limited medical cannabis access. The Law permits prescribing of cannabis-based products for medicinal use (CBPMs) aligned with UK MHRA standards. CBD products are commercially available in Jersey given their classification outside the controlled drugs framework. Jersey operates independently of UK drug law but has chosen to broadly align with UK CBPM standards.',
'Patients in Jersey may access cannabis-based products for medicinal use (CBPMs) through registered medical practitioners with specialist recommendation, dispensed via licensed pharmacies. The access pathway mirrors the UK''s NHS CBPM framework.',
'Jersey-registered physicians may prescribe CBPMs for qualifying conditions including multiple sclerosis spasticity, nausea, and treatment-resistant epilepsy. Specialist endorsement is generally required.',
'Jersey''s small population (approximately 103,000) supports a limited medical cannabis market. CBD products are commercially available through health and wellness retailers. No domestic cannabis cultivation or production exists.',
'Jersey is expected to continue its alignment with UK medical cannabis policy developments. As the UK expands its CBPM framework, Jersey is likely to follow suit.',
'Jersey Health and Community Services (HCS) oversees pharmaceutical regulation. States of Jersey Police enforce drug laws.',
'Jersey Misuse of Drugs (Amendment No. 7) Law 2021; HCS pharmaceutical guidance; MHRA CBPM alignment; UK medical cannabis policy monitoring','Current as of Q2 2026','Annual','Crown Dependency briefing covering limited medical access aligned with UK CBPM standards',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='JE' AND jurisdiction_type='country');

-- Guernsey (GG)
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'guernsey','country','GG','Prohibited; CBD Gray Area',
'Guernsey, a British Crown Dependency, prohibits cannabis under its Misuse of Drugs (Bailiwick of Guernsey) Law. Unlike Jersey, Guernsey has not enacted medical cannabis legislation. CBD products exist in a legal gray area. Guernsey''s Bailiwick includes the islands of Guernsey, Alderney, and Sark.',
'No formal medical cannabis access pathway exists in Guernsey. Patients seeking cannabis-based medicines must rely on individual clinical import authorization, which is administratively complex.',
'Guernsey physicians cannot formally prescribe cannabis under the existing legal framework.',
'No licensed cannabis market exists. CBD products are commercially present but face regulatory uncertainty.',
'Guernsey may follow Jersey''s lead in establishing a medical cannabis framework if and when the political will emerges. No imminent legislative action is confirmed.',
'Health and Social Care (HSC) Guernsey oversees pharmaceutical regulation. Guernsey Police enforce drug laws.',
'Guernsey Misuse of Drugs Law; HSC Guernsey pharmaceutical guidance; Jersey comparison monitoring','Current as of Q2 2026','Annual','Crown Dependency briefing noting prohibition and absence of medical framework',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='GG' AND jurisdiction_type='country');

-- Isle of Man (IM)
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'isle-of-man','country','IM','Prohibited; CBD Available',
'The Isle of Man, a British Crown Dependency in the Irish Sea, prohibits cannabis under the Misuse of Drugs Act 1995. No medical cannabis program exists. CBD products with THC below 0.2% are available commercially. The Isle of Man Tynwald (Parliament) has discussed cannabis reform in line with UK and Channel Islands developments but no legislation has been enacted.',
'No formal medical cannabis access pathway exists. Individual import authorization may be possible for specific pharmaceutical products.',
'Isle of Man physicians cannot prescribe cannabis under the existing framework.',
'No licensed cannabis market exists. CBD products are commercially available through health retailers.',
'Reform may follow UK and Channel Islands precedents. Tynwald discussions have acknowledged the need to review medical access. No imminent legislation confirmed.',
'Isle of Man Department of Health and Social Care oversees pharmaceutical regulation. Isle of Man Constabulary enforces drug laws.',
'Isle of Man Misuse of Drugs Act 1995; DHSC IoM pharmaceutical guidance; Tynwald cannabis reform discussion records','Current as of Q2 2026','Annual','Crown Dependency briefing noting prohibition with CBD market',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='IM' AND jurisdiction_type='country');

-- Gibraltar (GI)
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'gibraltar','country','GI','Medical Legal; Recreational Decriminalized',
'Gibraltar, a British Overseas Territory on the southern tip of Spain, enacted the Cannabis Agency Act 2020, creating a Cannabis Agency to license medical cannabis activities and decriminalizing personal possession. Gibraltar has positioned itself as an early mover in regulated cannabis in the British territories context. Medical cannabis products may be prescribed and dispensed under the Act''s framework. Gibraltar''s proximity to Spain (where cannabis clubs are widespread) and its British legal tradition create a unique regulatory environment.',
'Patients access cannabis through licensed medical dispensaries with physician recommendation under the Cannabis Agency Act framework. Products include oils and flower from licensed sources.',
'Gibraltar-registered physicians may recommend medical cannabis under the Cannabis Agency Act. No strict specialist-only requirement applies.',
'Gibraltar''s small population (approximately 32,000) limits market scale, but its forward-looking regulatory framework and financial services expertise position it as a potential cannabis licensing hub. Several operators have obtained Cannabis Agency licenses.',
'Gibraltar''s Cannabis Agency is expected to continue developing the licensing framework. As a British Overseas Territory, Gibraltar''s model is watched closely by other UK-adjacent territories.',
'Gibraltar Cannabis Agency administers all cannabis licenses. Royal Gibraltar Police enforce drug laws.',
'Gibraltar Cannabis Agency Act 2020; Cannabis Agency licensing data; Ministry of Health Gibraltar pharmaceutical guidance','Current as of Q2 2026','Quarterly','Territory briefing covering landmark Cannabis Agency Act and progressive framework',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='GI' AND jurisdiction_type='country');

-- Aruba (AW)
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'aruba','country','AW','Prohibited; Reform Discussion',
'Aruba, a constituent country of the Kingdom of the Netherlands in the Caribbean, prohibits cannabis under the Opiumlandsverordening (Opium National Ordinance). Despite the Netherlands'' tolerant approach to cannabis, Aruba maintains formal prohibition. Tourism is the dominant economic sector, and some reform advocates have raised cannabis tourism as a potential revenue opportunity given Dutch cultural precedents.',
'No formal medical cannabis access pathway exists in Aruba.',
'Aruba physicians cannot prescribe cannabis under the existing framework.',
'No licensed cannabis market exists. Tourism-focused reform discussion references Dutch practice. No commercial development has occurred.',
'Reform may follow Dutch Kingdom developments. Cannabis tourism has been discussed as an economic opportunity given Aruba''s hospitality sector dominance. No imminent legislation confirmed.',
'Directorate of Public Health Aruba oversees pharmaceutical regulation. Korps Politie Aruba enforces drug laws.',
'Aruba Opiumlandsverordening; Ministry of Health Aruba pharmaceutical guidance; Kingdom of the Netherlands cannabis policy context','Current as of Q2 2026','Annual','Constituent country briefing noting prohibition despite Dutch Kingdom affiliation',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='AW' AND jurisdiction_type='country');

-- Curaçao (CW)
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'curacao','country','CW','Prohibited; Reform Discussion',
'Curaçao, a constituent country of the Kingdom of the Netherlands in the Dutch Caribbean, maintains cannabis prohibition under its national ordinances. Curaçao has discussed cannabis reform, including medical access, given the Netherlands'' tolerant framework. Willemstad is the capital and the primary economic and tourism centre.',
'No formal medical cannabis access pathway exists in Curaçao.',
'Curaçao physicians cannot prescribe cannabis under the existing framework.',
'No licensed cannabis market exists. Reform discussions have occurred in the Staten (parliament) but no legislation has been enacted.',
'Cannabis reform is possible given Kingdom of Netherlands precedents. Medical access legislation has been discussed. Tourism and economic development motives exist.',
'Curaçao Ministry of Health, Environment and Nature (GMN) oversees pharmaceutical regulation. Curaçao Police (Korps Politie Curaçao) enforces drug laws.',
'Curaçao national drug ordinances; GMN pharmaceutical guidance; Kingdom of Netherlands cannabis policy context','Current as of Q2 2026','Annual','Constituent country briefing noting prohibition with reform discussion context',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='CW' AND jurisdiction_type='country');

-- Sint Maarten (SX)
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'sint-maarten','country','SX','Prohibited',
'Sint Maarten, the Dutch side of the island of Saint Martin, is a constituent country of the Kingdom of the Netherlands. Cannabis is prohibited under Sint Maarten''s national ordinances. The unique geography — sharing the island of Saint Martin with French collectivity Saint-Martin — creates interesting cross-border dynamics given France''s separate drug enforcement framework.',
'No formal medical cannabis access pathway exists in Sint Maarten.',
'Sint Maarten physicians cannot prescribe cannabis under the existing framework.',
'No licensed cannabis market exists. Sint Maarten''s tourism-heavy economy and island-sharing with France creates cross-border informal market dynamics.',
'No imminent reform is confirmed. Kingdom of Netherlands framework developments may influence Sint Maarten policy over time.',
'Sint Maarten Ministry of Public Health, Social Development and Labour (VSA) oversees pharmaceutical regulation. Sint Maarten Police Force enforces drug laws.',
'Sint Maarten national drug ordinances; VSA pharmaceutical guidance; Kingdom of Netherlands cannabis policy context','Current as of Q2 2026','Annual','Constituent country briefing noting prohibition on shared island with French territory',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='SX' AND jurisdiction_type='country');

-- Greenland (GL)
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'greenland','country','GL','Prohibited',
'Greenland, an autonomous territory of the Kingdom of Denmark in the Arctic, prohibits cannabis under Danish law extended to the territory. Greenland has extensive self-government (Selvstyre) but drug policy has not been a priority area of autonomous governance. Denmark''s medical cannabis pilot program applies to Danish citizens but Greenland''s remote communities face significant healthcare access challenges generally.',
'No formal medical cannabis access pathway exists outside the Danish framework. Access challenges in remote Arctic communities make even theoretical framework implementation extremely difficult.',
'Greenland-based practitioners cannot formally prescribe cannabis given the absence of a distinct Greenlandic medical cannabis framework.',
'No licensed cannabis market exists. Greenland''s sparse population (approximately 56,000) and remote geography severely limit market development.',
'No cannabis-specific reform is anticipated as a Greenlandic priority. Danish medical program developments nominally cover Greenland but practical access is severely limited.',
'Naalakkersuisut (Government of Greenland) Department of Health handles health regulation. Grønlands Politi enforces drug laws.',
'Danish Medicines Act extension to Greenland; Naalakkersuisut health policy; Danish medical cannabis pilot program application','Current as of Q2 2026','Annual','Territory briefing noting prohibition in Arctic autonomous territory context',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='GL' AND jurisdiction_type='country');

-- Faroe Islands (FO)
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'faroe-islands','country','FO','Prohibited',
'The Faroe Islands, an autonomous territory of the Kingdom of Denmark in the North Atlantic, prohibit cannabis under drug control legislation. The Faroese Løgting (parliament) has legislative competence in most areas, including drug policy, but has not enacted cannabis reform. The Faroe Islands have a distinctive conservative social culture influenced by Christian values.',
'No formal medical cannabis access pathway exists in the Faroe Islands.',
'Faroese practitioners cannot prescribe cannabis under the existing framework.',
'No licensed cannabis market exists. The Faroe Islands'' small population (approximately 55,000) and conservative culture limit reform momentum.',
'No reform is anticipated given the conservative social and political culture. Danish medical cannabis program developments may eventually influence discussion.',
'Faroese Landslægen (Chief Medical Officer) oversees pharmaceutical regulation. Faroe Islands Police enforce drug laws.',
'Faroese drug control legislation; Landslægen pharmaceutical guidance; Kingdom of Denmark monitoring','Current as of Q2 2026','Annual','Territory briefing noting prohibition in conservative North Atlantic autonomous territory',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='FO' AND jurisdiction_type='country');

-- Macao (MO)
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'macao','country','MO','Prohibited; Strict Enforcement',
'Macao (Macau), a Special Administrative Region of China, prohibits cannabis under Law No. 17/2009 on illicit drug trafficking and consumption. Macao enforces strict drug prohibition aligned with mainland Chinese standards. No medical cannabis program exists. Macao''s status as a major gaming and hospitality hub does not translate to cannabis tolerance — enforcement is strict for both residents and visitors.',
'No legal patient access exists. Cannabis-based medicines are unavailable through official Macao healthcare channels.',
'Macao physicians cannot prescribe cannabis under the existing legal framework.',
'No licensed cannabis market exists. Strict enforcement in a densely populated gaming jurisdiction means informal markets are heavily policed.',
'No reform is anticipated. Macao''s alignment with mainland Chinese drug enforcement standards and its SAR governance framework make cannabis liberalization effectively impossible.',
'Bureau for Food and Drug Safety (CAFSA) oversees pharmaceutical regulation. Polícia de Segurança Pública (PSP) and Judiciary Police handle drug enforcement.',
'Macao Law No. 17/2009; CAFSA pharmaceutical guidance; mainland Chinese drug enforcement alignment','Current as of Q2 2026','Annual','SAR briefing noting strict prohibition aligned with mainland Chinese standards',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='MO' AND jurisdiction_type='country');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622091458','seed_territories_and_dependencies','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622091458_seed_territories_and_dependencies.sql

-- RECOVERY BEGIN 20260622120000_security_advisor_fixes_jun22.sql
-- June 22 security-advisor remediation, replay-safe across historical states.
-- Every function and relation change is applied only when its exact target
-- exists. Browser grants are aligned with each policy instead of relying on RLS
-- policy presence alone.

-- Revoke anonymous execution from privileged helper functions when present.
do $advisor_function_hardening$
declare
  signature text;
begin
  foreach signature in array array[
    'public.get_country_status(text)',
    'public.is_genetics_admin_or_reviewer()'
  ]
  loop
    if to_regprocedure(signature) is not null then
      execute format('revoke execute on function %s from public, anon', signature);
      execute format('grant execute on function %s to authenticated, service_role', signature);
    end if;
  end loop;
end
$advisor_function_hardening$;

-- This trigger helper performs no privileged reads or writes and should execute
-- with the caller's privileges.
create or replace function public.cc_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

-- Retain object reads for the public-assets bucket while removing the former
-- blanket policy definition. Bucket listing behavior remains controlled by the
-- storage API and the bucket's public configuration.
do $public_assets_policy$
begin
  if to_regclass('storage.objects') is not null then
    execute 'drop policy if exists "public_assets_public_read" on storage.objects';
    execute 'drop policy if exists "public_assets_object_read" on storage.objects';
    execute $policy$
      create policy "public_assets_object_read"
      on storage.objects
      for select
      to public
      using (bucket_id = 'public-assets' and name is not null)
    $policy$;
  end if;
end
$public_assets_policy$;

-- Close internal tables to browser roles and expose only the explicitly audited
-- read-only operational surfaces to authenticated users.
do $advisor_table_policies$
declare
  item record;
  qualified_name text;
begin
  for item in
    select *
    from (values
      ('_push_staging',                    'service_role_only',  'service'),
      ('adi_cache',                        'service_role_only',  'service'),
      ('adi_source_log',                   'service_role_only',  'service'),
      ('country_coverage_matrix',          'authenticated_read', 'read'),
      ('country_data_import_runs',         'service_role_only',  'service'),
      ('country_regulatory_profiles_admin','authenticated_read', 'read'),
      ('llm_rate_limits',                  'service_role_only',  'service'),
      ('review_queue',                     'service_role_only',  'service'),
      ('source_expansion_coverage_queue',  'authenticated_read', 'read'),
      ('source_expansion_import_runs',     'service_role_only',  'service'),
      ('source_expansion_import_staging',  'service_role_only',  'service'),
      ('source_import_batches',            'service_role_only',  'service'),
      ('source_import_rejections',         'service_role_only',  'service')
    ) as policy_inventory(table_name, policy_name, access_mode)
  loop
    qualified_name := format('public.%I', item.table_name);
    if to_regclass(qualified_name) is null then
      continue;
    end if;

    execute format('alter table %s enable row level security', qualified_name);
    execute format('drop policy if exists %I on %s', item.policy_name, qualified_name);
    execute format('revoke all privileges on table %s from public, anon, authenticated', qualified_name);
    execute format('grant all privileges on table %s to service_role', qualified_name);

    if item.access_mode = 'read' then
      execute format('grant select on table %s to authenticated', qualified_name);
      execute format(
        'create policy %I on %s for select to authenticated using (true)',
        item.policy_name,
        qualified_name
      );
    else
      execute format(
        'create policy %I on %s for all to service_role using (true) with check (true)',
        item.policy_name,
        qualified_name
      );
    end if;
  end loop;
end
$advisor_table_policies$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622120000','security_advisor_fixes_jun22','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622120000_security_advisor_fixes_jun22.sql

-- RECOVERY BEGIN 20260622130000_add_missing_fk_indexes_jun22.sql
-- CONCURRENTLY removed 2026-08-05 for zero-state replay. The Supabase CLI sends
-- a migration's statements as one pipeline, and Postgres refuses CREATE INDEX
-- CONCURRENTLY there:
--   ERROR: CREATE INDEX CONCURRENTLY cannot be executed within a pipeline
--   (SQLSTATE 25001)
-- Only the keyword is dropped; every index name, table and column list below is
-- unchanged, so the resulting schema is identical. CONCURRENTLY exists to avoid
-- locking a populated table, which is meaningless against the empty database a
-- replay builds, and production already carries these indexes -- this version is
-- recorded in supabase_migrations.schema_migrations, applied there as a single
-- statement, which is why the pipeline rule never bit in production.

-- Migration: add_missing_fk_indexes_jun22
-- Purpose: Add missing indexes on foreign key columns flagged by Supabase performance advisor (Jun 22 2026)
-- All indexes created with to avoid table locks.
-- Do NOT wrap in BEGIN/COMMIT — cannot run inside a transaction block.

-- canadian_operator_conflicts
CREATE INDEX IF NOT EXISTS idx_canadian_operator_conflicts_canonical_operator_id ON public.canadian_operator_conflicts (canonical_operator_id);
CREATE INDEX IF NOT EXISTS idx_canadian_operator_conflicts_site_id ON public.canadian_operator_conflicts (site_id);
CREATE INDEX IF NOT EXISTS idx_canadian_operator_conflicts_source_row_id ON public.canadian_operator_conflicts (source_row_id);

-- canadian_operator_duplicate_clusters
CREATE INDEX IF NOT EXISTS idx_canadian_operator_duplicate_clusters_canonical_operator_id ON public.canadian_operator_duplicate_clusters (canonical_operator_id);
CREATE INDEX IF NOT EXISTS idx_canadian_operator_duplicate_clusters_site_id ON public.canadian_operator_duplicate_clusters (site_id);

-- canadian_operator_exclusions
CREATE INDEX IF NOT EXISTS idx_canadian_operator_exclusions_canonical_operator_id ON public.canadian_operator_exclusions (canonical_operator_id);
CREATE INDEX IF NOT EXISTS idx_canadian_operator_exclusions_source_row_id ON public.canadian_operator_exclusions (source_row_id);

-- canadian_operator_individual_holds
CREATE INDEX IF NOT EXISTS idx_canadian_operator_individual_holds_canonical_operator_id ON public.canadian_operator_individual_holds (canonical_operator_id);
CREATE INDEX IF NOT EXISTS idx_canadian_operator_individual_holds_source_row_id ON public.canadian_operator_individual_holds (source_row_id);

-- canadian_operator_licence_sites
CREATE INDEX IF NOT EXISTS idx_canadian_operator_licence_sites_source_row_id ON public.canadian_operator_licence_sites (source_row_id);

-- canadian_operator_outreach_queue
CREATE INDEX IF NOT EXISTS idx_canadian_operator_outreach_queue_canonical_operator_id ON public.canadian_operator_outreach_queue (canonical_operator_id);
CREATE INDEX IF NOT EXISTS idx_canadian_operator_outreach_queue_site_id ON public.canadian_operator_outreach_queue (site_id);

-- cc_org_requirement_status
CREATE INDEX IF NOT EXISTS idx_cc_org_requirement_status_evidence_document_id ON public.cc_org_requirement_status (evidence_document_id);
CREATE INDEX IF NOT EXISTS idx_cc_org_requirement_status_licence_id ON public.cc_org_requirement_status (licence_id);
CREATE INDEX IF NOT EXISTS idx_cc_org_requirement_status_reviewed_by ON public.cc_org_requirement_status (reviewed_by);

-- cc_watch_rules
CREATE INDEX IF NOT EXISTS idx_cc_watch_rules_created_by ON public.cc_watch_rules (created_by);

-- cc_watchlist_items
CREATE INDEX IF NOT EXISTS idx_cc_watchlist_items_added_by ON public.cc_watchlist_items (added_by);

-- cc_watchlist_notifications
CREATE INDEX IF NOT EXISTS idx_cc_watchlist_notifications_org_id ON public.cc_watchlist_notifications (org_id);

-- country_coverage_matrix
CREATE INDEX IF NOT EXISTS idx_country_coverage_matrix_jurisdiction_id ON public.country_coverage_matrix (jurisdiction_id);

-- country_profiles_public
CREATE INDEX IF NOT EXISTS idx_country_profiles_public_jurisdiction_id ON public.country_profiles_public (jurisdiction_id);

-- country_regulatory_profiles_admin
CREATE INDEX IF NOT EXISTS idx_country_regulatory_profiles_admin_jurisdiction_id ON public.country_regulatory_profiles_admin (jurisdiction_id);

-- cultivar_aliases
CREATE INDEX IF NOT EXISTS idx_cultivar_aliases_cultivar_id ON public.cultivar_aliases (cultivar_id);

-- cultivar_passports
CREATE INDEX IF NOT EXISTS idx_cultivar_passports_breeder_profile_id ON public.cultivar_passports (breeder_profile_id);
CREATE INDEX IF NOT EXISTS idx_cultivar_passports_owner_user_id ON public.cultivar_passports (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_cultivar_passports_rights_holder_profile_id ON public.cultivar_passports (rights_holder_profile_id);

-- deal_room_messages
CREATE INDEX IF NOT EXISTS idx_deal_room_messages_sender_id ON public.deal_room_messages (sender_id);

-- genetics_access_grants
CREATE INDEX IF NOT EXISTS idx_genetics_access_grants_access_request_id ON public.genetics_access_grants (access_request_id);
CREATE INDEX IF NOT EXISTS idx_genetics_access_grants_grantee_profile_id ON public.genetics_access_grants (grantee_profile_id);
CREATE INDEX IF NOT EXISTS idx_genetics_access_grants_grantor_profile_id ON public.genetics_access_grants (grantor_profile_id);
CREATE INDEX IF NOT EXISTS idx_genetics_access_grants_grantor_user_id ON public.genetics_access_grants (grantor_user_id);
CREATE INDEX IF NOT EXISTS idx_genetics_access_grants_revoked_by ON public.genetics_access_grants (revoked_by);

-- genetics_access_requests
CREATE INDEX IF NOT EXISTS idx_genetics_access_requests_requester_profile_id ON public.genetics_access_requests (requester_profile_id);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622130000','add_missing_fk_indexes_jun22','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622130000_add_missing_fk_indexes_jun22.sql

-- RECOVERY BEGIN 20260622140519_revoke_anon_on_internal_ops_views.sql
-- State-aware internal operations view hardening.
-- Historical environments contain different subsets of these derived views.

-- The research queue is worker-only. No browser role receives direct access.
do $local_intel_queue_hardening$
begin
  if to_regclass('public.local_intel_next_batch') is not null then
    revoke all privileges on table public.local_intel_next_batch
      from public, anon, authenticated;
    grant select on table public.local_intel_next_batch to service_role;
  end if;
end
$local_intel_queue_hardening$;

-- Platform coverage contains operational source/review metrics. It is available
-- to authenticated internal dashboards and service workers, but not guests.
do $platform_coverage_hardening$
begin
  if to_regclass('public.platform_coverage_summary') is not null then
    revoke all privileges on table public.platform_coverage_summary
      from public, anon, authenticated;
    grant select on table public.platform_coverage_summary
      to authenticated, service_role;
  end if;
end
$platform_coverage_hardening$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622140519','revoke_anon_on_internal_ops_views','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622140519_revoke_anon_on_internal_ops_views.sql

-- RECOVERY BEGIN 20260622151411_fix_security_definer_views_to_invoker.sql
ALTER VIEW public.public_country_profile_dto SET (security_invoker = true);
ALTER VIEW public.marketplace_public_listings_v1 SET (security_invoker = true);
ALTER VIEW public.signals_intelligence_feed SET (security_invoker = true);
ALTER VIEW public.platform_coverage_summary SET (security_invoker = true);
ALTER VIEW public.genetics_public_profiles SET (security_invoker = true);
ALTER VIEW public.genetics_public_cultivar_passports SET (security_invoker = true);
ALTER VIEW public.genetics_public_cultivar_aliases SET (security_invoker = true);
ALTER VIEW public.genetics_public_country_opportunities SET (security_invoker = true);
ALTER VIEW public.genetics_public_evidence_summaries SET (security_invoker = true);
ALTER VIEW public.genetics_public_claims SET (security_invoker = true);
ALTER VIEW public.genetics_public_collaboration_projects SET (security_invoker = true);
ALTER VIEW public.genetics_public_service_providers SET (security_invoker = true);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622151411','fix_security_definer_views_to_invoker','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622151411_fix_security_definer_views_to_invoker.sql

-- RECOVERY BEGIN 20260622153231_create_clinical_education_tables.sql

create table if not exists public.clinical_education_modules (
  id                            text primary key,
  slug                          text unique not null,
  title                         text not null,
  route                         text not null,
  audience                      text[] not null default '{}',
  module_status                 text not null,
  risk_level                    text not null,
  public_summary                text not null,
  education_themes              text[] not null default '{}',
  safe_language                 text[] not null default '{}',
  restricted_language           text[] not null default '{}',
  research_status               text,
  professional_review_required  boolean not null default false,
  source_basis                  text,
  reviewer_role_required        text[] not null default '{}',
  audience_boundary             text,
  last_reviewed                 date,
  next_review_due               text,
  public_use_approved           boolean not null default false,
  medical_advice_boundary       text,
  country_relevance             text[] not null default '{}',
  format_relevance              text[] not null default '{}',
  disclaimer_type               text not null default 'standard',
  cta_label                     text,
  cta_href                      text,
  sort_order                    integer not null default 0,
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now()
);

create table if not exists public.clinical_education_country_readiness (
  id                                uuid primary key default gen_random_uuid(),
  country                           text not null,
  region                            text,
  professional_education_readiness  text,
  known_training_gap                text,
  official_guidance_status          text,
  formats_requiring_education       text[] not null default '{}',
  pharmacist_relevance              text,
  clinician_relevance               text,
  research_status                   text,
  professional_reviewer_needed      boolean not null default false,
  brief_availability                text,
  sort_order                        integer not null default 0,
  created_at                        timestamptz not null default now(),
  updated_at                        timestamptz not null default now()
);

alter table public.clinical_education_modules            enable row level security;
alter table public.clinical_education_country_readiness  enable row level security;

-- Public, non-promotional educational content: anon/authenticated may read; writes are service_role only.
create policy clinical_education_modules_public_read
  on public.clinical_education_modules for select to anon, authenticated using (true);
create policy clinical_education_country_readiness_public_read
  on public.clinical_education_country_readiness for select to anon, authenticated using (true);

grant select on public.clinical_education_modules           to anon, authenticated;
grant select on public.clinical_education_country_readiness to anon, authenticated;

create index if not exists idx_ce_modules_sort   on public.clinical_education_modules (sort_order);
create index if not exists idx_ce_readiness_sort on public.clinical_education_country_readiness (sort_order);

create trigger trg_ce_modules_touch   before update on public.clinical_education_modules
  for each row execute function public.touch_updated_at();
create trigger trg_ce_readiness_touch before update on public.clinical_education_country_readiness
  for each row execute function public.touch_updated_at();


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622153231','create_clinical_education_tables','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622153231_create_clinical_education_tables.sql

-- RECOVERY BEGIN 20260622153559_gap_a_market_metrics_time_series.sql
CREATE TABLE IF NOT EXISTS public.market_metrics (
    id                  uuid        NOT NULL DEFAULT gen_random_uuid(),
    country_iso2        text        NOT NULL,
    metric_name         text        NOT NULL,
    metric_value        numeric     NOT NULL,
    metric_unit         text        NOT NULL,
    period_start        date        NOT NULL,
    period_end          date        NOT NULL,
    period_granularity  text        NOT NULL DEFAULT 'annual'
                            CHECK (period_granularity IN ('annual','quarterly','monthly','point_in_time')),
    data_type           text        NOT NULL DEFAULT 'observed'
                            CHECK (data_type IN ('observed','estimated','forecast','modeled')),
    confidence_band     text        NOT NULL DEFAULT 'medium'
                            CHECK (confidence_band IN ('high','medium','low','unverified')),
    source_name         text,
    source_url          text,
    source_date         date,
    notes               text,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT market_metrics_pkey PRIMARY KEY (id),
    CONSTRAINT market_metrics_country_fk FOREIGN KEY (country_iso2) REFERENCES public.countries (iso_alpha2) ON DELETE CASCADE,
    CONSTRAINT market_metrics_period_check CHECK (period_end >= period_start)
);

CREATE INDEX IF NOT EXISTS idx_market_metrics_country_metric_period ON public.market_metrics (country_iso2, metric_name, period_start);
CREATE INDEX IF NOT EXISTS idx_market_metrics_metric_period ON public.market_metrics (metric_name, period_start);
CREATE INDEX IF NOT EXISTS idx_market_metrics_country_data_type ON public.market_metrics (country_iso2, data_type);

CREATE OR REPLACE FUNCTION public.set_market_metrics_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS trg_market_metrics_updated_at ON public.market_metrics;
CREATE TRIGGER trg_market_metrics_updated_at BEFORE UPDATE ON public.market_metrics FOR EACH ROW EXECUTE FUNCTION public.set_market_metrics_updated_at();

ALTER TABLE public.market_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS market_metrics_public_read ON public.market_metrics;
CREATE POLICY market_metrics_public_read ON public.market_metrics FOR SELECT TO public USING (data_type IN ('observed', 'estimated'));
DROP POLICY IF EXISTS market_metrics_service_write ON public.market_metrics;
CREATE POLICY market_metrics_service_write ON public.market_metrics FOR ALL TO service_role USING (true) WITH CHECK (true);

INSERT INTO public.market_metrics (country_iso2, metric_name, metric_value, metric_unit, period_start, period_end, period_granularity, data_type, confidence_band, source_name) VALUES
('CA','legal_sales_usd',5100000000,'USD','2024-01-01','2024-12-31','annual','observed','high','Harbourview Research'),
('CA','patient_count',400000,'count','2024-01-01','2024-12-31','annual','observed','high','Harbourview Research'),
('CA','store_count',3800,'count','2024-01-01','2024-12-31','annual','observed','high','Harbourview Research'),
('CA','export_volume_kg',8000,'kg','2024-01-01','2024-12-31','annual','estimated','medium','Harbourview Research'),
('DE','medical_sales_usd',600000000,'USD','2024-01-01','2024-12-31','annual','estimated','medium','Harbourview Research'),
('DE','patient_count',200000,'count','2024-01-01','2024-12-31','annual','estimated','medium','Harbourview Research'),
('US','adult_use_sales_usd',30000000000,'USD','2024-01-01','2024-12-31','annual','estimated','medium','Harbourview Research'),
('US','store_count',15000,'count','2024-01-01','2024-12-31','annual','estimated','medium','Harbourview Research'),
('AU','medical_sales_usd',280000000,'USD','2024-01-01','2024-12-31','annual','estimated','medium','Harbourview Research'),
('AU','patient_count',350000,'count','2024-01-01','2024-12-31','annual','observed','high','Harbourview Research'),
('IL','medical_sales_usd',400000000,'USD','2024-01-01','2024-12-31','annual','estimated','medium','Harbourview Research'),
('IL','patient_count',120000,'count','2024-01-01','2024-12-31','annual','estimated','medium','Harbourview Research'),
('NL','store_count',570,'count','2024-01-01','2024-12-31','annual','observed','high','Harbourview Research'),
('TH','store_count',8000,'count','2024-01-01','2024-12-31','annual','estimated','low','Harbourview Research'),
('CO','export_volume_kg',25000,'kg','2024-01-01','2024-12-31','annual','estimated','medium','Harbourview Research'),
('CO','cultivation_area_ha',2000,'ha','2024-01-01','2024-12-31','annual','estimated','medium','Harbourview Research'),
('UY','adult_use_sales_usd',40000000,'USD','2024-01-01','2024-12-31','annual','observed','high','Harbourview Research'),
('UY','store_count',17,'count','2024-01-01','2024-12-31','annual','observed','high','Harbourview Research'),
('MT','medical_sales_usd',5000000,'USD','2024-01-01','2024-12-31','annual','estimated','low','Harbourview Research'),
('GB','medical_sales_usd',150000000,'USD','2024-01-01','2024-12-31','annual','estimated','medium','Harbourview Research'),
('GB','patient_count',40000,'count','2024-01-01','2024-12-31','annual','estimated','medium','Harbourview Research')
ON CONFLICT DO NOTHING;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622153559','gap_a_market_metrics_time_series','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622153559_gap_a_market_metrics_time_series.sql

-- RECOVERY BEGIN 20260622153659_gap_b_trade_flows_structured.sql
CREATE TABLE IF NOT EXISTS public.trade_flows (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    origin_iso2 text NOT NULL,
    destination_iso2 text NOT NULL,
    flow_direction text NOT NULL CHECK (flow_direction IN ('export','import','bilateral')),
    product_category text NOT NULL CHECK (product_category IN ('flower','extracts','oils','edibles','pharmaceutical_cannabinoids','hemp_fiber','hemp_seed','starting_material','seeds','other')),
    legal_status text NOT NULL DEFAULT 'unknown' CHECK (legal_status IN ('legal_permit_required','legal_no_permit','restricted','prohibited','unknown','under_review')),
    permit_required boolean NOT NULL DEFAULT true,
    permit_authority text,
    purpose text CHECK (purpose IN ('medical','scientific','industrial','adult_use','re_export','unknown')),
    gmp_required boolean NOT NULL DEFAULT false,
    gacp_required boolean NOT NULL DEFAULT false,
    key_requirements text[] NOT NULL DEFAULT '{}',
    notes text,
    source_name text,
    source_url text,
    last_verified date NOT NULL DEFAULT CURRENT_DATE,
    confidence text NOT NULL DEFAULT 'medium' CHECK (confidence IN ('high','medium','low')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT trade_flows_pkey PRIMARY KEY (id),
    CONSTRAINT trade_flows_origin_fk FOREIGN KEY (origin_iso2) REFERENCES public.countries (iso_alpha2) ON DELETE RESTRICT,
    CONSTRAINT trade_flows_destination_fk FOREIGN KEY (destination_iso2) REFERENCES public.countries (iso_alpha2) ON DELETE RESTRICT,
    CONSTRAINT trade_flows_not_self_trade CHECK (origin_iso2 <> destination_iso2)
);
CREATE INDEX IF NOT EXISTS idx_trade_flows_origin_destination ON public.trade_flows (origin_iso2, destination_iso2);
CREATE INDEX IF NOT EXISTS idx_trade_flows_destination ON public.trade_flows (destination_iso2);
CREATE INDEX IF NOT EXISTS idx_trade_flows_legal_status ON public.trade_flows (legal_status);
CREATE INDEX IF NOT EXISTS idx_trade_flows_product_category ON public.trade_flows (product_category);
CREATE OR REPLACE FUNCTION public.set_trade_flows_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS trg_trade_flows_updated_at ON public.trade_flows;
CREATE TRIGGER trg_trade_flows_updated_at BEFORE UPDATE ON public.trade_flows FOR EACH ROW EXECUTE FUNCTION public.set_trade_flows_updated_at();
ALTER TABLE public.trade_flows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS trade_flows_public_read ON public.trade_flows;
CREATE POLICY trade_flows_public_read ON public.trade_flows FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS trade_flows_service_write ON public.trade_flows;
CREATE POLICY trade_flows_service_write ON public.trade_flows FOR ALL TO service_role USING (true) WITH CHECK (true);
INSERT INTO public.trade_flows (origin_iso2,destination_iso2,flow_direction,product_category,legal_status,permit_required,permit_authority,purpose,gmp_required,gacp_required,key_requirements,notes,source_name,last_verified,confidence) VALUES
('CA','DE','export','flower','legal_permit_required',true,'BfArM/Health Canada','medical',true,true,ARRAY['EU-GMP certification required','GACP certification required','BfArM narcotics import permit per shipment','Health Canada cannabis export licence','Single Convention Article 31 authorisations','CoA per batch'],NULL,'Harbourview Research','2025-01-01','high'),
('CA','GB','export','extracts','legal_permit_required',true,'MHRA/Health Canada','medical',true,false,ARRAY['MHRA Schedule 2 import licence','Health Canada cannabis export licence','EU-GMP or equivalent GMP','MHRA import declaration per consignment','CoA and batch records required'],NULL,'Harbourview Research','2025-01-01','high'),
('CA','GB','export','pharmaceutical_cannabinoids','legal_permit_required',true,'MHRA/Health Canada','medical',true,false,ARRAY['MHRA Schedule 2 import licence','Health Canada cannabis export licence','ICH Q7 API GMP compliance','CoA and batch records required'],NULL,'Harbourview Research','2025-01-01','high'),
('CA','AU','export','flower','legal_permit_required',true,'TGA/Health Canada','medical',true,false,ARRAY['TGA import permit required','TGA ODC import licence','Health Canada cannabis export licence','PIC/S GMP compliance','ARTG listing or TGA SAS-B approval','CoA per batch'],NULL,'Harbourview Research','2025-01-01','high'),
('CA','AU','export','oils','legal_permit_required',true,'TGA/Health Canada','medical',true,false,ARRAY['TGA import permit required','TGA ODC import licence','Health Canada cannabis export licence','PIC/S GMP compliance','ARTG listing or TGA SAS-B approval','CoA per batch'],NULL,'Harbourview Research','2025-01-01','high'),
('CA','IL','export','flower','legal_permit_required',true,'MOH Israel/Health Canada','medical',true,false,ARRAY['Israeli MOH import licence','Health Canada cannabis export licence','IMC-GMP or EU-GMP certification','Single Convention Article 31 authorisations','CoA per batch'],NULL,'Harbourview Research','2025-01-01','medium'),
('CO','DE','export','flower','legal_permit_required',true,'BfArM/Colombia MinSalud','medical',true,true,ARRAY['EU-GMP certification (Invima-audited)','GACP certification for farms','BfArM narcotics import permit','Colombia MinSalud/Invima export licence','Single Convention Article 31 authorisations','CoA per batch'],NULL,'Harbourview Research','2025-01-01','high'),
('CO','DE','export','oils','legal_permit_required',true,'BfArM/Colombia MinSalud','medical',true,false,ARRAY['EU-GMP certification','BfArM narcotics import permit','Colombia MinSalud/Invima export licence','Single Convention Article 31 authorisations','CoA per batch'],NULL,'Harbourview Research','2025-01-01','high'),
('CO','GB','export','oils','legal_permit_required',true,'MHRA/Colombia MinSalud','medical',false,false,ARRAY['MHRA Schedule 2 import licence','Colombia MinSalud/Invima export licence','MHRA-recognised GMP','CoA per batch'],NULL,'Harbourview Research','2025-01-01','medium'),
('LS','DE','export','flower','legal_permit_required',true,'BfArM/Lesotho MoH','medical',true,true,ARRAY['EU-GMP certification for Lesotho facility','GACP certification for cultivation','BfArM narcotics import permit','Lesotho MoH export permit','Single Convention Article 31 authorisations','CoA per batch'],NULL,'Harbourview Research','2025-01-01','high'),
('MK','DE','export','flower','legal_permit_required',true,'BfArM/North Macedonia MALMED','medical',true,false,ARRAY['EU-GMP certification','BfArM narcotics import permit','MALMED export authorisation','Single Convention Article 31 authorisations','CoA per batch'],NULL,'Harbourview Research','2025-01-01','medium'),
('PT','DE','export','flower','legal_permit_required',true,'BfArM/Infarmed','medical',true,false,ARRAY['EU-GMP certification (Infarmed-issued)','BfArM narcotics import permit','Infarmed export licence','Single Convention Article 31 authorisations','CoA per batch'],NULL,'Harbourview Research','2025-01-01','medium'),
('NL','DE','export','flower','legal_permit_required',true,'BfArM/Bureau Medicinale Cannabis','medical',true,false,ARRAY['EU-GMP certification (BMC state monopoly)','BfArM narcotics import permit','BMC export authorisation','Single Convention Article 31 authorisations','CoA per batch'],NULL,'Harbourview Research','2025-01-01','high'),
('AU','NZ','export','oils','legal_permit_required',true,'Medsafe/TGA','medical',true,false,ARRAY['Medsafe import licence','TGA export permit','PIC/S GMP compliance','CoA per batch'],NULL,'Harbourview Research','2025-01-01','high'),
('IL','DE','export','pharmaceutical_cannabinoids','legal_permit_required',true,'BfArM/MOH Israel','medical',true,false,ARRAY['EU-GMP or ICH Q7 API GMP certification','BfArM narcotics import permit','MOH Israel export licence','Single Convention Article 31 authorisations','DMF or ASMF submission','CoA per batch'],NULL,'Harbourview Research','2025-01-01','medium'),
('US','CA','export','flower','prohibited',false,NULL,'adult_use',false,false,ARRAY['Cannabis is Schedule I under US Controlled Substances Act','Federal law prohibits cross-border export','CBSA seizure risk for importers'],'Cannabis remains Schedule I federally in the US; cross-border shipment to Canada is illegal under both US federal law and Canadian CBSA enforcement.','Harbourview Research','2025-01-01','high')
ON CONFLICT DO NOTHING;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622153659','gap_b_trade_flows_structured','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622153659_gap_b_trade_flows_structured.sql

-- RECOVERY BEGIN 20260622153739_gap_c_operator_entity_graph_ddl.sql
CREATE TABLE IF NOT EXISTS public.cannabis_operators (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    country_iso2 text NOT NULL,
    legal_name text NOT NULL,
    normalized_name text NOT NULL,
    operator_type text NOT NULL,
    primary_country_iso2 text,
    website text,
    linkedin_url text,
    public_status text NOT NULL DEFAULT 'active',
    data_completeness text NOT NULL DEFAULT 'stub',
    verification_status text NOT NULL DEFAULT 'unverified',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT cannabis_operators_pkey PRIMARY KEY (id),
    CONSTRAINT cannabis_operators_country_iso2_fkey FOREIGN KEY (country_iso2) REFERENCES public.countries (iso_alpha2),
    CONSTRAINT cannabis_operators_primary_country_iso2_fkey FOREIGN KEY (primary_country_iso2) REFERENCES public.countries (iso_alpha2),
    CONSTRAINT cannabis_operators_operator_type_check CHECK (operator_type IN ('cultivator','processor','seller','pharmacy','distributor','laboratory','clinic','importer','exporter','integrated','holding_company','investment_fund','research_institution','other')),
    CONSTRAINT cannabis_operators_public_status_check CHECK (public_status IN ('active','revoked','suspended','expired','pending','unknown')),
    CONSTRAINT cannabis_operators_data_completeness_check CHECK (data_completeness IN ('stub','seed','verified','full')),
    CONSTRAINT cannabis_operators_verification_status_check CHECK (verification_status IN ('unverified','admin_verified','source_verified'))
);
CREATE TABLE IF NOT EXISTS public.operator_licences (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    operator_id uuid NOT NULL,
    country_iso2 text NOT NULL,
    licence_number text,
    licence_class text NOT NULL,
    issuing_regulator text NOT NULL,
    authorized_activities text[] NOT NULL DEFAULT '{}',
    issue_date date,
    expiry_date date,
    licence_status text NOT NULL DEFAULT 'active',
    facility_city text,
    facility_province_state text,
    gmp_certified boolean DEFAULT false,
    gacp_certified boolean DEFAULT false,
    source_url text,
    last_verified date NOT NULL DEFAULT CURRENT_DATE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT operator_licences_pkey PRIMARY KEY (id),
    CONSTRAINT operator_licences_operator_id_fkey FOREIGN KEY (operator_id) REFERENCES public.cannabis_operators (id) ON DELETE CASCADE,
    CONSTRAINT operator_licences_country_iso2_fkey FOREIGN KEY (country_iso2) REFERENCES public.countries (iso_alpha2),
    CONSTRAINT operator_licences_licence_status_check CHECK (licence_status IN ('active','revoked','suspended','expired','pending','unknown'))
);
CREATE TABLE IF NOT EXISTS public.operator_countries (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    operator_id uuid NOT NULL,
    country_iso2 text NOT NULL,
    presence_type text NOT NULL,
    CONSTRAINT operator_countries_pkey PRIMARY KEY (id),
    CONSTRAINT operator_countries_operator_id_fkey FOREIGN KEY (operator_id) REFERENCES public.cannabis_operators (id) ON DELETE CASCADE,
    CONSTRAINT operator_countries_country_iso2_fkey FOREIGN KEY (country_iso2) REFERENCES public.countries (iso_alpha2),
    CONSTRAINT operator_countries_presence_type_check CHECK (presence_type IN ('headquarters','subsidiary','licensed_facility','distribution','sales_office','partnership')),
    CONSTRAINT operator_countries_unique_operator_country_presence UNIQUE (operator_id, country_iso2, presence_type)
);
CREATE INDEX IF NOT EXISTS idx_cannabis_operators_country_iso2 ON public.cannabis_operators (country_iso2);
CREATE INDEX IF NOT EXISTS idx_cannabis_operators_operator_type ON public.cannabis_operators (operator_type);
CREATE INDEX IF NOT EXISTS idx_operator_licences_operator_id ON public.operator_licences (operator_id);
CREATE INDEX IF NOT EXISTS idx_operator_licences_country_iso2_status ON public.operator_licences (country_iso2, licence_status);
CREATE INDEX IF NOT EXISTS idx_operator_licences_status_expiry ON public.operator_licences (licence_status, expiry_date);
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_cannabis_operators_updated_at') THEN CREATE TRIGGER trg_cannabis_operators_updated_at BEFORE UPDATE ON public.cannabis_operators FOR EACH ROW EXECUTE FUNCTION public.set_updated_at(); END IF; IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_operator_licences_updated_at') THEN CREATE TRIGGER trg_operator_licences_updated_at BEFORE UPDATE ON public.operator_licences FOR EACH ROW EXECUTE FUNCTION public.set_updated_at(); END IF; END; $$;
ALTER TABLE public.cannabis_operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_licences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_countries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS public_select_cannabis_operators ON public.cannabis_operators;
CREATE POLICY public_select_cannabis_operators ON public.cannabis_operators FOR SELECT TO anon, authenticated USING (data_completeness != 'stub' AND verification_status != 'unverified');
DROP POLICY IF EXISTS public_select_operator_licences ON public.operator_licences;
CREATE POLICY public_select_operator_licences ON public.operator_licences FOR SELECT TO anon, authenticated USING (licence_status = 'active');
DROP POLICY IF EXISTS public_select_operator_countries ON public.operator_countries;
CREATE POLICY public_select_operator_countries ON public.operator_countries FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS service_role_all_cannabis_operators ON public.cannabis_operators;
CREATE POLICY service_role_all_cannabis_operators ON public.cannabis_operators FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS service_role_all_operator_licences ON public.operator_licences;
CREATE POLICY service_role_all_operator_licences ON public.operator_licences FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS service_role_all_operator_countries ON public.operator_countries;
CREATE POLICY service_role_all_operator_countries ON public.operator_countries FOR ALL TO service_role USING (true) WITH CHECK (true);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622153739','gap_c_operator_entity_graph_ddl','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622153739_gap_c_operator_entity_graph_ddl.sql

-- RECOVERY BEGIN 20260622153821_gap_c_operator_entity_graph_seed.sql
INSERT INTO public.cannabis_operators (id,country_iso2,legal_name,normalized_name,operator_type,primary_country_iso2,public_status,data_completeness,verification_status) VALUES
('a1000001-0000-0000-0000-000000000001','DE','Canopy Growth Germany GmbH','canopy growth germany gmbh','integrated','DE','active','seed','admin_verified'),
('a1000001-0000-0000-0000-000000000002','DE','Demecan GmbH','demecan gmbh','cultivator','DE','active','seed','admin_verified'),
('a1000001-0000-0000-0000-000000000003','DE','Tilray Deutschland GmbH','tilray deutschland gmbh','distributor','DE','active','seed','admin_verified'),
('a1000001-0000-0000-0000-000000000004','DE','IMC (Israel Medical Cannabis) GmbH','imc israel medical cannabis gmbh','importer','DE','active','seed','admin_verified'),
('a2000002-0000-0000-0000-000000000001','AU','Cannatrek Limited','cannatrek limited','distributor','AU','active','seed','admin_verified'),
('a2000002-0000-0000-0000-000000000002','AU','Little Green Pharma Ltd','little green pharma ltd','exporter','AU','active','seed','admin_verified'),
('a2000002-0000-0000-0000-000000000003','AU','Cann Group Limited','cann group limited','cultivator','AU','active','seed','admin_verified'),
('a3000003-0000-0000-0000-000000000001','IL','Inter Cannabis Ltd (IMC)','inter cannabis ltd imc','exporter','IL','active','seed','admin_verified'),
('a3000003-0000-0000-0000-000000000002','IL','Tikun Olam Ltd','tikun olam ltd','cultivator','IL','active','seed','admin_verified'),
('a3000003-0000-0000-0000-000000000003','IL','Canndoc Ltd','canndoc ltd','seller','IL','active','seed','admin_verified'),
('a3000003-0000-0000-0000-000000000004','IL','BOL Pharma Ltd','bol pharma ltd','cultivator','IL','active','seed','admin_verified'),
('a4000004-0000-0000-0000-000000000001','CO','Khiron Life Sciences Corp','khiron life sciences corp','integrated','CO','active','seed','admin_verified'),
('a4000004-0000-0000-0000-000000000002','CO','Flora Growth Corp','flora growth corp','exporter','CO','active','seed','admin_verified'),
('a4000004-0000-0000-0000-000000000003','CO','PharmaCielo Ltd','pharmacielo ltd','exporter','CO','active','seed','admin_verified'),
('a5000005-0000-0000-0000-000000000001','NL','Bedrocan BV','bedrocan bv','cultivator','NL','active','seed','admin_verified'),
('a6000006-0000-0000-0000-000000000001','GB','Curaleaf International Holdings Ltd','curaleaf international holdings ltd','seller','GB','active','seed','admin_verified'),
('a6000006-0000-0000-0000-000000000002','GB','Columbia Care UK Ltd','columbia care uk ltd','distributor','GB','active','seed','admin_verified')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.operator_countries (operator_id,country_iso2,presence_type) VALUES
('a1000001-0000-0000-0000-000000000001','DE','headquarters'),
('a1000001-0000-0000-0000-000000000001','CA','subsidiary'),
('a1000001-0000-0000-0000-000000000002','DE','headquarters'),
('a1000001-0000-0000-0000-000000000003','DE','headquarters'),
('a1000001-0000-0000-0000-000000000003','CA','subsidiary'),
('a1000001-0000-0000-0000-000000000004','DE','headquarters'),
('a1000001-0000-0000-0000-000000000004','IL','subsidiary'),
('a2000002-0000-0000-0000-000000000001','AU','headquarters'),
('a2000002-0000-0000-0000-000000000002','AU','headquarters'),
('a2000002-0000-0000-0000-000000000002','DE','distribution'),
('a2000002-0000-0000-0000-000000000002','GB','distribution'),
('a2000002-0000-0000-0000-000000000003','AU','headquarters'),
('a3000003-0000-0000-0000-000000000001','IL','headquarters'),
('a3000003-0000-0000-0000-000000000001','DE','subsidiary'),
('a3000003-0000-0000-0000-000000000002','IL','headquarters'),
('a3000003-0000-0000-0000-000000000003','IL','headquarters'),
('a3000003-0000-0000-0000-000000000004','IL','headquarters'),
('a4000004-0000-0000-0000-000000000001','CO','headquarters'),
('a4000004-0000-0000-0000-000000000001','GB','licensed_facility'),
('a4000004-0000-0000-0000-000000000002','CO','headquarters'),
('a4000004-0000-0000-0000-000000000002','DE','distribution'),
('a4000004-0000-0000-0000-000000000003','CO','headquarters'),
('a5000005-0000-0000-0000-000000000001','NL','headquarters'),
('a6000006-0000-0000-0000-000000000001','GB','headquarters'),
('a6000006-0000-0000-0000-000000000001','US','subsidiary'),
('a6000006-0000-0000-0000-000000000002','GB','headquarters')
ON CONFLICT (operator_id,country_iso2,presence_type) DO NOTHING;

INSERT INTO public.operator_licences (operator_id,country_iso2,licence_class,issuing_regulator,authorized_activities,licence_status,gmp_certified,gacp_certified,last_verified) VALUES
('a1000001-0000-0000-0000-000000000001','DE','Narcotic Import & Distribution','BfArM',ARRAY['import','distribution','wholesale'],'active',true,false,CURRENT_DATE),
('a1000001-0000-0000-0000-000000000002','DE','BfArM Domestic Cultivation Tender Lot 1','BfArM',ARRAY['cultivation','processing','wholesale'],'active',true,false,CURRENT_DATE),
('a1000001-0000-0000-0000-000000000003','DE','Narcotic Import & Wholesale Distribution','BfArM',ARRAY['import','wholesale'],'active',true,false,CURRENT_DATE),
('a1000001-0000-0000-0000-000000000004','DE','Narcotic Import & Distribution','BfArM',ARRAY['import','distribution'],'active',true,false,CURRENT_DATE),
('a2000002-0000-0000-0000-000000000001','AU','ODC Manufacture (Import)','TGA / Office of Drug Control',ARRAY['import','distribution'],'active',true,false,CURRENT_DATE),
('a2000002-0000-0000-0000-000000000002','AU','ODC Manufacture + Export','TGA / Office of Drug Control',ARRAY['cultivation','processing','export'],'active',true,true,CURRENT_DATE),
('a2000002-0000-0000-0000-000000000003','AU','ODC Cultivation + Manufacture','TGA / Office of Drug Control',ARRAY['cultivation','processing'],'active',true,true,CURRENT_DATE),
('a3000003-0000-0000-0000-000000000001','IL','MOH GAP Cultivation + Export','Israel Ministry of Health IMCA',ARRAY['cultivation','processing','export'],'active',true,true,CURRENT_DATE),
('a3000003-0000-0000-0000-000000000002','IL','MOH GAP Cultivation + Distribution','Israel Ministry of Health IMCA',ARRAY['cultivation','processing','distribution'],'active',true,true,CURRENT_DATE),
('a3000003-0000-0000-0000-000000000003','IL','MOH Pharmacy + Dispensary','Israel Ministry of Health IMCA',ARRAY['cultivation','processing','retail'],'active',true,false,CURRENT_DATE),
('a3000003-0000-0000-0000-000000000004','IL','MOH GAP Cultivation','Israel Ministry of Health IMCA',ARRAY['cultivation','processing'],'active',true,true,CURRENT_DATE),
('a4000004-0000-0000-0000-000000000001','CO','Licencia de Cultivo Cannabis Psicoactivo + Fabricacion','MinSalud / ICA',ARRAY['cultivation','processing','export','retail_medical'],'active',true,true,CURRENT_DATE),
('a4000004-0000-0000-0000-000000000002','CO','Licencia de Cultivo + Produccion + Exportacion','MinSalud / ICA',ARRAY['cultivation','processing','export'],'active',true,true,CURRENT_DATE),
('a4000004-0000-0000-0000-000000000003','CO','Licencia de Cultivo + Extraccion + Exportacion','MinSalud / ICA',ARRAY['cultivation','processing','export'],'active',true,true,CURRENT_DATE),
('a5000005-0000-0000-0000-000000000001','NL','BMC Official Government Supplier','Bureau Medicinale Cannabis',ARRAY['cultivation','processing','wholesale','export'],'active',true,true,CURRENT_DATE),
('a6000006-0000-0000-0000-000000000001','GB','Schedule 1 Controlled Drug Import & Wholesale Dealer','MHRA',ARRAY['import','wholesale','retail_medical'],'active',true,false,CURRENT_DATE),
('a6000006-0000-0000-0000-000000000002','GB','Schedule 1 Controlled Drug Import & Distribution','MHRA',ARRAY['import','distribution'],'active',true,false,CURRENT_DATE)
ON CONFLICT (id) DO NOTHING;

GRANT SELECT ON public.cannabis_operators TO anon, authenticated;
GRANT SELECT ON public.operator_licences TO anon, authenticated;
GRANT SELECT ON public.operator_countries TO anon, authenticated;
GRANT ALL ON public.cannabis_operators TO service_role;
GRANT ALL ON public.operator_licences TO service_role;
GRANT ALL ON public.operator_countries TO service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622153821','gap_c_operator_entity_graph_seed','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622153821_gap_c_operator_entity_graph_seed.sql

-- RECOVERY BEGIN 20260622153847_gap_d_jurisdiction_schema_unification.sql
CREATE TABLE IF NOT EXISTS public.jurisdiction_crossref (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    countries_iso2 text UNIQUE,
    jurisdictions_id text UNIQUE,
    hv_core_jurisdiction_iso_code text,
    canonical_iso2 text NOT NULL,
    canonical_name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT jurisdiction_crossref_pkey PRIMARY KEY (id),
    CONSTRAINT jurisdiction_crossref_countries_iso2_fkey FOREIGN KEY (countries_iso2) REFERENCES public.countries (iso_alpha2) ON DELETE SET NULL,
    CONSTRAINT jurisdiction_crossref_jurisdictions_id_fkey FOREIGN KEY (jurisdictions_id) REFERENCES public.jurisdictions (jurisdiction_id) ON DELETE SET NULL,
    CONSTRAINT jurisdiction_crossref_at_least_one_ref CHECK (countries_iso2 IS NOT NULL OR jurisdictions_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_jurisdiction_crossref_canonical_iso2 ON public.jurisdiction_crossref (canonical_iso2);
ALTER TABLE public.jurisdiction_crossref ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS public_select_jurisdiction_crossref ON public.jurisdiction_crossref;
CREATE POLICY public_select_jurisdiction_crossref ON public.jurisdiction_crossref FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS service_role_all_jurisdiction_crossref ON public.jurisdiction_crossref;
CREATE POLICY service_role_all_jurisdiction_crossref ON public.jurisdiction_crossref FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE OR REPLACE VIEW public.v_jurisdiction_unified AS
SELECT
    xref.canonical_iso2,
    xref.canonical_name,
    xref.hv_core_jurisdiction_iso_code,
    c.country_name,
    c.market_access_status,
    c.medical_status,
    c.adult_use_status,
    c.import_status,
    c.export_status,
    c.opportunity_score,
    c.data_completeness,
    c.regulator_label,
    c.public_summary AS countries_public_summary,
    j.jurisdiction_id,
    j.data_release_status,
    j.identity_verification_status,
    cpp.public_summary AS profile_public_summary,
    cpp.confidence_band_public,
    cpp.last_regulatory_verified_at
FROM public.jurisdiction_crossref xref
LEFT JOIN public.countries c ON c.iso_alpha2 = xref.countries_iso2
LEFT JOIN public.jurisdictions j ON j.jurisdiction_id = xref.jurisdictions_id
LEFT JOIN public.country_profiles_public cpp ON cpp.jurisdiction_id = j.jurisdiction_id;
GRANT SELECT ON public.v_jurisdiction_unified TO anon, authenticated;
INSERT INTO public.jurisdiction_crossref (countries_iso2, canonical_iso2, canonical_name)
SELECT iso_alpha2, iso_alpha2, country_name FROM public.countries
ON CONFLICT (countries_iso2) DO NOTHING;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622153847','gap_d_jurisdiction_schema_unification','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622153847_gap_d_jurisdiction_schema_unification.sql

-- RECOVERY BEGIN 20260622154316_gap_e_education_tables_ddl.sql
create table if not exists public.education_tracks (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text not null,
  publication_state text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.education_modules (
  id uuid primary key default gen_random_uuid(),
  track_id uuid references public.education_tracks(id) on delete cascade,
  slug text unique not null,
  title text not null,
  audience text[] not null default '{}',
  sensitivity text not null default 'standard',
  publication_state text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.education_articles (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references public.education_modules(id) on delete set null,
  slug text unique not null,
  title text not null,
  summary text not null,
  source_basis text not null default 'draft',
  publication_state text not null default 'draft',
  review_status text not null default 'review-required',
  last_reviewed date,
  next_review_due date,
  publication_confidence text not null default 'low',
  reviewer_type text,
  controlled_topic boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622154316','gap_e_education_tables_ddl','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622154316_gap_e_education_tables_ddl.sql

-- RECOVERY BEGIN 20260622154436_gap_e_education_track1_market_access.sql
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


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622154436','gap_e_education_track1_market_access','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622154436_gap_e_education_track1_market_access.sql

-- RECOVERY BEGIN 20260622154819_gap_e_education_track2_regulatory_compliance.sql
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
        'The World Health Organization''s GMP guidelines (WHO Technical Report Series No. 986, Annex 2) are recognised by many non-EU markets--including Australia (TGA), Canada (Health Canada), and several Latin American and Asian regulators--as an acceptable standard for pharmaceutical manufacturing, including cannabis-derived products. WHO-GMP inspections are conducted by national medicines regulatory authorities (NMRAs) or accredited third-party bodies, and certificates are issued for a defined scope of manufacturing activities. For cannabis producers seeking multi-market access, WHO-GMP certification provides a cost-effective foundation before pursuing market-specific certifications such as EU-GMP or TGA GMP.',
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


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622154819','gap_e_education_track2_regulatory_compliance','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622154819_gap_e_education_track2_regulatory_compliance.sql

-- RECOVERY BEGIN 20260622154920_gap_e_education_track3_country_intel.sql
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
        'Germany represents the largest regulated medicinal cannabis market in Europe, with over 4 million patient prescriptions dispensed in 2023 and annual import volumes estimated at 30,000-40,000 kg of dried flower equivalents. The market is characterised by a fragmented pharmacy-based dispensing model, a dominant dried flower product category, and strong demand for high-THC cultivars from established Canadian, Dutch, and Danish producers. The CanG reforms of 2024 have introduced adult-use possession rights but preserve the prescription-only import model for pharmaceutical-grade cannabis, sustaining demand for EU-GMP-certified international supply.',
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


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622154920','gap_e_education_track3_country_intel','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622154920_gap_e_education_track3_country_intel.sql
