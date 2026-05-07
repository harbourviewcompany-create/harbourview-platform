import type { ComplianceCountry, ComplianceMaturityLevel, ComplianceRegionSlug, ComplianceReviewStatus, ComplianceSourceConfidence } from './types'
import { complianceCountries } from './countries'

export const maturityLabels: Record<ComplianceMaturityLevel, string> = {
  not_assessed: 'Not assessed',
  basic_orientation: 'Basic orientation',
  source_backed_summary: 'Source-backed summary',
  specialist_reviewed: 'Specialist review recommended',
  active_support_pathway: 'Support available by review',
  restricted_case_by_case: 'Restricted / case-by-case',
}

export const reviewStatusLabels: Record<ComplianceReviewStatus, string> = {
  draft: 'Draft orientation',
  reviewed: 'Reviewed',
  needs_update: 'Needs update',
  jurisdiction_changing: 'Jurisdiction changing',
}

export const confidenceLabels: Record<ComplianceSourceConfidence, string> = {
  low: 'Low source confidence',
  moderate: 'Moderate source confidence',
  high: 'High source confidence',
}

export function getCountriesByRegion(region: ComplianceRegionSlug) {
  return complianceCountries.filter((country) => country.region === region)
}

export function getCountryCountByRegion() {
  return complianceCountries.reduce<Record<string, number>>((acc, country) => {
    acc[country.region] = (acc[country.region] ?? 0) + 1
    return acc
  }, {})
}

export function getMaturityDistribution() {
  return complianceCountries.reduce<Record<string, number>>((acc, country) => {
    acc[country.maturityLevel] = (acc[country.maturityLevel] ?? 0) + 1
    return acc
  }, {})
}

export function toSafeCountry(country: ComplianceCountry) {
  return {
    slug: country.slug,
    country: country.country,
    region: country.region,
    maturityLevel: country.maturityLevel,
    reviewStatus: country.reviewStatus,
    sourceConfidence: country.sourceConfidence,
    lastReviewed: country.lastReviewed,
    regulatoryBodies: country.regulatoryBodies,
    pathwaySummary: country.pathwaySummary,
    importExportRelevance: country.importExportRelevance,
    cultivationManufacturingRelevance: country.cultivationManufacturingRelevance,
    gmpGacpGdpRelevance: country.gmpGacpGdpRelevance,
    testingCoaRelevance: country.testingCoaRelevance,
    packagingLabellingRelevance: country.packagingLabellingRelevance,
    facilityEnvironmentSecurityRelevance: country.facilityEnvironmentSecurityRelevance,
    knownBottlenecks: country.knownBottlenecks,
    commercialRelevance: country.commercialRelevance,
    harbourviewSupportAvailability: country.harbourviewSupportAvailability,
    complianceTags: country.complianceTags,
    relatedExplainers: country.relatedExplainers,
    disclaimer: country.disclaimer,
  }
}
