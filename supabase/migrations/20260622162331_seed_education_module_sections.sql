-- Migration: Seed education_module_sections for all 12 education modules
-- Created: 2026-06-22

INSERT INTO education_module_sections
  (id, module_id, section_order, heading, body, block_type, created_at, updated_at)
VALUES

-- ============================================================
-- Module 1: Clinical Cannabis Prescribing (clinical track)
-- module_id: b4882b28-7039-471f-b580-c19786752be6
-- ============================================================
(
  gen_random_uuid(),
  'b4882b28-7039-471f-b580-c19786752be6',
  1,
  'Overview',
  'Clinical cannabis prescribing sits at the intersection of regulatory compliance, pharmacology, and patient-centred care. Across major markets — including Canada, Germany, Australia, and Israel — licensed healthcare practitioners must follow jurisdiction-specific frameworks that govern which products can be authorised, in what quantities, and for which indications. Understanding these frameworks is foundational for any clinician or operator seeking to participate in the regulated medical cannabis supply chain. This module provides a structured walkthrough of prescribing pathways, documentation obligations, and the product knowledge clinicians require to practise safely and lawfully.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'b4882b28-7039-471f-b580-c19786752be6',
  2,
  'Regulatory Prescribing Frameworks',
  'Each major medical cannabis jurisdiction has established its own prescribing authority model. In Canada, Sections 268–286 of the Cannabis Regulations permit patients to register directly with Licensed Producers upon receipt of a medical document from an authorised healthcare practitioner. Germany''s Cannabis Act (CanG 2024) allows any licensed physician to prescribe cannabis flower, extracts, or finished medicinal preparations without special narcotics authorisation, dramatically expanding access. Australia''s Therapeutic Goods Administration operates a Simplified Access Pathway under which GPs can authorise Schedule 8 or Schedule 4 cannabis medicines without prior TGA approval for most patients. Operators supplying into these markets must ensure their product labelling, Certificates of Analysis, and pharmacist-facing datasheets satisfy the requirements of each destination country''s prescribing framework.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'b4882b28-7039-471f-b580-c19786752be6',
  3,
  'Product Selection & Cannabinoid Dosing Principles',
  'Clinicians authorising cannabis medicines must be able to navigate product formats — flower, oil, capsule, sublingual spray — and their differing pharmacokinetic profiles. Inhaled products produce rapid onset (2–10 minutes) and shorter duration, making them suitable for breakthrough symptom management, whereas oral oil preparations provide slower onset (30–120 minutes) with extended duration, suiting chronic pain and sleep indications. THC:CBD ratio selection is clinically meaningful: high-CBD products (e.g. 20:1 CBD:THC) carry lower psychoactive risk for anxiety or epilepsy indications, while balanced or THC-dominant products may be required for treatment-resistant nausea or spasticity. Operators supplying to clinical settings should provide clear product monographs with start-low-go-slow dosing guidance aligned to each destination market''s clinical practice guidelines.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'b4882b28-7039-471f-b580-c19786752be6',
  4,
  'Documentation & Record-Keeping Requirements',
  'Medical cannabis prescribing generates a documentation chain that must satisfy both clinical governance standards and regulatory audit requirements. In most jurisdictions, the prescribing practitioner must retain a record of the clinical indication, the product authorised, the quantity and duration of the authorisation, and any follow-up assessment schedule. Canadian Licensed Producers are required to retain copies of medical documents for a minimum of two years; Australian sponsors must retain supply records for five years under TGA guidelines. For operators, this means that supply agreements with clinics and pharmacies should contractually define record-keeping obligations, and that ERP or seed-to-sale systems must be capable of producing supply records in formats acceptable to national health authority inspectors.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'b4882b28-7039-471f-b580-c19786752be6',
  5,
  'Common Pitfalls & Next Steps',
  'Common errors in clinical prescribing programmes include issuing authorisations without documented clinical rationale, failing to reconcile patient purchase limits across multiple authorised suppliers, and providing products whose CoA dates have lapsed beyond the acceptable window for the destination jurisdiction. Operators should ensure that their medical affairs teams proactively train prescribing clinicians on product shelf life, storage requirements, and reporting obligations for adverse events. The next step for operators entering or scaling clinical supply is to establish a Medical Information function capable of responding to clinician enquiries and providing post-market safety data, aligned to pharmacovigilance obligations in each active market.',
  'text',
  NOW(), NOW()
),

-- ============================================================
-- Module 2: Pharmacy Dispensing Controls (clinical track)
-- module_id: 03f94ba6-bbd9-4eb5-b3ef-04b3bfa45587
-- ============================================================
(
  gen_random_uuid(),
  '03f94ba6-bbd9-4eb5-b3ef-04b3bfa45587',
  1,
  'Overview',
  'Pharmacy dispensing controls for cannabis medicines govern how authorised products move from the licensed supply chain into the hands of patients, and impose obligations on both manufacturers and dispensing pharmacists. In markets where cannabis medicines are classified as Schedule 8 (Australia), Betäubungsmittel (Germany), or Narcotic Drugs (Canada), pharmacies must implement specific storage, dispensing, and record-keeping controls that go beyond standard prescription medicines. Operators supplying into pharmacy channels must understand these controls to ensure their packaging, labelling, and documentation meet the requirements that pharmacists need to dispense legally and efficiently. Failure to align product presentation with pharmacy workflow requirements is one of the most common causes of supply chain friction in regulated cannabis markets.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  '03f94ba6-bbd9-4eb5-b3ef-04b3bfa45587',
  2,
  'Scheduling Classifications & Storage Obligations',
  'Cannabis medicines are subject to controlled substance scheduling in virtually every regulated market, imposing specific storage requirements at the pharmacy level. In Australia, Schedule 8 products must be stored in a locked, fixed safe or vault that meets state health authority specifications, with separate registers maintained for each Schedule 8 substance. German pharmacies handling Betäubungsmittel (BtM) are required to store cannabis in a Class S steel safe per the BtMVV, maintain a separate BtM ledger updated within 24 hours of each transaction, and submit quarterly balance reports to the state authority. Canadian pharmacies dispensing cannabis under the Cannabis Regulations must maintain a controlled substance reconciliation log and conduct periodic physical inventory counts. Operators should confirm that their product unit sizes and packaging formats are compatible with the safe and dispensing infrastructure typical of pharmacies in each target market.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  '03f94ba6-bbd9-4eb5-b3ef-04b3bfa45587',
  3,
  'Labelling Standards for Dispensing Compliance',
  'Pharmacy-facing labelling for cannabis medicines must satisfy both the manufacturer''s regulatory obligations and the pharmacist''s ability to apply a dispensing label over or alongside the primary label without obscuring mandatory information. In Germany, finished cannabis medicines must display the BtM number, the product''s batch number, the cannabinoid content per unit and per container, and an expiry date in DD/MM/YYYY format. Australian TGA-listed or TGA-registered products must carry ARTG inclusion numbers where applicable, and labels must not make therapeutic claims beyond those approved in the product''s Schedule entry or indication list. Operators should test label layouts against the physical dispensing workflow — including the space available for pharmacist over-labelling — before committing to large production runs, as label recalls are costly and disruptive.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  '03f94ba6-bbd9-4eb5-b3ef-04b3bfa45587',
  4,
  'Dispensing Workflow & Patient Counselling',
  'Effective dispensing controls extend beyond physical security to encompass the pharmacist''s clinical role in cannabis medicine supply. In most regulated markets, dispensing pharmacists are expected to verify the prescriber''s authority, confirm the patient''s identity, check for potential drug-drug interactions (particularly with CNS depressants, blood thinners, and CYP450-metabolised medicines), and provide structured counselling on product use, storage at home, and driving restrictions. Operators can support pharmacy partners by providing pharmacist training modules, patient information leaflets in required languages, and direct-line medical information support. Markets with pharmacist-led dispensing models — including Germany, where pharmacies compound flower products to order — place additional demands on operators to supply accurate and up-to-date product monographs and stability data.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  '03f94ba6-bbd9-4eb5-b3ef-04b3bfa45587',
  5,
  'Common Pitfalls & Next Steps',
  'Frequent dispensing compliance failures include pharmacies accepting product shipments without verifying that the accompanying documentation (CoA, import permit, BtM delivery receipt) is complete, and operators failing to provide sufficient advance notice of batch changes that require pharmacists to update their dispensing system records. Short-dated stock — product arriving at pharmacy with less than 6 months of shelf life remaining — is a significant source of waste and returns claims in pharmacy channels. The next step for operators building pharmacy distribution networks is to establish a pharmacy account management programme that provides timely communication on batch changes, shelf life, and product discontinuations, and to implement a product return and destruction workflow that satisfies BtM or Schedule 8 disposal requirements in each market.',
  'text',
  NOW(), NOW()
),

