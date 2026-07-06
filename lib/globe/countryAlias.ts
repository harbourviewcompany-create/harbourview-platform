/**
 * lib/globe/countryAlias.ts
 *
 * `signals.country` is free text (confirmed live values include "USA", "UK",
 * "Canada", "Colombia", "Global", "Europe", "LATAM", "Africa", "Pacific", and
 * null) — there is no ISO2 column on `signals`, and no reliable 1:1 join to
 * `countries.iso_alpha2`.
 *
 * This map covers common non-ISO aliases seen in the live data. Regional
 * buckets ("Global", "Europe", "LATAM", "Africa", "Pacific") are deliberately
 * NOT mapped to a single country — they get bucketed separately by the caller
 * instead of being silently pinned to one arbitrary country on the globe.
 *
 * TODO (real fix, not done here): backfill a `country_iso2` column on
 * `signals` at ingestion time so this alias map isn't load-bearing long-term.
 * This file is a stopgap for the current data shape, not a permanent answer.
 */

export const COUNTRY_NAME_ALIASES: Record<string, string> = {
  USA: 'US',
  'United States': 'US',
  UK: 'GB',
  'United Kingdom': 'GB',
  Canada: 'CA',
  Colombia: 'CO',
  Germany: 'DE',
  France: 'FR',
  Australia: 'AU',
  'New Zealand': 'NZ',
  Mexico: 'MX',
  Brazil: 'BR',
  // Extend as real gaps are found — do not guess silently; log unmapped
  // values (see supabaseGlobeData.ts) instead of assuming a mapping.
}

// Values that represent a region or "no specific country," not an actual
// country — these should never be forced onto a single globe marker.
export const REGIONAL_BUCKET_VALUES = new Set([
  'Global',
  'Europe',
  'LATAM',
  'Africa',
  'Pacific',
])

/**
 * Resolves a free-text `signals.country` value to an ISO2 code, or null if
 * it's a regional bucket, unmapped, or missing. Callers must handle null
 * explicitly rather than dropping it silently.
 */
export function resolveCountryToIso2(
  rawCountry: string | null,
  iso2ByName: Map<string, string>
): string | null {
  if (!rawCountry) return null
  if (REGIONAL_BUCKET_VALUES.has(rawCountry)) return null

  const alias = COUNTRY_NAME_ALIASES[rawCountry]
  if (alias) return alias

  // Fall back to exact match against countries.country_name
  const direct = iso2ByName.get(rawCountry.toLowerCase())
  return direct ?? null
}
