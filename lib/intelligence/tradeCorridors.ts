/**
 * Trade corridors for medical / controlled-cannabis logistics orientation.
 *
 * Coverage rule: every jurisdiction that is applicable as an origin and/or
 * destination appears in the matrix. Corridors are generated for all
 * (origin → destination) pairs where from ≠ to.
 *
 * Notes are orientation only — not competent-authority advice.
 */

export type ProductClass =
  | 'flower'
  | 'extract'
  | 'finished_product'
  | 'starting_material'

export type ComplianceProfile =
  | 'eu_gmp'
  | 'intra_eu'
  | 'tga'
  | 'health_canada_export'
  | 'other'

export type TradeRole = 'origin' | 'destination' | 'both'

export type ApplicableJurisdiction = {
  iso2: string
  name: string
  role: TradeRole
  /** Short orientation tag for operators */
  tag: string
  region: 'europe' | 'americas' | 'mena' | 'africa' | 'apac'
  eea?: boolean
}

/**
 * Jurisdictions with a realistic medical / controlled-cannabis trade role
 * (cultivation, processing, import market, or both). Not the full UN list.
 */
export const APPLICABLE_TRADE_JURISDICTIONS: ApplicableJurisdiction[] = [
  // —— Europe (EEA + CH + GB + candidates) ——
  { iso2: 'DE', name: 'Germany', role: 'both', tag: 'Largest EU medical import market', region: 'europe', eea: true },
  { iso2: 'PT', name: 'Portugal', role: 'both', tag: 'EU-GMP cultivation & processing', region: 'europe', eea: true },
  { iso2: 'NL', name: 'Netherlands', role: 'both', tag: 'OMC / wholesale & research', region: 'europe', eea: true },
  { iso2: 'ES', name: 'Spain', role: 'both', tag: 'AEMPS medical pathways', region: 'europe', eea: true },
  { iso2: 'DK', name: 'Denmark', role: 'both', tag: 'DKMA / EU-GMP export', region: 'europe', eea: true },
  { iso2: 'CZ', name: 'Czechia', role: 'both', tag: 'Processing & release hub', region: 'europe', eea: true },
  { iso2: 'MT', name: 'Malta', role: 'both', tag: 'EU-GMP processing corridor', region: 'europe', eea: true },
  { iso2: 'GR', name: 'Greece', role: 'both', tag: 'Expanding EU-GMP cultivation', region: 'europe', eea: true },
  { iso2: 'IT', name: 'Italy', role: 'both', tag: 'AIFA / medical import', region: 'europe', eea: true },
  { iso2: 'FR', name: 'France', role: 'destination', tag: 'ANSM medical experiment / constrained access', region: 'europe', eea: true },
  { iso2: 'PL', name: 'Poland', role: 'destination', tag: 'CEE medical demand', region: 'europe', eea: true },
  { iso2: 'AT', name: 'Austria', role: 'both', tag: 'AGES medical cannabis', region: 'europe', eea: true },
  { iso2: 'BE', name: 'Belgium', role: 'both', tag: 'FAMHP medical pathways', region: 'europe', eea: true },
  { iso2: 'IE', name: 'Ireland', role: 'destination', tag: 'Medical cannabis access programme', region: 'europe', eea: true },
  { iso2: 'SE', name: 'Sweden', role: 'destination', tag: 'Medical import / pharmacy channel', region: 'europe', eea: true },
  { iso2: 'FI', name: 'Finland', role: 'destination', tag: 'Fimea medical pathways', region: 'europe', eea: true },
  { iso2: 'NO', name: 'Norway', role: 'destination', tag: 'EEA medical import', region: 'europe', eea: true },
  { iso2: 'IS', name: 'Iceland', role: 'destination', tag: 'EEA medical pathways', region: 'europe', eea: true },
  { iso2: 'LI', name: 'Liechtenstein', role: 'destination', tag: 'EEA alignment', region: 'europe', eea: true },
  { iso2: 'LU', name: 'Luxembourg', role: 'both', tag: 'Medical programme / EU', region: 'europe', eea: true },
  { iso2: 'SK', name: 'Slovakia', role: 'destination', tag: 'Medical cannabis pathways', region: 'europe', eea: true },
  { iso2: 'SI', name: 'Slovenia', role: 'both', tag: 'Medical / EU-GMP potential', region: 'europe', eea: true },
  { iso2: 'HR', name: 'Croatia', role: 'both', tag: 'Medical cannabis framework', region: 'europe', eea: true },
  { iso2: 'RO', name: 'Romania', role: 'destination', tag: 'Medical access developing', region: 'europe', eea: true },
  { iso2: 'BG', name: 'Bulgaria', role: 'both', tag: 'Cultivation licences / EU', region: 'europe', eea: true },
  { iso2: 'HU', name: 'Hungary', role: 'destination', tag: 'Medical pathways', region: 'europe', eea: true },
  { iso2: 'CY', name: 'Cyprus', role: 'both', tag: 'Medical cannabis licences', region: 'europe', eea: true },
  { iso2: 'LT', name: 'Lithuania', role: 'destination', tag: 'Medical pathways', region: 'europe', eea: true },
  { iso2: 'LV', name: 'Latvia', role: 'destination', tag: 'Medical pathways', region: 'europe', eea: true },
  { iso2: 'EE', name: 'Estonia', role: 'destination', tag: 'Medical pathways', region: 'europe', eea: true },
  { iso2: 'CH', name: 'Switzerland', role: 'both', tag: 'Swissmedic / pilot & medical', region: 'europe' },
  { iso2: 'GB', name: 'United Kingdom', role: 'both', tag: 'MHRA / specials & medical', region: 'europe' },
  { iso2: 'MK', name: 'North Macedonia', role: 'origin', tag: 'Export-oriented cultivation', region: 'europe' },
  { iso2: 'AL', name: 'Albania', role: 'origin', tag: 'Cultivation / export interest', region: 'europe' },
  { iso2: 'RS', name: 'Serbia', role: 'origin', tag: 'Medical cultivation licences', region: 'europe' },
  // —— Americas ——
  { iso2: 'CA', name: 'Canada', role: 'both', tag: 'Major global exporter', region: 'americas' },
  { iso2: 'US', name: 'United States', role: 'both', tag: 'State medical; federal trade constraints', region: 'americas' },
  { iso2: 'MX', name: 'Mexico', role: 'both', tag: 'COFEPRIS framework evolving', region: 'americas' },
  { iso2: 'CO', name: 'Colombia', role: 'origin', tag: 'GACP / export licences', region: 'americas' },
  { iso2: 'UY', name: 'Uruguay', role: 'origin', tag: 'IRCCA export pathway', region: 'americas' },
  { iso2: 'BR', name: 'Brazil', role: 'both', tag: 'ANVISA patient import & industry', region: 'americas' },
  { iso2: 'AR', name: 'Argentina', role: 'both', tag: 'Medical programme / REPROCANN', region: 'americas' },
  { iso2: 'PE', name: 'Peru', role: 'origin', tag: 'Medical cannabis licences', region: 'americas' },
  { iso2: 'CL', name: 'Chile', role: 'both', tag: 'Medical access / local production', region: 'americas' },
  { iso2: 'JM', name: 'Jamaica', role: 'origin', tag: 'Export licences / traditional cultivation', region: 'americas' },
  { iso2: 'PA', name: 'Panama', role: 'destination', tag: 'Medical cannabis market', region: 'americas' },
  { iso2: 'CR', name: 'Costa Rica', role: 'origin', tag: 'Medical / export interest', region: 'americas' },
  // —— MENA ——
  { iso2: 'IL', name: 'Israel', role: 'both', tag: 'IMCA export & domestic medical', region: 'mena' },
  { iso2: 'TR', name: 'Türkiye', role: 'origin', tag: 'Controlled cultivation licences', region: 'mena' },
  { iso2: 'AE', name: 'United Arab Emirates', role: 'destination', tag: 'Controlled medical import interest', region: 'mena' },
  { iso2: 'MA', name: 'Morocco', role: 'origin', tag: 'Legal cannabis regions / export ambition', region: 'mena' },
  // —— Africa ——
  { iso2: 'ZA', name: 'South Africa', role: 'both', tag: 'SAHPRA medical & export', region: 'africa' },
  { iso2: 'LS', name: 'Lesotho', role: 'origin', tag: 'Export-oriented cultivation', region: 'africa' },
  { iso2: 'MW', name: 'Malawi', role: 'origin', tag: 'Industrial & medical cannabis licences', region: 'africa' },
  { iso2: 'RW', name: 'Rwanda', role: 'origin', tag: 'Medical cannabis export licences', region: 'africa' },
  { iso2: 'UG', name: 'Uganda', role: 'origin', tag: 'Medical cannabis licences', region: 'africa' },
  { iso2: 'GH', name: 'Ghana', role: 'origin', tag: 'Medical cannabis framework', region: 'africa' },
  { iso2: 'NG', name: 'Nigeria', role: 'origin', tag: 'Medical cannabis policy developing', region: 'africa' },
  { iso2: 'ZW', name: 'Zimbabwe', role: 'origin', tag: 'Export cultivation licences', region: 'africa' },
  // —— Asia-Pacific ——
  { iso2: 'AU', name: 'Australia', role: 'both', tag: 'TGA ODC import/export', region: 'apac' },
  { iso2: 'NZ', name: 'New Zealand', role: 'both', tag: 'Medicinal cannabis scheme', region: 'apac' },
  { iso2: 'TH', name: 'Thailand', role: 'both', tag: 'Medical cannabis; export rules evolving', region: 'apac' },
  { iso2: 'KR', name: 'South Korea', role: 'destination', tag: 'Narcotics control medical import', region: 'apac' },
  { iso2: 'JP', name: 'Japan', role: 'destination', tag: 'Strict medical cannabis rules', region: 'apac' },
  { iso2: 'PH', name: 'Philippines', role: 'destination', tag: 'Medical cannabis policy watch', region: 'apac' },
  { iso2: 'IN', name: 'India', role: 'origin', tag: 'Traditional & medical frameworks', region: 'apac' },
  { iso2: 'LK', name: 'Sri Lanka', role: 'origin', tag: 'Traditional cultivation / export interest', region: 'apac' },
  { iso2: 'SG', name: 'Singapore', role: 'destination', tag: 'Highly controlled medical exceptions', region: 'apac' },
]

