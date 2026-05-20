import { describe, expect, it } from 'vitest'
import { containsForbiddenRegulatorySignalLeakage } from '@/lib/regulatory-signals/safety'
import { toPublicMarketplaceListing } from '@/lib/marketplace/publicListings'
import { marketplaceListings } from '@/lib/marketplace/listings'

function mkListing(overrides: Record<string, unknown>) {
  return { ...marketplaceListings[0], ...overrides }
}

describe('public safety fuzz', () => {
  it('blocks common obfuscated regulatory leakage terms', () => {
    const variants = ['SOURCE_URL', 'sourceUrl', 'source url', 'buyer_demand', 'INTERNAL review']
    for (const term of variants) {
      expect(containsForbiddenRegulatorySignalLeakage(`payload: ${term}`)).toBe(true)
    }
  })

  it('sanitizes marketplace listing source hints', () => {
    const projected = toPublicMarketplaceListing(mkListing({
      title: 'Machinio extractor listing',
      section: 'Supplier Directory',
      category: 'source listing equipment',
      location: 'supplier direct - US',
    }))

    expect(projected.title).toBe('Reviewed commercial opportunity')
    expect(projected.section).toBe('Featured Opportunities')
    expect(projected.category).toBe('Commercial Opportunity')
    expect(projected.location).toBe('Available on request')
  })
})
