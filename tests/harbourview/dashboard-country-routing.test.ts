import { describe, it, expect } from 'vitest'
import {
  resolveCountryRouteParam,
  getDashboardSectionHref,
  getCountryByAlias,
  countryRegistry,
} from '@/lib/dashboard/countryRegistry'

describe('dashboard country routing contract', () => {
  it('resolves valid country route', () => {
    expect(resolveCountryRouteParam('germany')?.iso2).toBe('DE')
  })

  it('resolves aliases to canonical country', () => {
    expect(getCountryByAlias('USA')?.slug).toBe('united-states')
    expect(resolveCountryRouteParam('uk')?.slug).toBe('united-kingdom')
  })

  it('section routes generate correctly', () => {
    expect(getDashboardSectionHref('germany', 'market')).toBe('/dashboard/country/germany/market')
  })

  it('fixture coverage includes required countries', () => {
    for (const slug of ['germany','italy','new-zealand','canada','united-states','united-kingdom','portugal','australia','colombia','israel']) {
      expect(countryRegistry.some((c) => c.slug === slug)).toBe(true)
    }
  })
})
