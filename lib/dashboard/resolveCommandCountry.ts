import { getCountryName } from '@/config/globe/country-role-profiles'
import { resolveMarketCountryIso2 } from '@/lib/market/marketCode'

type CountryLike = { iso2: string; displayName: string }

/**
 * Resolve Command Centre country context.
 * Never invents a default jurisdiction (e.g. Canada).
 */
export function resolveCommandCountryContext(
  requestedCountry: string | null | undefined,
  allCountries: readonly CountryLike[],
): {
  currentCountry: string | null
  country: CountryLike | null
  countryLabel: string
} {
  const currentCountry = resolveMarketCountryIso2(requestedCountry)
  if (!currentCountry) {
    return { currentCountry: null, country: null, countryLabel: 'Select jurisdiction' }
  }
  const country = allCountries.find(item => item.iso2 === currentCountry) ?? null
  return {
    currentCountry,
    country,
    countryLabel: country?.displayName ?? getCountryName(currentCountry),
  }
}
