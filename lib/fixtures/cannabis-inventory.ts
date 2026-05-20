import type { CannabisInventoryListing } from './types'

export const cannabisInventoryListings: CannabisInventoryListing[] = [
  {
    id: 'ci-005',
    category: 'cannabis-inventory',
    title: 'GMP Bulk Cannabis Extract — Canadian LP, 10–50kg Per Lot, Licensed Importers',
    description:
      'GMP-certified cannabis extract produced by a licensed Canadian LP under Health Canada oversight, available for licensed operators in eligible medical markets. 10kg minimum per lot, up to 50kg available per lot. Certificate of analysis, GMP documentation and permit-support documentation are reviewed before any counterparty introduction. Suitable for licensed importers and cannabis operators holding applicable national import licences. Import compliance is the responsibility of the receiving party. Introductions managed through Harbourview — import licence verification required before introduction.',
    price: 'POA',
    weightAvailable: '10kg minimum, up to 50kg per lot',
    licenseRequired: true,
    location: 'Ontario, Canada',
    tags: ['Extract', 'GMP', 'Licensed Importers', 'Canadian LP', 'Bulk', 'Inquiry Required'],
    postedDate: '2026-05-05',
  },
  {
    id: 'ci-006',
    category: 'cannabis-inventory',
    title: 'EU-GMP Dried Flower — Licensed Producer, 5kg+ Per Cultivar, Licensed Importers',
    description:
      'EU-GMP-certified dried cannabis flower from a licensed producer, available for review by operators holding valid national import licences. Multiple cultivars available; 5kg minimum order per cultivar. COA and GMP documentation reviewed before any counterparty introduction. Suitable for licensed cannabis operators and importers in eligible medical markets with active import authorisation. Import compliance is the responsibility of the receiving party. Introductions managed through Harbourview — import licence verification required before introduction.',
    price: 'POA',
    weightAvailable: '5kg minimum per cultivar',
    licenseRequired: true,
    location: 'Germany',
    tags: ['Flower', 'GMP', 'EU-GMP', 'Import', 'Licensed Producer', 'Licensed Importers', 'Inquiry Required'],
    postedDate: '2026-05-05',
  },
  {
    id: 'ci-007',
    category: 'cannabis-inventory',
    title: 'Medical Cannabis Flower Lot Available — EU Market Pathway, Licensed Importers Only',
    description:
      'Public-safe review summary for a medical cannabis flower lot available for licensed importer review in eligible regulated medical markets. 5kg minimum lot review, with cultivar, COA, batch documentation, GMP scope and permit-support materials disclosed only after Harbourview review. Suitable for licensed importers assessing compliant supply options. Introductions managed through Harbourview — licence and jurisdiction review required before any counterparty routing.',
    price: 'POA',
    weightAvailable: '5kg minimum lot review',
    licenseRequired: true,
    location: 'EU pathway — location disclosed after review',
    tags: ['Flower', 'Medical Market', 'Licensed Importers', '5kg', 'Batch Documents', 'Inquiry Required'],
    postedDate: '2026-05-17',
  },
  {
    id: 'ci-008',
    category: 'cannabis-inventory',
    title: 'GMP Extract Input Available — International Medical Market, Licensed Operators',
    description:
      'Controlled public summary for GMP extract input available for licensed medical-market operators reviewing recurring supply or batch-based input needs. 10kg lot review, documentation scope, batch identifiers, release evidence and supplier details are held for private review only. Suitable for operators assessing regulated extract inputs for eligible jurisdictions. Introductions managed through Harbourview — licence verification and route review required before any commercial discussion.',
    price: 'POA',
    weightAvailable: '10kg lot review',
    licenseRequired: true,
    location: 'International medical market — reviewed routing',
    tags: ['Extract', 'GMP Review', 'Licensed Operators', '10kg', 'Recurring Supply', 'Inquiry Required'],
    postedDate: '2026-05-17',
  },
]
