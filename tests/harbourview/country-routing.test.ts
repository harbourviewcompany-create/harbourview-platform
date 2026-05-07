import { describe, it, expect } from 'vitest'
import { getSafeCountrySlug } from '@/lib/harbourview/country-routing'

describe('country routing', () => {
  it('returns valid slug', () => {
    expect(getSafeCountrySlug('germany')).toBe('germany')
  })

  it('rejects invalid slug', () => {
    expect(getSafeCountrySlug('DROP TABLE')).toBe(null)
  })
})
