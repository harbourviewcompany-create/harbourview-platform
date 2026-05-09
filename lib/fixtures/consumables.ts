import type { Listing } from './types'
import { withRepresentativeImage } from './representativeImages'

const common = {
  price: 'Price on request',
  location: 'Region confirmed by inquiry',
  postedDate: '2026-05-05',
}

export const consumables: Listing[] = [
  {
    id: 'cons-001',
    title: 'Child-Resistant Mylar Pouches — 1oz, 3.5g & 7g Formats',
    description:
      'Bulk supply of child-resistant resealable mylar pouches across 1oz, 3.5g and 7g formats. Plain and custom-print options available. Minimum order quantities and per-unit pricing reviewed by volume. Sample quantities available before commitment. Suitable for licensed operators sourcing 25,000+ units on a recurring cadence. Inquiry required through Harbourview.',
    tags: ['Packaging', 'Child-Resistant', 'Mylar Pouches', 'Custom Print', 'Supplier Qualification Required', 'Inquiry Required'],
    ...common,
  },
  {
    id: 'cons-002',
    title: 'Ongoing Lab & QA Consumables — Testing Supplies & Sample Containers',
    description:
      'Recurring supply of lab and quality assurance consumables for licensed operators maintaining active QA programs. Covers testing-grade sample containers, certified labware, tamper-evident bags, documentation materials and compliance labels. Volume and SKU mix reviewed by inquiry. Operator pricing available on standing-order commitments for 1,000+ sample containers or equivalent monthly QA supply volume. Inquiry required through Harbourview.',
    tags: ['Lab & QA', 'Testing Supplies', 'Recurring Supply', 'Compliance', 'Licensed Operators', 'Inquiry Required'],
    ...common,
  },
  {
    id: 'cons-003',
    title: 'Cultivation Inputs — Nutrients, Grow Media & Facility Supplies',
    description:
      'Recurring supply of cultivation operating inputs for licensed operators, indoor cultivators and greenhouse operators. Covers base nutrients and supplements, coco and peat media, pH and EC management supplies, monitoring consumables and recurring facility materials. Seasonal and annualised supply programs available for multi-room cultivation sites and commercial-scale facilities. Volume, SKU mix and delivery region reviewed by inquiry. Inquiry required through Harbourview.',
    tags: ['Cultivation', 'Nutrients', 'Grow Media', 'Indoor & Greenhouse', 'Recurring Supply', 'Licensed Operators', 'Commercial Scale', 'Inquiry Required'],
    ...common,
  },
  {
    id: 'cons-004',
    title: 'Processing Room Consumables — Extraction-Compatible Materials',
    description:
      'Recurring supply of processing and extraction room consumables for licensed production facilities. Covers extraction-compatible collection bags, solvent-resistant liners, disposable gloves and sleeves, sample containers, terpene storage vials and general lab disposables. Compatible with CO₂ and ethanol extraction workflows. Supply quantities, specifications and format requirements reviewed by inquiry for commercial volume programs. Inquiry required through Harbourview.',
    tags: ['Processing', 'Extraction', 'Licensed Operators', 'Recurring Supply', 'Commercial Volume', 'CO₂ & Ethanol Compatible', 'Inquiry Required'],
    ...common,
  },
  {
    id: 'cons-005',
    title: 'Sanitation & PPE Replenishment — Commercial Facility Program',
    description:
      'Monthly and quarterly sanitation and PPE replenishment for licensed cannabis production and retail facilities. Covers facility-grade cleaning agents, disinfectants, nitrile gloves, masks and respirators, eye protection, floor maintenance supplies and compliance-relevant hygiene products. Multi-site operator pricing available for 10+ recurring SKUs. Volume and delivery cadence reviewed by inquiry. Inquiry required through Harbourview.',
    tags: ['Sanitation', 'PPE', 'Facility Compliance', 'Recurring Supply', 'Licensed Operators', 'Multi-Site', 'Inquiry Required'],
    ...common,
  },
  {
    id: 'cons-006',
    title: 'Corrugated Cartons & Warehouse Consumables — Pallet-Quantity Supply',
    description:
      'Bulk supply of corrugated shipping cartons, poly bags, stretch wrap, void fill, carton tape and pallet goods for licensed cannabis operators. Pallet-quantity minimums. Regional delivery and freight terms reviewed by inquiry. Suitable for distribution, fulfilment and warehousing operations sourcing at consistent volume. Inquiry required through Harbourview.',
    tags: ['Logistics', 'Shipping Cartons', 'Warehouse Supply', 'Bulk Pricing', 'Licensed Operators', 'Inquiry Required'],
    ...common,
  },
  {
    id: 'cons-007',
    title: 'Retail & Dispensary Operating Supplies — Bags, Labels & Compliance Materials',
    description:
      'Recurring operating supplies for licensed cannabis retailers and dispensaries. Covers exit bags, child-resistant packaging, compliance labels by jurisdiction, receipt rolls, point-of-sale consumables and branded display materials. Multi-location operator pricing available. Compliance label formats and jurisdictional requirements reviewed before supply introduction. Inquiry required through Harbourview.',
    tags: ['Retail', 'Dispensary', 'Exit Bags', 'Compliance Labels', 'Multi-Location', 'Recurring Supply', 'Inquiry Required'],
    ...common,
  },
  {
    id: 'cons-008',
    title: 'Facility Maintenance Supply — Multi-Site Replenishment Program',
    description:
      'Standing-order maintenance and facility upkeep supply for licensed cannabis operators across single and multi-site footprints. Covers cleaning agents, lubricants, replacement filters and belts, electrical consumables, lighting, safety signage and general maintenance materials. Standing-order programs with scheduled delivery available. SKU requirements and site count reviewed by inquiry for 10+ recurring SKUs. Inquiry required through Harbourview.',
    tags: ['Maintenance', 'Facility Upkeep', 'Licensed Operators', 'Multi-Site', 'Standing-Order', 'Safety Supplies', 'Inquiry Required'],
    ...common,
  },
].map(withRepresentativeImage)
