import { countryOptions } from '@/config/globe/country-role-profiles'
import { publicCountryIntelligenceFixtures } from '@/lib/intelligence/fixtures'

const countryNameToOption = new Map(countryOptions.map((country) => [country.name, country]))

export function getAlphaCountryFixtureRows() {
  return publicCountryIntelligenceFixtures.flatMap((fixture) => {
    const option = countryNameToOption.get(fixture.country)
    if (!option) return []

    return [{
      iso_alpha2: option.iso2,
      country_name: fixture.country,
      market_access_status: fixture.statusLabel,
      medical_status: fixture.pathways.includes('medical') ? 'tracked' : 'unknown',
      adult_use_status: fixture.pathways.includes('adultUse') ? 'tracked' : 'unknown',
      import_status: fixture.tradeRole.includes('import market') ? 'tracked' : 'unknown',
      export_status: fixture.tradeRole.includes('export market') ? 'tracked' : 'unknown',
      public_summary: fixture.publicSummary,
      regulator_label: fixture.regulatorLabel ?? null,
      country_slug: fixture.slug,
      opportunity_score: null,
    }]
  })
}

export function getAlphaCountryFixtureRowByIso2(iso2?: string | null) {
  if (!iso2) return undefined
  return getAlphaCountryFixtureRows().find((row) => row.iso_alpha2 === iso2)
}
