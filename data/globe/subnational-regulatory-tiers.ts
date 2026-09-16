import type { RegulatoryTier } from '@/lib/globe/globe-materials'

/**
 * Build the regulatory-tier lookup exclusively from live database rows.
 *
 * Static jurisdiction tier fixtures are intentionally excluded from the runtime
 * heatmap path. They can remain as historical/test fixtures, but a rendered
 * colour is a regulatory claim and must come from countries.regulatory_tier.
 * Missing/null rows therefore remain uncoloured instead of silently falling
 * back to a checked-in default.
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
 * A subnational region must never inherit its parent country's tier: doing so
 * turns missing regional evidence into a confident but potentially false
 * colour. If a region has no live tier row, return null and render neutral.
 */
export function resolveRegulatoryTierForEntry(
  entryIso2: string,
  _parentIso2: string | undefined,
  tierByIso2?: Record<string, RegulatoryTier | null>,
): RegulatoryTier | null {
  return tierByIso2?.[entryIso2] ?? null
}
