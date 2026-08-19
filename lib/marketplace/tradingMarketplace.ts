export type TradePriceTier = {
  label: string
  price: number | null
  currency: string | null
  unit: string | null
  minimumQuantity: number | null
}

export type TradeDocument = {
  label: string
  url: string
  documentType: string | null
  status: string | null
}

export type TradeImage = {
  url: string
  alt: string
}

export type TradeSpec = {
  reference: string | null
  inventoryForm: string | null
  stockQuantity: string | null
  stockLocation: string | null
  originCountry: string | null
  shippingTerritories: string[]
  cultivationMethod: string | null
  harvestDate: string | null
  cannabinoids: Array<{ name: string; value: string }>
  priceTiers: TradePriceTier[]
  documents: TradeDocument[]
  images: TradeImage[]
  availabilityStatus: string | null
  activityStatus: string | null
  minimumOrderQuantity: string | null
  sampleAvailable: boolean | null
  packaging: string | null
  incoterms: string | null
  certifications: string[]
  publishedAt: string | null
  updatedAt: string | null
  serviceCategory: string | null
  serviceCapacity: string | null
  turnaroundTime: string | null
  minimumBatch: string | null
  process: string | null
  jurisdictionsServed: string[]
}

export type TradingCategory = {
  key: string
  label: string
  description: string
  kind: 'inventory' | 'service' | 'controlled'
  terms: string[]
}

export const TRADING_CATEGORIES: TradingCategory[] = [
  { key: 'all', label: 'All supply', description: 'Reviewed public inventory and commercial services.', kind: 'inventory', terms: [] },
  { key: 'flower', label: 'Flower', description: 'Dried flower and whole-flower lots.', kind: 'inventory', terms: ['flower', 'flowers', 'bud', 'buds'] },
  { key: 'isolate', label: 'Isolates', description: 'CBD, CBG, CBN, THCA and other reviewed isolate supply.', kind: 'inventory', terms: ['isolate', 'isolates'] },
  { key: 'distillate', label: 'Distillates', description: 'Distillates, crystal-resistant distillates and refined concentrates.', kind: 'inventory', terms: ['distillate', 'crd', 'crystal resistant'] },
  { key: 'seed', label: 'Seeds', description: 'Commercial seed programs and bulk seed supply.', kind: 'inventory', terms: ['seed', 'seeds'] },
  { key: 'biomass', label: 'Biomass', description: 'Extraction-grade and flower-only biomass supply.', kind: 'inventory', terms: ['biomass'] },
  { key: 'hash-pollen', label: 'Hash & pollen', description: 'Reviewed pollen, hash and resin-style products.', kind: 'inventory', terms: ['hash', 'pollen', 'resin', 'piatella', 'static'] },
  { key: 'oil', label: 'Oils', description: 'Crude, remediated and refined cannabinoid oils.', kind: 'inventory', terms: ['oil', 'crude'] },
  { key: 'trim', label: 'Trim', description: 'Trim and secondary plant-material lots.', kind: 'inventory', terms: ['trim'] },
  { key: 'terpene', label: 'Terpenes', description: 'Bulk terpene profiles and formulation inputs.', kind: 'inventory', terms: ['terpene', 'terpenes', 'terpen'] },
  { key: 'finished', label: 'Finished formats', description: 'Pre-rolls, vape inputs, cartridges and other reviewed finished formats.', kind: 'inventory', terms: ['pre-roll', 'preroll', 'vape', 'cartridge', 'finished'] },
  { key: 'service', label: 'Services', description: 'Extraction, remediation, infusion, enrichment and other processing services.', kind: 'service', terms: [] },
  { key: 'controlled', label: 'Controlled supply', description: 'Licence-qualified routing for non-public controlled inventory.', kind: 'controlled', terms: [] },
]

const KNOWN_CANNABINOIDS = [
  ['thca', 'THCA'],
  ['delta9_thc', 'Δ9-THC'],
  ['thc', 'THC'],
  ['cbda', 'CBDA'],
  ['cbd', 'CBD'],
  ['cbg', 'CBG'],
  ['cbga', 'CBGA'],
  ['cbn', 'CBN'],
  ['cbc', 'CBC'],
  ['cbdv', 'CBDV'],
  ['cbt', 'CBT'],
] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function text(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized ? normalized : null
}

function bool(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['yes', 'true', '1', 'available'].includes(normalized)) return true
    if (['no', 'false', '0', 'unavailable'].includes(normalized)) return false
  }
  return null
}

function stringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(text).filter((item): item is string => Boolean(item))
  }
  const single = text(value)
  if (!single) return []
  return single
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function safePublicUrl(value: unknown): string | null {
  const candidate = text(value)
  if (!candidate) return null
  try {
    const url = new URL(candidate)
    return url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

function publicDocuments(specs: Record<string, unknown>): TradeDocument[] {
  const value = specs.public_documents
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!isRecord(item)) return []
    const url = safePublicUrl(item.url)
    const label = text(item.label)
    if (!url || !label) return []
    return [{
      label,
      url,
      documentType: text(item.document_type ?? item.type),
      status: text(item.status),
    }]
  })
}

