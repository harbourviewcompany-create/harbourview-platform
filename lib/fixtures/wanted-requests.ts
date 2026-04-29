import type { WantedRequest } from './types'

export const wantedRequests: WantedRequest[] = [
  {
    id: 'wr-001',
    category: 'wanted-requests',
    title: 'Seeking: Commercial CO₂ or Ethanol Extraction System',
    description:
      'Established processor in Nevada is looking for a commercial extraction system — CO₂ (5L+) or ethanol (50L+ capacity). New or lightly used. Must include full documentation and be available for inspection prior to purchase.',
    budget: 'Up to $80,000',
    urgency: 'within-30-days',
    location: 'Nevada',
    tags: ['extraction', 'processing equipment', 'wanted'],
    postedDate: '2026-04-19',
    contactEmail: 'listings@harbourview.com',
  },
  {
    id: 'wr-002',
    category: 'wanted-requests',
    title: 'Wanted: Bulk Packaging Materials — Mylar Pouches',
    description:
      'High-volume dispensary group seeking bulk supply of 1oz and 3.5g mylar resealable pouches with child-resistant zip. Minimum 50,000 units. Must be compliant with Michigan packaging regulations. Requesting samples before order.',
    budget: 'Up to $0.12 per unit at volume',
    urgency: 'asap',
    location: 'Michigan',
    tags: ['packaging', 'mylar', 'child-resistant', 'bulk'],
    postedDate: '2026-04-20',
    contactEmail: 'listings@harbourview.com',
  },
  {
    id: 'wr-003',
    category: 'wanted-requests',
    title: 'Looking For: Dispensary POS System — Used or Refurbished',
    description:
      'Single-location retail operator looking for a used or refurbished dispensary POS system with current compliance integrations. Preferred: BioTrack or Metrc integration. Budget-conscious — open to leasing arrangements.',
    budget: '$3,000–$8,000',
    urgency: 'flexible',
    location: 'Illinois',
    tags: ['POS', 'technology', 'dispensary', 'Metrc'],
    postedDate: '2026-04-15',
    contactEmail: 'listings@harbourview.com',
  },
  {
    id: 'wr-004',
    category: 'wanted-requests',
    title: 'Seeking: Indoor Cultivation Facility — 5,000–15,000 sq ft',
    description:
      'Licensed cultivation operator expanding operations in Colorado. Looking for an existing indoor grow facility — purpose-built preferred, warehouse conversion acceptable. Must have adequate power (400A+) and existing HVAC infrastructure.',
    budget: 'Up to $8,000/mo lease or purchase',
    urgency: 'within-30-days',
    location: 'Colorado',
    tags: ['facility', 'real estate', 'cultivation', 'lease'],
    postedDate: '2026-04-23',
    contactEmail: 'listings@harbourview.com',
  },
]
