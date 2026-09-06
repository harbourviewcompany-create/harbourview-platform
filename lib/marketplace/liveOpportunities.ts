import type {
  BusinessOpportunity,
  Listing,
  ListingImage,
  ListingImageStatus,
} from '@/lib/marketplace/listingTypes'

type ListingWithReplyAddress = Listing
export type BusinessOpportunityWithPublicSlug = BusinessOpportunity & { slug?: string | null }

export interface LiveOpportunityRecord {
  id?: unknown
  slug?: unknown
  title?: unknown
  description?: unknown
  price?: unknown
  location?: unknown
  tags?: unknown
  postedDate?: unknown
  imageSrc?: unknown
  imageAlt?: unknown
  imageStatus?: unknown
  imageCaption?: unknown
  imageAssetSource?: unknown
  opportunityType?: unknown
  licenseType?: unknown
  state?: unknown
  reviewStatus?: unknown
  publicationStatus?: unknown
  publicVisibility?: unknown
  visibility?: unknown
  expiresAt?: unknown
}

export interface LiveBusinessOpportunityResult {
  listings: BusinessOpportunityWithPublicSlug[]
  source: 'live' | 'fixture' | 'empty' | 'error'
}

const allowedImageProtocols = new Set(['https:'])
const blockedImageHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0'])

function asText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

function asTags(value: unknown): string[] {
  if (!Array.isArray(value)) return ['Inquiry Required']
  const tags = value.filter((item): item is string => typeof item === 'string').map(s => s.trim()).filter(Boolean)
  return tags.length > 0 ? tags : ['Inquiry Required']
}

function asImageStatus(value: unknown): ListingImageStatus {
  if (value === 'supplier-provided' || value === 'verified') return value
  return 'representative'
}

function asImageAssetSource(value: unknown): ListingImage['assetSource'] {
  if (value === 'supplier_provided' || value === 'licensed_stock' || value === 'internal_photo' || value === 'generated') return value
  return 'supplier_provided'
}

function asOpportunityType(value: unknown): BusinessOpportunity['opportunityType'] {
  if (value === 'acquisition' || value === 'partnership' || value === 'lease' || value === 'license-transfer') return value
  return 'partnership'
}

function isApprovedForPublic(record: LiveOpportunityRecord): boolean {
  const visibility = record.publicVisibility || record.visibility
  const expiresAt = asText(record.expiresAt)
  const parsedExpiry = expiresAt ? Date.parse(expiresAt) : NaN
  const isCurrent = !expiresAt || Number.isNaN(parsedExpiry) || parsedExpiry > Date.now()
  return (
    record.reviewStatus === 'approved' &&
    record.publicationStatus === 'published' &&
    visibility === 'public' &&
    isCurrent
  )
}

export function isValidPublicImageUrl(value: unknown): value is string {
  const imageUrl = asText(value)
  if (!imageUrl) return false
  try {
    const parsed = new URL(imageUrl)
    if (!allowedImageProtocols.has(parsed.protocol)) return false
    if (blockedImageHosts.has(parsed.hostname.toLowerCase())) return false
    if (!parsed.hostname.includes('.')) return false
    return true
  } catch {
    return false
  }
}

function normalizeBusinessOpportunity(record: LiveOpportunityRecord): BusinessOpportunityWithPublicSlug | null {
  if (!isApprovedForPublic(record)) return null
  const id = asText(record.id)
  const title = asText(record.title)
  const description = asText(record.description)
  if (!id || !title || !description) return null
  const imageSrc = isValidPublicImageUrl(record.imageSrc) ? record.imageSrc : undefined
  return {
    id,
    slug: asText(record.slug) ?? null,
    category: 'business-opportunities',
    title,
    description,
    opportunityType: asOpportunityType(record.opportunityType),
    licenseType: asText(record.licenseType),
    state: asText(record.state) || 'Review required',
    price: asText(record.price) || 'Price on request',
    location: asText(record.location) || 'Region confirmed by inquiry',
    tags: asTags(record.tags),
    postedDate: asText(record.postedDate) || new Date().toISOString().slice(0, 10),
    image: imageSrc
      ? {
          src: imageSrc,
          alt: asText(record.imageAlt) || title,
          status: asImageStatus(record.imageStatus),
          caption: asText(record.imageCaption),
          assetSource: asImageAssetSource(record.imageAssetSource),
        }
      : undefined,
  }
}

function sanitizeBusinessOpportunity(listing: BusinessOpportunityWithPublicSlug): BusinessOpportunityWithPublicSlug {
  return {
    id: listing.id,
    slug: listing.slug ?? null,
    category: 'business-opportunities',
    title: listing.title,
    description: listing.description,
    opportunityType: listing.opportunityType,
    licenseType: listing.licenseType,
    state: listing.state,
    price: listing.price,
    location: listing.location,
    tags: listing.tags,
    postedDate: listing.postedDate,
    image: listing.image,
  }
}

