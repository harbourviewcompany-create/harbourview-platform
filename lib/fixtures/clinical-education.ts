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
  {
    id: 'doctors-clinics',
    slug: 'doctors',
    title: 'For Doctors & Clinics',
    route: '/network/clinical-education/doctors',
    audience: ['doctors', 'clinicians', 'clinics'],
    moduleStatus: 'Live',
    riskLevel: 'medium',
    publicSummary:
      'A high-level professional education area for clinicians reviewing cannabis formats, routes, cannabinoid ratios, onset and duration concepts, monitoring considerations and country-specific prescribing context.',
    educationThemes: [
      'format literacy',
      'routes of administration',
      'cannabinoid ratios',
      'monitoring considerations',
      'country prescribing context',
    ],
    safeLanguage: ['clinician prescribing context', 'monitoring considerations', 'professional education'],
    restrictedLanguage: ['individualized prescribing wording', 'treatment-claim wording'],
    researchStatus: 'High-level only',
    professionalReviewRequired: true,
    countryRelevance: ['global'],
    formatRelevance: ['oils', 'capsules', 'flower', 'extracts'],
    disclaimerType: 'dosage',
    ctaLabel: 'Request Clinician Education Support',
    ctaHref: '/network/clinical-education/request-education-support',
  },
  {
    id: 'pharmacists',
    slug: 'pharmacists',
    title: 'For Pharmacists',
    route: '/network/clinical-education/pharmacists',
    audience: ['pharmacists', 'dispensers', 'pharmacy operators'],
    moduleStatus: 'Live',
    riskLevel: 'medium',
    publicSummary:
      'A professional education area for pharmacists reviewing cannabis dosage forms, COAs, potency, batch documentation, storage, substitution issues, patient counselling boundaries and adverse-event awareness.',
    educationThemes: [
      'dispensing considerations',
      'COA review basics',
      'batch documentation',
      'storage and handling',
      'patient counselling boundaries',
    ],
    safeLanguage: ['pharmacist counselling considerations', 'documentation expectations', 'adverse-effect awareness'],
    restrictedLanguage: ['patient-specific suitability wording', 'product-direction wording'],
    researchStatus: 'High-level only',
    professionalReviewRequired: true,
    countryRelevance: ['global'],
    formatRelevance: ['oils', 'capsules', 'flower', 'extracts'],
    disclaimerType: 'dosage',
    ctaLabel: 'Request Pharmacist Education Support',
    ctaHref: '/network/clinical-education/request-education-support',
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
      'A basic education module explaining dosage forms and routes, including oils, capsules, softgels, dried flower, extracts, sublingual products, vaporization formats where legal and pharmacy-prepared products where applicable.',
    educationThemes: ['oral oils', 'capsules', 'softgels', 'dried flower', 'extracts', 'routes of administration'],
    safeLanguage: ['dosage forms', 'product formats', 'route of administration'],
    restrictedLanguage: ['individualized amount wording', 'prescribing instruction wording'],
    researchStatus: 'Live basic format education',
    professionalReviewRequired: false,
    countryRelevance: ['global'],
    formatRelevance: ['oils', 'capsules', 'softgels', 'flower', 'extracts'],
    disclaimerType: 'dosage',
    ctaLabel: 'Request Format Education Support',
    ctaHref: '/network/clinical-education/request-education-support',
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
      'A research-stage module for professional education around THC-dominant, CBD-dominant, balanced THC:CBD, full-spectrum, broad-spectrum, isolate-based and minor cannabinoid formulas.',
    educationThemes: [
      'THC-dominant formulas',
      'CBD-dominant formulas',
      'balanced THC:CBD',
      'full-spectrum',
      'isolate-based formulas',
    ],
    safeLanguage: ['formula considerations', 'cannabinoid ratios', 'professional considerations'],
    restrictedLanguage: ['patient-matching wording', 'condition-selection wording'],
    researchStatus: 'Research in progress',
    professionalReviewRequired: true,
    countryRelevance: ['global'],
    formatRelevance: ['all formulas'],
    disclaimerType: 'dosage',
    ctaLabel: 'Request Formula Education Support',
    ctaHref: '/network/clinical-education/request-education-support',
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
    educationThemes: [
      'onset concepts',
      'duration concepts',
      'oral vs inhaled differences',
      'delayed onset awareness',
      'monitoring implications',
    ],
    safeLanguage: ['onset', 'duration', 'monitoring considerations'],
    restrictedLanguage: ['effect-promise wording', 'outcome-claim wording'],
    researchStatus: 'Professional review required',
    professionalReviewRequired: true,
    countryRelevance: ['global'],
    formatRelevance: ['oils', 'capsules', 'flower', 'vaporization where legal'],
    disclaimerType: 'dosage',
    ctaLabel: 'Request Professional Review Briefing',
    ctaHref: '/network/clinical-education/request-education-support',
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
    educationThemes: [
      'patient-reported effects',
      'subjective effects',
      'adverse-effect awareness',
      'impairment considerations',
      'monitoring',
    ],
    safeLanguage: ['patient-reported effects', 'subjective effects', 'monitoring considerations'],
    restrictedLanguage: ['feeling-promise wording', 'suitability-claim wording'],
    researchStatus: 'Professional review required',
    professionalReviewRequired: true,
    countryRelevance: ['global'],
    formatRelevance: ['all formats'],
    disclaimerType: 'patient-boundary',
    ctaLabel: 'Request Effects & Monitoring Briefing',
    ctaHref: '/network/clinical-education/request-education-support',
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
      'A basic documentation education module covering COAs, potency, cannabinoid profile, batch number, expiry, contaminant testing, carrier oils, excipients, stability, storage conditions and GMP/GACP/GDP relevance where applicable.',
    educationThemes: ['COAs', 'potency', 'batch documentation', 'contaminant testing', 'storage conditions'],
    safeLanguage: ['COA basics', 'potency', 'documentation expectations'],
    restrictedLanguage: ['private document wording', 'inventory wording'],
    researchStatus: 'Live basic documentation education',
    professionalReviewRequired: false,
    countryRelevance: ['global'],
    formatRelevance: ['all formats'],
    disclaimerType: 'standard',
    ctaLabel: 'Request Documentation Education Support',
    ctaHref: '/network/clinical-education/request-education-support',
  },
  {
    id: 'country-readiness',
    slug: 'country-readiness',
    title: 'Country Education Readiness',
    route: '/network/clinical-education/country-readiness',
    audience: ['doctors', 'pharmacists', 'importers', 'licensed producers', 'market-access teams'],
    moduleStatus: 'Live',
    riskLevel: 'medium',
    publicSummary:
      'A framework for tracking country-specific medical cannabis education readiness, including whether official guidance has been identified, whether professional reviewers are needed and whether education briefs are available by request.',
    educationThemes: ['country readiness', 'professional training gaps', 'official guidance', 'reviewer needs', 'brief availability'],
    safeLanguage: ['country readiness', 'professional education readiness', 'official guidance status'],
    restrictedLanguage: ['market-access guarantee wording', 'counterparty-confirmation wording'],
    researchStatus: 'Live framework, country details by request',
    professionalReviewRequired: true,
    countryRelevance: ['global'],
    formatRelevance: ['all formats'],
    disclaimerType: 'standard',
    ctaLabel: 'Request Country Education Brief',
    ctaHref: '/network/clinical-education/request-education-support',
  },
  {
    id: 'research-review',
    slug: 'research-review',
    title: 'Research & Professional Review',
    route: '/network/clinical-education/research-review',
    audience: ['regulated participants', 'reviewers', 'operators'],
    moduleStatus: 'Live',
    riskLevel: 'low',
    publicSummary:
      'An explanation of Harbourview’s intended research and professional-review approach for clinical education, including source-backed research, country-by-country review, professional input and medical/legal/regulatory boundaries.',
    educationThemes: [
      'source-backed research',
      'professional reviewer pathway',
      'country review',
      'local-language source review',
      'education boundaries',
    ],
    safeLanguage: ['research in progress', 'professional review', 'evidence-led education'],
    restrictedLanguage: ['medical-authority wording', 'accreditation wording'],
    researchStatus: 'Live',
    professionalReviewRequired: false,
    countryRelevance: ['global'],
    formatRelevance: ['all formats'],
    disclaimerType: 'standard',
    ctaLabel: 'Request Education Support',
    ctaHref: '/network/clinical-education/request-education-support',
  },
]

