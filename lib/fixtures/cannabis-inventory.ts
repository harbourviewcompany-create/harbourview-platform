import type { CannabisInventoryListing } from './types'

export const cannabisInventoryListings: CannabisInventoryListing[] = [
  {
    id: 'ci-001',
    category: 'cannabis-inventory',
    title: 'Premium Indoor Flower — Mixed Hybrid Lots',
    description:
      'Indoor-grown premium mixed hybrid flower available in 10lb and 25lb lots. Consistent cannabinoid profile, COA on file. Suitable for retail packaging or processing. For licensed dispensaries and processors only.',
    price: 'POA — minimum 10lb order',
    strain: 'Mixed hybrid',
    weightAvailable: '200lb available',
    licenseRequired: true,
    location: 'Michigan',
    tags: ['flower', 'indoor', 'wholesale', 'hybrid'],
    postedDate: '2026-04-17',
    contactEmail: 'listings@harbourview.com',
  },
  {
    id: 'ci-002',
    category: 'cannabis-inventory',
    title: 'CBD Hemp Biomass — Certified Organic',
    description:
      'USDA-certified organic hemp biomass, 14–18% CBD, <0.3% THC. Available in 100lb drum or bulk tote quantities. COA provided for every lot. Suitable for extraction operations. Priced per pound on volume.',
    price: 'From $25/lb',
    strain: 'Cherry Wine / Suver Haze',
    weightAvailable: '2,000lb available',
    licenseRequired: true,
    location: 'Colorado',
    tags: ['hemp', 'CBD', 'biomass', 'organic'],
    postedDate: '2026-04-13',
    contactEmail: 'listings@harbourview.com',
  },
  {
    id: 'ci-003',
    category: 'cannabis-inventory',
    title: 'Live Resin Concentrate — Wholesale Quantity',
    description:
      'High-terpene live resin produced from fresh-frozen input material. Available in 1g jars (wholesale case) and bulk gram quantities. Lab-tested, packaged in compliant containers. For licensed retailers and distributors.',
    price: 'POA — case pricing available',
    weightAvailable: '50lb equivalent',
    licenseRequired: true,
    location: 'California',
    tags: ['concentrate', 'live resin', 'wholesale', 'wholesale packaging'],
    postedDate: '2026-04-08',
    contactEmail: 'listings@harbourview.com',
  },
  {
    id: 'ci-004',
    category: 'cannabis-inventory',
    title: 'Feminised Hemp Seed — Certified Genetics',
    description:
      'Feminised hemp seed from state-certified genetics program. Stabilised variety with documented phenotype consistency. Suitable for outdoor, greenhouse, and indoor cultivation. Sold in lots of 1,000 seeds minimum.',
    price: '$1.20 / seed (1k minimum)',
    weightAvailable: '50,000 seeds available',
    licenseRequired: true,
    location: 'Oregon',
    tags: ['seed', 'genetics', 'hemp', 'feminised'],
    postedDate: '2026-04-22',
    contactEmail: 'listings@harbourview.com',
  },
]