-- ============================================================
-- Module 3: GMP Compliance Essentials (compliance track)
-- module_id: edc533ae-e077-4eac-8cb4-01f974a4ce5d
-- ============================================================
(
  gen_random_uuid(),
  'edc533ae-e077-4eac-8cb4-01f974a4ce5d',
  1,
  'Overview',
  'Good Manufacturing Practice (GMP) certification is the gateway requirement for accessing virtually every regulated international cannabis export market. EU-GMP (Annex 1 for sterile products and general GMP for non-sterile cannabis preparations), WHO-GMP, and PIC/S GMP standards form the core frameworks that regulators in Germany, Australia, the UK, Israel, and other importing markets use to assess whether foreign-produced cannabis medicines meet the quality standards required for patient safety. For cannabis operators, achieving and maintaining GMP certification is not a one-time event but an ongoing operational discipline that touches every function — from cultivation and extraction to packaging, laboratory testing, and distribution. This module provides a practical foundation in GMP principles as they apply to the cannabis sector.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'edc533ae-e077-4eac-8cb4-01f974a4ce5d',
  2,
  'Core GMP Principles Applied to Cannabis',
  'The ten core GMP principles — quality management, personnel, premises and equipment, documentation, production, quality control, contract manufacture and analysis, complaints and recalls, self-inspection, and change control — all apply to cannabis manufacturing with industry-specific nuances. Cannabis cultivation under GMP requires validated growing environments with controlled humidity, temperature, and lighting, along with documented pesticide management programmes and seed-to-harvest traceability. Extraction and processing operations must use validated methods with established critical process parameters, and all equipment must be qualified (IQ/OQ/PQ) and subject to a preventive maintenance schedule. GMP-compliant cannabis manufacturers must maintain a Pharmaceutical Quality System (PQS) documented in a Site Master File (SMF) that describes all manufacturing activities performed at the licensed site.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'edc533ae-e077-4eac-8cb4-01f974a4ce5d',
  3,
  'EU-GMP Certification Process',
  'EU-GMP certification for cannabis manufacturers is granted by a competent authority in an EU/EEA member state following a successful inspection of the manufacturing site. The process typically begins with a manufacturer applying for a Manufacturing and Import Authorisation (MIA) or equivalent national licence, submitting a detailed Site Master File, and undergoing an announced on-site inspection by the competent authority''s inspectorate team. Inspections assess conformance with EU GMP guidelines (EudraLex Volume 4) across all manufacturing steps and may result in the issuance of a GMP certificate valid for up to three years, subject to re-inspection. Non-EU manufacturers — such as those in Canada, Australia, or Colombia — can achieve EU-GMP recognition through bilateral Mutual Recognition Agreements (MRAs) or by applying directly to a member state authority and undergoing an overseas inspection, a process that can take 12–24 months and cost €150,000–€400,000 in preparation and inspection fees.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'edc533ae-e077-4eac-8cb4-01f974a4ce5d',
  4,
  'Documentation & Change Control',
  'GMP documentation underpins the entire quality system and is one of the most frequently cited areas of non-conformance during inspections. Cannabis manufacturers must maintain a full set of Standard Operating Procedures (SOPs), Batch Manufacturing Records (BMRs), Batch Packaging Records (BPRs), equipment qualification protocols, and analytical method validation reports. Change control is the formal process by which any modification to a validated process, material, equipment, facility, or document is assessed for quality impact before implementation — a requirement that prevents unauthorised changes that could compromise product quality or regulatory compliance. Operators building GMP systems should implement electronic document management systems (eDMS) capable of version controlling SOPs, managing approval workflows, and generating audit trails that are available for regulatory inspection without manual reconstruction.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'edc533ae-e077-4eac-8cb4-01f974a4ce5d',
  5,
  'Common Pitfalls & Next Steps',
  'The most common GMP non-conformances identified during cannabis facility inspections include inadequate environmental monitoring programmes for controlled manufacturing areas, incomplete or retrospectively completed batch records, pest control programmes that lack documented effectiveness data, and calibration schedules that are not adhered to on time. Personnel training records are a frequent inspection finding — GMP requires documented evidence that every person performing GMP-critical tasks has been trained against the current version of the relevant SOP. Operators preparing for a first GMP inspection should conduct a gap assessment against EudraLex Volume 4 or the relevant national GMP guide, remediate identified gaps, and perform a full internal mock inspection at least 60 days before the scheduled regulatory inspection to allow time for corrective actions.',
  'text',
  NOW(), NOW()
),

