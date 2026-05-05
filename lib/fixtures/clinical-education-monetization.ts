export type AccessLevel = 'public' | 'gated' | 'paid' | 'admin_only'
export type ReviewStatus = 'draft' | 'source_review' | 'claim_review' | 'professional_review' | 'approved' | 'published' | 'expired' | 'archived'
export type ProfessionalCategory = 'doctor' | 'pharmacist' | 'clinic' | 'importer' | 'supplier' | 'compliance' | 'investor' | 'regulated_operator'

export type ClinicalEducationAsset = {
  id: string
  slug: string
  title: string
  assetType: 'country_brief' | 'pharmacist_brief' | 'doctor_brief' | 'format_comparison' | 'documentation_checklist' | 'training_deck' | 'webinar_recording'
  accessLevel: AccessLevel
  audience: ProfessionalCategory[]
  country?: string
  formatTopics: string[]
  publicSummary: string
  reviewStatus: ReviewStatus
  professionalReviewerRequired: boolean
  priceCad?: number
  ctaLabel: string
  ctaHref: string
}

export type ClinicalEducationPackage = {
  id: string
  slug: string
  title: string
  packageType: 'pharmacist_package' | 'doctor_clinic_briefing' | 'country_education_pack' | 'supplier_readiness_review' | 'webinar_package' | 'documentation_workshop'
  accessLevel: 'paid'
  audience: ProfessionalCategory[]
  countryScope: 'single_country' | 'multi_country' | 'global'
  deliverables: string[]
  startingPriceCad: number
  reviewStatus: ReviewStatus
  manualPaymentOnly: true
  publicSummary: string
  ctaLabel: string
  ctaHref: string
}

export type ClinicalEducationEvent = {
  id: string
  slug: string
  title: string
  eventType: 'country_briefing' | 'pharmacist_format_briefing' | 'doctor_clinic_briefing' | 'supplier_launch_session' | 'importer_workshop' | 'documentation_webinar'
  accessLevel: 'free' | 'gated' | 'paid' | 'private'
  audience: ProfessionalCategory[]
  country?: string
  formatTopics: string[]
  eventStatus: 'planned' | 'registration_open' | 'closed' | 'recording_available' | 'private'
  recordingAvailable: boolean
  priceCad?: number
  reviewStatus: ReviewStatus
  publicSummary: string
  ctaLabel: string
  ctaHref: string
}

export const clinicalEducationDisclaimer =
  'Harbourview Clinical Education is provided for regulated-market education only. It is not medical advice, prescribing advice, legal advice or patient-specific guidance.'

export const manualPaymentBoundary =
  'V2 uses manual payment and approval. Harbourview will confirm scope, price, access and delivery terms directly before any paid engagement begins.'

export const requestAccessHref = '/network/clinical-education/request-access'

export const clinicalEducationAssets: ClinicalEducationAsset[] = [
  {
    id: 'pharmacist-format-brief',
    slug: 'pharmacist-format-brief',
    title: 'Pharmacist Format Brief',
    assetType: 'pharmacist_brief',
    accessLevel: 'gated',
    audience: ['pharmacist', 'importer'],
    formatTopics: ['formats', 'documentation', 'dispensing context'],
    publicSummary: 'A gated professional resource for pharmacy-facing format and documentation education.',
    reviewStatus: 'professional_review',
    professionalReviewerRequired: true,
    ctaLabel: 'Request Access',
    ctaHref: requestAccessHref,
  },
  {
    id: 'doctor-clinic-format-overview',
    slug: 'doctor-clinic-format-overview',
    title: 'Doctor / Clinic Format Overview',
    assetType: 'doctor_brief',
    accessLevel: 'gated',
    audience: ['doctor', 'clinic'],
    formatTopics: ['formats', 'routes', 'monitoring themes'],
    publicSummary: 'A gated overview for clinical teams reviewing format differences and professional education needs.',
    reviewStatus: 'professional_review',
    professionalReviewerRequired: true,
    ctaLabel: 'Request Access',
    ctaHref: requestAccessHref,
  },
  {
    id: 'country-readiness-brief',
    slug: 'country-readiness-brief',
    title: 'Country Education Readiness Brief',
    assetType: 'country_brief',
    accessLevel: 'gated',
    audience: ['importer', 'supplier', 'regulated_operator'],
    country: 'By request',
    formatTopics: ['country readiness', 'professional education gap', 'documentation'],
    publicSummary: 'A gated country brief for assessing professional education readiness in a target market.',
    reviewStatus: 'source_review',
    professionalReviewerRequired: true,
    ctaLabel: 'Request Country Brief',
    ctaHref: requestAccessHref,
  },
  {
    id: 'documentation-checklist',
    slug: 'documentation-checklist',
    title: 'Product Documentation Checklist',
    assetType: 'documentation_checklist',
    accessLevel: 'gated',
    audience: ['supplier', 'importer', 'compliance'],
    formatTopics: ['documentation', 'quality records', 'review readiness'],
    publicSummary: 'A gated checklist for organizing product documentation before review or market-entry discussions.',
    reviewStatus: 'approved',
    professionalReviewerRequired: false,
    ctaLabel: 'Request Checklist',
    ctaHref: requestAccessHref,
  },
  {
    id: 'coa-basics-checklist',
    slug: 'coa-basics-checklist',
    title: 'COA Review Basics Checklist',
    assetType: 'documentation_checklist',
    accessLevel: 'gated',
    audience: ['pharmacist', 'supplier', 'importer'],
    formatTopics: ['certificates', 'potency', 'batch context'],
    publicSummary: 'A gated checklist for professional review of basic certificate and batch-documentation themes.',
    reviewStatus: 'approved',
    professionalReviewerRequired: false,
    ctaLabel: 'Request Checklist',
    ctaHref: requestAccessHref,
  },
  {
    id: 'format-comparison-sheet',
    slug: 'format-comparison-sheet',
    title: 'Format Comparison Sheet',
    assetType: 'format_comparison',
    accessLevel: 'gated',
    audience: ['doctor', 'pharmacist', 'clinic'],
    formatTopics: ['formats', 'routes', 'professional considerations'],
    publicSummary: 'A gated comparison sheet for professional education around format differences.',
    reviewStatus: 'professional_review',
    professionalReviewerRequired: true,
    ctaLabel: 'Request Access',
    ctaHref: requestAccessHref,
  },
]

