export type ComplianceRegionSlug =
  | 'europe'
  | 'north-america'
  | 'latin-america'
  | 'caribbean'
  | 'africa'
  | 'middle-east'
  | 'asia-pacific'

export type ComplianceMaturityLevel =
  | 'not_assessed'
  | 'basic_orientation'
  | 'source_backed_summary'
  | 'specialist_reviewed'
  | 'active_support_pathway'
  | 'restricted_case_by_case'

export type ComplianceReviewStatus = 'draft' | 'reviewed' | 'needs_update' | 'jurisdiction_changing'
export type ComplianceSourceConfidence = 'low' | 'moderate' | 'high'
export type ComplianceCountryPublicStatus =
  | 'draft_orientation'
  | 'source_review_required'
  | 'source_backed_public_summary'
  | 'specialist_reviewed_public_summary'
  | 'case_by_case_restricted'

export type ComplianceRegion = {
  slug: ComplianceRegionSlug
  name: string
  summary: string
  commercialFocus: string
}

export type ComplianceCountry = {
  slug: string
  country: string
  region: ComplianceRegionSlug
  maturityLevel: ComplianceMaturityLevel
  reviewStatus: ComplianceReviewStatus
  sourceConfidence: ComplianceSourceConfidence
  publicStatus: ComplianceCountryPublicStatus
  publicStatusLabel: string
  publicStatusExplanation: string
  lastReviewed: string
  nextReviewDue: string
  sourceBasis: string
  reviewOwner: string
  regulatoryBodies: string[]
  pathwaySummary: string
  importExportRelevance: string
  cultivationManufacturingRelevance: string
  gmpGacpGdpRelevance: string
  testingCoaRelevance: string
  packagingLabellingRelevance: string
  facilityEnvironmentSecurityRelevance: string
  knownBottlenecks: string[]
  commercialRelevance: string
  harbourviewSupportAvailability: string
  complianceTags: string[]
  relatedExplainers: string[]
  disclaimer: string
}

export type ComplianceExplainer = {
  slug: string
  title: string
  summary: string
  whoItAppliesTo: string[]
  commercialRelevance: string
  coreRequirements: string[]
  documentsUsuallyInvolved: string[]
  operationalControls: string[]
  commonFailurePoints: string[]
  countryVariation: string
  harbourviewCanScreen: string[]
  specialistAdviceRequired: string
  relatedCountries: string[]
  relatedServiceCategories: string[]
  disclaimer: string
}

export type ComplianceServiceCategory = {
  slug: string
  name: string
  whoItHelps: string
  typicalIssues: string[]
  relatedRegions: ComplianceRegionSlug[]
  ctaHref: string
}

export type ComplianceProduct = {
  slug: string
  name: string
  summary: string
  bestFor: string
  output: string
  riskControls: string[]
  ctaLabel: string
  ctaHref: string
}