-- ============================================================
-- Module 4: Building a Proof Pack (compliance track)
-- module_id: cb3bf297-51ed-4c85-bded-7370e1748d94
-- ============================================================
(
  gen_random_uuid(),
  'cb3bf297-51ed-4c85-bded-7370e1748d94',
  1,
  'Overview',
  'A "Proof Pack" is the compiled dossier of regulatory, quality, and legal documentation that a cannabis operator presents to importers, regulators, distribution partners, and institutional buyers to demonstrate that their products and operations meet the required standards for market entry. In the cannabis industry, where trust is built on documentation rather than brand history, a well-structured Proof Pack is a competitive differentiator and a prerequisite for closing high-value distribution agreements. Proof Packs vary by market and counterparty, but typically include GMP certificates, Certificates of Analysis, import/export permits, product registrations, and corporate compliance declarations. This module walks through the components of a complete Proof Pack and how to assemble, maintain, and present it effectively.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'cb3bf297-51ed-4c85-bded-7370e1748d94',
  2,
  'Core Documents Every Proof Pack Needs',
  'The foundational documents in any cannabis Proof Pack include: (1) a current GMP Certificate issued by a recognised competent authority, with the scope statement confirming coverage of the specific product type being supplied; (2) Certificates of Analysis (CoA) for each batch offered, issued by a GMP-compliant or ISO 17025-accredited laboratory, covering potency, residual solvents, pesticides, heavy metals, microbiology, and mycotoxins; (3) a valid export licence or permit from the country of origin confirming the specific shipment or product category is authorised for export; (4) a product specification sheet or Technical Data Sheet that provides shelf life, storage conditions, packaging description, and cannabinoid profile; and (5) a Certificate of Origin where required by the destination country''s import authority. Each document must be current — expired GMP certificates or CoAs older than 12 months are common reasons for shipment rejection at customs.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'cb3bf297-51ed-4c85-bded-7370e1748d94',
  3,
  'Market-Specific Documentation Requirements',
  'Proof Pack requirements vary significantly by destination market, and operators must maintain market-specific document sets rather than a single universal dossier. Germany requires BtM import permits referencing specific batch quantities and UN narcotic codes, and the importer must be named on the export permit. Australia requires TGA import permits referencing the specific consignment, and the TGA may request a Foreign Government Certificate (FGC) from the exporting country''s health authority. The UK requires Home Office import licences that must be applied for well in advance of shipment. Israel''s IMCA requires suppliers to hold recognised GMP certification and to provide product registration documentation or a Letter of Access to relevant dossiers. Operators serving multiple markets should maintain a document matrix tracking the status and expiry of every required document by market, updated on a rolling basis.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'cb3bf297-51ed-4c85-bded-7370e1748d94',
  4,
  'Maintaining & Updating Your Proof Pack',
  'A Proof Pack is only as strong as its most recently expired document. Operators must establish a document lifecycle management process that tracks expiry dates for all certificates and permits, triggers renewal applications well in advance of expiry (at least 90 days for GMP certificates, 60 days for permits), and ensures that updated documents are distributed to all counterparties holding current copies. GMP re-inspections must be scheduled proactively — waiting for a certificate to expire before beginning the renewal process can leave an operator without a valid certificate for months, effectively blocking all exports during that period. Quality Management Systems (QMS) should include a dedicated register of external regulatory documents with owner assignments, expiry dates, and renewal action triggers.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'cb3bf297-51ed-4c85-bded-7370e1748d94',
  5,
  'Presenting Your Proof Pack to Buyers & Regulators',
  'When presenting a Proof Pack to a prospective importer or institutional buyer, organisation and accessibility matter as much as content. Buyers conducting due diligence on multiple suppliers will favour operators whose documentation is logically structured, indexed, and available in a secure digital data room with clearly labelled folders by document type and market. Regulators conducting import permit reviews require that documentation submitted with permit applications is self-contained — all referenced certificates and permits should be included as annexes rather than described by reference. Operators should prepare both a "public" version of their Proof Pack (for early-stage commercial discussions) and a "full" version (for formal regulatory submissions and distribution agreements) that includes confidential manufacturing and quality system information under NDA protection.',
  'text',
  NOW(), NOW()
),

-- ============================================================
-- Module 5: Compliance Readiness Self-Assessment (compliance track)
-- module_id: 8d4ba66c-776e-44a2-9bc6-7c1e95054a83
-- ============================================================
(
  gen_random_uuid(),
  '8d4ba66c-776e-44a2-9bc6-7c1e95054a83',
  1,
  'Overview',
  'A Compliance Readiness Self-Assessment is a structured internal audit process that allows cannabis operators to measure their current state of regulatory compliance against the requirements of their target markets before engaging regulators, importers, or institutional partners. Unlike a formal regulatory inspection — which carries the risk of enforcement action for identified deficiencies — a self-assessment is a proactive, low-risk mechanism for identifying and remediating compliance gaps. Well-executed self-assessments are used by leading operators to prepare for GMP inspections, licensing renewals, distribution partner due diligence, and capital raises where investors require evidence of regulatory standing. This module provides a framework for conducting a meaningful self-assessment across the key compliance domains relevant to international cannabis operations.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  '8d4ba66c-776e-44a2-9bc6-7c1e95054a83',
  2,
  'Assessment Domains & Key Questions',
  'A comprehensive compliance readiness assessment for a cannabis operator should cover at minimum five domains: (1) Licensing & Regulatory Standing — are all licences current, in-scope for current activities, and free from conditions or enforcement actions? (2) Quality Management System — is the QMS documented, implemented, and effective, with all SOPs approved and in use? (3) Product Quality & Testing — are all batches released against specification, with CoAs from qualified laboratories and shelf life data on file? (4) Supply Chain & Traceability — is seed-to-sale tracking functional, complete, and capable of generating the data required by destination market regulators? (5) Personnel & Training — are all staff trained against current SOPs, with records maintained and accessible? Each domain should be assessed against the specific requirements of target export markets, not just the operator''s domestic regulatory framework.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  '8d4ba66c-776e-44a2-9bc6-7c1e95054a83',
  3,
  'Running the Assessment: Process & Tools',
  'An effective self-assessment combines document review, staff interviews, physical facility walk-throughs, and data integrity checks. The assessment team should include internal quality and compliance staff supplemented by an external GMP consultant with direct experience in the target market''s inspection standards — external reviewers bring objectivity and knowledge of what inspectors actually look for in practice. Assessment findings should be recorded in a structured format — typically a gap analysis matrix — that captures the regulatory requirement, the current state, the identified gap, the risk classification (critical, major, minor), the proposed corrective action, the responsible owner, and the target completion date. Prioritisation of corrective actions should be risk-based, with critical gaps (those that would result in a failed inspection or product recall) addressed first.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  '8d4ba66c-776e-44a2-9bc6-7c1e95054a83',
  4,
  'Interpreting Results & Prioritising Remediation',
  'Self-assessment results should be presented to senior leadership in a format that communicates risk clearly and drives resource allocation decisions. A traffic-light scoring system — Red (critical gap, immediate action required), Amber (significant gap, action required within 30–60 days), Green (compliant or minor gap) — provides an accessible summary that non-technical executives can act on. Remediation timelines should be realistic: a critical data integrity gap in a laboratory information management system (LIMS), for example, may require months of system reconfiguration and revalidation, while an SOP that lacks a required section can be corrected in days. Operators should avoid the common trap of treating self-assessment as a paper exercise — remediation actions must be implemented, verified, and closed with documented evidence, not simply noted as "in progress."',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  '8d4ba66c-776e-44a2-9bc6-7c1e95054a83',
  5,
  'Next Steps: From Assessment to Action',
  'Completing a self-assessment is the beginning of a compliance improvement cycle, not the end. Operators should establish a CAPA (Corrective and Preventive Action) register to track all identified gaps through to verified closure, conduct follow-up assessments at 60 and 90 days to confirm that corrective actions have been implemented effectively, and schedule the next full self-assessment no more than 12 months later. Operators preparing for a GMP inspection should aim to complete their self-assessment at least six months before the scheduled inspection date to allow sufficient remediation time. The self-assessment process itself — when documented with gap analyses, CAPA records, and closure evidence — serves as powerful evidence of a functioning quality culture that regulators and institutional partners find reassuring.',
  'text',
  NOW(), NOW()
),