function getFeedUrl(envKey: string): string | null {
  const feedUrl = process.env[envKey]?.trim()
  if (!feedUrl) return null
  try {
    const url = new URL(feedUrl)
    return url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

function extractRecords(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload
  if (payload && typeof payload === 'object' && Array.isArray((payload as { records?: unknown }).records)) {
    return (payload as { records: unknown[] }).records
  }
  return []
}

// ── Supabase marketplace_public_listings_v1 fallback ─────────────────────────
// Queries the approved/public marketplace listings view as a secondary source
// when no external feed URL is configured. Returns records already shaped as
// BusinessOpportunityWithPublicSlug (opportunityType defaults to 'partnership').
async function fromSupabaseListings(): Promise<BusinessOpportunityWithPublicSlug[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return []

  try {
    const params = new URLSearchParams({
      select: 'id,slug,title,description,category,subcategory,product_type,region,condition,price_display,price_amount,price_currency,seller_type,created_at',
      order:  'created_at.desc',
      limit:  '24',
    })

    const res = await fetch(`${url}/rest/v1/marketplace_public_listings_v1?${params}`, {
      // Anon holds SELECT on api.marketplace_public_listings_v1 only; the
      // public.* view of the same name is service_role-only, and `public` is
      // PostgREST's default schema here.
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: 'application/json',
        'Accept-Profile': 'api',
      },
      next: { revalidate: 300 },
    })

    if (!res.ok) return []
    const rows: Record<string, unknown>[] = await res.json()
    if (!Array.isArray(rows) || rows.length === 0) return []

    return rows
      .map(row => {
        const priceParts = [row.price_currency, row.price_amount].filter(Boolean)
        return normalizeBusinessOpportunity({
          id:                row.id,
          slug:              row.slug,
          title:             row.title,
          description:       row.description,
          price:             row.price_display ?? (priceParts.length ? priceParts.join(' ') : 'Price on request'),
          location:          row.region ?? 'Global',
          tags:              [row.category, row.product_type, row.subcategory].filter(Boolean),
          postedDate:        typeof row.created_at === 'string' ? row.created_at.slice(0, 10) : undefined,
          opportunityType:   'partnership',
          licenseType:       row.seller_type,
          state:             row.condition ?? 'Available',
          // View already filters status=approved/published + public_visibility=true
          reviewStatus:      'approved',
          publicationStatus: 'published',
          publicVisibility:  'public',
        })
      })
      .filter((l): l is BusinessOpportunityWithPublicSlug => l !== null)
  } catch {
    return []
  }
}

// ── getLiveBusinessOpportunities ──────────────────────────────────────────────
// Priority:
//   1. External feed (HARBOURVIEW_BUSINESS_OPPORTUNITIES_FEED_URL)
//   2. Supabase marketplace_public_listings_v1  ← new
//   3. Fixture fallback
export async function getLiveBusinessOpportunities(
  fallbackListings: BusinessOpportunity[],
): Promise<LiveBusinessOpportunityResult> {
  const fallback = fallbackListings.map(sanitizeBusinessOpportunity)

  // 1. External operator-configured feed
  const feedUrl = getFeedUrl('HARBOURVIEW_BUSINESS_OPPORTUNITIES_FEED_URL')
  if (feedUrl) {
    try {
      const response = await fetch(feedUrl, {
        headers: { accept: 'application/json' },
        next: { revalidate: 300 },
      })
      if (response.ok) {
        const payload: unknown = await response.json()
        const liveListings = extractRecords(payload)
          .map(record => normalizeBusinessOpportunity(record as LiveOpportunityRecord))
          .filter((l): l is BusinessOpportunityWithPublicSlug => Boolean(l))
        if (liveListings.length > 0) return { listings: liveListings, source: 'live' }
      }
    } catch { /* fall through to Supabase */ }
  }

  // 2. Supabase marketplace_public_listings_v1
  const dbListings = await fromSupabaseListings()
  if (dbListings.length > 0) return { listings: dbListings, source: 'live' }

  // 3. Fixture fallback
  return { listings: fallback, source: fallback.length > 0 ? 'fixture' : 'empty' }
}

export function normalizeLiveOpportunity(record: LiveOpportunityRecord): ListingWithReplyAddress | null {
  const id = asText(record.id)
  const title = asText(record.title)
  const description = asText(record.description)
  if (!id || !title || !description) return null
  const imageSrc = isValidPublicImageUrl(record.imageSrc) ? record.imageSrc : undefined
  return {
    id,
    title,
    description,
    price: asText(record.price) || 'Price on request',
    location: asText(record.location) || 'Region confirmed by inquiry',
    tags: asTags(record.tags),
    postedDate: asText(record.postedDate) || new Date().toISOString().slice(0, 10),
    image: imageSrc
      ? {
          src: imageSrc,
          alt: asText(record.imageAlt) || title,
          status: asImageStatus(record.imageStatus),
          caption: asText(record.imageCaption),
          assetSource: asImageAssetSource(record.imageAssetSource),
        }
      : undefined,
  }
}

export async function getLiveConsumableOpportunities(fallbackListings: Listing[]): Promise<ListingWithReplyAddress[]> {
  const feedUrl = getFeedUrl('HARBOURVIEW_CONSUMABLES_FEED_URL')
  if (!feedUrl) return fallbackListings
  try {
    const response = await fetch(feedUrl, {
      headers: { accept: 'application/json' },
      next: { revalidate: 300 },
    })
    if (!response.ok) return fallbackListings
    const payload: unknown = await response.json()
    const liveListings = extractRecords(payload)
      .map(record => normalizeLiveOpportunity(record as LiveOpportunityRecord))
      .filter((l): l is ListingWithReplyAddress => Boolean(l))
    return liveListings.length > 0 ? liveListings : fallbackListings
  } catch {
    return fallbackListings
  }
}
