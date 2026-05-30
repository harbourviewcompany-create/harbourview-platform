export type ClinicalEducationModuleStatus = 'Live' | 'Available by request' | 'Research in progress' | 'Professional review required' | 'Future module' | 'Admin-only'
export type ClinicalEducationRiskLevel = 'low' | 'medium' | 'high'
export type ClinicalEducationDisclaimerType = 'standard' | 'dosage' | 'patient-boundary'
export type ClinicalEducationSourceBasis = 'professional-orientation' | 'official-source-required' | 'professional-review-required' | 'research-in-progress'
export type ClinicalEducationAudienceBoundary = 'professional-only' | 'commercial-professional' | 'not-patient-facing'

export type ClinicalEducationModule = {
  id: string
  slug: string
  title: string
  route: string
  audience: string[]
  moduleStatus: ClinicalEducationModuleStatus
  riskLevel: ClinicalEducationRiskLevel
  publicSummary: string
  educationThemes: string[]
  safeLanguage: string[]
  restrictedLanguage: string[]
  researchStatus: string
  professionalReviewRequired: boolean
  sourceBasis: ClinicalEducationSourceBasis
  reviewerRoleRequired: string[]
  audienceBoundary: ClinicalEducationAudienceBoundary
  lastReviewed: string
  nextReviewDue: string
  publicUseApproved: boolean
  medicalAdviceBoundary: string
  countryRelevance: string[]
  formatRelevance: string[]
  disclaimerType: ClinicalEducationDisclaimerType
  ctaLabel: string
  ctaHref: string
}

export type ClinicalEducationCountryReadiness = {
  country: string
  region: string
  professionalEducationReadiness: string
  knownTrainingGap: string
  officialGuidanceStatus: string
  formatsRequiringEducation: string[]
  pharmacistRelevance: string
  clinicianRelevance: string
  researchStatus: string
  professionalReviewerNeeded: boolean
  briefAvailability: string
}

export const standardClinicalEducationDisclaimer =
  'Harbourview Clinical Education is provided for regulated-market education only. It is not medical advice, prescribing advice, legal advice or patient-specific guidance. Clinicians, pharmacists and regulated participants remain responsible for decisions made under applicable laws, professional standards and local regulatory requirements.'

export const dosageBoundaryDisclaimer =
  'Harbourview may organize education around product forms, routes, formulas, ratios, timing and monitoring considerations. Harbourview does not provide patient-specific instructions or treatment recommendations.'

export const patientBoundaryDisclaimer =
  'This resource is intended for licensed professionals and regulated market participants. It is not patient-facing content and does not provide patient-specific medical advice. Patients should consult a qualified clinician or pharmacist in their jurisdiction.'

const requestHref = '/network/clinical-education/request'
const standardMedicalAdviceBoundary = 'Professional education only. Not medical advice, prescribing advice, patient-specific guidance, product recommendation or treatment direction.'