-- ============================================================
-- Module 6: Export Readiness 101 (export track)
-- module_id: 6bff2f95-b4b5-4487-8455-26a5d110e742
-- ============================================================
(
  gen_random_uuid(),
  '6bff2f95-b4b5-4487-8455-26a5d110e742',
  1,
  'Overview',
  'Export readiness for cannabis operators encompasses the full set of regulatory, quality, logistics, and commercial capabilities required to successfully ship products across international borders into regulated markets. The global medical cannabis export market exceeded USD 600 million in 2024 and is projected to grow substantially as Germany''s liberalised prescribing framework drives European demand, and as emerging markets in Southeast Asia and Latin America establish regulated import pathways. However, achieving consistent, compliant export operations requires significant preparation: most operators attempting their first international export underestimate the complexity of simultaneous compliance with both the exporting and importing country''s regulatory requirements. This module provides a structured roadmap for operators at any stage of export readiness.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  '6bff2f95-b4b5-4487-8455-26a5d110e742',
  2,
  'EU-GMP Certification Requirements',
  'EU-GMP certification is the non-negotiable prerequisite for exporting cannabis medicines to Germany, and is recognised or required by the majority of other regulated importing markets including the Netherlands, Portugal, Poland, and the Czech Republic. The certification process requires a cannabis manufacturer to implement a Pharmaceutical Quality System conforming to EudraLex Volume 4, undergo a formal inspection by a competent authority from an EU/EEA member state or a country with a Mutual Recognition Agreement, and receive a GMP Certificate that explicitly covers the manufacturing scope being exported. Operators in non-MRA countries — such as Colombia, Thailand, or Jamaica — must apply directly to a European competent authority (commonly the Dutch IGJ, German BfArM/Länder authorities, or the Portuguese INFARMED) for an overseas inspection, a process requiring a minimum of 12 months lead time and meticulous inspection preparation. Without a current, in-scope GMP certificate, no EU country will grant an import permit for a commercial shipment.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  '6bff2f95-b4b5-4487-8455-26a5d110e742',
  3,
  'Phytosanitary & Import Permits',
  'In addition to GMP certification, international cannabis shipments require a set of permits that must be obtained and coordinated between the exporter, the importer, and both countries'' competent authorities. On the export side, an export licence or permit is required from the national drug control authority — for example, Health Canada for Canadian exports, or the ANVISA for Brazilian exports — referencing the specific product, quantity, destination country, and importing entity. On the import side, the receiving country''s authority issues an import permit — Germany''s BtM import permit, Australia''s TGA import licence, the UK''s Home Office licence — that must be in hand before the shipment departs. Phytosanitary certificates, issued by the exporting country''s national plant health authority, are required for cannabis flower and other plant-derived products and confirm that the shipment is free from pests and plant diseases. Permit procurement lead times range from 2 weeks (some Australian TGA permits) to 8 weeks (German BtM permits), and shipments that arrive without valid permits face seizure and destruction.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  '6bff2f95-b4b5-4487-8455-26a5d110e742',
  4,
  'GDP Logistics Requirements',
  'Cannabis medicines exported to regulated markets must be transported under conditions that maintain product integrity from manufacturer to end customer, in accordance with GDP (Good Distribution Practice) guidelines. Temperature-controlled logistics — typically 15–25°C ambient or 2–8°C for cold chain products — must be maintained throughout the cold chain with continuous temperature monitoring using validated data loggers that generate records available for regulatory review. GDP-compliant logistics providers must hold the appropriate narcotics handling authorisations in each country through which the shipment transits, and must be named in the relevant import and export permits where required by national regulations. Air freight is the dominant mode for international cannabis medicine shipments due to the narcotics handling complexity of sea freight and the shorter transit times that reduce temperature excursion risk. Operators should perform GDP qualification of each logistics provider before first use, including review of the provider''s narcotics security procedures, temperature mapping data, and deviation management processes.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  '6bff2f95-b4b5-4487-8455-26a5d110e742',
  5,
  'Common Pitfalls',
  'The most frequent causes of export failure among cannabis operators include: GMP certificates that do not explicitly cover the exported product type (e.g. a certificate covering extraction but not flower); CoAs that do not include all analytes required by the destination market''s import permit conditions; permit applications submitted without all required attachments, causing weeks of delays; logistics providers without narcotics handling authorisations in transit countries; and shipments that arrive at the destination port without advance notification to the importer and customs broker, resulting in delayed clearance and temperature excursions. A less visible but equally damaging pitfall is currency and counterparty risk — export invoices denominated in a currency that the importer cannot readily convert, or distribution agreements that do not clearly allocate responsibility for permit procurement, customs costs, and shipment rejection liability.',
  'text',
  NOW(), NOW()
),

