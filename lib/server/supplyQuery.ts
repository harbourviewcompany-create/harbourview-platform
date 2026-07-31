import 'server-only'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const TARGET_PUBLIC_VIEW = 'supply_catalog_public_v1'

export type PublicSupplyAttribute = {
  key: string
  label: string
  value: string
}

export type SupplyListing = {
  id: string
  slug: string
  title: string
  description: string
  category: string
  marketplace_section: string
  product_type: string | null
  region: string
  price_currency: string
  price_display: string
  is_featured: boolean
  created_at: string
  sku: string
  unit: string | null
  moq_display: string | null
  lead_time_display: string | null
  availability_status: string
  target_countries: string[]
  public_attributes: PublicSupplyAttribute[]
  review_note: string
}

const SELECT_COLS =
  'id,slug,title,description,category,marketplace_section,product_type,region,' +
  'price_currency,price_display,is_featured,created_at,sku,unit,moq_display,' +
  'lead_time_display,availability_status,target_countries,public_attributes,review_note'

const PUBLIC_LISTING_CACHE: RequestInit = { next: { revalidate: 300 } }

function isPublicSupplyAttribute(value: unknown): value is PublicSupplyAttribute {
  if (!value || typeof value !== 'object') return false
  const row = value as Record<string, unknown>
  return typeof row.key === 'string' && typeof row.label === 'string' && typeof row.value === 'string'
}

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
    typeof row.price_display !== 'string' ||
    typeof row.is_featured !== 'boolean' ||
    typeof row.created_at !== 'string' ||
    typeof row.sku !== 'string' ||
    typeof row.availability_status !== 'string' ||
    typeof row.review_note !== 'string'
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
    price_currency: row.price_currency,
    price_display: row.price_display,
    is_featured: row.is_featured,
    created_at: row.created_at,
    sku: row.sku,
    unit: typeof row.unit === 'string' ? row.unit : null,
    moq_display: typeof row.moq_display === 'string' ? row.moq_display : null,
    lead_time_display: typeof row.lead_time_display === 'string' ? row.lead_time_display : null,
    availability_status: row.availability_status,
    target_countries: Array.isArray(row.target_countries)
      ? row.target_countries.filter((country): country is string => typeof country === 'string')
      : [],
    public_attributes: Array.isArray(row.public_attributes)
      ? row.public_attributes.filter(isPublicSupplyAttribute)
      : [],
    review_note: row.review_note,
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
      console.error('Supply catalog public query failed', { status: res.status, view: TARGET_PUBLIC_VIEW })
      return []
    }

    const payload: unknown = await res.json()
    if (!Array.isArray(payload)) return []
    return payload.map(toSupplyListing).filter((listing): listing is SupplyListing => listing !== null)
  } catch (error) {
    console.error('Supply catalog public query failed', {
      view: TARGET_PUBLIC_VIEW,
      message: error instanceof Error ? error.message : 'unknown error',
    })
    return []
  }
}

function baseParams(limit = 100): URLSearchParams {
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
  limit = 100,
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
    const escaped = search.replace(/[,*()]/g, ' ').replace(/\s+/g, ' ').trim()
    if (escaped) p.set('or', `(title.ilike.*${escaped}*,sku.ilike.*${escaped}*)`)
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
