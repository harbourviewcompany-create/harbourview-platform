import { ALL_COUNTRIES, resolveCountryRouteParam } from './countries'

export type CountryDashboardPage =
  | 'briefing'
  | 'marketplace'
  | 'education'
  | 'compliance'
  | 'signals'
  | 'clinical'

/**
 * Matches the legacy country-profile slug formatter used by the mobile
 * Command Centre. Keeping this compatibility path prevents existing links
 * such as /countries/c-te-d-ivoire from dropping the selected jurisdiction.
 */
export function legacyCountryProfileSlug(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function safelyDecodeRouteValue(value: string): string {
  try {
    return decodeURIComponent(value).trim()
  } catch {
    return value.trim()
  }
}

export function resolveCountryDashboardTarget(value: string) {
  const routeValue = safelyDecodeRouteValue(value)
  if (!routeValue) return null

  return (
    resolveCountryRouteParam(routeValue) ??
    ALL_COUNTRIES.find(
      country => legacyCountryProfileSlug(country.displayName) === routeValue.toLowerCase(),
    ) ??
    null
  )
}

export function buildCountryDashboardHref(
  value: string,
  page: CountryDashboardPage = 'briefing',
): string | null {
  const country = resolveCountryDashboardTarget(value)
  if (!country) return null

  const params = new URLSearchParams({ country: country.iso2 })
  if (page !== 'briefing') params.set('page', page)

  return `/dashboard?${params.toString()}`
}
