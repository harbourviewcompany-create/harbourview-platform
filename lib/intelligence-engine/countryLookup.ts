// lib/intelligence-engine/countryLookup.ts
// ISO-3166 country lookup table. Replaces hard-coded COUNTRY_NAME map.

export interface CountryRecord {
  iso2: string
  iso3: string
  name: string
  region: 'north_america' | 'europe' | 'asia_pacific' | 'latin_america' | 'middle_east_africa' | 'global'
}

const COUNTRIES: CountryRecord[] = [
  { iso2: 'CA', iso3: 'CAN', name: 'Canada', region: 'north_america' },
  { iso2: 'US', iso3: 'USA', name: 'United States', region: 'north_america' },
  { iso2: 'MX', iso3: 'MEX', name: 'Mexico', region: 'north_america' },
  { iso2: 'DE', iso3: 'DEU', name: 'Germany', region: 'europe' },
  { iso2: 'GB', iso3: 'GBR', name: 'United Kingdom', region: 'europe' },
  { iso2: 'NL', iso3: 'NLD', name: 'Netherlands', region: 'europe' },
  { iso2: 'PT', iso3: 'PRT', name: 'Portugal', region: 'europe' },
  { iso2: 'IL', iso3: 'ISR', name: 'Israel', region: 'middle_east_africa' },
  { iso2: 'CO', iso3: 'COL', name: 'Colombia', region: 'latin_america' },
  { iso2: 'BR', iso3: 'BRA', name: 'Brazil', region: 'latin_america' },
  { iso2: 'AU', iso3: 'AUS', name: 'Australia', region: 'asia_pacific' },
  { iso2: 'NZ', iso3: 'NZL', name: 'New Zealand', region: 'asia_pacific' },
  { iso2: 'CH', iso3: 'CHE', name: 'Switzerland', region: 'europe' },
  { iso2: 'AT', iso3: 'AUT', name: 'Austria', region: 'europe' },
  { iso2: 'CZ', iso3: 'CZE', name: 'Czech Republic', region: 'europe' },
  { iso2: 'DK', iso3: 'DNK', name: 'Denmark', region: 'europe' },
  { iso2: 'SE', iso3: 'SWE', name: 'Sweden', region: 'europe' },
  { iso2: 'NO', iso3: 'NOR', name: 'Norway', region: 'europe' },
  { iso2: 'PL', iso3: 'POL', name: 'Poland', region: 'europe' },
  { iso2: 'ZA', iso3: 'ZAF', name: 'South Africa', region: 'middle_east_africa' },
  { iso2: 'TH', iso3: 'THA', name: 'Thailand', region: 'asia_pacific' },
  { iso2: 'MT', iso3: 'MLT', name: 'Malta', region: 'europe' },
  { iso2: 'IT', iso3: 'ITA', name: 'Italy', region: 'europe' },
  { iso2: 'FR', iso3: 'FRA', name: 'France', region: 'europe' },
  { iso2: 'ES', iso3: 'ESP', name: 'Spain', region: 'europe' },
  { iso2: 'GR', iso3: 'GRC', name: 'Greece', region: 'europe' },
  { iso2: 'JM', iso3: 'JAM', name: 'Jamaica', region: 'latin_america' },
  { iso2: 'IE', iso3: 'IRL', name: 'Ireland', region: 'europe' },
  { iso2: 'LU', iso3: 'LUX', name: 'Luxembourg', region: 'europe' },
  { iso2: 'BE', iso3: 'BEL', name: 'Belgium', region: 'europe' },
  { iso2: 'FI', iso3: 'FIN', name: 'Finland', region: 'europe' },
  { iso2: 'IS', iso3: 'ISL', name: 'Iceland', region: 'europe' },
  { iso2: 'LI', iso3: 'LIE', name: 'Liechtenstein', region: 'europe' },
  { iso2: 'CY', iso3: 'CYP', name: 'Cyprus', region: 'europe' },
  { iso2: 'SI', iso3: 'SVN', name: 'Slovenia', region: 'europe' },
  { iso2: 'SK', iso3: 'SVK', name: 'Slovakia', region: 'europe' },
  { iso2: 'HU', iso3: 'HUN', name: 'Hungary', region: 'europe' },
  { iso2: 'RO', iso3: 'ROU', name: 'Romania', region: 'europe' },
  { iso2: 'BG', iso3: 'BGR', name: 'Bulgaria', region: 'europe' },
  { iso2: 'HR', iso3: 'HRV', name: 'Croatia', region: 'europe' },
  { iso2: 'EE', iso3: 'EST', name: 'Estonia', region: 'europe' },
  { iso2: 'LV', iso3: 'LVA', name: 'Latvia', region: 'europe' },
  { iso2: 'LT', iso3: 'LTU', name: 'Lithuania', region: 'europe' },
  { iso2: 'JP', iso3: 'JPN', name: 'Japan', region: 'asia_pacific' },
  { iso2: 'KR', iso3: 'KOR', name: 'South Korea', region: 'asia_pacific' },
  { iso2: 'SG', iso3: 'SGP', name: 'Singapore', region: 'asia_pacific' },
  { iso2: 'MY', iso3: 'MYS', name: 'Malaysia', region: 'asia_pacific' },
  { iso2: 'PH', iso3: 'PHL', name: 'Philippines', region: 'asia_pacific' },
  { iso2: 'ID', iso3: 'IDN', name: 'Indonesia', region: 'asia_pacific' },
  { iso2: 'VN', iso3: 'VNM', name: 'Vietnam', region: 'asia_pacific' },
  { iso2: 'IN', iso3: 'IND', name: 'India', region: 'asia_pacific' },
  { iso2: 'CN', iso3: 'CHN', name: 'China', region: 'asia_pacific' },
  { iso2: 'AR', iso3: 'ARG', name: 'Argentina', region: 'latin_america' },
  { iso2: 'CL', iso3: 'CHL', name: 'Chile', region: 'latin_america' },
  { iso2: 'PE', iso3: 'PER', name: 'Peru', region: 'latin_america' },
  { iso2: 'UY', iso3: 'URY', name: 'Uruguay', region: 'latin_america' },
  { iso2: 'EC', iso3: 'ECU', name: 'Ecuador', region: 'latin_america' },
  { iso2: 'BO', iso3: 'BOL', name: 'Bolivia', region: 'latin_america' },
  { iso2: 'PY', iso3: 'PRY', name: 'Paraguay', region: 'latin_america' },
  { iso2: 'VE', iso3: 'VEN', name: 'Venezuela', region: 'latin_america' },
  { iso2: 'NG', iso3: 'NGA', name: 'Nigeria', region: 'middle_east_africa' },
  { iso2: 'KE', iso3: 'KEN', name: 'Kenya', region: 'middle_east_africa' },
  { iso2: 'GH', iso3: 'GHA', name: 'Ghana', region: 'middle_east_africa' },
  { iso2: 'UG', iso3: 'UGA', name: 'Uganda', region: 'middle_east_africa' },
  { iso2: 'ZW', iso3: 'ZWE', name: 'Zimbabwe', region: 'middle_east_africa' },
  { iso2: 'MW', iso3: 'MWI', name: 'Malawi', region: 'middle_east_africa' },
  { iso2: 'LS', iso3: 'LSO', name: 'Lesotho', region: 'middle_east_africa' },
  { iso2: 'SZ', iso3: 'SWZ', name: 'Eswatini', region: 'middle_east_africa' },
  { iso2: 'MZ', iso3: 'MOZ', name: 'Mozambique', region: 'middle_east_africa' },
  { iso2: 'TZ', iso3: 'TZA', name: 'Tanzania', region: 'middle_east_africa' },
  { iso2: 'RW', iso3: 'RWA', name: 'Rwanda', region: 'middle_east_africa' },
  { iso2: 'MA', iso3: 'MAR', name: 'Morocco', region: 'middle_east_africa' },
  { iso2: 'LB', iso3: 'LBN', name: 'Lebanon', region: 'middle_east_africa' },
  { iso2: 'JO', iso3: 'JOR', name: 'Jordan', region: 'middle_east_africa' },
  { iso2: 'AE', iso3: 'ARE', name: 'United Arab Emirates', region: 'middle_east_africa' },
  { iso2: 'SA', iso3: 'SAU', name: 'Saudi Arabia', region: 'middle_east_africa' },
  { iso2: 'QA', iso3: 'QAT', name: 'Qatar', region: 'middle_east_africa' },
  { iso2: 'KW', iso3: 'KWT', name: 'Kuwait', region: 'middle_east_africa' },
  { iso2: 'BH', iso3: 'BHR', name: 'Bahrain', region: 'middle_east_africa' },
  { iso2: 'OM', iso3: 'OMN', name: 'Oman', region: 'middle_east_africa' },
]

const byIso2 = new Map(COUNTRIES.map((c) => [c.iso2, c]))
const byIso3 = new Map(COUNTRIES.map((c) => [c.iso3, c]))
const byName = new Map(COUNTRIES.map((c) => [c.name.toLowerCase(), c]))

export function lookupCountry(code: string): CountryRecord | undefined {
  const upper = code.toUpperCase().trim()
  if (upper.length === 2) return byIso2.get(upper)
  if (upper.length === 3) return byIso3.get(upper)
  return byName.get(upper.toLowerCase())
}

export function getCountryName(code: string): string {
  return lookupCountry(code)?.name ?? code
}

export function getCountryRegion(code: string): CountryRecord['region'] {
  return lookupCountry(code)?.region ?? 'global'
}

export function getCountriesByRegion(region: CountryRecord['region']): CountryRecord[] {
  return COUNTRIES.filter((c) => c.region === region)
}

export function isValidCountryCode(code: string): boolean {
  return lookupCountry(code) !== undefined
}
