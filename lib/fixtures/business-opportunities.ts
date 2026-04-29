import type { BusinessOpportunity } from './types'

export const businessOpportunities: BusinessOpportunity[] = [
  {
    id: 'bo-001',
    category: 'business-opportunities',
    title: 'Licensed Adult-Use Dispensary — Transfer Available',
    description:
      'Single-location adult-use retail dispensary in a suburban Michigan market. Existing license, lease, and operational fit-out available for qualified buyer. Current average monthly revenue disclosed under NDA. Reason for sale: owner retirement.',
    opportunityType: 'license-transfer',
    licenseType: 'Adult-Use Retail',
    state: 'Michigan',
    price: 'POA — NDA required',
    location: 'Greater Detroit, MI',
    tags: ['dispensary', 'retail', 'license transfer', 'Michigan'],
    postedDate: '2026-04-16',
    contactEmail: 'listings@harbourview.com',
  },
  {
    id: 'bo-002',
    category: 'business-opportunities',
    title: 'Indoor Cultivation Facility — Commercial Lease Available',
    description:
      '12,000 sq ft purpose-built indoor cultivation facility with full electrical infrastructure (800A service), existing HVAC zones, and irrigation system in place. Available for lease to licensed cultivators. Clean condition, previous operator relocated out of state.',
    opportunityType: 'lease',
    state: 'Colorado',
    price: '$9,500/month',
    location: 'Denver Metro, CO',
    tags: ['cultivation', 'facility', 'lease', 'Colorado'],
    postedDate: '2026-04-13',
    contactEmail: 'listings@harbourview.com',
  },
  {
    id: 'bo-003',
    category: 'business-opportunities',
    title: 'Extraction & Processing License — Partnership Sought',
    description:
      'Established extraction license holder in California seeking an operating partner with capital and equipment to activate a dormant processing license. License in good standing. Ideal for an operator looking to enter the CA market without a full licensing process.',
    opportunityType: 'partnership',
    licenseType: 'Type 7 — Volatile Manufacturing',
    state: 'California',
    price: 'POA — equity structure to be negotiated',
    location: 'Southern California',
    tags: ['extraction', 'license', 'partnership', 'California'],
    postedDate: '2026-04-11',
    contactEmail: 'listings@harbourview.com',
  },
  {
    id: 'bo-004',
    category: 'business-opportunities',
    title: 'Cannabis Distribution Company — Acquisition Opportunity',
    description:
      'Independent cannabis distribution business operating in Nevada with existing retail accounts, licensed fleet, and trained staff. Seller is consolidating interests. Full financials available under NDA to verified buyers.',
    opportunityType: 'acquisition',
    licenseType: 'Distribution',
    state: 'Nevada',
    price: 'POA — verified buyers only',
    location: 'Las Vegas, NV',
    tags: ['distribution', 'acquisition', 'Nevada', 'fleet'],
    postedDate: '2026-04-08',
    contactEmail: 'listings@harbourview.com',
  },
]
