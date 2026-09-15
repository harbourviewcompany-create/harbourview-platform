import type { RegulatoryTier } from '@/lib/globe/globe-materials'
import { US_STATE_REGULATORY_TIERS } from './us-state-tiers'
import { CANADA_PROVINCE_REGULATORY_TIERS } from './canada-province-tiers'
import { GERMANY_STATE_REGULATORY_TIERS } from './germany-state-tiers'
import { AUSTRALIA_STATE_REGULATORY_TIERS } from './australia-state-tiers'

const STATIC_SUBNATIONAL_TIERS: Record<string, RegulatoryTier> = {
  ...US_STATE_REGULATORY_TIERS,
  ...CANADA_PROVINCE_REGULATORY_TIERS,
  ...GERMANY_STATE_REGULATORY_TIERS,
  ...AUSTRALIA_STATE_REGULATORY_TIERS,
}

/**
 * Build the complete tier lookup for every rendered subnational geometry.
 *
 * The static seeds are the repository's current reviewed subnational baseline;
 * live country rows override them when a matching live row exists. Missing
 * entries remain unresolved and therefore render neutral rather than inheriting
 * a parent-country claim.
 */
export function buildRegulatoryTierMap(
  liveCountries: readonly { iso2: string; regulatoryTier?: RegulatoryTier | null }[],
): Record<string, RegulatoryTier> {
  const map: Record<string, RegulatoryTier> = { ...STATIC_SUBNATIONAL_TIERS }

  for (const country of liveCountries) {
    if (country.regulatoryTier) map[country.iso2] = country.regulatoryTier
  }

  return map
}

/**
 * Resolve the exact rendered jurisdiction only.
 *
 * A subnational region must never inherit its parent country's tier. Every
 * supported child row must have its own tier before it receives a colour.
 */
export function resolveRegulatoryTierForEntry(
  entryIso2: string,
  _parentIso2: string | undefined,
  tierByIso2?: Record<string, RegulatoryTier | null>,
): RegulatoryTier | null {
  return tierByIso2?.[entryIso2] ?? null
}
