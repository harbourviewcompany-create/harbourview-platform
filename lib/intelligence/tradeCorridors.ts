/**
 * Shared trade-corridor reference for logistics surfaces and the Phase 2 simulator.
 * Orientation-level only — no operator identities or commercial terms.
 */

export type ProductClass =
  | 'flower'
  | 'extract'
  | 'finished_product'
  | 'starting_material'
  | 'any'

export type ComplianceProfile =
  | 'eu_gmp'
  | 'intra_eu'
  | 'health_canada_export'
  | 'tga'
  | 'other'

export type TradeCorridor = {
  id: string
  from: string
  to: string
  label: string
  notes: string
  productClasses: ProductClass[]
  compliance: ComplianceProfile[]
  /** 1 = lower friction, 5 = higher friction / longer permit path */
  riskScore: 1 | 2 | 3 | 4 | 5
  riskLabel: string
}

export const TRADE_CORRIDORS: TradeCorridor[] = [
  {
    id: 'CA-DE',
    from: 'CA',
    to: 'DE',
    label: 'Canada → Germany',
    notes: 'EU-GMP required; Health Canada export licence; BfArM narcotics import permit.',
    productClasses: ['flower', 'extract', 'finished_product'],
    compliance: ['eu_gmp', 'health_canada_export'],
    riskScore: 3,
    riskLabel: 'Established medical corridor',
  },
  {
    id: 'CA-AU',
    from: 'CA',
    to: 'AU',
    label: 'Canada → Australia',
    notes: 'TGA ODC import permit; Health Canada export licence; Narcotic Drugs Act 1967.',
    productClasses: ['flower', 'extract', 'finished_product'],
    compliance: ['tga', 'health_canada_export'],
    riskScore: 3,
    riskLabel: 'Permit-intensive',
  },
  {
    id: 'CO-DE',
    from: 'CO',
    to: 'DE',
    label: 'Colombia → Germany',
    notes: 'INVIMA GMP + EU-GMP recognition; BfArM narcotics import permit; longest avg processing.',
    productClasses: ['flower', 'extract'],
    compliance: ['eu_gmp'],
    riskScore: 4,
    riskLabel: 'Long processing path',
  },
  {
    id: 'IL-DE',
    from: 'IL',
    to: 'DE',
    label: 'Israel → Germany',
    notes: 'IMCA export licence; EU-GMP equivalency decision delayed to Q4 2026 (EMA).',
    productClasses: ['flower', 'extract', 'finished_product'],
    compliance: ['eu_gmp'],
    riskScore: 4,
    riskLabel: 'Equivalency watch',
  },
  {
    id: 'ZA-DE',
    from: 'ZA',
    to: 'DE',
    label: 'South Africa → Germany',
    notes: 'SAHPRA export licence; EU-GMP pathway; permit fee increased ZAR 18,500 (Jan 2026).',
    productClasses: ['flower', 'extract'],
    compliance: ['eu_gmp'],
    riskScore: 4,
    riskLabel: 'Emerging export path',
  },
  {
    id: 'PT-DE',
    from: 'PT',
    to: 'DE',
    label: 'Portugal → Germany',
    notes: 'Intra-EU; Infarmed licence; EU-GMP inherently satisfied; narcotics transport permit.',
    productClasses: ['flower', 'extract', 'finished_product', 'starting_material'],
    compliance: ['intra_eu', 'eu_gmp'],
    riskScore: 2,
    riskLabel: 'Intra-EU lower friction',
  },
  {
    id: 'NL-DE',
    from: 'NL',
    to: 'DE',
    label: 'Netherlands → Germany',
    notes: 'Intra-EU; OMC wholesale authorisation; shortest avg processing of major corridors.',
    productClasses: ['flower', 'extract', 'finished_product'],
    compliance: ['intra_eu', 'eu_gmp'],
    riskScore: 1,
    riskLabel: 'Lowest friction (tracked)',
  },
  {
    id: 'AU-GB',
    from: 'AU',
    to: 'GB',
    label: 'Australia → United Kingdom',
    notes: 'TGA export; MHRA import licence; Schedule 1→2 reclassification per product.',
    productClasses: ['flower', 'extract', 'finished_product'],
    compliance: ['tga'],
    riskScore: 3,
    riskLabel: 'Product-class sensitive',
  },
  {
    id: 'CA-GB',
    from: 'CA',
    to: 'GB',
    label: 'Canada → United Kingdom',
    notes: 'Health Canada export; MHRA specials import (digital-only from Apr 2026); UK GMP cert.',
    productClasses: ['flower', 'extract', 'finished_product'],
    compliance: ['health_canada_export'],
    riskScore: 3,
    riskLabel: 'Digital import shift',
  },
  {
    id: 'MX-CA',
    from: 'MX',
    to: 'CA',
    label: 'Mexico → Canada',
    notes: 'COFEPRIS export; Health Canada import; not yet in CUSMA trade provisions.',
    productClasses: ['flower', 'extract', 'starting_material'],
    compliance: ['other', 'health_canada_export'],
    riskScore: 5,
    riskLabel: 'Policy gap / high friction',
  },
  {
    id: 'TH-AU',
    from: 'TH',
    to: 'AU',
    label: 'Thailand → Australia',
    notes: 'Thai FDA tightened export restrictions Apr 2026; TGA import; cold-chain alignment.',
    productClasses: ['extract', 'finished_product'],
    compliance: ['tga', 'other'],
    riskScore: 5,
    riskLabel: 'Export restrictions watch',
  },
  {
    id: 'BR-PT',
    from: 'BR',
    to: 'PT',
    label: 'Brazil → Portugal',
    notes: 'ANVISA export; Infarmed import; Brazil–Portugal phytosanitary equivalence under discussion.',
    productClasses: ['flower', 'extract', 'starting_material'],
    compliance: ['other', 'intra_eu'],
    riskScore: 4,
    riskLabel: 'Equivalence under discussion',
  },
]

export type CorridorFilter = {
  product?: ProductClass | 'any'
  compliance?: ComplianceProfile | 'any'
  from?: string | 'any'
  to?: string | 'any'
  maxRisk?: number
}

export function filterCorridors(
  corridors: TradeCorridor[],
  filter: CorridorFilter,
): TradeCorridor[] {
  return corridors.filter((c) => {
    if (filter.product && filter.product !== 'any' && !c.productClasses.includes(filter.product)) {
      return false
    }
    if (
      filter.compliance &&
      filter.compliance !== 'any' &&
      !c.compliance.includes(filter.compliance)
    ) {
      return false
    }
    if (filter.from && filter.from !== 'any' && c.from !== filter.from) return false
    if (filter.to && filter.to !== 'any' && c.to !== filter.to) return false
    if (typeof filter.maxRisk === 'number' && c.riskScore > filter.maxRisk) return false
    return true
  })
}

export const PRODUCT_OPTIONS: { value: ProductClass | 'any'; label: string }[] = [
  { value: 'any', label: 'Any product' },
  { value: 'flower', label: 'Flower' },
  { value: 'extract', label: 'Extract' },
  { value: 'finished_product', label: 'Finished product' },
  { value: 'starting_material', label: 'Starting material' },
]

export const COMPLIANCE_OPTIONS: { value: ComplianceProfile | 'any'; label: string }[] = [
  { value: 'any', label: 'Any compliance path' },
  { value: 'eu_gmp', label: 'EU-GMP' },
  { value: 'intra_eu', label: 'Intra-EU' },
  { value: 'health_canada_export', label: 'Health Canada export' },
  { value: 'tga', label: 'TGA / Australia' },
  { value: 'other', label: 'Other national' },
]
