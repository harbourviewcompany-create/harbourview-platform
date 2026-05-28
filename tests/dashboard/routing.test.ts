import { describe, it, expect } from 'vitest'
import { getCountryByAlias, getCountryBySlug, getDashboardSectionHref, resolveCountryRouteParam } from '@/lib/dashboard/countries'

describe('dashboard routing', () => {
  it('resolves valid country route', () => {
    expect(resolveCountryRouteParam('germany')?.iso2).toBe('DE')
  })
  it('resolves alias to canonical country', () => {
    expect(getCountryByAlias('USA')?.slug).toBe('united-states')
  })
  it('invalid route does not resolve', () => {
    expect(getCountryBySlug('atlantis')).toBeNull()
  })
  it('builds section route', () => {
    expect(getDashboardSectionHref('germany', 'market')).toBe('/dashboard/country/germany/market')
  })
})