export type TradeCorridor = {
  id: string
  from: string
  to: string
  label: string
  notes: string
  productClasses: ProductClass[]
  compliance: ComplianceProfile[]
  riskScore: number
  riskLabel: string
}

const DEFAULT_PRODUCTS: ProductClass[] = ['flower', 'extract', 'finished_product']

/** High-signal notes for well-known pairs (override generic generation). */
const CURATED_NOTES: Record<string, Partial<TradeCorridor>> = {
  'CA-DE': {
    notes: 'EU-GMP required; Health Canada export licence; BfArM narcotics import permit.',
    compliance: ['eu_gmp', 'health_canada_export'],
    riskScore: 3,
    riskLabel: 'Established medical corridor',
  },
  'CA-AU': {
    notes: 'TGA ODC import permit; Health Canada export licence.',
    compliance: ['tga', 'health_canada_export'],
    riskScore: 3,
    riskLabel: 'Permit-intensive',
  },
  'CA-GB': {
    notes: 'Health Canada export; MHRA specials / medical import; UK GMP evidence.',
    compliance: ['health_canada_export'],
    riskScore: 3,
    riskLabel: 'Digital import shift',
  },
  'PT-DE': {
    notes: 'Intra-EU; Infarmed; EU-GMP; narcotics transport still required.',
    compliance: ['intra_eu', 'eu_gmp'],
    riskScore: 2,
    riskLabel: 'Intra-EU lower friction',
  },
  'NL-DE': {
    notes: 'Intra-EU; OMC wholesale; relatively short processing on major lanes.',
    compliance: ['intra_eu', 'eu_gmp'],
    riskScore: 1,
    riskLabel: 'Lowest friction (tracked)',
  },
  'CO-DE': {
    notes: 'GACP / INVIMA path; EU-GMP evidence or EU processing; BfArM import.',
    compliance: ['eu_gmp'],
    riskScore: 4,
    riskLabel: 'Long processing path',
  },
  'IL-DE': {
    notes: 'IMCA export; ACAA/EU alignment context; EU-GMP evidence still mapped per SKU.',
    compliance: ['eu_gmp'],
    riskScore: 4,
    riskLabel: 'Equivalency watch',
  },
  'TH-AU': {
    notes: 'Thai export rules evolving; TGA import; cold-chain alignment.',
    compliance: ['tga', 'other'],
    riskScore: 5,
    riskLabel: 'Export restrictions watch',
  },
  'MX-CA': {
    notes: 'COFEPRIS / Health Canada; CUSMA does not by itself clear cannabis trade.',
    compliance: ['other', 'health_canada_export'],
    riskScore: 5,
    riskLabel: 'Policy gap / high friction',
  },
  'GB-DE': {
    notes: 'Post-Brexit third-country path; TCA inspection recognition ≠ single market.',
    compliance: ['eu_gmp', 'other'],
    riskScore: 4,
    riskLabel: 'TCA / dual systems',
  },
}