export const clinicalEducationPackages: ClinicalEducationPackage[] = [
  {
    id: 'pharmacist-education-package',
    slug: 'pharmacist-education-package',
    title: 'Pharmacist Education Package',
    packageType: 'pharmacist_package',
    accessLevel: 'paid',
    audience: ['pharmacist', 'importer'],
    countryScope: 'single_country',
    deliverables: ['format overview', 'documentation checklist', 'dispensing-context brief', 'review call'],
    startingPriceCad: 750,
    reviewStatus: 'professional_review',
    manualPaymentOnly: true,
    publicSummary: 'Manual-scope education package for pharmacy-facing launch or education support.',
    ctaLabel: 'Request Scope',
    ctaHref: requestAccessHref,
  },
  {
    id: 'doctor-clinic-briefing',
    slug: 'doctor-clinic-briefing',
    title: 'Doctor / Clinic Format Briefing',
    packageType: 'doctor_clinic_briefing',
    accessLevel: 'paid',
    audience: ['doctor', 'clinic'],
    countryScope: 'single_country',
    deliverables: ['format briefing', 'country context', 'education deck', 'review call'],
    startingPriceCad: 1000,
    reviewStatus: 'professional_review',
    manualPaymentOnly: true,
    publicSummary: 'Manual-scope briefing for clinical teams reviewing regulated product formats.',
    ctaLabel: 'Request Scope',
    ctaHref: requestAccessHref,
  },
  {
    id: 'country-clinical-education-pack',
    slug: 'country-clinical-education-pack',
    title: 'Country Clinical Education Pack',
    packageType: 'country_education_pack',
    accessLevel: 'paid',
    audience: ['supplier', 'importer', 'regulated_operator'],
    countryScope: 'single_country',
    deliverables: ['country readiness brief', 'professional education gap map', 'documentation checklist', 'review call'],
    startingPriceCad: 5000,
    reviewStatus: 'source_review',
    manualPaymentOnly: true,
    publicSummary: 'Manual-scope country education package for market-readiness planning.',
    ctaLabel: 'Request Scope',
    ctaHref: requestAccessHref,
  },
  {
    id: 'supplier-readiness-review',
    slug: 'supplier-readiness-review',
    title: 'Supplier Education Readiness Review',
    packageType: 'supplier_readiness_review',
    accessLevel: 'paid',
    audience: ['supplier', 'compliance'],
    countryScope: 'single_country',
    deliverables: ['material review', 'claim-risk notes', 'documentation readiness notes', 'review call'],
    startingPriceCad: 1500,
    reviewStatus: 'claim_review',
    manualPaymentOnly: true,
    publicSummary: 'Manual-scope review of supplier education materials before professional-channel use.',
    ctaLabel: 'Request Scope',
    ctaHref: requestAccessHref,
  },
]

export const clinicalEducationEvents: ClinicalEducationEvent[] = [
  {
    id: 'country-education-briefing',
    slug: 'country-education-briefing',
    title: 'Country Education Briefing',
    eventType: 'country_briefing',
    accessLevel: 'gated',
    audience: ['importer', 'supplier', 'regulated_operator'],
    formatTopics: ['country readiness', 'professional education needs'],
    eventStatus: 'planned',
    recordingAvailable: false,
    reviewStatus: 'source_review',
    publicSummary: 'A planned professional briefing for country education readiness.',
    ctaLabel: 'Request Invitation',
    ctaHref: requestAccessHref,
  },
  {
    id: 'pharmacist-format-briefing',
    slug: 'pharmacist-format-briefing',
    title: 'Pharmacist Format Briefing',
    eventType: 'pharmacist_format_briefing',
    accessLevel: 'gated',
    audience: ['pharmacist', 'importer'],
    formatTopics: ['formats', 'documentation', 'pharmacy context'],
    eventStatus: 'planned',
    recordingAvailable: false,
    reviewStatus: 'professional_review',
    publicSummary: 'A planned education briefing for pharmacy-facing format education.',
    ctaLabel: 'Request Invitation',
    ctaHref: requestAccessHref,
  },
  {
    id: 'documentation-readiness-webinar',
    slug: 'documentation-readiness-webinar',
    title: 'Documentation Readiness Webinar',
    eventType: 'documentation_webinar',
    accessLevel: 'paid',
    audience: ['supplier', 'importer', 'compliance'],
    formatTopics: ['documentation', 'review readiness'],
    eventStatus: 'planned',
    recordingAvailable: false,
    priceCad: 3500,
    reviewStatus: 'approved',
    publicSummary: 'A manual-scope webinar for documentation and review-readiness education.',
    ctaLabel: 'Request Scope',
    ctaHref: requestAccessHref,
  },
]

export const reviewerWorkflowStatuses: ReviewStatus[] = [
  'draft',
  'source_review',
  'claim_review',
  'professional_review',
  'approved',
  'published',
  'expired',
  'archived',
]
