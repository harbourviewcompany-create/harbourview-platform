import type { RoleId } from '@/types/globe-router'
import type { PathwayData } from './dashboardLiveData'

// ── Generic, country-agnostic Access Pathways ──────────────────────────────────
//
// cc_pathway_templates only holds hand-curated, country-specific pathways
// (e.g. the Florida licensed-cultivator pathway, with named regulators and
// citable local rules). Most country/role combinations don't have one of
// those yet — and given there are 191 countries x 19 roles, most never will
// be hand-authored with that level of local specificity.
//
// Rather than show "No Access Pathway defined" for ~every country, every role
// falls back to one of these generic pathways below. They're written so the
// steps/requirements are true and useful for any jurisdiction without
// inventing local agency names or citing rules we haven't verified — phrasing
// like "your country's cannabis regulator" instead of a specific authority.
//
// Country-specific overrides in cc_pathway_templates always take priority —
// as those get built out (backed by Evidence & Sources entries), they
// progressively replace these generic fallbacks for that country/role.

type GenericReq = {
  title:       string
  description: (country: string, regulator: string) => string
  evidence_type: 'licence' | 'document' | 'declaration' | 'verification'
  is_required: boolean
}

type GenericStep = {
  title:       string
  description: (country: string, regulator: string) => string
  requirements: GenericReq[]
}

type GenericPathway = {
  name: (country: string, roleLabel: string) => string
  steps: GenericStep[]
}

// ── Role clusters ────────────────────────────────────────────────────────────
// Roles with broadly similar access-pathway shapes share a template, with the
// role label interpolated where it matters.

const PRODUCTION_QUALITY: GenericPathway = {
  name: (country, roleLabel) => `${country} ${roleLabel} Access Pathway`,
  steps: [
    {
      title: 'Licence & Registration Status',
      description: (country, regulator) =>
        `Confirm your active licence or registration with ${regulator}.`,
      requirements: [
        {
          title: 'Active licence or registration',
          description: (country, regulator) => `Verified with ${regulator}`,
          evidence_type: 'licence',
          is_required: true,
        },
        {
          title: 'Licence in good standing confirmation',
          description: () => 'No active violations, suspensions, or unresolved enforcement actions',
          evidence_type: 'declaration',
          is_required: true,
        },
      ],
    },
    {
      title: 'Facility & Operational Readiness',
      description: () =>
        'Demonstrate compliant facility standards, operating procedures, and quality controls.',
      requirements: [
        {
          title: 'Facility registration & site plan',
          description: () => 'Site plan or floor plan with operational areas marked',
          evidence_type: 'document',
          is_required: true,
        },
        {
          title: 'Standard Operating Procedures (SOPs)',
          description: () => 'Production, hygiene, and quality-control SOPs',
          evidence_type: 'document',
          is_required: true,
        },
        {
          title: 'Traceability system in place',
          description: () => 'Seed-to-sale or batch tracking documentation',
          evidence_type: 'document',
          is_required: true,
        },
      ],
    },
    {
      title: 'Product & Quality Classification',
      description: (country, _regulator) =>
        `Classify your product categories and confirm packaging and labelling compliance for ${country}.`,
      requirements: [
        {
          title: 'Product category declaration',
          description: () => 'List of product types produced and intended markets',
          evidence_type: 'declaration',
          is_required: true,
        },
        {
          title: 'Packaging & labelling compliance',
          description: (country, _regulator) => `Compliance with ${country}'s packaging and labelling rules`,
          evidence_type: 'document',
          is_required: true,
        },
      ],
    },
    {
      title: 'Testing & Certification',
      description: () =>
        'Provide current Certificates of Analysis and testing documentation meeting buyer and regulatory standards.',
      requirements: [
        {
          title: 'Current Certificate of Analysis (COA)',
          description: () => 'Lab results from an accredited testing laboratory',
          evidence_type: 'document',
          is_required: true,
        },
        {
          title: 'Batch traceability record',
          description: () => 'Seed-to-sale or batch tracking output for the relevant lot',
          evidence_type: 'document',
          is_required: true,
        },
        {
          title: 'Residue & quality testing panel',
          description: () => 'Panel matching destination-market testing standards',
          evidence_type: 'document',
          is_required: false,
        },
      ],
    },
    {
      title: 'Market Connection',
      description: () =>
        'Identify your target buyer or supplier route and complete distribution documentation.',
      requirements: [
        {
          title: 'Market route selection',
          description: () => 'Confirm target market(s) and counterpart type',
          evidence_type: 'declaration',
          is_required: true,
        },
        {
          title: 'Trade readiness self-assessment',
          description: () => 'Complete Harbourview\u2019s trade readiness form',
          evidence_type: 'document',
          is_required: true,
        },
        {
          title: 'Counterpart due diligence package',
          description: () => 'Harbourview-verified buyer or supplier profile',
          evidence_type: 'verification',
          is_required: false,
        },
      ],
    },
  ],
}

