import { describe, it, expect } from 'vitest'
import { getDashboardSectionHref, resolveCountryRouteParam, getCountryByAlias, dashboardCountries } from '@/lib/dashboard/countryRegistry'

describe('dashboard route contract', () => {
  it('resolves valid route', () => {
    expect(resolveCountryRouteParam('germany')?.slug).toBe('germany')
  })

  it('resolves aliases to canonical country', () => {
    expect(getCountryByAlias('USA')?.slug).toBe('united-states')
    expect(getCountryByAlias('UK')?.slug).toBe('united-kingdom')
  })

  it('generates section routes', () => {
    expect(getDashboardSectionHref('germany', 'market')).toBe('/dashboard/country/germany/market')
  })

  it('has required fixture countries', () => {
    const slugs = new Set(dashboardCountries.map((c) => c.slug))
    ;['germany','italy','new-zealand','canada','united-states','united-kingdom','portugal','australia','colombia','israel'].forEach((slug)=>expect(slugs.has(slug)).toBe(true))
  })
})
