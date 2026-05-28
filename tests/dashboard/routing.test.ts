import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  countries,
  dashboardSections,
  getCountryByAlias,
  getCountryBySlug,
  getDashboardSafeUnresolvedCountry,
  getDashboardSectionHref,
  resolveCountryRouteParam,
  serializePublicCountryDashboard,
} from '@/lib/dashboard/countries'

const globeCountries = JSON.parse(readFileSync(join(process.cwd(), 'data/globe/source/ne_110m_admin_0_countries.geojson'), 'utf8')) as { features: { properties: Record<string, string> }[] }

const requiredFixtureCountries = ['germany', 'italy', 'new-zealand', 'canada', 'united-states', 'united-kingdom', 'portugal', 'australia', 'colombia', 'israel']
const forbiddenPublicStrings = [
  'sourceUrl',
  'sourceName',
  'sourceEvidence',
  'provenanceSummary',
  'internalReviewNotes',
  'reviewerNotes',
  'supplierContact',
  'supplierName',
  'privateEvidence',
  'rawSource',
  'adminOnly',
  'unpublished',
  'counterpartyNotes',
  'buyerIdentity',
  'sellerIdentity',
  'dealTerms',
  'confidential',
  'private COA',
  'inventory available',
  'verified buyer',
  'verified seller',
]

describe('dashboard routing', () => {
  it('resolves valid country route', () => {
    expect(resolveCountryRouteParam('germany')?.iso2).toBe('DE')
  })

  it('resolves aliases to canonical countries', () => {
    expect(getCountryByAlias('USA')?.slug).toBe('united-states')
    expect(getCountryByAlias('UK')?.slug).toBe('united-kingdom')
    expect(getCountryByAlias('Czech Republic')?.slug).toBe('czechia')
    expect(getCountryByAlias('Turkey')?.slug).toBe('turkiye')
    expect(getCountryByAlias('Ivory Coast')?.slug).toBe('cote-divoire')
    expect(getCountryByAlias('DPRK')?.slug).toBe('north-korea')
    expect(getCountryByAlias('DRC')?.slug).toBe('democratic-republic-of-the-congo')
  })

  it('invalid country routes fall through to not-found handling', () => {
    expect(getCountryBySlug('atlantis')).toBeNull()
    expect(getDashboardSafeUnresolvedCountry('Atlantis').routeAvailability).toBe('unavailable')
  })

  it('generates section routes correctly', () => {
    for (const section of dashboardSections) {
      expect(getDashboardSectionHref('germany', section)).toBe(`/dashboard/country/germany/${section}`)
    }
  })
})

describe('country registry coverage', () => {
  it('contains rich fixture records for required countries', () => {
    for (const slug of requiredFixtureCountries) {
      expect(getCountryBySlug(slug)?.fixtureLevel).toBe('rich-fixture')
    }
  })

  it('resolves every Natural Earth globe feature to a dashboard record or safe default', () => {
    for (const feature of globeCountries.features) {
      const properties = feature.properties
      const resolved = resolveCountryRouteParam(properties.ADMIN) ?? resolveCountryRouteParam(properties.ISO_A2) ?? resolveCountryRouteParam(properties.ISO_A3)
      expect(resolved, properties.ADMIN).toBeTruthy()
    }
  })

  it('provides all required panel states across fixtures', () => {
    const states = new Set(countries.flatMap((country) => [country.dashboardStatus, ...dashboardSections.map((section) => country.panels[section].state)]))
    expect(Array.from(states)).toEqual(expect.arrayContaining(['live', 'partial', 'static-orientation', 'fallback-backed', 'request-only', 'review-required', 'unavailable']))
  })
})

describe('public dashboard DTO leakage safety', () => {
  it('serializes only public-safe country dashboard fields', () => {
    const dto = serializePublicCountryDashboard(getCountryBySlug('germany')!)
    const serialized = JSON.stringify(dto)
    for (const forbidden of forbiddenPublicStrings) {
      expect(serialized).not.toContain(forbidden)
    }
  })
})