-- ============================================================
-- Module 7: Genetics IP & Cultivar Documentation (genetics track)
-- module_id: 7520ef89-8758-4436-860c-e016c53a6d32
-- ============================================================
(
  gen_random_uuid(),
  '7520ef89-8758-4436-860c-e016c53a6d32',
  1,
  'Overview',
  'Intellectual property protection for cannabis genetics is an increasingly critical competitive concern as the industry matures and proprietary cultivars become key commercial differentiators. Cannabis breeders and cultivators face a unique IP landscape: unlike pharmaceutical drug patents, which protect molecules, cannabis genetics IP sits at the intersection of plant variety protection law, trade secret law, utility patents, and international biosafety agreements such as the Nagoya Protocol. Operators who fail to document and protect their cultivar IP risk losing competitive advantages through uncontrolled genetic propagation by partners or competitors, and may face Freedom to Operate challenges when entering markets where competing genetics have been protected. This module introduces the key IP mechanisms available to cannabis operators and the documentation practices that underpin them.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  '7520ef89-8758-4436-860c-e016c53a6d32',
  2,
  'Plant Variety Protection & Utility Patents',
  'The two primary legal instruments for protecting cannabis cultivar IP are Plant Variety Protection (PVP) certificates and utility patents. PVP certificates, issued under UPOV Convention frameworks by national plant variety offices (e.g. CFIA in Canada, CPVO in the EU, IP Australia), grant the holder exclusive rights to produce, sell, and import a registered variety for 20–25 years, provided the variety satisfies the DUS criteria: Distinctness (clearly different from existing varieties), Uniformity (sufficiently uniform across plants), and Stability (remaining true to description after repeated propagation). Utility patents — available in the US and increasingly tested in other jurisdictions — offer broader protection covering not just the specific variety but the genetic traits themselves, potentially blocking competitors from breeding related cultivars. Cannabis operators building a commercial genetics programme should pursue PVP registration as a minimum and assess utility patent viability with IP counsel familiar with the jurisdiction''s evolving case law.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  '7520ef89-8758-4436-860c-e016c53a6d32',
  3,
  'Cultivar Documentation Standards',
  'Robust cultivar documentation is the foundation of any IP protection or licensing programme and serves the dual purpose of satisfying regulatory traceability requirements and establishing a defensible prior art record. A cultivar dossier should include: the breeding history and parentage (to the extent not protected as a trade secret), morphological descriptors (plant height, leaf shape, flower structure, trichome density), chemotype profile (cannabinoid and terpene ratios across multiple grow cycles and environments), genetic fingerprinting data (STR or SNP profiles generated by an accredited laboratory), and a phenotypic stability report demonstrating consistent expression across at least three independent grow cycles. Operators exporting genetics-derived products should also document the provenance of parent material in compliance with the Nagoya Protocol on Access and Benefit Sharing, which requires documented consent and benefit-sharing agreements when genetic resources originate from countries that are parties to the protocol.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  '7520ef89-8758-4436-860c-e016c53a6d32',
  4,
  'Licensing & Commercialising Cultivar IP',
  'Proprietary cultivar IP can be commercialised through licensing agreements, joint ventures, and exclusive supply arrangements that generate revenue streams independent of the operator''s own production capacity. A cultivar licence should specify the licensed territory, the permitted use (propagation for own production only vs. sub-licensing), royalty structures (per-gram of flower produced, per-clone supplied, or percentage of net revenue), quality standards the licensee must maintain to protect the cultivar''s reputation, and audit rights allowing the licensor to verify compliance. Operators licensing genetics internationally must ensure that the licence agreement is governed by a law that provides effective enforcement mechanisms, and that the agreement addresses the risk of genetic drift or unauthorised cross-breeding by the licensee. Trade secret protection — maintaining cultivar parentage information as confidential, with access controlled through NDAs — is often used alongside formal IP registration to create a layered protection strategy.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  '7520ef89-8758-4436-860c-e016c53a6d32',
  5,
  'Common Pitfalls & Next Steps',
  'Common genetics IP failures include sharing cultivar material with prospective partners before formal IP protection is in place or NDAs are signed, failing to document the chain of custody of genetic material from breeding through propagation, and not conducting freedom-to-operate searches before commercialising a new cultivar in a market where competitors may hold blocking IP. Operators frequently underestimate the time required for PVP registration — the examination process typically takes 2–4 years from filing, during which time the applicant must maintain the variety in growing trials available for examination by the plant variety office. The next steps for operators serious about genetics IP are to appoint an IP attorney specialising in plant variety rights, commission a genetic fingerprinting exercise across all commercial cultivars, and establish an internal IP register that tracks registration status, licensing agreements, and renewal obligations by jurisdiction.',
  'text',
  NOW(), NOW()
),

-- ============================================================
-- Module 8: Importer / Buyer Pathway Guide (import track)
-- module_id: b65b8dbd-4e12-46fe-8928-99cf520770b1
-- ============================================================
(
  gen_random_uuid(),
  'b65b8dbd-4e12-46fe-8928-99cf520770b1',
  1,
  'Overview',
  'Navigating the importer and buyer landscape is one of the most strategically important — and least standardised — activities for a cannabis exporter entering a new market. In regulated cannabis markets, the importer is often not just a logistics intermediary but a licensed entity with direct regulatory accountability, typically holding an import licence, a wholesale distribution authorisation, and in some markets a narcotics handling permit that cannot be transferred. Understanding who the key licensed importers are in each target market, what their commercial requirements and due diligence standards look like, and how to structure agreements that align incentives between exporter and importer is essential for building a sustainable international distribution business. This module guides operators through the importer identification, qualification, and contracting process in major cannabis importing markets.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'b65b8dbd-4e12-46fe-8928-99cf520770b1',
  2,
  'Identifying Licensed Importers by Market',
  'In most regulated cannabis markets, the universe of licensed importers is limited and publicly identifiable through national regulatory registers. Germany''s BfArM publishes a list of BtM licence holders; Australia''s TGA maintains a register of import licence holders; the UK''s Home Office and MHRA jointly oversee cannabis medicine importers. These registers are the starting point for market entry — operators should systematically identify all licensed importers in target markets and prioritise outreach based on their apparent commercial activity (recent import permit applications, public distribution announcements, or pharmacy network relationships). In some markets, particularly those where distribution is vertically integrated — such as the Netherlands, where Bedrocan holds a government-mandated supply monopoly — the importer universe is extremely limited and commercial entry requires negotiation with a single counterparty or government body.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'b65b8dbd-4e12-46fe-8928-99cf520770b1',
  3,
  'Importer Due Diligence & Qualification',
  'Before entering a distribution agreement, cannabis exporters should conduct structured due diligence on prospective importers to assess their regulatory standing, financial capacity, market reach, and operational capability. Key due diligence areas include: verification of current import licence and narcotics handling authorisations; confirmation of GDP certification or equivalent quality certification; review of the importer''s pharmacy distribution network (number of pharmacies, geographic coverage, exclusive vs. non-exclusive arrangements with existing suppliers); financial standing (particularly relevant for small importers requesting extended payment terms or consignment arrangements); and reputational assessment (regulatory enforcement history, litigation records, industry references). Operators should also assess whether the importer has exclusive agreements with competing suppliers that could create conflicts of interest, and whether their distribution infrastructure is aligned with the product formats and volume profiles the exporter intends to supply.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'b65b8dbd-4e12-46fe-8928-99cf520770b1',
  4,
  'Distribution Agreement Key Terms',
  'A well-structured cannabis distribution agreement is the commercial backbone of an international supply relationship and must address both commercial and regulatory dimensions that are specific to narcotics supply chains. Key commercial terms include: territory and exclusivity provisions (exclusive territory arrangements provide importers with protection against parallel imports but limit the exporter''s flexibility); minimum purchase commitments with quarterly ratchets that create accountability for distribution performance; pricing mechanisms indexed to an agreed benchmark (e.g. spot price for comparable product in the market) with annual review provisions; payment terms that protect the exporter against credit risk (letter of credit or advance payment for first shipments, net-30 thereafter with credit insurance); and termination provisions with adequate notice periods (minimum 6 months for exclusive arrangements) and IP return obligations. Regulatory terms must cover: responsibility for permit procurement and costs; product liability and recall procedures; compliance with destination market advertising restrictions; and data sharing obligations for pharmacovigilance reporting.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'b65b8dbd-4e12-46fe-8928-99cf520770b1',
  5,
  'Common Pitfalls & Next Steps',
  'Exporters frequently encounter the following problems in importer relationships: importers who secure exclusive territory rights but fail to invest in market development, resulting in stagnant sales under an exclusive arrangement that blocks alternative distribution; shipments rejected by the importer for minor documentation deficiencies that, under the contract, transfer the logistics and destruction costs to the exporter; and pricing disputes arising from exchange rate movements not anticipated in the original agreement. Establishing a performance review cadence — quarterly commercial reviews, annual distribution audits — within the contract framework prevents small issues from becoming costly disputes. The next step for operators finalising their first distribution agreement is to engage a lawyer with specific experience in cross-border narcotics supply contracts, as standard commercial contract templates do not adequately address the regulatory obligations and enforcement risk specific to cannabis medicine supply chains.',
  'text',
  NOW(), NOW()
),