function defaultCompliance(fromIso: string, toIso: string): ComplianceProfile[] {
  const from = APPLICABLE_TRADE_JURISDICTIONS.find((j) => j.iso2 === fromIso)
  const to = APPLICABLE_TRADE_JURISDICTIONS.find((j) => j.iso2 === toIso)
  const profiles: ComplianceProfile[] = []
  if (from?.eea && to?.eea) profiles.push('intra_eu', 'eu_gmp')
  else if (to?.eea || from?.eea) profiles.push('eu_gmp')
  if (fromIso === 'CA') profiles.push('health_canada_export')
  if (toIso === 'AU' || fromIso === 'AU') profiles.push('tga')
  if (profiles.length === 0) profiles.push('other')
  return [...new Set(profiles)]
}

function defaultRisk(fromIso: string, toIso: string): { riskScore: number; riskLabel: string } {
  const from = APPLICABLE_TRADE_JURISDICTIONS.find((j) => j.iso2 === fromIso)
  const to = APPLICABLE_TRADE_JURISDICTIONS.find((j) => j.iso2 === toIso)
  if (from?.eea && to?.eea) return { riskScore: 2, riskLabel: 'Intra-EEA orientation' }
  if (to?.eea && !from?.eea) return { riskScore: 3, riskLabel: 'Third-country → EEA' }
  if (from?.eea && !to?.eea) return { riskScore: 3, riskLabel: 'EEA → third country' }
  return { riskScore: 4, riskLabel: 'Cross-regional orientation' }
}

