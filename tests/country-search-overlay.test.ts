import { describe, expect, it } from 'vitest'
import { expandCountrySearchQuery } from '@/components/globe/CountrySearchOverlay'

describe('expandCountrySearchQuery', () => {
  it('resolves supported aliases', () => {
    expect(expandCountrySearchQuery('usa')).toEqual(['US', 'United States'])
    expect(expandCountrySearchQuery('UK')).toEqual(['GB', 'United Kingdom'])
  })

  it('returns empty aliases for unknown query', () => {
    expect(expandCountrySearchQuery('germany')).toEqual([])
  })
})
