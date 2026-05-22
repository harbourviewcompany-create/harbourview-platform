import { describe, expect, it } from 'vitest'
import { getMarketplaceListing } from '@/lib/marketplace/listings'
import { toPublicMarketplaceListing } from '@/lib/marketplace/publicListings'
import { containsForbiddenRegulatorySignalLeakage } from '@/lib/regulatory-signals/safety'

describe('public leakage fuzz checks', () => {
  it('sanitizes marketplace fields with obfuscated forbidden text variants', () => {
    const sourceListing = getMarketplaceListing('equipnet-online-auctions-lab-production-equipment')
    if (!sourceListing) throw new Error('fixture listing not found')

    const projected = toPublicMarketplaceListing({
      ...sourceListing,
      section: 'Supplier Directory',
      title: 'MACHINIO direct listing',
      category: 'supplier   directory lead',
      location: 'source URL hidden',
      price: 'auction context',
      buyerFit: ['supplier website mention'],
      complianceNote: 'listed by source',
    })

    expect(projected.title).toBe('Reviewed commercial opportunity')
    expect(projected.section).toBe('Featured Opportunities')
    expect(projected.location).toBe('Available on request')
    expect(projected.price).toBe('Price on request')
    expect(projected.buyerFit).toEqual(['Qualified buyers'])
  })

  it('detects forbidden regulatory signal leakage terms regardless of case', () => {
    expect(containsForbiddenRegulatorySignalLeakage('Contains RAW Excerpt from source')).toBe(true)
    expect(containsForbiddenRegulatorySignalLeakage('Public-safe statement only')).toBe(false)
  })
})
