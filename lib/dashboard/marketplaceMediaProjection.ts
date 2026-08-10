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
}

const REPRESENTATIVE_CAPTION = 'Representative category image. Specifications, supplier fit and commercial terms are available upon inquiry.'
const LOCKED_SUPABASE_HOST = 'zvxdgdkukjrrwamdpqrg.supabase.co'
const PUBLIC_MARKETPLACE_STORAGE_PREFIX = '/storage/v1/object/public/marketplace-item-public/'
const HARBOURVIEW_ASSET_HOSTS = new Set(['harbourview.vercel.app', 'harbourview-platform.vercel.app'])
const LOCAL_ASSET_PREFIXES = ['/marketplace/images/', '/images/consumables/']

const REPRESENTATIVE_MEDIA: Record<MarketView, Pick<MarketplaceProjectionMedia, 'src' | 'altText' | 'caption'>> = {
  cannabis: {
    src: '/marketplace/images/product-inventory.webp',
    altText: 'Representative cannabis product inventory image',
    caption: REPRESENTATIVE_CAPTION,
  },
  wanted: {
    src: '/marketplace/images/product-inventory.webp',
    altText: 'Representative marketplace demand image',
    caption: REPRESENTATIVE_CAPTION,
  },
  opportunities: {
    src: '/marketplace/images/retail-facility.webp',
    altText: 'Representative commercial opportunity image',
    caption: REPRESENTATIVE_CAPTION,
  },
  equipment: {
    src: '/marketplace/images/extraction-equipment.webp',
    altText: 'Representative commercial equipment image',
    caption: REPRESENTATIVE_CAPTION,
  },
  consumables: {
    src: '/marketplace/images/packaging-pouches.webp',
    altText: 'Representative marketplace consumables image',
    caption: REPRESENTATIVE_CAPTION,
  },
  services: {
    src: '/marketplace/images/advisory-services.webp',
    altText: 'Representative professional services image',
    caption: REPRESENTATIVE_CAPTION,
  },
  'new-products': {
    src: '/marketplace/images/grow-lighting.webp',
    altText: 'Representative new product image',
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
    badgeLabel: 'Representative image',
    caption: representative.caption,
    fallbackSrc: representative.src,
    fallbackAltText: representative.altText,
    fallbackCaption: representative.caption ?? REPRESENTATIVE_CAPTION,
  }
}
