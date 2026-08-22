import type { MarketView } from '@/components/dashboard/CommandCentre'

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

const REPRESENTATIVE_CAPTION = MARKETPLACE_MEDIA_COPY.representativeCaption
const LOCKED_SUPABASE_HOST = 'zvxdgdkukjrrwamdpqrg.supabase.co'
const PUBLIC_MARKETPLACE_STORAGE_PREFIX = '/storage/v1/object/public/marketplace-item-public/'
const PUBLIC_MEDIA_BASE = `https://${LOCKED_SUPABASE_HOST}${PUBLIC_MARKETPLACE_STORAGE_PREFIX}`
const HARBOURVIEW_ASSET_HOSTS = new Set(['harbourview.vercel.app', 'harbourview-platform.vercel.app', 'ourview.vercel.app'])
const LOCAL_ASSET_PREFIXES = ['/marketplace/images/', '/images/consumables/']

// Approved illustrative assets from PR1307 media final (public marketplace-item-public bucket).
const REPRESENTATIVE_MEDIA: Record<MarketView, Pick<MarketplaceProjectionMedia, 'src' | 'altText' | 'caption'>> = {
  cannabis: {
    src: `${PUBLIC_MEDIA_BASE}representative/v6/dried-flower.png`,
    altText: 'Representative dried medicinal flower in stainless sample tray with bulk pouch and amber jar',
    caption: REPRESENTATIVE_CAPTION,
  },
  wanted: {
    src: `${PUBLIC_MEDIA_BASE}representative/v6/dried-flower.png`,
    altText: 'Representative marketplace demand image — dried medicinal flower product class',
    caption: REPRESENTATIVE_CAPTION,
  },
  opportunities: {
    src: `${PUBLIC_MEDIA_BASE}representative/v5/retail-facility.png`,
    altText: 'Representative regulated dispensary or commercial facility interior',
    caption: REPRESENTATIVE_CAPTION,
  },
  equipment: {
    src: `${PUBLIC_MEDIA_BASE}representative/v5/co2-extraction-system.png`,
    altText: 'Representative commercial extraction equipment',
    caption: REPRESENTATIVE_CAPTION,
  },
  consumables: {
    src: `${PUBLIC_MEDIA_BASE}representative/v2/packaging-pouches.png`,
    altText: 'Representative child-resistant packaging pouches',
    caption: REPRESENTATIVE_CAPTION,
  },
  services: {
    src: `${PUBLIC_MEDIA_BASE}representative/v2/advisory-services.png`,
    altText: 'Representative professional advisory services workspace',
    caption: REPRESENTATIVE_CAPTION,
  },
  'new-products': {
    src: `${PUBLIC_MEDIA_BASE}representative/v2/grow-lighting.png`,
    altText: 'Representative commercial horticultural LED lighting',
    caption: REPRESENTATIVE_CAPTION,
  },
}

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

export function getRepresentativeMarketplaceMedia(view: MarketView): MarketplaceProjectionMedia {
  const representative = REPRESENTATIVE_MEDIA[view]
  return {
    src: representative.src,
    altText: representative.altText,
    kind: 'representative',
    badgeLabel: MARKETPLACE_MEDIA_COPY.representativeBadge,
    caption: representative.caption,
    fallbackSrc: representative.src,
    fallbackAltText: representative.altText,
    fallbackCaption: representative.caption ?? REPRESENTATIVE_CAPTION,
  }
}
