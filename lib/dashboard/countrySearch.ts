import { countries } from './countries'
import type { CountryDashboardSummary } from './contracts'
import { tokenMatchesSearch } from '@/lib/globe/search-normalization'

export type CanonicalCountrySearchStatus = 'available' | 'request-access'

export type CanonicalCountrySearchOption = {
  slug: string
  iso2: string
  iso3: string
  name: string
  region: string
  aliases: string[]
  dashboardPath: string
  status: CanonicalCountrySearchStatus
}

function toSearchOption(country: CountryDashboardSummary): CanonicalCountrySearchOption {
  return {
    slug: country.slug,
    iso2: country.iso2,
    iso3: country.iso3,
    name: country.displayName,
    region: country.region,
    aliases: country.aliases,
    dashboardPath: country.dashboardPath,
    status: country.dashboardStatus === 'unavailable' ? 'request-access' : 'available',
  }
}

export const canonicalCountrySearchOptions: CanonicalCountrySearchOption[] = [
  ...countries.map(toSearchOption),
  {
    slug: 'example-unsupported-country',
    iso2: 'XX',
    iso3: 'XXX',
    name: 'Example Unsupported Country',
    region: 'Request access',
    aliases: ['Unsupported request access example'],
    dashboardPath: '/contact?intent=country-access-request&country=XX',
    status: 'request-access' as const,
  },
]

export function searchCanonicalCountries(query: string) {
  const normalizedQuery = query.trim()
  if (!normalizedQuery) return canonicalCountrySearchOptions

  return canonicalCountrySearchOptions.filter((country) =>
    tokenMatchesSearch(normalizedQuery, [
      country.name,
      country.iso2,
      country.iso3,
      country.region,
      country.slug,
      ...country.aliases,
    ]),
  )
}
