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
      'Recurring bulk packaging supply for cannabis operators. Pouches, jars, tubes, exit bags, tamper seals and branded packaging formats available through inquiry-first supplier qualification. Volume, specification, format and region are confirmed before supplier introduction.',
    tags: ['Packaging', 'Bulk Programs', 'Inquiry Required'],
    ...common,
  },
  {
    id: 'cons-002',
    title: 'Recurring Lab & QA Consumables',
    description:
      'Lab and quality assurance consumable supply for licensed operators. Testing supplies, sample containers, labware, documentation materials and recurring QA inputs sourced through screened supplier qualification. Specifications and volumes are handled by inquiry.',
    tags: ['Lab & QA', 'Recurring Supply', 'Inquiry Required'],
    ...common,
  },
  {
    id: 'cons-003',
    title: 'Cultivation Operating Supplies',
    description:
      'Cultivation inputs and facility materials for licensed growing operations. Nutrients, growing media, monitoring supplies, facility consumables and seasonal inputs sourced through inquiry-first supplier qualification. Volume, timing and specification are confirmed before routing.',
    tags: ['Cultivation', 'Operating Supplies', 'Inquiry Required'],
    ...common,
  },
  {
    id: 'cons-004',
    title: 'Processing Room Consumables',
    description:
      'Consumables for cannabis processing and production environments. Extraction-compatible materials, processing aids, containment supplies and facility consumables available through screened supplier qualification. Supplier fit and specifications are handled by inquiry.',
    tags: ['Processing', 'Production Supplies', 'Inquiry Required'],
    ...common,
  },
  {
    id: 'cons-005',
    title: 'Sanitation & PPE Replenishment',
    description:
      'Sanitation, hygiene and personal protective equipment for cannabis facility operations. Recurring replenishment programs for cleaning supplies, PPE, facility hygiene products and compliance-relevant materials sourced through inquiry-first qualification.',
    tags: ['Sanitation', 'PPE', 'Facility Compliance', 'Inquiry Required'],
    ...common,
  },
  {
    id: 'cons-006',
    title: 'Logistics & Warehouse Supplies',
    description:
      'Logistics, storage and warehouse supply programs for cannabis operators. Cartons, pallets, handling materials, climate-control packaging and inbound/outbound supply chain consumables handled through screened supplier qualification. Volume and region confirmed by inquiry.',
    tags: ['Logistics', 'Warehouse', 'Supply Chain', 'Inquiry Required'],
    ...common,
  },
  {
    id: 'cons-007',
    title: 'Retail Operating Supplies',
    description:
      'Retail support materials and point-of-sale consumables for licensed cannabis retailers. Display materials, bags, receipts, compliance labels, customer-facing packaging and recurring retail supply needs sourced through inquiry-first supplier qualification.',
    tags: ['Retail', 'Point of Sale', 'Operating Supplies', 'Inquiry Required'],
    ...common,
  },
  {
    id: 'cons-008',
    title: 'Maintenance Consumables Supply',
    description:
      'Maintenance, facility upkeep and routine replenishment supply for cannabis operations. Replacement parts, cleaning agents, lubricants, safety supplies and recurring maintenance materials sourced through screened supplier qualification. Specifications reviewed privately.',
    tags: ['Maintenance', 'Facility Upkeep', 'Recurring Supply', 'Inquiry Required'],
    ...common,
  },
].map(withRepresentativeImage)