function publicImages(specs: Record<string, unknown>): TradeImage[] {
  const value = specs.public_image_urls
  if (!Array.isArray(value)) return []
  return value.flatMap((item, index) => {
    if (typeof item === 'string') {
      const url = safePublicUrl(item)
      return url ? [{ url, alt: `Listing image ${index + 1}` }] : []
    }
    if (!isRecord(item)) return []
    const url = safePublicUrl(item.url)
    if (!url) return []
    return [{ url, alt: text(item.alt) ?? `Listing image ${index + 1}` }]
  })
}

function priceTiers(specs: Record<string, unknown>): TradePriceTier[] {
  const value = specs.price_tiers
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!isRecord(item)) return []
    const label = text(item.label ?? item.quantity ?? item.range)
    if (!label) return []
    const rawPrice = typeof item.price === 'number' ? item.price : Number(item.price)
    const rawMinimum = typeof item.minimum_quantity === 'number' ? item.minimum_quantity : Number(item.minimum_quantity)
    return [{
      label,
      price: Number.isFinite(rawPrice) ? rawPrice : null,
      currency: text(item.currency),
      unit: text(item.unit),
      minimumQuantity: Number.isFinite(rawMinimum) ? rawMinimum : null,
    }]
  })
}

function cannabinoids(specs: Record<string, unknown>): Array<{ name: string; value: string }> {
  const structured = specs.cannabinoids
  const values: Array<{ name: string; value: string }> = []
  if (isRecord(structured)) {
    for (const [key, value] of Object.entries(structured)) {
      const rendered = typeof value === 'number' ? `${value}%` : text(value)
      if (rendered) values.push({ name: key.toUpperCase().replaceAll('_', '-'), value: rendered })
    }
  }
  for (const [key, label] of KNOWN_CANNABINOIDS) {
    if (values.some((entry) => entry.name === label)) continue
    const value = specs[`${key}_percent`] ?? specs[key]
    const rendered = typeof value === 'number' ? `${value}%` : text(value)
    if (rendered) values.push({ name: label, value: rendered })
  }
  return values.slice(0, 12)
}

export function getTradeSpec(highLevelSpecs: Record<string, unknown> | null | undefined): TradeSpec {
  const specs = highLevelSpecs ?? {}
  return {
    reference: text(specs.trade_reference ?? specs.lot_reference ?? specs.reference),
    inventoryForm: text(specs.inventory_form ?? specs.product_form ?? specs.form),
    stockQuantity: text(specs.stock_quantity ?? specs.available_quantity ?? specs.quantity_available),
    stockLocation: text(specs.stock_location ?? specs.inventory_location),
    originCountry: text(specs.origin_country ?? specs.production_country),
    shippingTerritories: stringList(specs.shipping_territories ?? specs.shipping_regions ?? specs.regions_served),
    cultivationMethod: text(specs.cultivation_method ?? specs.production_method),
    harvestDate: text(specs.harvest_date ?? specs.production_date),
    cannabinoids: cannabinoids(specs),
    priceTiers: priceTiers(specs),
    documents: publicDocuments(specs),
    images: publicImages(specs),
    availabilityStatus: text(specs.availability_status ?? specs.trade_availability),
    activityStatus: text(specs.activity_status ?? specs.trade_activity),
    minimumOrderQuantity: text(specs.minimum_order_quantity ?? specs.moq),
    sampleAvailable: bool(specs.sample_available),
    packaging: text(specs.packaging ?? specs.packaging_format),
    incoterms: text(specs.incoterms),
    certifications: stringList(specs.certifications ?? specs.certification_status),
    publishedAt: text(specs.published_at ?? specs.publication_date),
    updatedAt: text(specs.updated_at ?? specs.last_updated_at),
    serviceCategory: text(specs.service_category),
    serviceCapacity: text(specs.service_capacity ?? specs.capacity),
    turnaroundTime: text(specs.turnaround_time ?? specs.response_time),
    minimumBatch: text(specs.minimum_batch ?? specs.minimum_order_quantity),
    process: text(specs.process ?? specs.processing_method),
    jurisdictionsServed: stringList(specs.jurisdictions_served ?? specs.regions_served),
  }
}

export function matchesTradingCategory(
  categoryKey: string,
  listing: { category?: string | null; product_type?: string | null; title: string; high_level_specs?: Record<string, unknown> | null },
) {
  if (categoryKey === 'all') return listing.category === 'cannabis_inventory' || listing.category === 'services'
  const category = TRADING_CATEGORIES.find((item) => item.key === categoryKey)
  if (!category) return false
  if (category.kind === 'service') return listing.category === 'services'
  if (category.kind === 'controlled') return false
  if (listing.category !== 'cannabis_inventory') return false
  const spec = getTradeSpec(listing.high_level_specs)
  const haystack = [listing.product_type, listing.title, spec.inventoryForm]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return category.terms.some((term) => haystack.includes(term))
}

export function formatTradeDate(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: 'numeric' }).format(date)
}