-- ============================================================
-- Module 9: GDP Logistics & Cold Chain (logistics track)
-- module_id: af5161a6-07fd-4a1c-9ea7-bd125cd658fe
-- ============================================================
(
  gen_random_uuid(),
  'af5161a6-07fd-4a1c-9ea7-bd125cd658fe',
  1,
  'Overview',
  'Good Distribution Practice (GDP) for cannabis medicines governs the conditions under which licensed products must be stored and transported to maintain their quality, safety, and integrity throughout the supply chain from manufacturer to patient. The EU GDP Guidelines (2013/C 343/01) and equivalent national frameworks (e.g. TGA GDP, UK MHRA GDP) impose obligations on all entities in the distribution chain — manufacturers, importers, wholesale distributors, and logistics providers — to implement quality systems, staff training programmes, temperature monitoring, and deviation management procedures. For cannabis medicines, GDP compliance is not merely a regulatory formality: products that experience significant temperature excursions, compression damage, or contamination during transport may degrade in potency or develop microbial contamination that renders them unfit for patient use. This module provides a practical guide to building a GDP-compliant cannabis logistics operation.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'af5161a6-07fd-4a1c-9ea7-bd125cd658fe',
  2,
  'Temperature Control Requirements',
  'Cannabis medicines typically require one of two temperature storage and transport conditions: controlled room temperature (CRT, 15–25°C) for most dried flower, oil, and capsule products, or refrigerated (2–8°C) for certain formulations. GDP compliance requires that these conditions be maintained throughout the entire logistics chain — from the warehouse loading dock, through air freight transit (where ambient temperatures in aircraft holds can range from -30°C to +50°C without active temperature control), to the importer''s receiving facility. Temperature mapping studies must be conducted on all storage areas to demonstrate that specified conditions are maintained across seasonal temperature variations, and all transport containers used for temperature-sensitive products must be validated for their intended use conditions. Temperature monitoring using calibrated, continuous data loggers is mandatory for all regulated shipments, and the resulting data must be reviewed before each batch is released for distribution.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'af5161a6-07fd-4a1c-9ea7-bd125cd658fe',
  3,
  'Narcotics Security in Transit',
  'Cannabis medicines classified as narcotic drugs under the UN Single Convention require enhanced security measures throughout transit that go beyond standard pharmaceutical GDP requirements. Air freight consignments must be declared to the airline as dangerous goods under IATA Dangerous Goods Regulations and may require specific handling instructions; in some jurisdictions, armed escort of high-value narcotic shipments is mandatory or commercially advisable. Warehousing and distribution facilities must hold the appropriate narcotics handling licences in each country of operation and must implement dual-access inventory controls (two-person authorisation for receipt, dispensing, and destruction), with all movements recorded in a narcotics register that is available for inspection by the competent authority at any time. Operators should conduct due diligence on every logistics provider and freight forwarder in their supply chain to confirm that their narcotics security procedures satisfy both legal requirements and the practical risk profile of each shipping lane.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'af5161a6-07fd-4a1c-9ea7-bd125cd658fe',
  4,
  'GDP Qualification of Logistics Providers',
  'Before using any logistics provider for cannabis medicine shipments, operators should conduct a formal GDP qualification process that assesses the provider against EU GDP guidelines or the relevant national equivalent. The qualification process typically involves a paper-based review of the provider''s quality documentation (GDP certificate or equivalent, SOPs for cannabis handling, temperature monitoring validation reports, narcotics licence copies), followed by an on-site audit of the provider''s facilities and operational procedures. Qualification findings should be documented in a Supplier Qualification Report, with any identified gaps subject to a corrective action plan before first use. Qualification should be renewed at least every two years, or immediately following any significant change to the provider''s facilities, operational scope, or regulatory status. A Technical Agreement or Quality Agreement with each qualified logistics provider formally defines the responsibilities of each party and provides a contractual basis for audit rights, deviation reporting, and recall support.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'af5161a6-07fd-4a1c-9ea7-bd125cd658fe',
  5,
  'Deviation Management & Next Steps',
  'Temperature excursions, delayed shipments, and damaged packaging are inevitable in complex international logistics operations; what distinguishes GDP-compliant operators is the rigour of their deviation management process. Every identified deviation must be formally recorded, assessed for impact on product quality (typically by the Quality Assurance team, with input from the stability data for the affected product), classified by severity, and subjected to a documented impact assessment that either confirms the product remains within specification or recommends rejection and destruction. Root cause analysis and corrective/preventive actions must be documented and followed up to prevent recurrence. Operators building their GDP capabilities should prioritise selection of a GDP-certified cold chain logistics partner with demonstrated experience in narcotics handling, invest in validated temperature monitoring equipment that provides real-time visibility during transit, and establish clear escalation procedures so that out-of-specification conditions are communicated to QA within 24 hours of identification.',
  'text',
  NOW(), NOW()
),