export const clinicalEducationModules: ClinicalEducationModule[] = [
  {
    id: 'clinical-overview',
    slug: 'clinical-education',
    title: 'Harbourview Clinical Education',
    route: '/network/clinical-education',
    audience: ['doctors', 'pharmacists', 'clinics', 'regulated participants'],
    moduleStatus: 'Live',
    riskLevel: 'low',
    publicSummary: 'Medical cannabis access can expand faster than professional training. Harbourview Clinical Education organizes professional education themes for regulated markets.',
    educationThemes: ['professional education gap', 'product forms', 'country readiness', 'professional review'],
    safeLanguage: ['professional education', 'country readiness', 'documentation expectations'],
    restrictedLanguage: ['individualized instruction wording', 'treatment-direction wording'],
    researchStatus: 'Live framework',
    professionalReviewRequired: false,
    sourceBasis: 'professional-orientation',
    reviewerRoleRequired: ['Harbourview editorial review'],
    audienceBoundary: 'commercial-professional',
    lastReviewed: '2026-05-17',
    nextReviewDue: 'Before jurisdiction-specific publication or patient-facing reuse',
    publicUseApproved: true,
    medicalAdviceBoundary: standardMedicalAdviceBoundary,
    countryRelevance: ['global'],
    formatRelevance: ['all formats'],
    disclaimerType: 'standard',
    ctaLabel: 'Request Education Support',
    ctaHref: requestHref,
  },
  {
    id: 'dosage-forms',
    slug: 'dosage-forms',
    title: 'Dosage Forms & Routes',
    route: '/network/clinical-education/dosage-forms',
    audience: ['doctors', 'pharmacists', 'importers', 'licensed producers'],
    moduleStatus: 'Live',
    riskLevel: 'medium',
    publicSummary: 'A basic education module explaining product forms and routes at a professional overview level.',
    educationThemes: ['oral formats', 'capsules', 'softgels', 'dried formats', 'extracts', 'routes of administration'],
    safeLanguage: ['product forms', 'product formats', 'route of administration'],
    restrictedLanguage: ['individualized amount wording', 'prescribing instruction wording'],
    researchStatus: 'Live basic format education',
    professionalReviewRequired: false,
    sourceBasis: 'professional-orientation',
    reviewerRoleRequired: ['Harbourview editorial review', 'Clinical/pharmacy reviewer before jurisdiction-specific use'],
    audienceBoundary: 'professional-only',
    lastReviewed: '2026-05-17',
    nextReviewDue: 'Before any dose, condition, country or patient-facing adaptation',
    publicUseApproved: true,
    medicalAdviceBoundary: standardMedicalAdviceBoundary,
    countryRelevance: ['global'],
    formatRelevance: ['oils', 'capsules', 'softgels', 'flower', 'extracts'],
    disclaimerType: 'dosage',
    ctaLabel: 'Request Format Education Support',
    ctaHref: requestHref,
  },
  {
    id: 'product-documentation',
    slug: 'product-documentation',
    title: 'COAs, Potency & Product Documentation',
    route: '/network/clinical-education/product-documentation',
    audience: ['pharmacists', 'importers', 'licensed producers', 'compliance teams'],
    moduleStatus: 'Live',
    riskLevel: 'low',
    publicSummary: 'A basic documentation education module covering certificates, profiles, batch references, testing, storage conditions and documentation standards.',
    educationThemes: ['certificates', 'potency', 'batch documentation', 'testing', 'storage conditions'],
    safeLanguage: ['certificate basics', 'potency', 'documentation expectations'],
    restrictedLanguage: ['private document wording', 'inventory wording'],
    researchStatus: 'Live basic documentation education',
    professionalReviewRequired: false,
    sourceBasis: 'professional-orientation',
    reviewerRoleRequired: ['Harbourview editorial review', 'QA/regulatory reviewer before route-specific reliance'],
    audienceBoundary: 'commercial-professional',
    lastReviewed: '2026-05-17',
    nextReviewDue: 'Before batch-specific, country-specific or QP-facing adaptation',
    publicUseApproved: true,
    medicalAdviceBoundary: standardMedicalAdviceBoundary,
    countryRelevance: ['global'],
    formatRelevance: ['all formats'],
    disclaimerType: 'standard',
    ctaLabel: 'Request Documentation Education Support',
    ctaHref: requestHref,
  },
  {
    id: 'formulas-ratios',
    slug: 'formulas-ratios',
    title: 'Formulas & Ratios',
    route: '/network/clinical-education/formulas-ratios',
    audience: ['doctors', 'pharmacists', 'licensed producers', 'importers'],
    moduleStatus: 'Research in progress',
    riskLevel: 'high',
    publicSummary: 'A research-stage module for professional education around formulas and ratios.',
    educationThemes: ['formula considerations', 'ratio concepts', 'professional considerations'],
    safeLanguage: ['formula considerations', 'ratio concepts', 'professional considerations'],
    restrictedLanguage: ['patient-matching wording', 'condition-selection wording'],
    researchStatus: 'Research in progress',
    professionalReviewRequired: true,
    sourceBasis: 'research-in-progress',
    reviewerRoleRequired: ['Qualified clinical reviewer', 'Regulatory/promotional review before external use'],
    audienceBoundary: 'professional-only',
    lastReviewed: '2026-05-17',
    nextReviewDue: 'Before public detail expansion or external reuse',
    publicUseApproved: false,
    medicalAdviceBoundary: standardMedicalAdviceBoundary,
    countryRelevance: ['global'],
    formatRelevance: ['all formulas'],
    disclaimerType: 'dosage',
    ctaLabel: 'Request Formula Education Support',
    ctaHref: requestHref,
  },
  {
    id: 'onset-duration',
    slug: 'onset-duration',
    title: 'Onset, Duration & Format Differences',
    route: '/network/clinical-education/onset-duration',
    audience: ['doctors', 'pharmacists', 'clinics'],
    moduleStatus: 'Professional review required',
    riskLevel: 'high',
    publicSummary: 'A professional-review-required module for timing and format-difference education.',
    educationThemes: ['onset concepts', 'duration concepts', 'format differences', 'monitoring implications'],
    safeLanguage: ['onset', 'duration', 'monitoring considerations'],
    restrictedLanguage: ['effect-promise wording', 'outcome-claim wording'],
    researchStatus: 'Professional review required',
    professionalReviewRequired: true,
    sourceBasis: 'professional-review-required',
    reviewerRoleRequired: ['Qualified clinical reviewer', 'Medical/legal/promotional review before external use'],
    audienceBoundary: 'professional-only',
    lastReviewed: '2026-05-17',
    nextReviewDue: 'Before any public detail expansion or clinical-use adaptation',
    publicUseApproved: false,
    medicalAdviceBoundary: standardMedicalAdviceBoundary,
    countryRelevance: ['global'],
    formatRelevance: ['multiple formats'],
    disclaimerType: 'dosage',
    ctaLabel: 'Request Professional Review Briefing',
    ctaHref: requestHref,
  },
  {
    id: 'effects-monitoring',
    slug: 'effects-monitoring',
    title: 'Patient-Reported Effects & Monitoring',
    route: '/network/clinical-education/effects-monitoring',
    audience: ['doctors', 'pharmacists', 'clinics'],
    moduleStatus: 'Professional review required',
    riskLevel: 'high',
    publicSummary: 'A professional-review-required module for reported effects and monitoring themes.',
    educationThemes: ['reported effects', 'subjective effects', 'adverse-effect awareness', 'monitoring'],
    safeLanguage: ['patient-reported effects', 'subjective effects', 'monitoring considerations'],
    restrictedLanguage: ['feeling-promise wording', 'suitability-claim wording'],
    researchStatus: 'Professional review required',
    professionalReviewRequired: true,
    sourceBasis: 'professional-review-required',
    reviewerRoleRequired: ['Qualified clinical reviewer', 'Pharmacovigilance/safety reviewer before external use'],
    audienceBoundary: 'not-patient-facing',
    lastReviewed: '2026-05-17',
    nextReviewDue: 'Before public detail expansion, safety-language reuse or clinical-use adaptation',
    publicUseApproved: false,
    medicalAdviceBoundary: standardMedicalAdviceBoundary,
    countryRelevance: ['global'],
    formatRelevance: ['all formats'],
    disclaimerType: 'patient-boundary',
    ctaLabel: 'Request Effects & Monitoring Briefing',
    ctaHref: requestHref,
  },
]

