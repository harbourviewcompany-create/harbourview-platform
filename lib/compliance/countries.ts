import type { ComplianceCountry } from './types'
import { countryComplianceDisclaimer, fallbackCountrySummary } from './disclaimers'

function baseCountry(country: string, slug: string, region: ComplianceCountry['region']): ComplianceCountry {
  return {
    slug,
    country,
    region,
    maturityLevel: 'basic_orientation',
    reviewStatus: 'draft',
    sourceConfidence: 'low',
    lastReviewed: '2026-05-05',
    regulatoryBodies: [],
    pathwaySummary: fallbackCountrySummary,
    importExportRelevance: 'Import/export pathways require jurisdiction-specific confirmation and specialist review.',
    cultivationManufacturingRelevance: 'Cultivation and manufacturing permissions vary significantly and must be verified locally.',
    gmpGacpGdpRelevance: 'GMP, GACP and GDP relevance depends on intended commercial pathway and jurisdiction requirements.',
    testingCoaRelevance: 'Testing and COA expectations are regulator-specific and must be validated before commercial use.',
    packagingLabellingRelevance: 'Packaging and labelling rules vary and may include strict medical or controlled-substance requirements.',
    facilityEnvironmentSecurityRelevance: 'Facility, environmental and security compliance requirements vary by jurisdiction and activity.',
    knownBottlenecks: ['Licensing clarity', 'Documentation readiness', 'Regulator approval timelines'],
    commercialRelevance: 'Commercial viability depends on regulatory clarity, documentation readiness and partner alignment.',
    harbourviewSupportAvailability: 'Assessment available on request',
    complianceTags: ['market-entry', 'import-export', 'documentation'],
    relatedExplainers: ['import-export', 'eu-gmp'],
    disclaimer: countryComplianceDisclaimer,
  }
}

export const complianceCountries: ComplianceCountry[] = [
  // Europe
  baseCountry('Germany', 'germany', 'europe'),
  baseCountry('Netherlands', 'netherlands', 'europe'),
  baseCountry('France', 'france', 'europe'),
  baseCountry('Portugal', 'portugal', 'europe'),
  baseCountry('Spain', 'spain', 'europe'),
  baseCountry('Poland', 'poland', 'europe'),
  baseCountry('Czechia', 'czechia', 'europe'),
  baseCountry('Denmark', 'denmark', 'europe'),
  baseCountry('Malta', 'malta', 'europe'),
  baseCountry('Ireland', 'ireland', 'europe'),
  baseCountry('United Kingdom', 'united-kingdom', 'europe'),
  baseCountry('Switzerland', 'switzerland', 'europe'),
  baseCountry('Greece', 'greece', 'europe'),
  baseCountry('Italy', 'italy', 'europe'),
  baseCountry('Luxembourg', 'luxembourg', 'europe'),
  baseCountry('North Macedonia', 'north-macedonia', 'europe'),

  // North America
  baseCountry('Canada', 'canada', 'north-america'),
  baseCountry('United States', 'united-states', 'north-america'),
  baseCountry('Mexico', 'mexico', 'north-america'),

  // Caribbean
  baseCountry('Jamaica', 'jamaica', 'caribbean'),
  baseCountry('Barbados', 'barbados', 'caribbean'),
  baseCountry('St. Vincent and the Grenadines', 'st-vincent-and-the-grenadines', 'caribbean'),
  baseCountry('Trinidad and Tobago', 'trinidad-and-tobago', 'caribbean'),
  baseCountry('Antigua and Barbuda', 'antigua-and-barbuda', 'caribbean'),
  baseCountry('Bermuda', 'bermuda', 'caribbean'),
  baseCountry('Cayman Islands', 'cayman-islands', 'caribbean'),

  // Latin America
  baseCountry('Brazil', 'brazil', 'latin-america'),
  baseCountry('Colombia', 'colombia', 'latin-america'),
  baseCountry('Argentina', 'argentina', 'latin-america'),
  baseCountry('Uruguay', 'uruguay', 'latin-america'),
  baseCountry('Chile', 'chile', 'latin-america'),
  baseCountry('Peru', 'peru', 'latin-america'),
  baseCountry('Ecuador', 'ecuador', 'latin-america'),
  baseCountry('Paraguay', 'paraguay', 'latin-america'),
  baseCountry('Costa Rica', 'costa-rica', 'latin-america'),
  baseCountry('Panama', 'panama', 'latin-america'),

  // Africa
  baseCountry('South Africa', 'south-africa', 'africa'),
  baseCountry('Morocco', 'morocco', 'africa'),
  baseCountry('Lesotho', 'lesotho', 'africa'),
  baseCountry('Zimbabwe', 'zimbabwe', 'africa'),
  baseCountry('Uganda', 'uganda', 'africa'),
  baseCountry('Rwanda', 'rwanda', 'africa'),
  baseCountry('Ghana', 'ghana', 'africa'),
  baseCountry('Malawi', 'malawi', 'africa'),

  // Middle East
  baseCountry('Israel', 'israel', 'middle-east'),

  // Asia-Pacific
  baseCountry('Australia', 'australia', 'asia-pacific'),
  baseCountry('New Zealand', 'new-zealand', 'asia-pacific'),
  baseCountry('Thailand', 'thailand', 'asia-pacific'),
  baseCountry('Japan', 'japan', 'asia-pacific'),
  baseCountry('South Korea', 'south-korea', 'asia-pacific'),
  baseCountry('Singapore', 'singapore', 'asia-pacific'),
  baseCountry('Malaysia', 'malaysia', 'asia-pacific'),
  baseCountry('India', 'india', 'asia-pacific'),
]

export function getComplianceCountry(slug: string) {
  return complianceCountries.find((c) => c.slug === slug)
}
