import type { CountryEducationOverlay } from './dashboardLiveData'

// Single source of truth for education-module topic content, shared by the
// desktop (CommandCentre.tsx EducationPage) and mobile (MobileCommandCentre.tsx
// EducationMobile) module-detail views so the two surfaces never drift.
export const MODULE_TOPICS: Record<string, { topics: string[]; action: string }> = {
  'Dispensing Controls': {
    topics: [
      'Prescription validation and controlled-substance handling protocols',
      'Drug interaction screening and contraindication review',
      'Patient consultation and informed-consent requirements',
      'Good Pharmacy Practice standards and audit readiness',
      'Record-keeping, pharmacovigilance and adverse-event reporting',
    ],
    action: 'Review dispensing SOP',
  },
  'Compliance & Reg.': {
    topics: [
      'National regulatory authority requirements and licence conditions',
      'Authorization classes, permit types and renewal obligations',
      'Inspection readiness: documentation, SOPs and audit trail',
      'Continuing competency and professional obligations',
      'Enforcement exposure and voluntary disclosure procedures',
    ],
    action: 'Check compliance calendar',
  },
  'Country Rules': {
    topics: [
      'Medical cannabis programme status and legislative framework',
      'Permitted indications, formulations and quantity limits',
      'Import and export regime, INCB permits and customs controls',
      'Licence classes, authorization pathways and regulator contact',
      'Jurisdiction-specific restrictions and upcoming regulatory changes',
    ],
    action: 'View regulatory brief',
  },
  'Documentation': {
    topics: [
      'Certificate of Analysis (COA) interpretation and verification',
      'Product dossier structure and GMP certificate requirements',
      'Supplier verification, counterparty checks and due diligence',
      'Traceability record structure and chain-of-custody obligations',
      'Submission templates, format standards and filing deadlines',
    ],
    action: 'Access document templates',
  },
  'Export Regulations': {
    topics: [
      'Export licence classes, permit applications and processing times',
      'INCB notification requirements and Article 12 obligations',
      'Destination-country import permit mechanics and equivalence rules',
      'EU-GMP certification, phytosanitary and customs documentation',
      'Controlled shipment packaging, labelling and transit procedures',
    ],
    action: 'Review export pathway',
  },
  'Import Frameworks': {
    topics: [
      'Import licence requirements, quota allocation and application process',
      'Controlled substance INCB permits and national quota management',
      'Distributor authorization, pharmacy participation and custody rules',
      'Customs procedures, inspection requirements and duty classification',
      'Country-specific quantity limits, formulation restrictions and labelling',
    ],
    action: 'Review import pathway',
  },
  'Market Access': {
    topics: [
      'Commercial market entry pathways and access restrictions by role',
      'Mediated access protocols and counterparty disclosure controls',
      'Regulatory approval timeline and milestone mapping',
      'Market size, competitor landscape and pricing intelligence',
      'Strategic positioning and risk classification for selected role',
    ],
    action: 'Request market brief',
  },
  'Trade & Access': {
    topics: [
      'International trade framework and applicable bilateral treaties',
      'Counterparty verification and commercial due diligence requirements',
      'Partner and distributor identification and qualification process',
      'Harbourview-mediated access workflow and contact-release controls',
      'Risk classification and commercial review decision matrix',
    ],
    action: 'View trade pathway',
  },
  'GMP Standards': {
    topics: [
      'Good Manufacturing Practice framework (EU-GMP, GACP, GDP)',
      'Facility authorization, site master file and inspection requirements',
      'Quality management system: SOPs, deviations and CAPA process',
      'Batch release, product testing obligations and stability studies',
      'Supplier qualification, approved vendor list and audit procedures',
    ],
    action: 'Review GMP checklist',
  },
  'Prescribing Pathways': {
    topics: [
      'Clinical authorization requirements and prescriber eligibility criteria',
      'Patient eligibility, approved indications and diagnosis documentation',
      'Prescription format, quantity limits, duration and renewal rules',
      'Informed consent, monitoring requirements and follow-up obligations',
      'Adverse event recording, PSUR submissions and reporting timelines',
    ],
    action: 'Review prescribing SOP',
  },
  'Clinical Evidence': {
    topics: [
      'Current randomized controlled trial landscape and evidence base',
      'Meta-analyses and systematic review summaries by indication',
      'Cannabinoid pharmacology, mechanisms of action and receptor profile',
      'Efficacy and safety data stratified by formulation and population',
      'Evidence quality classification and regulatory acceptance criteria',
    ],
    action: 'View evidence library',
  },
  'Pharmacology': {
    topics: [
      'Endocannabinoid system, receptor pharmacology (CB1, CB2, TRPV1)',
      'Cannabinoid profiles: THC, CBD, CBG, CBN and minor cannabinoids',
      'Drug-drug interaction risk assessment and CYP450 pathway effects',
      'Pharmacokinetics, bioavailability and onset by formulation route',
      'Special population considerations: elderly, paediatric, renal/hepatic',
    ],
    action: 'Review pharmacology module',
  },
  'Logistics & Customs': {
    topics: [
      'Controlled substance shipping requirements, sealing and labelling',
      'Customs documentation, import/export permits and HS codes',
      'Cold chain, temperature monitoring and GDP requirements',
      'Carrier selection, route risk assessment and insurance requirements',
      'Delay, seizure and loss-of-shipment protocols and notifications',
    ],
    action: 'Review logistics checklist',
  },
  'Trade & Cross-Border': {
    topics: [
      'Cross-border shipment permit framework: INCB and national requirements',
      'Harmonized tariff codes and controlled substance customs classification',
      'Phytosanitary certificate, fumigation and plant import restrictions',
      'Insurance, Incoterms 2020 and liability allocation by trade route',
      'Destination-country controlled substance import documentation matrix',
    ],
    action: 'View cross-border guide',
  },
  'Cultivation Standards': {
    topics: [
      'Good Agricultural and Collection Practice (GACP) requirements',
      'Harvest and post-harvest handling, drying and storage protocols',
      'Permitted genetics, THC/CBD limits and variety registration obligations',
      'Water, soil, integrated pest management and contamination controls',
      'Chain-of-custody from harvest to processor and traceability records',
    ],
    action: 'Review cultivation standards',
  },
  'Lab & Testing Protocols': {
    topics: [
      'Certificate of Analysis scope, required analytes and acceptance criteria',
      'ISO 17025 and GLP accreditation standards for cannabis laboratories',
      'Contaminant panels: pesticides, heavy metals, mycotoxins and residual solvents',
      'Potency testing methods: HPLC, GC, and validated reference standards',
      'Shelf-life studies, stability testing and re-test interval requirements',
    ],
    action: 'Review testing protocols',
  },
  'Investment & Operations': {
    topics: [
      'Capital requirements: licence acquisition, build-out and working capital',
      'M&A, asset transfer and regulatory change-of-ownership procedures',
      'Operational setup: facility compliance, staffing and SOPs',
      'Revenue modelling, unit economics and market-entry payback timeline',
      'Risk matrix: regulatory, market, currency and execution exposures',
    ],
    action: 'View investment framework',
  },
  'Regulatory Compliance': {
    topics: [
      'Compliance programme design: policies, procedures and controls',
      'Regulatory change monitoring and impact assessment process',
      'Internal audit, gap analysis and remediation planning',
      'Regulator engagement, licence renewals and condition management',
      'Training, competency verification and culture of compliance',
    ],
    action: 'Review compliance framework',
  },
  'Evidence gap review': {
    topics: [
      'This country-role pathway requires additional evidence before full verification',
      'Harbourview is reviewing regulatory, market and licence-class data for this route',
      'Interim guidance is available through the mediated intake process',
      'Submit pathway verification requests via the intake workflow for priority review',
      'Evidence gaps are addressed as source review and regulatory data are confirmed',
    ],
    action: 'Submit pathway review request',
  },
  'Export Readiness': {
    topics: [
      'Verify your distributor or producer licence explicitly authorises export and controlled-substance cross-border transfer in your jurisdiction',
      'Secure an INCB Article 12 export permit and confirm the destination country has issued the corresponding import permit before any shipment',
      'Prepare the full export documentation packet: EU-GMP or equivalent certificate, batch COA, product specification, customs invoice, and packing list',
      'Confirm destination-country product registration status, permitted THC/CBD concentration limits, and approved formulation types before committing to supply',
      'Understand controlled-substance labelling requirements for international transit: language, quantity declarations, and INCB permit reference number placement',
    ],
    action: 'Begin export licence application',
  },
  'Buyer Pathway': {
    topics: [
      'Confirm your wholesale distributor or importer authorisation covers controlled-substance import under national pharmaceutical or cannabis law',
      'Submit the import permit application to your national competent authority with quota allocation request, product specification, and source-country export permit reference',
      'Select an EU-GMP or equivalent certified supply partner and verify their current GMP certificate scope, batch COA, and product registration status',
      'Establish compliant goods-receipt procedures: physical inspection, quarantine hold, QP batch release sign-off, temperature records, and receipting documentation',
      'Define re-supply cadence, minimum order volumes, contract terms, and mediated-access pricing structure within regulatory and commercial frameworks',
    ],
    action: 'Start import permit application',
  },
  'GDP Logistics': {
    topics: [
      'GDP Directive 2013/C 343/01 obligations for wholesale distribution of medicinal cannabis — storage, transport, and documentation requirements',
      'Cold chain qualification: temperature mapping studies, validated storage areas, continuous monitoring systems, and alarm response procedures',
      'Transport SOP requirements: carrier qualification, vehicle validation, chain-of-custody documentation, and delivery verification records',
      'Controlled-substance shipment packaging integrity, labelling standards, INCB permit reference placement, and transit documentation matrix',
      'Return goods policy, product recall logistics procedures, stock reconciliation, and competent authority notification timelines',
    ],
    action: 'Download GDP logistics checklist',
  },
  'GMP Compliance': {
    topics: [
      'EU-GMP Chapter 3 (premises and equipment) and GDP Directive 2013/C 343/01 obligations for wholesale medicinal cannabis distribution',
      'Written SOPs for receipt, quarantine, storage, dispatch, return, and recall of controlled products — all with temperature-controlled audit trail',
      'Qualified Person (QP) responsibilities: batch release sign-off, deviation and OOS management, CAPA documentation, and annual product review',
      'Product recall and withdrawal procedures: tier-1 field alert timelines, stock reconciliation, pharmacy/hospital notification chain, and competent authority reporting',
      'Internal audit programme: annual GDP self-inspection, supplier qualification visits, approved vendor list maintenance, and audit response tracking',
    ],
    action: 'Download GDP compliance checklist',
  },
  'Wholesale Distribution': {
    topics: [
      'Wholesale dealer authorisation scope: permitted product categories, storage conditions, and approved customer classes under national law',
      'GDP-compliant receiving and dispatch: purchase order matching, delivery verification, serialisation and traceability record creation',
      'Cold-chain maintenance: validated storage areas, temperature monitoring systems, alarm response procedures, and mapping qualification records',
      'Controlled-substance security requirements: physical access controls, inventory reconciliation frequency, and loss or theft reporting obligations',
      'Customer due-diligence: verifying pharmacy, hospital, or downstream licence status before each supply transaction',
    ],
    action: 'Review wholesale licence conditions',
  },
  'Cannabis Law': {
    topics: [
      'National legislative framework governing medical cannabis: enabling act, ministerial regulations, and competent authority designation',
      'Controlled substance scheduling: which cannabinoids are scheduled, applicable quantity thresholds, and derogation or reclassification history',
      'Licence class hierarchy: cultivation, production, processing, wholesale, retail, import, export, and research authorisations',
      'Enforcement landscape: recent inspection findings, penalty structures, suspension and revocation precedents, and voluntary disclosure provisions',
      'Upcoming regulatory changes: bills in progress, consultation periods, and anticipated impact on current licence conditions and operational procedures',
    ],
    action: 'View regulatory brief',
  },
  'Regulatory Framework': {
    topics: [
      'Current status of the national medical cannabis programme: legal basis, authorised use cases, and permitted product categories',
      'Competent authority structure: which agency issues licences, inspects premises, approves products, and handles import/export permits',
      'Licence application requirements: eligibility criteria, supporting documents, facility standards, and indicative processing timelines',
      'Good practice standards: applicable GMP, GDP, GACP, and GSP guidelines and how they interact with national cannabis-specific regulations',
      'Annual compliance obligations: licence renewal, reporting requirements, adverse event notifications, and record retention periods',
    ],
    action: 'Access regulatory brief',
  },
}

export function getModuleContent(
  title: string,
  overlays?: CountryEducationOverlay[],
): { topics: string[]; action: string; isVerified: boolean } {
  const overlay = overlays?.find(o => title.toLowerCase().includes(o.moduleKey.toLowerCase()))
  if (overlay && overlay.topics.length > 0) {
    return { topics: overlay.topics, action: overlay.actionLabel, isVerified: true }
  }
  const key = Object.keys(MODULE_TOPICS).find(k => title.toLowerCase().includes(k.toLowerCase()))
  if (key) return { ...MODULE_TOPICS[key], isVerified: false }
  return {
    topics: [
      `Review the regulatory and licence requirements applicable to ${title} in your selected jurisdiction`,
      `Identify the permit classes, authority contacts, and application timelines relevant to ${title}`,
      `Prepare the documentation and evidence package — COA, GMP certificates, product specifications — required for compliance in this area`,
      `Understand competent authority inspection scope, enforcement exposure, and voluntary disclosure procedures for ${title}`,
      `Submit a priority content request via the Harbourview intake flow to receive curated guidance for this module and jurisdiction`,
    ],
    action: `Request ${title} briefing`,
    isVerified: false,
  }
}