export const clinicalEducationCountryReadiness: ClinicalEducationCountryReadiness[] = [
  {
    country: 'Italy',
    region: 'Europe',
    medicalCannabisAccessStatus: 'Medical cannabis access exists, education context requires research',
    professionalEducationReadiness: 'Research in progress',
    knownTrainingGap:
      'Doctors and pharmacists may require clearer education on formats, documentation and prescribing or dispensing context.',
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
    knownTrainingGap:
      'Pharmacists and clinicians may require support understanding dosage forms, products and documentation.',
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
  {
    country: 'France',
    region: 'Europe',
    medicalCannabisAccessStatus: 'Access framework evolving',
    professionalEducationReadiness: 'Under monitoring',
    knownTrainingGap: 'Professional education likely needed as access pathways evolve.',
    officialGuidanceStatus: 'To be researched',
    formatsRequiringEducation: ['oils', 'capsules', 'extracts'],
    pharmacistRelevance: 'Medium',
    clinicianRelevance: 'High',
    researchStatus: 'Under monitoring',
    professionalReviewerNeeded: true,
    briefAvailability: 'Not yet public',
  },
  {
    country: 'Brazil',
    region: 'LATAM',
    medicalCannabisAccessStatus: 'Medical cannabis access exists through specific pathways',
    professionalEducationReadiness: 'Research in progress',
    knownTrainingGap: 'Clinician, pharmacist and importer education may require country-specific review.',
    officialGuidanceStatus: 'To be researched',
    formatsRequiringEducation: ['oils', 'CBD-dominant products', 'formulas and ratios'],
    pharmacistRelevance: 'Medium',
    clinicianRelevance: 'High',
    researchStatus: 'Research in progress',
    professionalReviewerNeeded: true,
    briefAvailability: 'Available by request',
  },
  {
    country: 'Japan',
    region: 'Asia',
    medicalCannabisAccessStatus: 'Cannabis-related product rules require careful review',
    professionalEducationReadiness: 'Under monitoring',
    knownTrainingGap: 'Professional education must be tightly controlled and evidence-led.',
    officialGuidanceStatus: 'Official sources required',
    formatsRequiringEducation: ['CBD-related products where lawful', 'documentation'],
    pharmacistRelevance: 'Medium',
    clinicianRelevance: 'Medium',
    researchStatus: 'Under monitoring',
    professionalReviewerNeeded: true,
    briefAvailability: 'Not yet public',
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
  const module = clinicalEducationModules.find((item) => item.slug === slug)
  if (!module) throw new Error(`Clinical education module not found: ${slug}`)
  return module
}