const TRADE_LOGISTICS: GenericPathway = {
  name: (country, roleLabel) => `${country} ${roleLabel} Access Pathway`,
  steps: [
    {
      title: 'Licence & Authorisation Status',
      description: (country, regulator) =>
        `Confirm your trade licence, permit, or authorisation to operate with ${regulator}.`,
      requirements: [
        {
          title: 'Active trade licence or authorisation',
          description: (country, regulator) => `Verified with ${regulator}`,
          evidence_type: 'licence',
          is_required: true,
        },
        {
          title: 'Authorisation in good standing confirmation',
          description: () => 'No active violations, suspensions, or unresolved enforcement actions',
          evidence_type: 'declaration',
          is_required: true,
        },
      ],
    },
    {
      title: 'Supply Chain & Compliance Readiness',
      description: (country, _regulator) =>
        `Demonstrate import/export, customs, and storage compliance for ${country}.`,
      requirements: [
        {
          title: 'Import/export permit or quota allocation',
          description: (country, _regulator) => `Where applicable under ${country}'s import/export controls`,
          evidence_type: 'document',
          is_required: true,
        },
        {
          title: 'Storage & handling compliance',
          description: () => 'Secure storage and chain-of-custody procedures',
          evidence_type: 'document',
          is_required: true,
        },
        {
          title: 'Customs declaration template',
          description: () => 'Standard customs and shipping documentation pack',
          evidence_type: 'document',
          is_required: false,
        },
      ],
    },
    {
      title: 'Product & Shipment Classification',
      description: () =>
        'Classify shipments by product category, tariff code, and labelling requirements.',
      requirements: [
        {
          title: 'Product category & tariff classification',
          description: () => 'HS code or local equivalent for each product line',
          evidence_type: 'declaration',
          is_required: true,
        },
        {
          title: 'Packaging & labelling compliance',
          description: (country, _regulator) => `Compliance with ${country}'s packaging and labelling rules`,
          evidence_type: 'document',
          is_required: true,
        },
      ],
    },
    {
      title: 'Verification & Documentation',
      description: () =>
        'Confirm quality assurance documentation from counterparties in the supply chain.',
      requirements: [
        {
          title: 'Supplier Certificate of Analysis (COA)',
          description: () => 'Lab results accompanying each shipment',
          evidence_type: 'document',
          is_required: true,
        },
        {
          title: 'Chain-of-custody documentation',
          description: () => 'Batch and lot traceability across the supply chain',
          evidence_type: 'document',
          is_required: true,
        },
      ],
    },
    {
      title: 'Buyer / Supplier Connection',
      description: () =>
        'Identify and qualify counterparties and finalise distribution agreements.',
      requirements: [
        {
          title: 'Counterpart route selection',
          description: () => 'Confirm target market(s) and counterpart type',
          evidence_type: 'declaration',
          is_required: true,
        },
        {
          title: 'Distribution agreement or LOI',
          description: () => 'Letter of intent or signed distribution agreement',
          evidence_type: 'document',
          is_required: true,
        },
        {
          title: 'Counterpart due diligence package',
          description: () => 'Harbourview-verified buyer or supplier profile',
          evidence_type: 'verification',
          is_required: false,
        },
      ],
    },
  ],
}

