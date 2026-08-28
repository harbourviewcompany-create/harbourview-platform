/**
 * Tier A auto-publish — light safety gate for open commercial categories.
 * Licensed / restricted categories stay needs_review (Tier B).
 */

import { getMarketplaceCategory, isMarketplaceCategoryKey } from './taxonomy'
import { findExcludedConsumablesTerms } from './consumables'
import { findUnsafePublicEquipmentClaims } from './equipment'

export type TierAAutoPublishInput = {
  categoryKey: string
  title: string
  description?: string | null
  listingTypeKey?: string | null
}

export type TierAAutoPublishDecision = {
  /** True when the listing may go straight to approved_draft / public surface. */
  autoPublish: boolean
  /** Candidate status to write on insert. */
  status: 'approved_draft' | 'needs_review'
  /** Human-readable reasons when held for review. */
  holdReasons: string[]
  /** Category is Tier A eligible (public_allowed, no licence review by default). */
  isTierACategory: boolean
}

const CANNABIS_HARD_BLOCK_TERMS = [
  'dried flower',
  'flower lot',
  'biomass',
  'distillate',
  'isolate',
  'thc',
  'cbd oil',
  'clone',
  'genetics program',
  'seed bank',
] as const

function containsHardBlockTerm(text: string): string[] {
  const haystack = text.toLowerCase()
  return CANNABIS_HARD_BLOCK_TERMS.filter(term => haystack.includes(term))
}

/**
 * Decide whether a self-serve submission can auto-publish.
 * Does not mutate data — caller applies status + public draft fields.
 */
export function decideTierAAutoPublish(input: TierAAutoPublishInput): TierAAutoPublishDecision {
  const holdReasons: string[] = []
  const categoryKey = (input.categoryKey || '').trim()
  const title = (input.title || '').trim()
  const description = (input.description || '').trim()
  const combined = `${title} ${description}`

  if (!categoryKey || !isMarketplaceCategoryKey(categoryKey)) {
    return {
      autoPublish: false,
      status: 'needs_review',
      holdReasons: ['invalid_or_missing_category'],
      isTierACategory: false,
    }
  }

  const category = getMarketplaceCategory(categoryKey)
  if (!category) {
    return {
      autoPublish: false,
      status: 'needs_review',
      holdReasons: ['unknown_category'],
      isTierACategory: false,
    }
  }

  const isTierACategory =
    category.publicVisibilityMode === 'public_allowed' &&
    !category.requiresLicenseReview &&
    !category.restrictedByDefault

  if (!isTierACategory) {
    holdReasons.push('category_requires_manual_review')
    if (category.requiresLicenseReview) holdReasons.push('licence_review_required')
    if (category.restrictedByDefault) holdReasons.push('restricted_by_default')
    if (category.publicVisibilityMode !== 'public_allowed') {
      holdReasons.push(`visibility_${category.publicVisibilityMode}`)
    }
    return {
      autoPublish: false,
      status: 'needs_review',
      holdReasons,
      isTierACategory: false,
    }
  }

  if (title.length < 3) {
    holdReasons.push('title_too_short')
  }

  const excluded = findExcludedConsumablesTerms(combined)
  if (excluded.length > 0) {
    holdReasons.push(`excluded_terms:${excluded.join(',')}`)
  }

  const hardBlocks = containsHardBlockTerm(combined)
  if (hardBlocks.length > 0) {
    holdReasons.push(`regulated_product_terms:${hardBlocks.join(',')}`)
  }

  // Equipment-ish categories: soft-check unsafe public claims (does not require full subcategory validation for self-serve)
  const equipmentKeys = new Set([
    'cultivation_equipment',
    'processing_equipment',
    'new_products',
    'used_surplus',
  ])
  if (equipmentKeys.has(categoryKey)) {
    try {
      const unsafe = findUnsafePublicEquipmentClaims(combined)
      if (unsafe.length > 0) {
        holdReasons.push(`unsafe_equipment_claims:${unsafe.join(',')}`)
      }
    } catch {
      // equipment helper may be strict; never block auto-publish path on import errors
    }
  }

  if (holdReasons.length > 0) {
    return {
      autoPublish: false,
      status: 'needs_review',
      holdReasons,
      isTierACategory: true,
    }
  }

  return {
    autoPublish: true,
    status: 'approved_draft',
    holdReasons: [],
    isTierACategory: true,
  }
}

export function tierAAutoPublishSuccessMessage(autoPublish: boolean): string {
  if (autoPublish) {
    return 'Listing published. It is now visible on the open market. Buyers can contact you through Harbourview.'
  }
  return 'Submission received. Harbourview will review your listing within 2 business days.'
}
