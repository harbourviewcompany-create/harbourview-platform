import { describe, expect, it } from 'vitest'
import {
  buildCountryDashboardHref,
  legacyCountryProfileSlug,
  resolveCountryDashboardTarget,
} from '@/lib/dashboard/navigationRoutes'

describe('mobile dashboard navigation routes', () => {
  it('preserves the selected country across dashboard destinations', () => {
    expect(buildCountryDashboardHref('mexico')).toBe('/dashboard?country=MX')
    expect(buildCountryDashboardHref('mexico', 'marketplace')).toBe('/dashboard?country=MX&page=marketplace')
    expect(buildCountryDashboardHref('MX', 'compliance')).toBe('/dashboard?country=MX&page=compliance')
    expect(buildCountryDashboardHref('MEX', 'signals')).toBe('/dashboard?country=MX&page=signals')
  })

  it('supports legacy slugs emitted by the mobile country-profile link', () => {
    expect(legacyCountryProfileSlug('Côte d’Ivoire')).toBe('c-te-d-ivoire')
    expect(resolveCountryDashboardTarget('c-te-d-ivoire')?.iso2).toBe('CI')
    expect(buildCountryDashboardHref('c-te-d-ivoire')).toBe('/dashboard?country=CI')
  })

  it('fails closed for unknown countries', () => {
    expect(buildCountryDashboardHref('not-a-country')).toBeNull()
  })
})