const HEALTHCARE_PATIENT: GenericPathway = {
  name: (country, roleLabel) => `${country} ${roleLabel} Access Pathway`,
  steps: [
    {
      title: 'Professional Registration Status',
      description: (country, regulator) =>
        `Confirm your professional registration and authority to engage with medical cannabis under ${regulator}'s framework.`,
      requirements: [
        {
          title: 'Active professional registration or licence',
          description: (country, regulator) => `Verified with ${regulator}`,
          evidence_type: 'licence',
          is_required: true,
        },
        {
          title: 'Scope-of-practice confirmation',
          description: () => 'Confirmation that cannabis-related activities fall within your registered scope',
          evidence_type: 'declaration',
          is_required: true,
        },
      ],
    },
    {
      title: 'Clinical & Operational Readiness',
      description: () =>
        'Establish protocols and systems for prescribing, dispensing, or supporting patients.',
      requirements: [
        {
          title: 'Clinical or dispensing protocol',
          description: () => 'Internal protocol for cannabis-related patient interactions',
          evidence_type: 'document',
          is_required: true,
        },
        {
          title: 'Patient record-keeping system',
          description: () => 'System for recording and retaining patient-related records',
          evidence_type: 'document',
          is_required: true,
        },
      ],
    },
    {
      title: 'Product & Formulary Knowledge',
      description: (country, _regulator) =>
        `Confirm familiarity with the cannabis product categories available under ${country}'s medical access framework.`,
      requirements: [
        {
          title: 'Approved product category review',
          description: () => 'Review of product formats and formulations available to patients',
          evidence_type: 'declaration',
          is_required: true,
        },
        {
          title: 'Dosage & administration guidance',
          description: () => 'Reference materials for dosage forms and administration routes',
          evidence_type: 'document',
          is_required: false,
        },
      ],
    },
    {
      title: 'Compliance & Safety Documentation',
      description: (country, _regulator) =>
        `Confirm record-keeping and adverse-event reporting obligations under ${country}'s rules.`,
      requirements: [
        {
          title: 'Record-keeping compliance confirmation',
          description: (country, _regulator) => `Compliance with ${country}'s record-retention requirements`,
          evidence_type: 'declaration',
          is_required: true,
        },
        {
          title: 'Adverse event reporting protocol',
          description: () => 'Process for reporting adverse events or product concerns',
          evidence_type: 'document',
          is_required: true,
        },
      ],
    },
    {
      title: 'Patient & Network Connection',
      description: () =>
        'Establish referral and supply relationships within the medical cannabis network.',
      requirements: [
        {
          title: 'Referral or supply network mapping',
          description: () => 'Identify pharmacies, clinics, or suppliers relevant to your role',
          evidence_type: 'declaration',
          is_required: true,
        },
        {
          title: 'Network due diligence package',
          description: () => 'Harbourview-verified profile for key referral or supply partners',
          evidence_type: 'verification',
          is_required: false,
        },
      ],
    },
  ],
}

const PROFESSIONAL_OVERSIGHT: GenericPathway = {
  name: (country, roleLabel) => `${country} ${roleLabel} Access Pathway`,
  steps: [
    {
      title: 'Mandate & Jurisdiction Status',
      description: (country, _regulator) =>
        `Confirm your mandate, authority, or area of focus within ${country}'s cannabis regulatory framework.`,
      requirements: [
        {
          title: 'Mandate or engagement confirmation',
          description: (country, _regulator) => `Declaration of your role and remit in relation to ${country}`,
          evidence_type: 'declaration',
          is_required: true,
        },
        {
          title: 'Relevant professional credentials',
          description: () => 'Licences, registrations, or accreditations relevant to your mandate',
          evidence_type: 'licence',
          is_required: false,
        },
      ],
    },
    {
      title: 'Regulatory Framework Mapping',
      description: (country, _regulator) =>
        `Map the applicable laws, licensing regime, and market structure for ${country}.`,
      requirements: [
        {
          title: 'Regulatory framework summary',
          description: (country, _regulator) => `Overview of ${country}'s cannabis laws and licensing regime`,
          evidence_type: 'document',
          is_required: true,
        },
        {
          title: 'Market structure mapping',
          description: () => 'Identification of relevant licence categories and market participants',
          evidence_type: 'document',
          is_required: true,
        },
      ],
    },
    {
      title: 'Risk & Compliance Assessment',
      description: () =>
        'Assess compliance gaps, risks, and due-diligence requirements relevant to your mandate.',
      requirements: [
        {
          title: 'Compliance gap analysis',
          description: () => 'Assessment of compliance gaps relative to local requirements',
          evidence_type: 'document',
          is_required: true,
        },
        {
          title: 'Due diligence framework',
          description: () => 'Standard due-diligence checklist applied to counterparties',
          evidence_type: 'document',
          is_required: false,
        },
      ],
    },
    {
      title: 'Evidence & Monitoring Setup',
      description: (country, _regulator) =>
        `Establish monitoring sources and reporting templates for ${country}.`,
      requirements: [
        {
          title: 'Monitoring source list',
          description: () => 'Regulatory, legislative, or market sources to track on an ongoing basis',
          evidence_type: 'declaration',
          is_required: true,
        },
        {
          title: 'Reporting template',
          description: () => 'Template for periodic regulatory or market updates',
          evidence_type: 'document',
          is_required: false,
        },
      ],
    },
    {
      title: 'Stakeholder & Market Engagement',
      description: () =>
        'Connect with operators, buyers, investors, or regulators relevant to your mandate.',
      requirements: [
        {
          title: 'Stakeholder mapping',
          description: () => 'Identification of key operators, regulators, or counterparties',
          evidence_type: 'declaration',
          is_required: true,
        },
        {
          title: 'Engagement due diligence package',
          description: () => 'Harbourview-verified profile for key stakeholders',
          evidence_type: 'verification',
          is_required: false,
        },
      ],
    },
  ],
}

