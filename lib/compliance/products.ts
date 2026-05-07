import type { ComplianceProduct } from './types'

export const complianceProducts: ComplianceProduct[] = [
  {
    slug: 'country-snapshot',
    name: 'Country Compliance Snapshot',
    summary: 'Structured overview of compliance requirements for a target country.',
    bestFor: 'Initial market screening',
    output: 'Summary report',
    riskControls: ['No legal advice','Source-based orientation'],
    ctaLabel: 'Request Snapshot',
    ctaHref: '/compliance/request-support',
  },
  {
    slug: 'market-entry-brief',
    name: 'Market Entry Compliance Brief',
    summary: 'Deeper compliance and documentation overview for market entry.',
    bestFor: 'Operators preparing entry',
    output: 'Detailed brief',
    riskControls: ['No guarantees','Specialist confirmation required'],
    ctaLabel: 'Request Brief',
    ctaHref: '/compliance/request-support',
  },
]
