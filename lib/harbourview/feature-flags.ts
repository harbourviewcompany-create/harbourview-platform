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
   * ON by default as of 2026-07-10. All 203 countries are classified, so the
   * globe communicates market access on first load rather than rendering as
   * undifferentiated gold.
   *
   * What this publishes: each plate's colour is an assertion about cannabis law
   * in that jurisdiction. 195 tiers were auto-derived from each country's own
   * `cc_jurisdiction_briefings.program_status` text; 8 (RU, PR, FK, VA, FM, SC,
   * TO, EH) were set manually. Every row stores a `regulatory_tier_rationale`
   * quoting its source, and `regulatory_tier_reviewed_at` is still NULL on all
   * of them — no human has signed off yet. That review is worth doing; the
   * legend deliberately describes tiers in terms of trade pathways rather than
   * legality per se, which keeps the claim narrower than "X is legal here".
   *
   * Set NEXT_PUBLIC_HARBOURVIEW_GLOBE_REGULATORY_TIERS=false to kill the
   * colouring without a code change if a tier turns out to be wrong.
   */
  globeRegulatoryTiers: getEnvFlag('NEXT_PUBLIC_HARBOURVIEW_GLOBE_REGULATORY_TIERS', true),
}