export const clinicalEducationCountryReadiness: ClinicalEducationCountryReadiness[] = [
  {
    country: 'Italy',
    region: 'Europe',
    professionalEducationReadiness: 'Research in progress',
    knownTrainingGap: 'Professionals may require clearer education on formats, documentation and local context.',
    officialGuidanceStatus: 'To be researched',
    formatsRequiringEducation: ['oils', 'flower', 'capsules'],
    pharmacistRelevance: 'High',
    clinicianRelevance: 'High',
    researchStatus: 'Research in progress',
    professionalReviewerNeeded: true,
    briefAvailability: 'Available by request',
  },
  {
    country: 'New Zealand',
    region: 'Oceania',
    professionalEducationReadiness: 'Official guidance to be reviewed',
    knownTrainingGap: 'Professionals may require support understanding product forms and documentation.',
    officialGuidanceStatus: 'Official sources to be reviewed',
    formatsRequiringEducation: ['oils', 'capsules', 'dried flower where applicable'],
    pharmacistRelevance: 'High',
    clinicianRelevance: 'High',
    researchStatus: 'Research in progress',
    professionalReviewerNeeded: true,
    briefAvailability: 'Available by request',
  },
  {
    country: 'Germany',
    region: 'Europe',
    professionalEducationReadiness: 'Professional education remains relevant',
    knownTrainingGap: 'Product formats, pharmacy workflows and documentation remain important education areas.',
    officialGuidanceStatus: 'Official and professional sources to be reviewed',
    formatsRequiringEducation: ['flower', 'extracts', 'oils', 'capsules'],
    pharmacistRelevance: 'High',
    clinicianRelevance: 'High',
    researchStatus: 'Research in progress',
    professionalReviewerNeeded: true,
    briefAvailability: 'Available by request',
  },
]

export function getClinicalEducationModule(slug: string): ClinicalEducationModule {
  const educationItem = clinicalEducationModules.find((item) => item.slug === slug)
  if (!educationItem) throw new Error(`Clinical education module not found: ${slug}`)
  return educationItem
}
