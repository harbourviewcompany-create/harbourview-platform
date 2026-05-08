import type { CannabisInventoryListing } from './types'

export const cannabisInventoryListings: CannabisInventoryListing[] = [
  {
    id: 'ci-001',
    category: 'cannabis-inventory',
    title: 'Premium Indoor Flower — 200lb Mixed Hybrid Lot Available, Licensed Dispensaries & Processors',
    description:
      'Indoor-grown premium mixed hybrid flower, 200lb available now in 10lb and 25lb lots. Bulk supply available for immediate order. Consistent cannabinoid profile, COA on file for every lot. Suitable for licensed dispensaries sourcing retail inventory and licensed processors sourcing extraction input. Minimum 10lb order. Inquiry required through Harbourview — licence verification required before introduction.',
    price: 'POA — minimum 10lb order',
    strain: 'Mixed hybrid',
    weightAvailable: '200lb available',
    licenseRequired: true,
    location: 'Michigan',
    tags: ['Flower', 'Indoor', 'Wholesale', 'Hybrid', 'Bulk Available', 'Inquiry Required'],
    postedDate: '2026-05-05',
  },
  {
    id: 'ci-002',
    category: 'cannabis-inventory',
    title: 'CBD Hemp Biomass — 2,000lb USDA Organic, Bulk Supply for Licensed Extraction Operators',
    description:
      'USDA-certified organic hemp biomass, 2,000lb available for bulk supply. 14–18% CBD, <0.3% THC. Available in 100lb drums or bulk totes. Bulk supply available for ongoing extraction programs and standing-order supply relationships. COA provided for every lot. Suitable for licensed extraction operators and processors with active hemp extract programs. Priced per pound on volume. Inquiry required through Harbourview — licence verification required before introduction.',
    price: 'Price on request',
    strain: 'Cherry Wine / Suver Haze',
    weightAvailable: '2,000lb available',
    licenseRequired: true,
    location: 'Colorado',
    tags: ['Hemp', 'CBD', 'Biomass', 'Organic', 'Bulk Supply', 'Inquiry Required'],
    postedDate: '2026-05-05',
  },
]
