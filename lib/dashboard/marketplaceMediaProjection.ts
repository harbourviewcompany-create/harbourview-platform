import type { MarketView } from '@/components/dashboard/CommandCentre'
import { getSubjectRepresentativeMedia } from '@/lib/dashboard/marketplaceSubjectMedia'

export type MarketplaceMediaKind = 'actual' | 'catalogue' | 'representative'

export type MarketplaceProjectionMedia = {
  src: string
  altText: string
  kind: MarketplaceMediaKind
  badgeLabel: string | null
  caption: string | null
  fallbackSrc: string
  fallbackAltText: string
  fallbackCaption: string
}

export type MarketplaceMediaById = Record<string, MarketplaceProjectionMedia>

export type DashboardMarketplaceProjection = {
  rows: Partial<Record<MarketView, import('@/components/dashboard/CommandCentre').MarketRow[]>>
  mediaById: MarketplaceMediaById
  mediaStatus: 'live' | 'degraded'
}

// Controlled trust/risk copy. Canonical source: docs/control/MARKETPLACE_MEDIA_COPY.md
export const MARKETPLACE_MEDIA_COPY = Object.freeze({
  representativeBadge: 'Representative image',
  catalogueBadge: 'Manufacturer catalogue image',
  degradedNotice: 'Marketplace images are temporarily degraded; representative images may be shown while approved media is reloaded.',
  representativeCaption: 'Representative category image. Specifications, supplier fit and commercial terms are available upon inquiry.',
})

const LOCKED_SUPABASE_HOST = 'zvxdgdkukjrrwamdpqrg.supabase.co'
const PUBLIC_MARKETPLACE_STORAGE_PREFIX = '/storage/v1/object/public/marketplace-item-public/'
const HARBOURVIEW_ASSET_HOSTS = new Set(['harbourview.vercel.app', 'harbourview-platform.vercel.app', 'ourview.vercel.app'])
const LOCAL_ASSET_PREFIXES = ['/marketplace/images/', '/images/consumables/']

export function marketplaceMediaKey(view: MarketView, listingId: string): string {
  return `${view}:${listingId}`
}

export function toRenderableMarketplaceMediaSrc(value: string | null | undefined): string | null {
  const raw = value?.trim()
  if (!raw) return null

  if (raw.startsWith('/')) {
    return LOCAL_ASSET_PREFIXES.some(prefix => raw.startsWith(prefix)) ? raw : null
  }

  try {
    const url = new URL(raw)
    if (url.protocol !== 'https:') return null
    if (url.hostname === LOCKED_SUPABASE_HOST) {
      return url.pathname.startsWith(PUBLIC_MARKETPLACE_STORAGE_PREFIX) ? url.toString() : null
    }
    if (
      HARBOURVIEW_ASSET_HOSTS.has(url.hostname)
      && LOCAL_ASSET_PREFIXES.some(prefix => url.pathname.startsWith(prefix))
    ) {
      return `${url.pathname}${url.search}`
    }
  } catch {
    return null
  }

  return null
}

/** Subject-aligned representative media (PR1307 id map + keyword rules + view default). */
export function getRepresentativeMarketplaceMedia(
  view: MarketView,
  listingId?: string | null,
  title?: string | null,
  category?: string | null,
): MarketplaceProjectionMedia {
  return getSubjectRepresentativeMedia(view, listingId, title, category)
}