-- ============================================================
-- Module 10: Market Access Strategy (market track)
-- module_id: 5c3b131f-f733-4295-9f52-5d6cb2058410
-- ============================================================
(
  gen_random_uuid(),
  '5c3b131f-f733-4295-9f52-5d6cb2058410',
  1,
  'Overview',
  'Market access strategy for cannabis operators involves the systematic analysis, prioritisation, and execution of entry into regulated international markets, balancing regulatory readiness, commercial opportunity, and competitive dynamics. The global medical cannabis market is characterised by highly heterogeneous regulatory environments — ranging from fully liberalised prescription access in Germany and Australia to tightly controlled government-monopoly models in the Netherlands and nascent frameworks in emerging markets such as Thailand, Colombia, and Zambia. Effective market access strategy requires operators to continuously monitor regulatory developments, assess their own capability readiness against each market''s entry requirements, and allocate limited regulatory, commercial, and financial resources to the highest-return opportunities. This module provides a structured framework for market prioritisation and entry planning.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  '5c3b131f-f733-4295-9f52-5d6cb2058410',
  2,
  'Market Prioritisation Framework',
  'A rigorous market prioritisation framework evaluates prospective markets across four dimensions: (1) Market Size & Growth — current patient volumes, prescription rates, and projected compound annual growth rate driven by regulatory liberalisation and clinician adoption; (2) Regulatory Accessibility — whether the market is open to imports, the complexity and cost of the regulatory pathway, and the enforced timeline from application to first legal shipment; (3) Competitive Intensity — the number of established suppliers, the concentration of market share among top importers, and whether the operator has a differentiated product or cost position; and (4) Capability Alignment — whether the operator''s current certifications, product formats, and documentation meet the market''s requirements without significant incremental investment. Markets are scored and ranked across these dimensions, with the resulting prioritisation matrix used to guide investment in regulatory submissions, commercial development, and logistics infrastructure.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  '5c3b131f-f733-4295-9f52-5d6cb2058410',
  3,
  'Regulatory Pathway Analysis by Market',
  'Each target market requires a detailed regulatory pathway analysis that maps the specific sequence of licences, certifications, product registrations, and permit applications required to achieve first commercial shipment. For Germany, the pathway for a non-EU manufacturer involves: (1) achieving EU-GMP certification from a European competent authority; (2) identifying and contracting a licensed German importer holding a BtM Einfuhrlizenz; (3) obtaining a BtM export permit from the exporting country; (4) the importer applying for a BtM Einfuhrerlaubnis for the specific shipment; and (5) completing customs clearance with a registered customs agent experienced in narcotics handling. For Australia, the pathway involves TGA import licence verification by the importer, SAS Category B application or ARTG listing depending on the product classification, and TGA import permit application per shipment. Operators should map each step''s lead time, cost, and dependency on counterparty actions to build a realistic first-shipment timeline.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  '5c3b131f-f733-4295-9f52-5d6cb2058410',
  4,
  'Competitive Positioning & Differentiation',
  'In increasingly competitive regulated cannabis markets, commodity positioning — competing primarily on price — is a race to the bottom that favours operators with the lowest production costs. Sustainable market access is built on differentiation across multiple dimensions: product quality and consistency (demonstrated through CoA data and clinical outcomes evidence), supply reliability (proven track record of on-time, specification-compliant deliveries), service quality (responsive medical information, proactive communication on batch changes), and strategic alignment with importer and pharmacy partner needs. Operators with proprietary cultivars, unique extraction technologies, or clinical data packages have structural advantages that justify premium pricing and preferred supplier status. Market access strategy should explicitly address how the operator''s differentiation story is communicated to prospective importers, prescribers, and regulators — and should be backed by verifiable data rather than marketing claims.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  '5c3b131f-f733-4295-9f52-5d6cb2058410',
  5,
  'Execution Planning & KPIs',
  'Translating market access strategy into execution requires a detailed market entry plan with defined milestones, resource requirements, and key performance indicators. Critical milestones typically include: GMP certificate issuance (trigger for regulatory submissions and importer negotiations), first import permit granted (trigger for first shipment preparation), first commercial shipment delivered (trigger for pharmacy onboarding and sales tracking), and first quarterly sales review with importer (trigger for market performance assessment and plan adjustment). KPIs for market access programmes should include: time from strategy approval to first shipment, shipment acceptance rate (percentage of consignments cleared without rejection or significant delay), days of inventory at the importer level, pharmacist/prescriber feedback scores, and net revenue per kilogram by market. Monthly tracking of these KPIs against plan enables early identification of execution problems and data-driven resource reallocation.',
  'text',
  NOW(), NOW()
),

-- ============================================================
-- Module 11: Lab Testing & QA Frameworks (quality track)
-- module_id: b64698bc-edf3-4b93-96fc-0e9c991a0135
-- ============================================================
(
  gen_random_uuid(),
  'b64698bc-edf3-4b93-96fc-0e9c991a0135',
  1,
  'Overview',
  'Laboratory testing and quality assurance frameworks are the technical backbone of compliant cannabis medicine production, providing the analytical evidence that a product meets its specification before it is released for distribution and patient use. International cannabis operators face a particularly complex testing landscape: each importing market specifies its own required analytes, test methods, and acceptance limits, and a Certificate of Analysis that satisfies Canadian Health Canada requirements may not satisfy German BfArM import permit conditions without additional testing. Building a fit-for-purpose QA framework that efficiently satisfies multi-market testing requirements — while maintaining the data integrity standards required for GMP compliance — is one of the most technically demanding challenges in international cannabis operations. This module provides a comprehensive overview of testing requirements and QA framework design.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'b64698bc-edf3-4b93-96fc-0e9c991a0135',
  2,
  'Required Analyte Panels by Market',
  'Cannabis medicines destined for regulated markets must be tested for a defined set of analytes, and the specific requirements vary materially between jurisdictions. EU-GMP compliant products exported to Germany must typically be tested for: cannabinoid profile (THC, CBD, CBN, CBG, and other minor cannabinoids by HPLC), residual solvents (ICH Q3C Class 1 and 2 limits), pesticides (EU MRL list for herbs and teas, or pharmacopoeial limits), heavy metals (lead, cadmium, arsenic, mercury to Ph. Eur. 5.17 limits), microbiology (TAMC, TYMC, Enterobacteria, Salmonella, E. coli, Staphylococcus aureus, Candida albicans), and mycotoxins (aflatoxins B1, B2, G1, G2 and ochratoxin A). Australia''s TGA requires testing aligned to the Ph. Eur. or BP monographs applicable to the product type, with specific limits for THC in CBD-dominant products. Operators should maintain a living analyte matrix that maps each target market''s requirements to their standard test panel, identifying any gaps that require additional testing for specific shipments.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'b64698bc-edf3-4b93-96fc-0e9c991a0135',
  3,
  'ISO 17025 & GMP Laboratory Qualification',
  'The analytical laboratories used to generate CoA data for regulated cannabis products must meet defined quality system standards. For GMP-manufactured products, in-house laboratories must implement a GMP-compliant quality system for all testing that supports batch release decisions, including analytical method validation, reference standard management, equipment qualification, and analyst training records. Where testing is contracted to external laboratories, those laboratories must be qualified as GMP contract testing organisations or hold ISO 17025 accreditation with the relevant test methods explicitly within their accreditation scope. ISO 17025 accreditation, awarded by national accreditation bodies (e.g. UKAS in the UK, DAkkS in Germany, NATA in Australia), demonstrates that a laboratory has validated its test methods against internationally recognised standards and is subject to regular technical assessments. Operators should verify laboratory accreditation scope before placing orders, as laboratories sometimes offer testing on methods not covered by their accreditation, generating data that regulators may not accept.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'b64698bc-edf3-4b93-96fc-0e9c991a0135',
  4,
  'Batch Release & Specification Management',
  'The batch release process — the formal quality decision that a specific production batch meets its registered or approved specification and is fit for distribution — is a critical GMP control point. For cannabis medicines, batch release must be performed or authorised by a Qualified Person (QP) in EU-GMP markets, a role that carries personal legal liability for the quality of released batches. Specification management is the upstream discipline that defines what a product must meet at release and throughout its shelf life: specifications must be set based on validated manufacturing capability, clinical and regulatory requirements, and stability data, and must be formally approved before any batch is released against them. Operators must maintain a controlled specification register, ensure that specifications are aligned to what is stated on regulatory submissions and import permit applications, and implement a formal out-of-specification (OOS) investigation procedure for any batch result that falls outside the approved specification.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'b64698bc-edf3-4b93-96fc-0e9c991a0135',
  5,
  'Common Pitfalls & Next Steps',
  'Frequent QA failures in cannabis operations include reliance on CoA data from non-accredited laboratories, specification limits set without supporting stability data (causing batches to fail specification as they age during the distribution cycle), and analytical methods that have not been validated for the specific cannabis matrices being tested (leading to inaccurate results that are not discovered until challenged during a regulatory inspection). Data integrity — the completeness, consistency, and accuracy of analytical data — is a major focus of current regulatory inspection programmes; operators must ensure that their LIMS or laboratory record-keeping systems generate complete and unalterable audit trails. The next step for operators building QA frameworks is to conduct an analytical gap assessment, mapping current test panel and laboratory capabilities against the requirements of each active and planned market, and to develop a testing strategy that addresses gaps through validated method development or external laboratory qualification.',
  'text',
  NOW(), NOW()
),

