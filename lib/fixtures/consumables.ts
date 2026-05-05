import type { Listing, ListingImage } from './types'

const representativeCaption =
  'Representative operating-supplies category image. Specifications, supplier fit and commercial terms are available upon inquiry.'

const consumablesImageMap: Record<string, ListingImage> = {
  'cons-001': { src: '/marketplace/consumables/02-mylar-pouches.webp', alt: 'Unbranded child-resistant mylar pouches arranged in a studio product shot', status: 'representative', caption: representativeCaption, assetSource: 'generated' },
  'cons-002': { src: '/marketplace/consumables/08-labels-and-tamper-seals.webp', alt: 'Unbranded lab and QA supply materials shown in a studio product shot', status: 'representative', caption: representativeCaption, assetSource: 'generated' },
  'cons-003': { src: '/marketplace/consumables/09-facility-supplies.webp', alt: 'Unbranded cultivation supplies shown in a studio product shot', status: 'representative', caption: representativeCaption, assetSource: 'generated' },
  'cons-004': { src: '/marketplace/consumables/09-facility-supplies.webp', alt: 'Unbranded processing room consumables shown in a studio product shot', status: 'representative', caption: representativeCaption, assetSource: 'generated' },
  'cons-005': { src: '/marketplace/consumables/09-facility-supplies.webp', alt: 'Unbranded sanitation and PPE supplies shown in a studio product shot', status: 'representative', caption: representativeCaption, assetSource: 'generated' },
  'cons-006': { src: '/marketplace/consumables/10-shipping-cartons-and-bundles.webp', alt: 'Unbranded shipping cartons and warehouse supplies shown in a studio product shot', status: 'representative', caption: representativeCaption, assetSource: 'generated' },
  'cons-007': { src: '/marketplace/consumables/02-mylar-pouches.webp', alt: 'Unbranded retail and dispensary operating supplies shown in a studio product shot', status: 'representative', caption: representativeCaption, assetSource: 'generated' },
  'cons-008': { src: '/marketplace/consumables/10-shipping-cartons-and-bundles.webp', alt: 'Unbranded facility maintenance supplies shown in a studio product shot', status: 'representative', caption: representativeCaption, assetSource: 'generated' },
}

function withRepresentativeImage(listing: Listing): Listing {
  return { ...listing, image: consumablesImageMap[listing.id] }
}

const common = {
  price: 'Price on request',
  location: 'Region confirmed by inquiry',
  postedDate: '2026-05-05',
  contactEmail: 'harbourviewcompany@gmail.com',
}

export const consumables: Listing[] = [
  {
    id: 'cons-001',
    title: 'Child-Resistant Mylar Pouches — 1oz, 3.5g & 7g Formats',
    description:
      'Bulk supply of child-resistant resealable mylar pouches across 1oz, 3.5g and 7g formats. Plain and custom-print options available. Minimum order quantities and per-unit pricing reviewed by volume. Sample quantities available before commitment. Suitable for operators sourcing 25,000+ units on a recurring cadence.',
    tags: ['Packaging', 'Child-Resistant', 'Mylar Pouches', 'Custom Print', 'Inquiry Required'],
    ...common,
  },
  {
    id: 'cons-002',
    title: 'Ongoing Lab & QA Consumables — Testing Supplies & Sample Containers',
    description:
      'Recurring supply of lab and quality assurance consumables for licensed operators maintaining active QA programs. Covers testing-grade sample containers, certified labware, tamper-evident bags, documentation materials and compliance labels. Volume and SKU mix reviewed by inquiry. Operator pricing available on standing-order commitments.',
    tags: ['Lab & QA', 'Testing Supplies', 'Recurring Program', 'Compliance', 'Inquiry Required'],
    ...common,
  },
  {
    id: 'cons-003',
    title: 'Cultivation Inputs — Nutrients, Grow Media & Facility Supplies',
    description:
      'Supply of cultivation operating inputs for licensed indoor and greenhouse operators. Covers base nutrients and supplements, coco and peat media, pH and EC management supplies, monitoring consumables and recurring facility materials. Seasonal and annualised supply programs available. Volume, SKU mix and delivery region reviewed by inquiry.',
    tags: ['Cultivation', 'Nutrients', 'Grow Media', 'Indoor & Greenhouse', 'Inquiry Required'],
    ...common,
  },
  {
    id: 'cons-004',
    title: 'Processing Room Consumables — Extraction-Compatible Materials',
    description:
      'Processing and extraction room consumables for licensed production facilities. Covers extraction-compatible collection bags, solvent-resistant liners, disposable gloves and sleeves, sample containers, terpene storage vials and general lab disposables. Compatible with CO₂ and ethanol extraction workflows. Supply quantities, specifications and format requirements reviewed by inquiry.',
    tags: ['Processing', 'Extraction', 'Lab Disposables', 'CO₂ & Ethanol Compatible', 'Inquiry Required'],
    ...common,
  },
  {
    id: 'cons-005',
    title: 'Sanitation & PPE Replenishment — Commercial Facility Program',
    description:
      'Monthly and quarterly sanitation and PPE replenishment for cannabis production and retail facilities. Covers facility-grade cleaning agents, disinfectants, nitrile gloves, masks and respirators, eye protection, floor maintenance supplies and compliance-relevant hygiene products. Multi-site operator pricing available. Volume and delivery cadence reviewed by inquiry.',
    tags: ['Sanitation', 'PPE', 'Facility Compliance', 'Recurring Supply', 'Inquiry Required'],
    ...common,
  },
  {
    id: 'cons-006',
    title: 'Corrugated Cartons & Warehouse Consumables — Pallet-Quantity Supply',
    description:
      'Bulk supply of corrugated shipping cartons, poly bags, stretch wrap, void fill, carton tape and pallet goods for licensed cannabis operators. Pallet-quantity minimums. Regional delivery and freight terms reviewed by inquiry. Suitable for distribution, fulfilment and warehousing operations sourcing at consistent volume.',
    tags: ['Logistics', 'Shipping Cartons', 'Warehouse Supply', 'Bulk Pricing', 'Inquiry Required'],
    ...common,
  },
  {
    id: 'cons-007',
    title: 'Retail & Dispensary Operating Supplies — Bags, Labels & Compliance Materials',
    description:
      'Recurring operating supplies for licensed cannabis retailers and dispensaries. Covers exit bags, child-resistant packaging, compliance labels by jurisdiction, receipt rolls, point-of-sale consumables and branded display materials. Multi-location operator pricing available. Compliance label formats and jurisdictional requirements reviewed before supply introduction.',
    tags: ['Retail', 'Dispensary', 'Exit Bags', 'Compliance Labels', 'Multi-Location', 'Inquiry Required'],
    ...common,
  },
  {
    id: 'cons-008',
    title: 'Facility Maintenance Supply — Multi-Site Replenishment Program',
    description:
      'Maintenance and facility upkeep supply for commercial cannabis operations across single and multi-site footprints. Covers cleaning agents, lubricants, replacement filters and belts, electrical consumables, lighting, safety signage and general maintenance materials. Standing-order programs with scheduled delivery available. SKU requirements and site count reviewed by inquiry.',
    tags: ['Maintenance', 'Facility Upkeep', 'Multi-Site', 'Safety Supplies', 'Inquiry Required'],
    ...common,
  },
].map(withRepresentativeImage)
