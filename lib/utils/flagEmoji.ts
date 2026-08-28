// Generates a flag emoji from an ISO 3166-1 alpha-2 country code.
// Uses Unicode Regional Indicator Symbols — works for all 193 UN member states
// and most territories without any lookup table.
export function flagEmoji(iso2: string | null | undefined): string {
  if (!iso2 || iso2.length !== 2) return '🌐'
  const base = 0x1F1E6 - 65 // 'A'.charCodeAt(0)
  const up = iso2.toUpperCase()
  try {
    return String.fromCodePoint(up.charCodeAt(0) + base, up.charCodeAt(1) + base)
  } catch {
    return '🌐'
  }
}

// Resolves a flag from either an ISO2 code or a country full name.
// Used for signal feeds that carry a country name string rather than an ISO2 code.
const NAME_TO_ISO2: Record<string, string> = {
  'United States': 'US', 'USA': 'US',
  'United Kingdom': 'GB', 'UK': 'GB', 'Great Britain': 'GB',
  'Germany': 'DE', 'Netherlands': 'NL', 'France': 'FR',
  'Australia': 'AU', 'Canada': 'CA', 'Israel': 'IL',
  'Thailand': 'TH', 'Colombia': 'CO', 'Brazil': 'BR',
  'Mexico': 'MX', 'Spain': 'ES', 'Italy': 'IT',
  'Portugal': 'PT', 'Denmark': 'DK', 'Switzerland': 'CH',
  'Czech Republic': 'CZ', 'Czechia': 'CZ', 'Poland': 'PL',
  'New Zealand': 'NZ', 'South Africa': 'ZA', 'Malta': 'MT',
  'Luxembourg': 'LU', 'Uruguay': 'UY', 'Greece': 'GR',
  'Slovenia': 'SI', 'Argentina': 'AR', 'Peru': 'PE',
  'Chile': 'CL', 'Belgium': 'BE', 'Romania': 'RO',
  'Bulgaria': 'BG', 'Morocco': 'MA', 'Ghana': 'GH',
  'Kenya': 'KE', 'Zimbabwe': 'ZW', 'Lesotho': 'LS',
  'Jamaica': 'JM', 'Trinidad and Tobago': 'TT',
  'North Macedonia': 'MK', 'Sweden': 'SE', 'Finland': 'FI',
  'Norway': 'NO', 'Austria': 'AT', 'Ireland': 'IE',
  'Hungary': 'HU', 'Croatia': 'HR', 'Singapore': 'SG',
  'Japan': 'JP', 'South Korea': 'KR', 'India': 'IN',
  'China': 'CN', 'Russia': 'RU', 'Ukraine': 'UA',
  'European Union': 'EU',
}

const NORMALIZED_NAME_TO_ISO2 = new Map(
  Object.entries(NAME_TO_ISO2).map(([name, iso2]) => [name.trim().toLowerCase(), iso2]),
)

export function marketToIso2(market: string | null | undefined): string | null {
  const value = market?.trim()
  if (!value) return null
  if (/^[A-Za-z]{2}$/.test(value)) return value.toUpperCase()
  return NORMALIZED_NAME_TO_ISO2.get(value.toLowerCase()) ?? null
}

export function marketAliases(market: string | null | undefined): string[] {
  const value = market?.trim()
  if (!value) return []
  const iso2 = marketToIso2(value)
  if (!iso2) return [value]
  const aliases = Object.entries(NAME_TO_ISO2)
    .filter(([, mapped]) => mapped === iso2)
    .map(([name]) => name)
  return [...new Set([iso2, ...aliases])]
}

export function canonicalMarketId(market: string | null | undefined): string | null {
  const value = market?.trim()
  if (!value) return null
  const iso2 = marketToIso2(value)
  return iso2 ? `iso:${iso2}` : `name:${value.toLowerCase()}`
}

export function flagForMarket(market: string | null | undefined): string {
  const iso2 = marketToIso2(market)
  return iso2 ? flagEmoji(iso2) : '🌐'
}
