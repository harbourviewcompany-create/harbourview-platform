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

export function flagForMarket(market: string | null | undefined): string {
  if (!market) return '🌐'
  if (market.length === 2) return flagEmoji(market)
  const iso2 = NAME_TO_ISO2[market]
  return iso2 ? flagEmoji(iso2) : '🌐'
}
