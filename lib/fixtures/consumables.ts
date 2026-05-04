import type { Listing, ListingImage } from './types'

const representativeCaption =
  'Representative operating-supplies category image. Specifications, supplier fit and commercial terms are available upon inquiry.'

const consumablesImageMap: Record<string, ListingImage> = {
  'cons-001': { src: '/marketplace/consumables/02-mylar-pouches.webp', alt: 'Unbranded packaging supplies arranged in a studio product shot', status: 'representative', caption: representativeCaption, assetSource: 'generated' },
  'cons-002': { src: '/marketplace/consumables/08-labels-and-tamper-seals.webp', alt: 'Unbranded lab and QA supply materials shown in a studio product shot', status: 'representative', caption: representativeCaption, assetSource: 'generated' },
  'cons-003': { src: '/marketplace/consumables/09-facility-supplies.webp', alt: 'Unbranded cultivation operating supplies shown in a studio product shot', status: 'representative', caption: representativeCaption, assetSource: 'generated' },
  'cons-004': { src: '/marketplace/consumables/09-facility-supplies.webp', alt: 'Unbranded processing operating supplies shown in a studio product shot', status: 'representative', caption: representativeCaption, assetSource: 'generated' },
  'cons-005': { src: '/marketplace/consumables/09-facility-supplies.webp', alt: 'Unbranded sanitation and PPE supplies shown in a studio product shot', status: 'representative', caption: representativeCaption, assetSource: 'generated' },
  'cons-006': { src: '/marketplace/consumables/10-shipping-cartons-and-bundles.webp', alt: 'Unbranded warehouse and logistics supplies shown in a studio product shot', status: 'representative', caption: representativeCaption, assetSource: 'generated' },
  'cons-007': { src: '/marketplace/consumables/02-mylar-pouches.webp', alt: 'Unbranded retail supply materials shown in a studio product shot', status: 'representative', caption: representativeCaption, assetSource: 'generated' },
  'cons-008': { src: '/marketplace/consumables/10-shipping-cartons-and-bundles.webp', alt: 'Unbranded maintenance consumables shown in a studio product shot', status: 'representative', caption: representativeCaption, assetSource: 'generated' },
}

function withRepresentativeImage(listing: Listing): Listing {
  return { ...listing, image: consumablesImageMap[listing.id] }
}

const common = {
  price: 'Inquiry Required',
  location: 'Region available upon inquiry',
  postedDate: '2026-05-04',
  contactEmail: 'harbourviewcompany@gmail.com',
}

export const consumables: Listing[] = [
  {
    id: 'cons-001',
    title: 'Packaging Supply Category',
    description:
      'Operating supplies category for packaging programs. Specifications, quantity, region, supplier fit and commercial terms are available upon inquiry.',
    tags: ['Packaging', 'Supplier Qualification Required', 'Bulk supply category'],
    ...common,
  },
  {
    id: 'cons-002',
    title: 'Lab & QA Supplies Category',
    description:
      'Operating supplies category for lab and quality workflows. Harbourview routes inquiries for specification review and supplier qualification before introduction.',
    tags: ['Lab & QA Supplies', 'Specifications available upon inquiry'],
    ...common,
  },
  {
    id: 'cons-003',
    title: 'Cultivation Supplies Category',
    description:
      'Operating supplies category for cultivation teams seeking recurring inputs, facility materials or qualified supply options. Inquiry review is required.',
    tags: ['Cultivation Supplies', 'Inquiry Required'],
    ...common,
  },
  {
    id: 'cons-004',
    title: 'Processing Supplies Category',
    description:
      'Operating supplies category for production and processing workflows. Supplier qualification, quantity, specifications and region are handled by inquiry.',
    tags: ['Processing Supplies', 'Supplier Qualification Required'],
    ...common,
  },
  {
    id: 'cons-005',
    title: 'Sanitation & PPE Category',
    description:
      'Operating supplies category for sanitation, facility and PPE programs. Specifications, volume, destination and supplier fit are available upon inquiry.',
    tags: ['Sanitation & PPE', 'Operating supplies category'],
    ...common,
  },
  {
    id: 'cons-006',
    title: 'Logistics & Warehouse Supplies Category',
    description:
      'Operating supplies category for storage, shipping, handling and warehouse requirements. Harbourview reviews inquiries before supplier routing.',
    tags: ['Logistics & Warehouse Supplies', 'Bulk supply category'],
    ...common,
  },
  {
    id: 'cons-007',
    title: 'Retail Supplies Category',
    description:
      'Operating supplies category for retail support materials and recurring supply needs. Commercial terms and supplier options are available upon inquiry.',
    tags: ['Retail Supplies', 'Inquiry Required'],
    ...common,
  },
  {
    id: 'cons-008',
    title: 'Maintenance Consumables Category',
    description:
      'Operating supplies category for maintenance, facility upkeep and routine replenishment. Supplier qualification and specifications are reviewed privately.',
    tags: ['Maintenance Consumables', 'Specifications available upon inquiry'],
    ...common,
  },
].map(withRepresentativeImage)
