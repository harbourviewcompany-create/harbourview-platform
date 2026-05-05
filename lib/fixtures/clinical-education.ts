export type ClinicalEducationModuleStatus =
  | 'Live'
  | 'Available by request'
  | 'Research in progress'
  | 'Professional review required'
  | 'Future module'
  | 'Admin-only'

export type ClinicalEducationRiskLevel = 'low' | 'medium' | 'high'

export type ClinicalEducationDisclaimerType = 'standard' | 'dosage' | 'patient-boundary'

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
  countryRelevance: string[]
  formatRelevance: string[]
  disclaimerType: ClinicalEducationDisclaimerType
  ctaLabel: string
  ctaHref: string
}

export type ClinicalEducationCountryReadiness = {
  country: string
  region: string
  medicalCannabisAccessStatus: string
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
  'Harbourview may organize education around dosage forms, routes, formulas, ratios, onset, duration and monitoring considerations. Harbourview does not provide patient-specific dosing instructions or treatment recommendations.'

export const patientBoundaryDisclaimer =
  'This resource is intended for licensed professionals and regulated market participants. Harbourview does not provide patient-specific medical advice. Patients should consult a qualified clinician or pharmacist in their jurisdiction.'

export const clinicalEducationModules: ClinicalEducationModule[] = [
  {
    id: 'clinical-overview',
    slug: 'clinical-education',
    title: 'Harbourview Clinical Education',
    route: '/network/clinical-education',
    audience: ['doctors', 'pharmacists', 'clinics', 'regulated participants'],
    moduleStatus: 'Live',
    riskLevel: 'low',
    publicSummary:
      'Medical cannabis access is expanding faster than professional training. Harbourview Clinical Education is being developed to help regulated markets organize education around dosage forms, formats, formulas, ratios, onset, duration, monitoring, documentation and country readiness.',
    educationThemes: [
      'doctor and pharmacist education gap',
      'dosage forms',
      'product formats',
      'country readiness',
      'professional review',
    ],
    safeLanguage: ['professional education', 'country readiness', 'documentation expectations'],
    restrictedLanguage: ['individualized dosing wording', 'treatment-direction wording'],
    researchStatus: 'Live framework',
    professionalReviewRequired: false,
    countryRelevance: ['global'],
    formatRelevance: ['all formats'],
    disclaimerType: 'standard',
    ctaLabel: 'Request Education Support',
    ctaHref: '/network/clinical-education/request-education-support',
  },
]

export function getClinicalEducationModule(slug: string): ClinicalEducationModule {
  const educationModule = clinicalEducationModules.find((item) => item.slug === slug)
  if (!educationModule) throw new Error(`Clinical education module not found: ${slug}`)
  return educationModule
}
