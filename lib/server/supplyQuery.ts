import 'server-only'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const TARGET_PUBLIC_VIEW = 'marketplace_public_listings_v1'

export type SupplyListing = {
  id: string
  slug: string | null
  title: string
  description: string
  category: string
  marketplace_section: string
  product_type: string | null
  region: string
  condition: string | null
  price_amount: number | null
  price_currency: string
  price_display: string | null
  is_featured: boolean
  high_level_specs: Record<string, unknown>
  created_at: string
  sku: string | null
  brand: string | null
  model: string | null
  quantity: number | null
  unit: string | null
  stock_qty: number | null
  lead_time_days: number | null
  moq: number | null
  compliance_flags: Record<string, Record<string, unknown>>
  target_countries: string[]
  // PostgREST/Postgres numeric serialization for average_rating isn't
  // guaranteed to be a JSON number — callers must coerce with Number().
  average_rating: number | string | null
  review_count: number | null
}

const SELECT_COLS =
  'id,slug,title,description,category,marketplace_section,product_type,region,condition,' +
  'price_amount,price_currency,price_display,is_featured,high_level_specs,created_at,' +
  'sku,brand,model,quantity,unit,stock_qty,lead_time_days,moq,compliance_flags,target_countries,' +
  'average_rating,review_count'

// Supply catalog pages are read-heavy and change only when the catalog is
// updated. Revalidate every 5 minutes, matching the pattern used for the
// rest of the public marketplace pages in lib/server/listingsQuery.ts.
const PUBLIC_LISTING_CACHE: RequestInit = { next: { revalidate: 300 } }

async function queryListings(params: URLSearchParams): Promise<SupplyListing[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return []
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TARGET_PUBLIC_VIEW}?${params.toString()}`, {
      ...PUBLIC_LISTING_CACHE,
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: 'application/json',
      },
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

function baseParams(limit = 60): URLSearchParams {
  const p = new URLSearchParams({
    select: SELECT_COLS,
    // Harbourview-direct catalog only — never the third-party P2P listings
    // that also live in this same view.
    sold_by_harbourview: 'eq.true',
    order: 'is_featured.desc,title.asc',
    limit: String(limit),
  })
  return p
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

// Strict ISO 3166-1 alpha-2 pattern — two uppercase letters only.
const ISO2_RE = /^[A-Z]{2}$/

export async function getSupplyCatalog(
  filters: SupplyCatalogFilters = {},
  limit = 60,
): Promise<SupplyListing[]> {
  const p = baseParams(limit)

  if (filters.category && filters.category !== 'all' && isSupplyCategory(filters.category)) {
    p.set('category', `eq.${filters.category}`)
  }

  const safeIso2 =
    filters.countryIso2 && ISO2_RE.test(filters.countryIso2.trim().toUpperCase())
      ? filters.countryIso2.trim().toUpperCase()
      : null
  if (safeIso2) {
    p.set('target_countries', `cs.{${safeIso2}}`)
  }

  const rows = await queryListings(p)

  if (filters.search) {
    const q = filters.search.toLowerCase()
    return rows.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        (r.sku ?? '').toLowerCase().includes(q) ||
        (r.brand ?? '').toLowerCase().includes(q),
    )
  }

  return rows
}

export async function getSupplyItemBySlug(slug: string): Promise<SupplyListing | null> {
  const p = baseParams(1)
  p.set('slug', `eq.${slug}`)
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
