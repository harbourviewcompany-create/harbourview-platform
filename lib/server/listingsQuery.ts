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
}

async function queryListings(params: URLSearchParams): Promise<PublicListing[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return []
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TARGET_PUBLIC_VIEW}?${params.toString()}`, {
      cache: 'no-store',
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

const BASE_PARAMS = new URLSearchParams({
  select:
    'id,slug,title,description,category,subcategory,marketplace_section,product_type,region,condition,location_country,location_region,price_amount,price_currency,price_display,seller_type,is_featured,high_level_specs,created_at',
  order: 'is_featured.desc,created_at.desc',
})

export async function getPublicListings(): Promise<PublicListing[]> {
  return queryListings(new URLSearchParams(BASE_PARAMS))
}

export async function getPublicListingsByCategory(category: string): Promise<PublicListing[]> {
  const p = new URLSearchParams(BASE_PARAMS)
  p.set('category', `eq.${category}`)
  return queryListings(p)
}

export async function getPublicListingsBySection(section: string): Promise<PublicListing[]> {
  const p = new URLSearchParams(BASE_PARAMS)
  p.set('marketplace_section', `eq.${section}`)
  return queryListings(p)
}

export async function getPublicListingBySlug(slug: string): Promise<PublicListing | null> {
  const p = new URLSearchParams(BASE_PARAMS)
  p.set('slug', `eq.${slug}`)
  p.set('limit', '1')
  const results = await queryListings(p)
  return results[0] ?? null
}
