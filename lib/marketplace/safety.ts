/**
 * Marketplace listing field sanitization — strips "source hints" (which
 * scraper/aggregator a listing was sourced from, which internal sourcing
 * bucket it sits in, raw auction/source-site provenance) before a listing
 * is shown to the public. Mirrors the fuzzy term-matching approach already
 * used in lib/regulatory-signals/safety.ts, applied here as a sanitize
 * (replace-with-safe-default) operation rather than a detect-and-throw one.
 *
 * This was a complete gap until now: toPublicMarketplaceListing() was a
 * pure passthrough with no sanitization at all — confirmed via two
 * pre-existing failing tests (public-leakage-fuzz, public-safety-fuzz)
 * that expected this behavior and had no implementation behind it.
 */

const FORBIDDEN_SOURCE_HINT_TERMS = [
  'machinio',
  'supplier directory',
  'source url',
  'supplier direct',
  'auction',
  'supplier website',
  'source listing',
  'listed by source',
  'source hidden',
] as const

function buildSourceHintPattern(term: string): RegExp {
  const parts = term
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const body = parts.join('[\\s_-]+')
  return new RegExp(body, 'i')
}

const FORBIDDEN_SOURCE_HINT_PATTERNS = FORBIDDEN_SOURCE_HINT_TERMS.map(buildSourceHintPattern)

export function containsMarketplaceSourceHint(value: string | undefined | null): boolean {
  if (!value) return false
  return FORBIDDEN_SOURCE_HINT_PATTERNS.some((pattern) => pattern.test(value))
}

export const SAFE_TITLE_FALLBACK = 'Reviewed commercial opportunity'
export const SAFE_SECTION_FALLBACK = 'Featured Opportunities'
export const SAFE_CATEGORY_FALLBACK = 'Commercial Opportunity'
export const SAFE_LOCATION_FALLBACK = 'Available on request'
export const SAFE_PRICE_FALLBACK = 'Price on request'
export const SAFE_BUYER_FIT_FALLBACK = ['Qualified buyers'] as const

/** Replaces a field's value with its safe fallback if it contains a source hint, otherwise passes it through unchanged. */
export function sanitizeMarketplaceField(value: string, fallback: string): string {
  return containsMarketplaceSourceHint(value) ? fallback : value
}

export function sanitizeMarketplaceBuyerFit(buyerFit: readonly string[]): string[] {
  if (buyerFit.some((entry) => containsMarketplaceSourceHint(entry))) {
    return [...SAFE_BUYER_FIT_FALLBACK]
  }
  return [...buyerFit]
}
