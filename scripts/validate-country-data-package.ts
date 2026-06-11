import { countryIdentityRows, expectedGlobalCountryRouteCount } from '../lib/country-data/generated-country-identity-rows'
import { getPublicCountryProfiles, assertPublicCountryRouteCoverage } from '../lib/country-data/public-country-dto'

function requireUnique(rows: readonly (readonly unknown[])[], index: number, label: string) {
  const seen = new Set<string>()
  for (const row of rows) {
    const value = String(row[index] ?? '')
    if (!value) throw new Error(`Missing ${label}`)
    if (seen.has(value)) throw new Error(`Duplicate ${label}: ${value}`)
    seen.add(value)
  }
}

function main() {
  const profiles = getPublicCountryProfiles()
  const routeCoverage = assertPublicCountryRouteCoverage()

  if (countryIdentityRows.length !== expectedGlobalCountryRouteCount) {
    throw new Error(`Expected ${expectedGlobalCountryRouteCount} identity rows, found ${countryIdentityRows.length}`)
  }

  if (!routeCoverage.pass) {
    throw new Error(`Route coverage failed: ${JSON.stringify(routeCoverage)}`)
  }

  requireUnique(countryIdentityRows, 0, 'jurisdiction_id')
  requireUnique(countryIdentityRows, 1, 'slug')

  const antarctica = profiles.find((country) => country.slug === 'antarctica' && country.jurisdiction_id === 'country_area:ATA')
  if (!antarctica) throw new Error('Antarctica cleanup row is missing')

  for (const profile of profiles) {
    if (!profile.slug || !profile.public_display_name) {
      throw new Error(`Malformed public profile: ${JSON.stringify(profile)}`)
    }
  }

  console.log(JSON.stringify({
    expectedJurisdictionCount: expectedGlobalCountryRouteCount,
    identityRowCount: countryIdentityRows.length,
    publicProfileCount: profiles.length,
    uniqueSlugCount: new Set(profiles.map((country) => country.slug)).size,
    antarcticaPresent: Boolean(antarctica),
    duplicateCheck: 'pass',
    publicStatusGate: 'neutral_placeholders_only',
    verdict: 'GO_IDENTITY_ONLY_PACKAGE_VALIDATE',
  }, null, 2))
}

main()
