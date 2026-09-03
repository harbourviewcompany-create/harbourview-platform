import 'server-only'

// EXPLICIT PRODUCT DECISION, STATED TWICE: the supply catalog must show
// full real data (stock, MOQ, lead time, brand/model, real compliance
// flags) rather than redacted placeholders. A prior version of this file
// pointed at the redacted api.supply_catalog_public_v1 DTO; that was
// reverted back to this full-detail contract after direct instruction.
// Do not re-redact this without checking with the product owner first --
// this has already been reverted back and forth once.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Dedicated, isolated public view for the Harbourview-direct supply
// catalog -- deliberately NOT api.marketplace_public_listings_v1 (the
// shared canonical contract for every other /marketplace/* public page)
// and deliberately NOT api.supply_catalog_public_v1 (the redacted DTO).
const TARGET_PUBLIC_VIEW = 'supply_catalog_detail_v1'

export type SupplyListing = {
  id: string
  slug: string
  title: string
  description: string
  category: string
  marketplace_section: string
  product_type: string | null
  region: string
  condition: string | null
  sku: string | null
  brand: string | null
  model: string | null
  quantity: number | null
  unit: string | null
  price_amount: number | null
  price_currency: string
  price_display: string | null
  is_featured: boolean
  stock_qty: number | null
  lead_time_days: number | null
  moq: number | null
  compliance_flags: Record<string, Record<string, unknown>>
  target_countries: string[]
  high_level_specs: Record<string, unknown>
  created_at: string
}

const SELECT_COLS =
  'id,slug,title,description,category,marketplace_section,product_type,region,condition,' +
  'sku,brand,model,quantity,unit,price_amount,price_currency,price_display,is_featured,' +
  'stock_qty,lead_time_days,moq,compliance_flags,target_countries,high_level_specs,created_at'

const PUBLIC_LISTING_CACHE: RequestInit = { next: { revalidate: 300 } }

// Runtime validation on every row before it reaches a page -- adopted from
// the redacted DTO's approach (worth keeping regardless of the
// full-vs-redacted data decision): a malformed/partial row from PostgREST
// should be dropped, not rendered with undefined fields.
function toSupplyListing(value: unknown): SupplyListing | null {
  if (!value || typeof value !== 'object') return null
  const row = value as Record<string, unknown>
  if (
    typeof row.id !== 'string' ||
    typeof row.slug !== 'string' ||
    typeof row.title !== 'string' ||
    typeof row.description !== 'string' ||
    typeof row.category !== 'string' ||
    typeof row.marketplace_section !== 'string' ||
    typeof row.region !== 'string' ||
    typeof row.price_currency !== 'string' ||
    typeof row.is_featured !== 'boolean' ||
    typeof row.created_at !== 'string'
  ) {
    return null
  }

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    category: row.category,
    marketplace_section: row.marketplace_section,
    product_type: typeof row.product_type === 'string' ? row.product_type : null,
    region: row.region,
    condition: typeof row.condition === 'string' ? row.condition : null,
    sku: typeof row.sku === 'string' ? row.sku : null,
    brand: typeof row.brand === 'string' ? row.brand : null,
    model: typeof row.model === 'string' ? row.model : null,
    quantity: typeof row.quantity === 'number' ? row.quantity : null,
    unit: typeof row.unit === 'string' ? row.unit : null,
    price_amount: typeof row.price_amount === 'number' ? row.price_amount : null,
    price_currency: row.price_currency,
    price_display: typeof row.price_display === 'string' ? row.price_display : null,
    is_featured: row.is_featured,
    stock_qty: typeof row.stock_qty === 'number' ? row.stock_qty : null,
    lead_time_days: typeof row.lead_time_days === 'number' ? row.lead_time_days : null,
    moq: typeof row.moq === 'number' ? row.moq : null,
    compliance_flags:
      row.compliance_flags && typeof row.compliance_flags === 'object'
        ? (row.compliance_flags as Record<string, Record<string, unknown>>)
        : {},
    target_countries: Array.isArray(row.target_countries)
      ? row.target_countries.filter((c): c is string => typeof c === 'string')
      : [],
    high_level_specs:
      row.high_level_specs && typeof row.high_level_specs === 'object'
        ? (row.high_level_specs as Record<string, unknown>)
        : {},
    created_at: row.created_at,
  }
}

async function queryListings(params: URLSearchParams): Promise<SupplyListing[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return []

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TARGET_PUBLIC_VIEW}?${params.toString()}`, {
      ...PUBLIC_LISTING_CACHE,
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: 'application/json',
        'Accept-Profile': 'api',
      },
    })

    if (!res.ok) {
      console.error('Supply catalog query failed', { status: res.status, view: TARGET_PUBLIC_VIEW })
      return []
    }

    const payload: unknown = await res.json()
    if (!Array.isArray(payload)) return []
    return payload.map(toSupplyListing).filter((listing): listing is SupplyListing => listing !== null)
  } catch (error) {
    console.error('Supply catalog query failed', {
      view: TARGET_PUBLIC_VIEW,
      message: error instanceof Error ? error.message : 'unknown error',
    })
    return []
  }
}

function baseParams(limit = 300): URLSearchParams {
  return new URLSearchParams({
    select: SELECT_COLS,
    order: 'is_featured.desc,title.asc',
    limit: String(limit),
  })
}

export type SupplyCatalogFilters = {
  category?: string
  countryIso2?: string
  search?: string
}

const CATALOG_CATEGORIES = [
  'packaging',
  'consumables',
  'cultivation_equipment',
  'processing_equipment',
  'labs_testing',
] as const

export type SupplyCategory = (typeof CATALOG_CATEGORIES)[number]

export function isSupplyCategory(value: string): value is SupplyCategory {
  return (CATALOG_CATEGORIES as readonly string[]).includes(value)
}

const ISO2_RE = /^[A-Z]{2}$/
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export async function getSupplyCatalog(
  filters: SupplyCatalogFilters = {},
  limit = 300,
): Promise<SupplyListing[]> {
  const p = baseParams(limit)

  if (filters.category && filters.category !== 'all' && isSupplyCategory(filters.category)) {
    p.set('category', `eq.${filters.category}`)
  }

  const safeIso2 =
    filters.countryIso2 && ISO2_RE.test(filters.countryIso2.trim().toUpperCase())
      ? filters.countryIso2.trim().toUpperCase()
      : null
  if (safeIso2) p.set('target_countries', `cs.{${safeIso2}}`)

  const search = filters.search?.trim()
  if (search) {
    // Escape PostgREST filter-syntax special characters before interpolating
    // into an `or=` expression -- same defensive pattern as the redacted DTO.
    const escaped = search.replace(/[,*()]/g, ' ').replace(/\s+/g, ' ').trim()
    if (escaped) p.set('or', `(title.ilike.*${escaped}*,sku.ilike.*${escaped}*,brand.ilike.*${escaped}*)`)
  }

  return queryListings(p)
}

export async function getSupplyItemBySlug(slug: string): Promise<SupplyListing | null> {
  const safeSlug = slug.trim().toLowerCase()
  if (!SLUG_RE.test(safeSlug)) return null

  const p = baseParams(1)
  p.set('slug', `eq.${safeSlug}`)
  const rows = await queryListings(p)
  return rows[0] ?? null
}

export const SUPPLY_CATEGORY_LABELS: Record<SupplyCategory, string> = {
  packaging: 'Packaging',
  consumables: 'Consumables',
  cultivation_equipment: 'Cultivation Equipment',
  processing_equipment: 'Processing Equipment',
  labs_testing: 'Lab & Testing',
}
