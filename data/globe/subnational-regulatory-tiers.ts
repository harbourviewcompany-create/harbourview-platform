import type { RegulatoryTier } from '@/lib/globe/globe-materials'

/**
 * Build the regulatory-tier lookup from the complete live country universe.
 * `supabaseGlobeData` prefers verified evidence and may expose the existing
 * five-tier legacy value as an explicitly provisional display fallback so
 * missing evidence does not remove a jurisdiction from the global choropleth.
 */
export function buildRegulatoryTierMap(
  liveCountries: readonly { iso2: string; regulatoryTier?: RegulatoryTier | null }[],
): Record<string, RegulatoryTier> {
  const map: Record<string, RegulatoryTier> = {}

  for (const country of liveCountries) {
    if (country.regulatoryTier) map[country.iso2] = country.regulatoryTier
  }

  return map
}

/**
 * Resolve the exact rendered jurisdiction only.
 *
 * A subnational region must never inherit its parent country's tier. Every
 * supported child row must have its own live display tier (verified or
 * explicitly provisional) before it receives a colour.
 */
export function resolveRegulatoryTierForEntry(
  entryIso2: string,
  _parentIso2: string | undefined,
  tierByIso2?: Record<string, RegulatoryTier | null>,
): RegulatoryTier | null {
  return tierByIso2?.[entryIso2] ?? null
}
