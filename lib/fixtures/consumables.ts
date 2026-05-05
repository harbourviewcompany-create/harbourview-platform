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
    title: 'Bulk Packaging Supply Programs',
    description:
      'Inquiry-first packaging supply programs for operators sourcing pouches, labels, cartons or recurring packaging inputs at commercial volume.',
    tags: ['Packaging', 'Supplier Qualification Required', 'Bulk supply category', 'Inquiry Required'],
    ...common,
  },
  {
    id: 'cons-002',
    title: 'Recurring Lab & QA Consumables',
    description:
      'Recurring lab and QA consumables for operators that need specification review, replenishment planning and supplier qualification before quote routing.',
    tags: ['Lab & QA Supplies', 'Specifications available upon inquiry', 'Inquiry Required'],
    ...common,
  },
  {
    id: 'cons-003',
    title: 'Cultivation Operating Supplies',
    description:
      'Operating supply categories for cultivation teams sourcing facility materials, routine inputs or recurring support supplies through reviewed inquiry.',
    tags: ['Cultivation Supplies', 'Operating supplies category', 'Inquiry Required'],
    ...common,
  },
  {
    id: 'cons-004',
    title: 'Processing Room Consumables',
    description:
      'Processing-room consumables for production workflows where quantity, specifications, region and supplier fit need private review before routing.',
    tags: ['Processing Supplies', 'Supplier Qualification Required', 'Inquiry Required'],
    ...common,
  },
  {
    id: 'cons-005',
    title: 'Sanitation & PPE Replenishment',
    description:
      'Sanitation, facility and PPE replenishment categories for teams coordinating specifications, volume, destination and supplier fit by inquiry.',
    tags: ['Sanitation & PPE', 'Operating supplies category', 'Inquiry Required'],
    ...common,
  },
  {
    id: 'cons-006',
    title: 'Logistics & Warehouse Supplies',
    description:
      'Storage, shipping, handling and warehouse supply categories for commercial operators coordinating bulk requirements through reviewed intake.',
    tags: ['Logistics & Warehouse Supplies', 'Bulk supply category', 'Inquiry Required'],
    ...common,
  },
  {
    id: 'cons-007',
    title: 'Retail Operating Supplies',
    description:
      'Retail support materials and recurring operating supplies for storefront or distribution teams seeking private supplier qualification before quote.',
    tags: ['Retail Supplies', 'Specifications available upon inquiry', 'Inquiry Required'],
    ...common,
  },
  {
    id: 'cons-008',
    title: 'Maintenance Consumables Supply',
    description:
      'Maintenance, facility upkeep and routine replenishment supply categories for commercial sites coordinating specifications and availability by inquiry.',
    tags: ['Maintenance Consumables', 'Specifications available upon inquiry', 'Inquiry Required'],
    ...common,
  },
].map(withRepresentativeImage)
