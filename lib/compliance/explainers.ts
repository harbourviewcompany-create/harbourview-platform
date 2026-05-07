import type { ComplianceExplainer } from './types'
import { coreComplianceDisclaimer } from './disclaimers'

function baseExplainer(slug: string, title: string): ComplianceExplainer {
  return {
    slug,
    title,
    summary: 'Structured overview of requirements, documentation and operational controls.',
    whoItAppliesTo: ['Operators', 'Importers', 'Manufacturers', 'Compliance teams'],
    commercialRelevance: 'Critical for market entry, documentation acceptance and regulatory approval.',
    coreRequirements: ['Defined process controls', 'Documentation readiness', 'Traceability'],
    documentsUsuallyInvolved: ['SOPs', 'Batch records', 'Quality manuals'],
    operationalControls: ['Quality management systems', 'Record keeping'],
    commonFailurePoints: ['Incomplete documentation', 'Incorrect classification'],
    countryVariation: 'Requirements vary significantly by jurisdiction.',
    harbourviewCanScreen: ['Readiness', 'Documentation gaps'],
    specialistAdviceRequired: 'Jurisdiction-specific legal or regulatory advice required.',
    relatedCountries: [],
    relatedServiceCategories: [],
    disclaimer: coreComplianceDisclaimer,
  }
}

export const complianceExplainers: ComplianceExplainer[] = [
  baseExplainer('eu-gmp', 'EU GMP'),
  baseExplainer('gacp', 'GACP'),
  baseExplainer('gdp-distribution', 'GDP Distribution'),
  baseExplainer('import-export', 'Import and Export Documentation'),
  baseExplainer('facility-environment', 'Facility, Environment and Security Compliance'),
  baseExplainer('documentation-audit', 'Documentation and Audit Readiness'),
  baseExplainer('testing-coa', 'Testing, COA, Packaging and Labelling'),
]

export function getExplainer(slug: string) {
  return complianceExplainers.find((e) => e.slug === slug)
}
