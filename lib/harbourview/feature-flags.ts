import { getEnvFlag } from './env'

export const featureFlags = {
  interactiveGlobe: getEnvFlag('NEXT_PUBLIC_HARBOURVIEW_INTERACTIVE_GLOBE', true),
  countryCards: getEnvFlag('NEXT_PUBLIC_HARBOURVIEW_GLOBE_COUNTRY_CARDS', true),
  expandedMode: getEnvFlag('NEXT_PUBLIC_HARBOURVIEW_GLOBE_EXPANDED_MODE', true),
  beam: getEnvFlag('NEXT_PUBLIC_HARBOURVIEW_GLOBE_BEAM', true),
  water: getEnvFlag('NEXT_PUBLIC_HARBOURVIEW_GLOBE_WATER', true),
  globeForceFallback: getEnvFlag('NEXT_PUBLIC_HARBOURVIEW_GLOBE_FORCE_FALLBACK', false),
  /**
   * Colours country plates by `countries.regulatory_tier`.
   *
   * DEFAULT OFF, deliberately. Tiers are public assertions about cannabis law
   * in a named jurisdiction, and none of the 56 seeded rows has a non-null
   * `regulatory_tier_reviewed_at` yet — i.e. no human has signed off. Turn this
   * on only after the tier assignments have been reviewed. The 147 unclassified
   * countries render neutral either way and assert nothing.
   */
  globeRegulatoryTiers: getEnvFlag('NEXT_PUBLIC_HARBOURVIEW_GLOBE_REGULATORY_TIERS', false),
}
