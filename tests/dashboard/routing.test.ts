import { describe, expect, it } from 'vitest'
import { naturalEarthCountriesPayload } from '@/data/globe/natural-earth-countries'
import {
  countries,
  dashboardSections,
  fixtureCountries,
  getCountryByAlias,
  getCountryBySlug,
  getDashboardCountryHref,
  getDashboardSafeUnresolvedCountry,
  getDashboardSectionHref,
  resolveCountryRouteParam,
} from '@/lib/dashboard/countries'
import { serializeCountryDashboardPublicDto } from '@/lib/dashboard/publicDto'
import { assertDashboardDtoPublicSafe } from '@/lib/dashboard/publicSafety'

const requiredCountries = ['germany', 'italy', 'new-zealand', 'canada', 'united-states', 'united-kingdom', 'portugal', 'australia', 'colombia', 'israel']
const aliasSamples = [
  ['USA', 'united-states'],
  ['US', 'united-states'],
  ['UK', 'united-kingdom'],
  ['Great Britain', 'united-kingdom'],
  ['Czech Republic', 'czechia'],
  ['Turkey', 'turkiye'],
  ['Ivory Coast', 'cote-divoire'],
  ['Holland', 'netherlands'],
  ['Republic of Korea', 'south-korea'],
  ['DPRK', 'north-korea'],
  ['Russian Federation', 'russia'],
  ['Islamic Republic of Iran', 'iran'],
  ['Bolivarian Republic of Venezuela', 'venezuela'],
  ['Plurinational State of Bolivia', 'bolivia'],
  ['United Republic of Tanzania', 'tanzania'],
  ['Viet Nam', 'vietnam'],
  ['Lao PDR', 'laos'],
  ['Syrian Arab Republic', 'syria'],
  ['Republic of Moldova', 'moldova'],
  ['Republic of the Congo', 'congo-republic'],
  ['DRC', 'democratic-republic-of-the-congo'],
  ['Palestinian Territory', 'palestine'],
  ['Kosovo', 'kosovo'],
  ['Taiwan', 'taiwan'],
  ['Hong Kong', 'hong-kong'],
  ['Macau', 'macau'],
] as const

describe('dashboard country route contract', () => {
  it('resolves valid country routes and ISO params', () => {
    expect(resolveCountryRouteParam('germany')?.iso2).toBe('DE')
    expect(resolveCountryRouteParam('DEU')?.slug).toBe('germany')
    expect(resolveCountryRouteParam('DE')?.slug).toBe('germany')
  })

  it.each(aliasSamples)('resolves alias %s to canonical slug %s', (alias, slug) => {
    expect(getCountryByAlias(alias)?.slug).toBe(slug)
  })

  it('invalid route uses the safe unresolved-country contract', () => {
    expect(getCountryBySlug('atlantis')).toBeNull()
    expect(getDashboardSafeUnresolvedCountry('Atlantis')).toMatchObject({ routeAvailability: 'unavailable', dashboardPath: '/dashboard' })
  })

  it('builds all required section routes', () => {
    expect(getDashboardCountryHref('germany')).toBe('/dashboard/country/germany')
    expect(dashboardSections.map((section) => getDashboardSectionHref('germany', section))).toEqual([
      '/dashboard/country/germany/market',
      '/dashboard/country/germany/education',
      '/dashboard/country/germany/compliance',
      '/dashboard/country/germany/signals',
      '/dashboard/country/germany/opportunities',
      '/dashboard/country/germany/intelligence',
      '/dashboard/country/germany/connections',
    ])
  })
})

describe('dashboard country registry', () => {
  it('contains required fixture countries and all requested dashboard states', () => {
    for (const slug of requiredCountries) {
      expect(fixtureCountries.some((country) => country.slug === slug)).toBe(true)
    }
    expect(fixtureCountries.map((country) => country.dashboardStatus)).toEqual(expect.arrayContaining(['live', 'partial', 'request-only', 'fallback-backed', 'static-orientation', 'review-required', 'unavailable']))
  })

  it('resolves every Natural Earth globe country to a dashboard-safe country record', () => {
    const unresolved = naturalEarthCountriesPayload.countries.filter((country) => !resolveCountryRouteParam(country.name) && !resolveCountryRouteParam(country.iso2) && !resolveCountryRouteParam(country.iso3))
    expect(unresolved).toEqual([])
  })

  it('has default records beyond rich fixtures', () => {
    expect(countries.length).toBeGreaterThan(fixtureCountries.length)
    expect(resolveCountryRouteParam('Afghanistan')?.dashboardStatus).toBe('fallback-backed')
  })
})

describe('public dashboard DTO serialization', () => {
  it('serializes allowlisted public country and panel fields without dashboard forbidden strings', () => {
    const germany = resolveCountryRouteParam('germany')
    expect(germany).toBeTruthy()
    const dto = serializeCountryDashboardPublicDto(germany!)
    expect(dto.displayName).toBe('Germany')
    expect(Object.keys(dto.panels)).toEqual(dashboardSections)
    expect(assertDashboardDtoPublicSafe(dto)).toEqual([])
  })
})
