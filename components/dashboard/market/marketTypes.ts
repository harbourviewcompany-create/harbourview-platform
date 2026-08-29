/**
 * Market UI types — Tier A (open commercial) vs Tier B (licensed / gated).
 * Tier is derived from the canonical marketplace taxonomy so UI contact paths
 * cannot drift from licence-review or restricted-category policy.
 */

import { getMarketplaceCategory, isMarketplaceCategoryKey } from '@/lib/marketplace/taxonomy'

export type MarketCardVariant =
  | 'tierA-compact'
  | 'tierA-featured'
  | 'tierB-teaser'
  | 'catalogue'

export type MarketTier = 'A' | 'B'

export type MarketCardMediaKind = 'actual' | 'catalogue' | 'representative'

export type MarketCardMedia = {
  src: string
  altText: string
  kind: MarketCardMediaKind
  badgeLabel: string | null
  caption: string | null
  fallbackSrc: string
  fallbackAltText: string
  fallbackCaption: string | null
}

export type MarketFeedRow =
  | { type: 'grid'; id: string; items: MarketCardModel[] }
  | { type: 'rail'; id: string; title: string; items: MarketCardModel[] }
  | { type: 'featured'; id: string; item: MarketCardModel }

export type MarketCardModel = {
  id: string
  slug?: string | null
  title: string
  description?: string | null
  priceDisplay: string
  imageUrl?: string | null
  media?: MarketCardMedia | null
  country?: string | null
  countryIso2?: string | null
  condition?: string | null
  category?: string | null
  badge?: string | null
  badgeTone?: 'ok' | 'warn' | 'muted'
  variant: MarketCardVariant
  tier: MarketTier
  ctaLabel: string
}

export type MarketFilterChip = {
  id: string
  label: string
  active?: boolean
  tone?: 'default' | 'gold'
}

export type MarketSegmentTab = {
  id: string
  label: string
  count?: number
}

export function resolveMarketTier(categoryKey: string | null | undefined): MarketTier {
  if (!categoryKey || !isMarketplaceCategoryKey(categoryKey)) return 'B'
  const category = getMarketplaceCategory(categoryKey)
  if (!category) return 'B'
  return category.publicVisibilityMode === 'public_allowed' &&
    !category.requiresLicenseReview &&
    !category.restrictedByDefault
    ? 'A'
    : 'B'
}

export function defaultCtaForTier(tier: MarketTier, catalogue = false): string {
  if (catalogue) return 'View details'
  return tier === 'A' ? 'Contact seller' : 'Request review'
}
