import type { RegulatoryTier } from '@/lib/globe/globe-materials'
import { US_STATE_REGULATORY_TIERS } from './us-state-tiers'
import { CANADA_PROVINCE_REGULATORY_TIERS } from './canada-province-tiers'
import { GERMANY_STATE_REGULATORY_TIERS } from './germany-state-tiers'
import { AUSTRALIA_STATE_REGULATORY_TIERS } from './australia-state-tiers'

export const SUBNATIONAL_REGULATORY_TIER_DEFAULTS = {
  ...US_STATE_REGULATORY_TIERS,
  ...CANADA_PROVINCE_REGULATORY_TIERS,
  ...GERMANY_STATE_REGULATORY_TIERS,
  ...AUSTRALIA_STATE_REGULATORY_TIERS,
} satisfies Record<string, RegulatoryTier>

export function buildRegulatoryTierMap(
  liveCountries: readonly { iso2: string; regulatoryTier?: RegulatoryTier | null }[],
): Record<string, RegulatoryTier> {
  const map: Record<string, RegulatoryTier> = { ...SUBNATIONAL_REGULATORY_TIER_DEFAULTS }

  for (const country of liveCountries) {
    if (country.regulatoryTier) map[country.iso2] = country.regulatoryTier
  }

  return map
}

export function resolveRegulatoryTierForEntry(
  entryIso2: string,
  parentIso2: string | undefined,
  tierByIso2?: Record<string, RegulatoryTier | null>,
): RegulatoryTier | null {
  return (
    tierByIso2?.[entryIso2] ??
    (parentIso2 ? tierByIso2?.[parentIso2] : undefined) ??
    null
  )
}