function defaultNotes(fromIso: string, toIso: string): string {
  const from = APPLICABLE_TRADE_JURISDICTIONS.find((j) => j.iso2 === fromIso)
  const to = APPLICABLE_TRADE_JURISDICTIONS.find((j) => j.iso2 === toIso)
  const bits = [
    from ? `Origin ${from.name}: ${from.tag}` : `Origin ${fromIso}`,
    to ? `Destination ${to.name}: ${to.tag}` : `Destination ${toIso}`,
    'Verify narcotics permits, GMP recognition, and importer scope with competent authorities.',
  ]
  return bits.join(' · ')
}

function buildMatrix(): TradeCorridor[] {
  const origins = APPLICABLE_TRADE_JURISDICTIONS.filter(
    (j) => j.role === 'origin' || j.role === 'both',
  )
  const destinations = APPLICABLE_TRADE_JURISDICTIONS.filter(
    (j) => j.role === 'destination' || j.role === 'both',
  )
  const out: TradeCorridor[] = []
  for (const o of origins) {
    for (const d of destinations) {
      if (o.iso2 === d.iso2) continue
      const id = `${o.iso2}-${d.iso2}`
      const curated = CURATED_NOTES[id]
      const risk = defaultRisk(o.iso2, d.iso2)
      out.push({
        id,
        from: o.iso2,
        to: d.iso2,
        label: `${o.name} → ${d.name}`,
        notes: curated?.notes ?? defaultNotes(o.iso2, d.iso2),
        productClasses: curated?.productClasses ?? DEFAULT_PRODUCTS,
        compliance: curated?.compliance ?? defaultCompliance(o.iso2, d.iso2),
        riskScore: curated?.riskScore ?? risk.riskScore,
        riskLabel: curated?.riskLabel ?? risk.riskLabel,
      })
    }
  }
  return out.sort((a, b) => a.label.localeCompare(b.label))
}

export const TRADE_CORRIDORS: TradeCorridor[] = buildMatrix()

export function listOriginJurisdictions(): ApplicableJurisdiction[] {
  return APPLICABLE_TRADE_JURISDICTIONS.filter((j) => j.role === 'origin' || j.role === 'both').sort(
    (a, b) => a.name.localeCompare(b.name),
  )
}

export function listDestinationJurisdictions(): ApplicableJurisdiction[] {
  return APPLICABLE_TRADE_JURISDICTIONS.filter(
    (j) => j.role === 'destination' || j.role === 'both',
  ).sort((a, b) => a.name.localeCompare(b.name))
}

/** High-traffic pairs for one-tap chips (subset of full matrix). */
export const POPULAR_CORRIDOR_IDS: string[] = [
  'CA-DE',
  'CA-AU',
  'CA-GB',
  'CA-FR',
  'CA-IT',
  'CA-PL',
  'PT-DE',
  'NL-DE',
  'ES-DE',
  'DK-DE',
  'CZ-DE',
  'MT-DE',
  'GR-DE',
  'IL-DE',
  'CO-DE',
  'ZA-DE',
  'AU-DE',
  'GB-DE',
  'CH-DE',
  'UY-DE',
  'CO-PT',
  'TH-AU',
  'AU-GB',
  'PT-GB',
  'NL-GB',
  'IL-AU',
  'BR-PT',
  'MX-CA',
]

export function getPopularCorridors(): TradeCorridor[] {
  const map = new Map(TRADE_CORRIDORS.map((c) => [c.id, c]))
  return POPULAR_CORRIDOR_IDS.map((id) => map.get(id)).filter(Boolean) as TradeCorridor[]
}

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
  { value: 'any', label: 'Any compliance profile' },
  { value: 'eu_gmp', label: 'EU-GMP' },
  { value: 'intra_eu', label: 'Intra-EU' },
  { value: 'tga', label: 'TGA' },
  { value: 'health_canada_export', label: 'Health Canada export' },
  { value: 'other', label: 'Other / national' },
]
