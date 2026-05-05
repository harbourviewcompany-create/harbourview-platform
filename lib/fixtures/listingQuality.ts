/**
 * Listing quality validation for Harbourview Marketplace.
 *
 * Every public listing should carry four signals:
 *   1. Deal trigger  — why this is available now (surplus, recurring supply, exit, etc.)
 *   2. Buyer type    — who this is for (licensed operator, dispensary group, processor, etc.)
 *   3. Scale anchor  — how large the opportunity is (volume, units, sq ft, capacity, etc.)
 *   4. Access model  — how to transact (Harbourview-routed, inquiry required, NDA, etc.)
 *
 * Use validateDealListing() to check an individual listing.
 * Use validateAllListings() to get only those with warnings.
 * In production builds, Next.js tree-shakes the dev-only call in ListingCard.
 */

const DEAL_TRIGGER_PATTERNS = [
  /surplus/i,
  /liquidat/i,
  /facil.*clos/i,
  /clos.*facil/i,
  /clos.*operat/i,
  /closing (test|lab|operation)/i,
  /facility upgrade/i,
  /\bexcess\b/i,
  /overstock/i,
  /relocat/i,
  /consolidat/i,
  /retirement\b/i,
  /\bexit\b/i,
  /dormant/i,
  /activat/i,
  /recurring supply/i,
  /replenishment/i,
  /standing[- ]order/i,
  /bulk available/i,
  /available (for|on|now)/i,
  /available per lot/i,
  /immediate (order|sale|purchase)/i,
  /new (capacity|stock|inventory|production|equipment)/i,
  /scale.up/i,
  /expansion project/i,
  /new.*engagement/i,
  /new.*client/i,
  /capacity.*addition/i,
  /bulk supply/i,
  /wholesale.*available/i,
  /\blot available\b/i,
]

const BUYER_TYPE_PATTERNS = [
  /licensed (producer|operator|processor|cultivator|retailer|dispensary|distributor|testing|lab|cannabis)/i,
  /licensed operators?/i,
  /dispensary (group|operator|chain|network)/i,
  /\bdispensaries\b/i,
  /\bprocessor\b/i,
  /\bprocessors\b/i,
  /\bcultivator\b/i,
  /\bcultivators\b/i,
  /\bdistributor\b/i,
  /\bdistributors\b/i,
  /retail operator/i,
  /extraction operator/i,
  /extraction (program|operation|lab)/i,
  /integrated operator/i,
  /cannabis operator/i,
  /packaging operation/i,
  /qualified (buyer|operator|investor|acquirer)/i,
  /import.*licen/i,
  /operators? (holding|seeking|in|with)/i,
]

const SCALE_ANCHOR_PATTERNS = [
  /\d[\d,.]*\s*(lb|lbs|kg|g|units?|seeds?|sq\.?\s*ft|square\s*feet|L\b|litre|liter|gallon)/i,
  /\b(10|20|25|50|100|200|500|1[,.]000|2[,.]000|5[,.]000|10[,.]000|25[,.]000|50[,.]000)\b/,
  /minimum (order|quantity|lot)/i,
  /\d+[- ]ton/i,
  /\d+[- ]pallet/i,
  /\d[\d,.]+\s*(\/\s*)?(month|hour|day|batch|unit|lot)/i,
  /per.unit pricing/i,
  /multi.unit/i,
  /bulk (quantity|pricing|order|lot)/i,
  /high.throughput/i,
  /high.volume/i,
  /commercial (volume|scale|capacity)/i,
  /multi.site/i,
  /multi.location/i,
  /multi.facility/i,
  /\d[\d,.]*\s*sq/i,
  /\d[\d,.]*\s*L\s+(vessel|column|capacity|minimum)/i,
  /\d[\d,.]*\s*[Aa]/i, // ampere for electrical
  /pallet.quantity/i,
  /case pricing/i,
  /lot pricing/i,
  /\d+\s*[×xX]\s*\d+/i, // canopy dimensions like 4×4
]

const ACCESS_MODEL_PATTERNS = [
  /inquiry required/i,
  /inquire to buy/i,
  /harbourview/i,
  /\bintroduction\b/i,
  /NDA required/i,
  /NDA\b/i,
  /routed (through|via)/i,
  /reviewed (by|before)/i,
  /managed (through|via|by)/i,
  /through harbourview/i,
  /via harbourview/i,
  /available on inquiry/i,
  /handled by inquiry/i,
  /inquiry.first/i,
]

export interface ListingQualityWarning {
  signal: 'deal-trigger' | 'buyer-type' | 'scale-anchor' | 'access-model'
  message: string
}

export interface ListingQualityResult {
  id: string
  title: string
  warnings: ListingQualityWarning[]
}

export function validateDealListing(listing: {
  id: string
  title: string
  description: string
  tags: string[]
}): ListingQualityResult {
  const haystack = `${listing.title} ${listing.description} ${listing.tags.join(' ')}`
  const warnings: ListingQualityWarning[] = []

  if (!DEAL_TRIGGER_PATTERNS.some((p) => p.test(haystack))) {
    warnings.push({
      signal: 'deal-trigger',
      message: 'Missing deal trigger — add why this is available (surplus, recurring supply, facility closure, exit, new capacity, etc.)',
    })
  }

  if (!BUYER_TYPE_PATTERNS.some((p) => p.test(haystack))) {
    warnings.push({
      signal: 'buyer-type',
      message: 'Missing target buyer type — specify who this is for (licensed operator, dispensary group, processor, cultivator, etc.)',
    })
  }

  if (!SCALE_ANCHOR_PATTERNS.some((p) => p.test(haystack))) {
    warnings.push({
      signal: 'scale-anchor',
      message: 'Missing scale anchor — include volume, quantity, capacity, facility size or unit count (e.g. 10lb, 25,000 units, 5,000 sq ft)',
    })
  }

  if (!ACCESS_MODEL_PATTERNS.some((p) => p.test(haystack))) {
    warnings.push({
      signal: 'access-model',
      message: 'Missing access model — include how to transact (Inquiry Required, Harbourview-routed, NDA required, etc.)',
    })
  }

  return { id: listing.id, title: listing.title, warnings }
}

/**
 * Returns only listings that have at least one quality warning.
 */
export function validateAllListings(
  listings: Array<{ id: string; title: string; description: string; tags: string[] }>
): ListingQualityResult[] {
  return listings.map(validateDealListing).filter((r) => r.warnings.length > 0)
}
