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

const requestHref = '/network/clinical-education/request'

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
    publicSummary:
      'A basic education module explaining dosage forms and routes, including oils, capsules, softgels, dried flower, extracts and other lawful product forms where applicable.',
    educationThemes: ['oral oils', 'capsules', 'softgels', 'dried flower', 'extracts', 'routes of administration'],
    safeLanguage: ['dosage forms', 'product formats', 'route of administration'],
    restrictedLanguage: ['individualized amount wording', 'prescribing instruction wording'],
    researchStatus: 'Live basic format education',
    professionalReviewRequired: false,
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
    publicSummary:
      'A basic documentation education module covering COAs, potency, cannabinoid profile, batch number, expiry, testing, storage conditions and documentation standards where applicable.',
    educationThemes: ['COAs', 'potency', 'batch documentation', 'testing', 'storage conditions'],
    safeLanguage: ['COA basics', 'potency', 'documentation expectations'],
    restrictedLanguage: ['private document wording', 'inventory wording'],
    researchStatus: 'Live basic documentation education',
    professionalReviewRequired: false,
    countryRelevance: ['global'],
    formatRelevance: ['all formats'],
    disclaimerType: 'standard',
    ctaLabel: 'Request Documentation Education Support',
    ctaHref: requestHref,
  },
  {
    id: 'formulas-ratios',
    slug: 'formulas-ratios',
    title: 'Formulas & Cannabinoid Ratios',
    route: '/network/clinical-education/formulas-ratios',
    audience: ['doctors', 'pharmacists', 'licensed producers', 'importers'],
    moduleStatus: 'Research in progress',
    riskLevel: 'high',
    publicSummary:
      'A research-stage module for professional education around THC-dominant, CBD-dominant, balanced THC:CBD, full-spectrum, broad-spectrum and isolate-based formulas.',
    educationThemes: ['THC-dominant formulas', 'CBD-dominant formulas', 'balanced THC:CBD', 'full-spectrum', 'isolate-based formulas'],
    safeLanguage: ['formula considerations', 'cannabinoid ratios', 'professional considerations'],
    restrictedLanguage: ['patient-matching wording', 'condition-selection wording'],
    researchStatus: 'Research in progress',
    professionalReviewRequired: true,
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
    publicSummary:
      'A professional-review-required module explaining why formats may differ in onset, duration, delayed onset risk, repeat-use caution concepts, monitoring implications and counselling themes.',
    educationThemes: ['onset concepts', 'duration concepts', 'oral vs inhaled differences', 'delayed onset awareness', 'monitoring implications'],
    safeLanguage: ['onset', 'duration', 'monitoring considerations'],
    restrictedLanguage: ['effect-promise wording', 'outcome-claim wording'],
    researchStatus: 'Professional review required',
    professionalReviewRequired: true,
    countryRelevance: ['global'],
    formatRelevance: ['oils', 'capsules', 'flower', 'vaporization where legal'],
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
    publicSummary:
      'A professional-review-required module organizing education around patient-reported effects, subjective effects, adverse-effect awareness, impairment considerations, tolerability considerations and monitoring themes.',
    educationThemes: ['patient-reported effects', 'subjective effects', 'adverse-effect awareness', 'impairment considerations', 'monitoring'],
    safeLanguage: ['patient-reported effects', 'subjective effects', 'monitoring considerations'],
    restrictedLanguage: ['feeling-promise wording', 'suitability-claim wording'],
    researchStatus: 'Professional review required',
    professionalReviewRequired: true,
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
    medicalCannabisAccessStatus: 'Medical cannabis access exists, education context requires research',
    professionalEducationReadiness: 'Research in progress',
    knownTrainingGap: 'Doctors and pharmacists may require clearer education on formats, documentation and prescribing or dispensing context.',
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
    medicalCannabisAccessStatus: 'Medical cannabis framework active, professional education context requires research',
    professionalEducationReadiness: 'Official guidance to be reviewed',
    knownTrainingGap: 'Pharmacists and clinicians may require support understanding dosage forms, products and documentation.',
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
    medicalCannabisAccessStatus: 'Established medical cannabis market with evolving framework',
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

export const clinicalEducationReadinessStatuses = [
  'Research not started',
  'Research in progress',
  'Official guidance identified',
  'Professional reviewer needed',
  'Education brief available by request',
  'Public education brief published',
]

export const professionalCategories = [
  'Doctor / clinician',
  'Pharmacist',
  'Clinic operator',
  'Importer / distributor',
  'Licensed producer',
  'Compliance / regulatory advisor',
  'Investor / operator',
  'Other regulated participant',
]

export const clinicalEducationTopics = [
  'Doctor education',
  'Pharmacist education',
  'Dosage forms',
  'Cannabinoid formulas and ratios',
  'Onset and duration',
  'Effects and monitoring',
  'Product documentation',
  'Country education readiness',
  'Professional briefing',
  'Supplier education support',
]

export function getClinicalEducationModule(slug: string): ClinicalEducationModule {
  const educationModule = clinicalEducationModules.find((item) => item.slug === slug)
  if (!educationModule) throw new Error(`Clinical education module not found: ${slug}`)
  return educationModule
}
