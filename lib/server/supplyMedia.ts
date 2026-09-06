import { MARKETPLACE_MEDIA_COPY } from '@/lib/dashboard/marketplaceMediaProjection'
import { isSupplyCategory, type SupplyCategory } from '@/lib/server/supplyQuery'

// Reuses the existing, already-approved category representative images and
// canonical trust-disclosure copy from the dashboard marketplace media
// system (lib/dashboard/marketplaceMediaProjection.ts,
// docs/control/MARKETPLACE_MEDIA_COPY.md) rather than a new, ungoverned
// image source. Category-level stand-ins, not per-SKU photos -- the
// "Representative image" badge/caption makes that explicit.

export type SupplyCategoryMedia = {
  src: string
  altText: string
  badgeLabel: string
  caption: string
}

const SUPPLY_CATEGORY_MEDIA: Record<SupplyCategory, Pick<SupplyCategoryMedia, 'src' | 'altText'>> = {
  packaging: {
    src: '/marketplace/images/packaging-pouches.webp',
    altText: 'Representative packaging image for the Harbourview Supply catalog',
  },
  consumables: {
    src: '/marketplace/images/facility-supplies.webp',
    altText: 'Representative consumables image for the Harbourview Supply catalog',
  },
  cultivation_equipment: {
    src: '/marketplace/images/cultivation-inputs.webp',
    altText: 'Representative cultivation equipment image for the Harbourview Supply catalog',
  },
  processing_equipment: {
    src: '/marketplace/images/packaging-equipment.webp',
    altText: 'Representative processing equipment image for the Harbourview Supply catalog',
  },
  labs_testing: {
    src: '/marketplace/images/lab-qa-consumables.webp',
    altText: 'Representative lab and testing image for the Harbourview Supply catalog',
  },
}

const DEFAULT_MEDIA = SUPPLY_CATEGORY_MEDIA.consumables

export function getSupplyCategoryMedia(category: string): SupplyCategoryMedia {
  const base = isSupplyCategory(category) ? SUPPLY_CATEGORY_MEDIA[category as SupplyCategory] : DEFAULT_MEDIA
  return {
    ...base,
    badgeLabel: MARKETPLACE_MEDIA_COPY.representativeBadge,
    caption: MARKETPLACE_MEDIA_COPY.representativeCaption,
  }
}
