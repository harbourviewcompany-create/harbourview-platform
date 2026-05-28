import { describe, expect, it } from 'vitest'
import { getCountryByAlias, getDashboardSectionHref, resolveCountryRouteParam, dashboardCountries } from '@/lib/dashboard/country-registry'
import { serializePublicDashboardDto } from '@/lib/dashboard/public-dto'

describe('dashboard country routing', () => {
  it('resolves valid country route', () => {
    expect(resolveCountryRouteParam('germany')?.iso2).toBe('DE')
  })
  it('resolves alias to canonical country', () => {
    expect(getCountryByAlias('USA')?.slug).toBe('united-states')
  })
  it('builds section route', () => {
    expect(getDashboardSectionHref('germany', 'market')).toBe('/dashboard/country/germany/market')
  })
  it('fixture coverage includes required countries', () => {
    const slugs = dashboardCountries.map((c) => c.slug)
    for (const required of ['germany','italy','new-zealand','canada','united-states','united-kingdom','portugal','australia','colombia','israel']) expect(slugs).toContain(required)
  })
  it('public dto excludes forbidden fields', () => {
    const dto = serializePublicDashboardDto(dashboardCountries[0]) as unknown as Record<string, unknown>
    for (const forbidden of ['sourceUrl','sourceName','sourceEvidence','provenanceSummary','internalReviewNotes','reviewerNotes','supplierContact','supplierName','privateEvidence','rawSource','adminOnly','unpublished','counterpartyNotes','buyerIdentity','sellerIdentity','dealTerms','confidential']) expect(dto[forbidden]).toBeUndefined()
  })
})
