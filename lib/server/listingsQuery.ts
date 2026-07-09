import 'server-only'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const TARGET_PUBLIC_VIEW = 'marketplace_public_listings_v1'

export type PublicListing = {
  id: string
  slug: string | null
  title: string
  description: string
  category: string
  subcategory?: string | null
  marketplace_section: string
  product_type: string | null
  region: string
  condition: string | null
  location_country: string | null
  location_region?: string | null
  price_amount: number | null
  price_currency: string
  price_display?: string | null
  seller_type: string
  is_featured: boolean
  high_level_specs: Record<string, unknown>
  created_at: string
  average_rating: number | null
  review_count: number | null
}

const SELECT_COLS =
  'id,slug,title,description,category,subcategory,marketplace_section,product_type,region,condition,location_country,location_region,price_amount,price_currency,price_display,seller_type,is_featured,high_level_specs,created_at,average_rating,review_count'

const SORT_ORDERS: Record<string, string> = {
  featured: 'is_featured.desc,created_at.desc',
  rating: 'average_rating.desc.nullslast,review_count.desc,created_at.desc',
}

// Public listing pages are read-heavy and change only when an admin publishes.
// Revalidate every 5 minutes — eliminates the direct DB hit for the vast
// majority of requests while keeping content fresh enough for commercial use.
// Auth-gated pages (my-listings, sell) must NOT use this helper — they call
// Supabase directly with the user session.
const PUBLIC_LISTING_CACHE: RequestInit = { next: { revalidate: 300 } }

async function queryListings(params: URLSearchParams): Promise<PublicListing[]> {
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

function baseParams(limit = 12, sort = 'featured'): URLSearchParams {
  return new URLSearchParams({
    select: SELECT_COLS,
    order: SORT_ORDERS[sort] ?? SORT_ORDERS.featured,
    limit: String(limit),
  })
}

export async function getPublicListings(limit = 20): Promise<PublicListing[]> {
  return queryListings(baseParams(limit))
}

export async function getPublicListingsByCategory(category: string): Promise<PublicListing[]> {
  const p = baseParams()
  // Normalize URL-style slugs (cannabis-inventory) to DB enum format (cannabis_inventory)
  const normalized = category.replace(/-/g, '_')
  p.set('category', `eq.${normalized}`)
  return queryListings(p)
}

export async function getPublicListingsBySection(section: string): Promise<PublicListing[]> {
  const p = baseParams()
  p.set('marketplace_section', `eq.${section}`)
  return queryListings(p)
}

export async function getPublicListingBySlug(slug: string): Promise<PublicListing | null> {
  const p = baseParams()
  p.set('slug', `eq.${slug}`)
  p.set('limit', '1')
  const results = await queryListings(p)
  return results[0] ?? null
}

/**
 * Fetch listings for a set of marketplace_section values, optionally filtered
 * by country ISO2. When countryIso2 is provided, returns rows where
 * location_country matches OR region is 'global'. Falls back to unfiltered
 * if the country-scoped query returns nothing.
 */
// Strict ISO 3166-1 alpha-2 pattern — two uppercase letters only.
const ISO2_RE = /^[A-Z]{2}$/

export async function getListingsBySections(
  sections: string[],
  countryIso2?: string | null,
  limit = 12,
): Promise<PublicListing[]> {
  if (!sections.length) return []

  const p = baseParams(limit)
  p.set('marketplace_section', `in.(${sections.join(',')})`)

  const safeIso2 = countryIso2 && ISO2_RE.test(countryIso2.trim().toUpperCase())
    ? countryIso2.trim().toUpperCase()
    : null

  if (safeIso2) {
    p.set('or', `(location_country.ilike.${safeIso2},region.eq.global)`)
  }

  const rows = await queryListings(p)

  if (countryIso2 && rows.length === 0) {
    const fallback = baseParams(limit)
    fallback.set('marketplace_section', `in.(${sections.join(',')})`)
    return queryListings(fallback)
  }

  return rows
}

export type ListingFilters = {
  region?: string
  productType?: string
  search?: string
  sort?: string
}

/**
 * General-purpose filtered listings fetch used by the main /marketplace/listings
 * page. Category is optional here (unlike getPublicListingsByCategoryFiltered)
 * since that page spans every category at once.
 */
export async function getPublicListingsFiltered(
  filters: ListingFilters & { category?: string } = {},
  limit = 60,
): Promise<PublicListing[]> {
  const p = baseParams(limit, filters.sort)
  if (filters.category && filters.category !== 'all') {
    p.set('category', `eq.${filters.category.replace(/-/g, '_')}`)
  }
  if (filters.region && filters.region !== 'all') {
    p.set('region', `eq.${filters.region}`)
  }
  if (filters.productType && filters.productType !== 'all') {
    p.set('product_type', `ilike.*${filters.productType.replace(/\s+/g, '*')}*`)
  }
  const rows = await queryListings(p)
  if (filters.search) {
    const q = filters.search.toLowerCase()
    return rows.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      (r.product_type ?? '').toLowerCase().includes(q),
    )
  }
  return rows
}

export async function getPublicListingsByCategoryFiltered(
  category: string,
  filters: ListingFilters = {},
  limit = 60,
): Promise<PublicListing[]> {
  return getPublicListingsFiltered({ ...filters, category }, limit)
}
