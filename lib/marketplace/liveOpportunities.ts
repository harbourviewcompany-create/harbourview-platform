import type { Listing, ListingImage, ListingImageStatus } from '@/lib/fixtures/types'

export interface LiveOpportunityRecord {
  id?: unknown
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
  sourceUrl?: unknown
  sourceName?: unknown
  supplierEmail?: unknown
  contactEmail?: unknown
  provenance?: unknown
  rawSupplierMetadata?: unknown
  internalNotes?: unknown
}

const fallbackContactEmail = 'harbourviewcompany@gmail.com'
const allowedImageProtocols = new Set(['https:'])
const blockedImageHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0'])

function asText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

function asTags(value: unknown): string[] {
  if (!Array.isArray(value)) return ['Inquiry Required']

  const tags = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)

  return tags.length > 0 ? tags : ['Inquiry Required']
}

function asImageStatus(value: unknown): ListingImageStatus {
  if (value === 'supplier-provided' || value === 'verified') return value
  return 'representative'
}

function asImageAssetSource(value: unknown): ListingImage['assetSource'] {
  if (
    value === 'supplier_provided' ||
    value === 'licensed_stock' ||
    value === 'internal_photo' ||
    value === 'generated'
  ) {
    return value
  }

  return 'supplier_provided'
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

export function normalizeLiveOpportunity(record: LiveOpportunityRecord): Listing | null {
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

function getFeedUrl(): string | null {
  const feedUrl = process.env.HARBOURVIEW_CONSUMABLES_FEED_URL?.trim()
  if (!feedUrl) return null

  try {
    const url = new URL(feedUrl)
    return url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

export async function getLiveConsumableOpportunities(fallbackListings: Listing[]): Promise<Listing[]> {
  const feedUrl = getFeedUrl()
  if (!feedUrl) return fallbackListings

  try {
    const response = await fetch(feedUrl, {
      headers: { accept: 'application/json' },
      next: { revalidate: 300 },
    })

    if (!response.ok) return fallbackListings

    const payload: unknown = await response.json()
    const records = Array.isArray(payload) ? payload : []
    const liveListings = records
      .map((record) => normalizeLiveOpportunity(record as LiveOpportunityRecord))
      .filter((listing): listing is Listing => Boolean(listing))

    return liveListings.length > 0 ? liveListings : fallbackListings
  } catch {
    return fallbackListings
  }
}
