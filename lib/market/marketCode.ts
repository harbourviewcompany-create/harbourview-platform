/**
 * Market codes: a selection on the globe is either a country (`US`, `CA`) or a
 * subdivision of one (`US-KS`, `CA-ON`).
 *
 * A subdivision must always resolve to its parent country. It narrows the
 * context; it never replaces or excludes the country. Before this module the
 * normalisation lived privately inside `lib/globe/route-resolver.ts`, so the
 * globe router handled `US-KS` correctly while `/api/dashboard/preferences`
 * and the Command Centre model did not — the preferences endpoint rejected the
 * code outright, the stored country went null, and the dashboard silently
 * rendered Canada for a Kansas selection. One shared normaliser is what keeps
 * those call sites from drifting apart again.
 */

/**
 * Countries whose subdivisions the platform routes on. The prefix of a
 * subdivision code must appear here for the code to be treated as a
 * subdivision rather than an unknown string.
 */
export const SUBDIVISION_PARENT_ISO2: Partial<Record<string, string>> = {
  US: 'US',
  CA: 'CA',
}

const SUBDIVISION_PATTERN = /^([A-Z]{2})-[A-Z0-9]{2,3}$/
const COUNTRY_PATTERN = /^[A-Z]{2}$/

export type MarketCode = {
  /** Parent country ISO-3166-1 alpha-2, e.g. `US` for `US-KS`. */
  countryIso2: string
  /** Full subdivision code when the input was one, e.g. `US-KS`. Otherwise null. */
  regionCode: string | null
}

/**
 * Parse a country or subdivision code into its country and (optional) region.
 * Returns null for anything that is neither — callers decide how to handle
 * unknown input rather than having a default silently chosen for them.
 */
export function parseMarketCode(value: unknown): MarketCode | null {
  if (typeof value !== 'string') return null

  const normalized = value.trim().toUpperCase()
  if (!normalized) return null

  const subdivision = SUBDIVISION_PATTERN.exec(normalized)
  if (subdivision) {
    const parent = SUBDIVISION_PARENT_ISO2[subdivision[1]]
    // A subdivision of a country we do not route on is not a usable market.
    return parent ? { countryIso2: parent, regionCode: normalized } : null
  }

  if (COUNTRY_PATTERN.test(normalized)) {
    return { countryIso2: normalized, regionCode: null }
  }

  return null
}

/**
 * The country a market code belongs to — `US-KS` and `US` both yield `US`.
 * Null when the code is not a market this platform recognises.
 */
export function resolveMarketCountryIso2(value: unknown): string | null {
  return parseMarketCode(value)?.countryIso2 ?? null
}

/**
 * The subdivision portion of a market code, or null when the code names a
 * whole country.
 */
export function resolveMarketRegionCode(value: unknown): string | null {
  return parseMarketCode(value)?.regionCode ?? null
}