const ROLE_CLUSTERS: Record<RoleId, GenericPathway | null> = {
  cultivator_producer:         PRODUCTION_QUALITY,
  geneticist_breeder:          PRODUCTION_QUALITY,
  processor_extractor:         PRODUCTION_QUALITY,
  gmp_quality:                 PRODUCTION_QUALITY,
  lab_qa:                      PRODUCTION_QUALITY,

  importer:                    TRADE_LOGISTICS,
  exporter:                    TRADE_LOGISTICS,
  distributor_wholesaler:      TRADE_LOGISTICS,
  logistics_customs:           TRADE_LOGISTICS,
  retail_operator:             TRADE_LOGISTICS,

  doctor_prescriber:           HEALTHCARE_PATIENT,
  pharmacist:                  HEALTHCARE_PATIENT,
  clinic_healthcare_operator:  HEALTHCARE_PATIENT,
  patient_caregiver_education: HEALTHCARE_PATIENT,
  budtender:                   HEALTHCARE_PATIENT,

  regulatory_compliance:       PROFESSIONAL_OVERSIGHT,
  legal_advisory:               PROFESSIONAL_OVERSIGHT,
  investor_operator:           PROFESSIONAL_OVERSIGHT,
  government_regulator:        PROFESSIONAL_OVERSIGHT,

  not_sure: null,
}

const ROLE_LABELS: Record<RoleId, string> = {
  cultivator_producer:         'Cultivator / Producer',
  geneticist_breeder:          'Geneticist / Breeder',
  processor_extractor:         'Processor / Extractor',
  gmp_quality:                 'GMP & Quality',
  lab_qa:                      'Lab QA',
  importer:                    'Importer',
  exporter:                    'Exporter',
  distributor_wholesaler:      'Distributor / Wholesaler',
  logistics_customs:           'Logistics & Customs',
  retail_operator:             'Retail Operator',
  doctor_prescriber:           'Doctor / Prescriber',
  pharmacist:                  'Pharmacist',
  clinic_healthcare_operator:  'Clinic / Healthcare Operator',
  patient_caregiver_education: 'Patient & Caregiver Education',
  budtender:                   'Budtender',
  regulatory_compliance:       'Regulatory Compliance',
  legal_advisory:              'Legal Advisory',
  investor_operator:           'Investor / Operator',
  government_regulator:        'Government Regulator',
  not_sure:                    'General',
}

/**
 * Returns a generic, country-agnostic Access Pathway for any role/country
 * combination. Used as a fallback by getPublicPathwayTemplate when no
 * country-specific row exists in cc_pathway_templates.
 */
export function getGenericPathwayTemplate(
  countryName: string,
  roleId: string,
  regulatorLabel?: string | null,
): PathwayData {
  const empty: PathwayData = {
    template: null, steps: [], requirements: [], progress: null, requirementStatuses: [],
  }

  const cluster = ROLE_CLUSTERS[roleId as RoleId]
  if (!cluster) return empty

  const regulator = regulatorLabel?.trim() || `${countryName}'s cannabis regulatory authority`

  const roleLabel = ROLE_LABELS[roleId as RoleId] ?? roleId
  const templateId = `generic-${roleId}`

  const steps: PathwayData['steps'] = []
  const requirements: PathwayData['requirements'] = []

  cluster.steps.forEach((step, stepIdx) => {
    const stepNumber = stepIdx + 1
    const stepId = `${templateId}-step-${stepNumber}`
    steps.push({
      id: stepId,
      step_number: stepNumber,
      title: step.title,
      description: step.description(countryName, regulator),
      unlock_condition: 'previous_step_complete',
    })
    step.requirements.forEach((req, reqIdx) => {
      requirements.push({
        id: `${stepId}-req-${reqIdx + 1}`,
        step_id: stepId,
        title: req.title,
        description: req.description(countryName, regulator),
        evidence_type: req.evidence_type,
        is_required: req.is_required,
        sort_order: reqIdx + 1,
      })
    })
  })

  return {
    template: {
      id: templateId,
      name: cluster.name(countryName, roleLabel),
      total_steps: steps.length,
    },
    steps,
    requirements,
    progress: null,
    requirementStatuses: [],
  }
}