-- ============================================================
-- Module 12: Regulatory Intelligence & Monitoring (regulatory track)
-- module_id: ac01db02-2182-43a3-a1f3-54fd05e56621
-- ============================================================
(
  gen_random_uuid(),
  'ac01db02-2182-43a3-a1f3-54fd05e56621',
  1,
  'Overview',
  'Regulatory intelligence — the systematic monitoring, analysis, and operationalisation of regulatory developments relevant to an operator''s business — is a strategic function that separates proactive operators from those who are perpetually reacting to regulatory changes that could have been anticipated. The cannabis regulatory landscape is among the most rapidly evolving in any industry: major structural reforms (Germany''s CanG 2024, Australia''s TGA rescheduling, Thailand''s reversal of decriminalisation, WHO scheduling recommendations) can fundamentally alter market access conditions, product requirements, and competitive dynamics within months. Operators who maintain a real-time regulatory intelligence capability can position for new market openings before competitors, anticipate product requirement changes in time to adapt manufacturing processes, and engage in regulatory consultations that shape the rules governing their industry. This module provides a framework for building and operationalising a regulatory intelligence function.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'ac01db02-2182-43a3-a1f3-54fd05e56621',
  2,
  'Monitoring Frameworks & Information Sources',
  'Effective regulatory intelligence begins with a structured monitoring framework that identifies the specific regulatory bodies, legislative bodies, and information channels relevant to each active and planned market. Primary sources include: official regulatory authority websites and gazette publications (BfArM, TGA, MHRA, Health Canada, INFARMED, IACM); parliamentary and legislative tracking services for bill progress in target markets; WHO and INCB publications on international drug scheduling and convention compliance; EU EMA guideline consultations relevant to cannabis medicines; and national pharmacopoeia updates. Secondary sources include: industry associations (EIHA, Cannabis Europe, Medicinal Cannabis Industry Australia, ACMPR); specialist law firms with regulatory cannabis practices; academic journals tracking regulatory change (Drug and Alcohol Review, Journal of Studies on Alcohol and Drugs); and commercial intelligence services. Operators should assign clear ownership for each monitored regulatory domain and establish a weekly intelligence digest process that surfaces relevant developments to operational decision-makers.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'ac01db02-2182-43a3-a1f3-54fd05e56621',
  3,
  'Regulatory Change Impact Assessment',
  'When a material regulatory development is identified — a new consultation paper, an enacted legislative amendment, a change to import permit requirements — operators must rapidly assess its impact on their current operations, planned activities, and commercial agreements. A regulatory change impact assessment should address: which products, markets, or operational activities are affected; what the required operational response is (e.g. label change, new testing, revised submission); what the timeline for compliance is (immediate, phased, or prospective); what the cost and resource implications are; and what the competitive implications are (e.g. does the change disadvantage higher-cost operators in a way that creates a competitive opportunity?). Impact assessments should be documented, distributed to affected functional owners, and tracked through to the implementation of required responses. A register of regulatory changes under assessment, with status tracking, provides visibility to leadership and investors that regulatory risks are being actively managed.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'ac01db02-2182-43a3-a1f3-54fd05e56621',
  4,
  'Regulatory Engagement & Advocacy',
  'Beyond monitoring, leading operators actively engage in regulatory processes to shape the frameworks governing their industry. Participation in public consultations — submitting written responses to TGA consultation papers, appearing before parliamentary committees, contributing to European Monitoring Centre for Drugs and Drug Addiction (EMCDDA) data collection — allows operators to provide technical expertise that improves regulatory frameworks while simultaneously positioning the operator as a credible, constructive industry participant. Regulatory engagement is most effective when conducted collaboratively through industry associations, which provide greater weight and reach than individual company submissions, and when submissions are evidence-based, technically rigorous, and aligned to public health objectives rather than purely commercial interests. Operators building a regulatory engagement capability should appoint a Head of Regulatory Affairs or equivalent senior role with direct access to the CEO and Board, as regulatory outcomes at the strategic level require executive-level relationships with policy-makers.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'ac01db02-2182-43a3-a1f3-54fd05e56621',
  5,
  'Building a Regulatory Intelligence System',
  'A systematic regulatory intelligence function requires purpose-built tools and processes rather than ad hoc monitoring. Operators should implement a regulatory information management system — which may range from a structured Notion or SharePoint knowledge base to a specialist regulatory intelligence platform such as Citeline Regulatory or Cortellis — that captures regulatory developments, links them to affected products and markets, tracks assessment and response status, and generates automated alerts for upcoming deadlines and renewal dates. The system should be integrated with the operator''s QMS so that regulatory changes that require SOP updates, specification amendments, or training programme revisions automatically generate the relevant quality system change workflows. Finally, a quarterly regulatory horizon-scanning report — reviewed at Board level — that summarises the most significant regulatory developments in active and target markets, assesses their strategic implications, and recommends resource allocation adjustments, is the output that transforms regulatory intelligence from an operational function into a strategic asset.',
  'text',
  NOW(), NOW()
);
