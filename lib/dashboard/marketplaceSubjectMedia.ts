import type { MarketView } from '@/components/dashboard/CommandCentre'
import {
  LISTING_SUBJECT_ASSETS,
  SUBJECT_MEDIA_RULES,
} from './marketplaceSubjectAssets'
import type { MarketplaceProjectionMedia } from './marketplaceMediaProjection'

const LOCKED_SUPABASE_HOST = 'zvxdgdkukjrrwamdpqrg.supabase.co'
const PUBLIC_MARKETPLACE_STORAGE_PREFIX = '/storage/v1/object/public/marketplace-item-public/'
const PUBLIC_MEDIA_BASE = `https://${LOCKED_SUPABASE_HOST}${PUBLIC_MARKETPLACE_STORAGE_PREFIX}`
const REPRESENTATIVE_BADGE = 'Representative image'
const REPRESENTATIVE_CAPTION =
  'Representative category image. Specifications, supplier fit and commercial terms are available upon inquiry.'

const VIEW_DEFAULT_ASSET: Record<MarketView, string> = {
  cannabis: 'representative/v6/dried-flower.png',
  wanted: 'representative/v6/dried-flower.png',
  opportunities: 'representative/v5/retail-facility.png',
  equipment: 'representative/v5/co2-extraction-system.png',
  consumables: 'representative/v2/packaging-pouches.png',
  services: 'representative/v2/advisory-services.png',
  'new-products': 'representative/v2/grow-lighting.png',
}

function toPublicSrc(assetPath: string): string {
  if (assetPath.startsWith('http')) return assetPath
  return `${PUBLIC_MEDIA_BASE}${assetPath.replace(/^\//, '')}`
}

/**
 * Resolve the best subject-aligned representative asset for a listing.
 * Priority: exact listing id (PR1307) → title/category keyword rules → view default.
 */
export function resolveSubjectAssetPath(
  view: MarketView,
  listingId?: string | null,
  title?: string | null,
  category?: string | null,
): string {
  if (listingId && LISTING_SUBJECT_ASSETS[listingId]) {
    return LISTING_SUBJECT_ASSETS[listingId]
  }

  const haystack = `${title ?? ''} ${category ?? ''}`.toLowerCase()
  if (haystack.trim()) {
    for (const rule of SUBJECT_MEDIA_RULES) {
      if (rule.terms.some(term => haystack.includes(term))) {
        return rule.asset
      }
    }
  }

  return VIEW_DEFAULT_ASSET[view]
}

export function getSubjectRepresentativeMedia(
  view: MarketView,
  listingId?: string | null,
  title?: string | null,
  category?: string | null,
): MarketplaceProjectionMedia {
  const asset = resolveSubjectAssetPath(view, listingId, title, category)
  const src = toPublicSrc(asset)
  const altText = title
    ? `Representative image for ${title}`
    : 'Representative category image'

  return {
    src,
    altText,
    kind: 'representative',
    badgeLabel: REPRESENTATIVE_BADGE,
    caption: REPRESENTATIVE_CAPTION,
    fallbackSrc: src,
    fallbackAltText: altText,
    fallbackCaption: REPRESENTATIVE_CAPTION,
  }
}
