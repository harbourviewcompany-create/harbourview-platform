import type { Listing, ListingImage, ListingImageStatus } from '@/lib/fixtures/types'

interface LiveOpportunityRecord {
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
}

const fallbackContactEmail = 'harbourviewcompany@gmail.com'

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

function normalizeLiveOpportunity(record: LiveOpportunityRecord): Listing | null {
  const id = asText(record.id)
  const title = asText(record.title)
  const description = asText(record.description)

  if (!id || !title || !description) return null

  const imageSrc = asText(record.imageSrc)

  return {
    id,
    title,
    description,
    price: asText(record.price) || 'Price on request',
    location: asText(record.location) || 'Region confirmed by inquiry',
    tags: asTags(record.tags),
    postedDate: asText(record.postedDate) || new Date().toISOString().slice(0, 10),
    contactEmail: fallbackContactEmail,
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
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null
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
