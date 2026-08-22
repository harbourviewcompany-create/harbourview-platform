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
   * Set NEXT_PUBLIC_HARBOURVIEW_GLOBE_REGULATORY_TIERS=false to kill the
   * colouring without a code change if a tier turns out to be wrong.
   */
  globeRegulatoryTiers: getEnvFlag('NEXT_PUBLIC_HARBOURVIEW_GLOBE_REGULATORY_TIERS', true),
  /**
   * Continuous Gaussian heat-density surface above country plates.
   * OFF by default until visual + performance validation.
   * NEXT_PUBLIC_HARBOURVIEW_GLOBE_HEATMAP=true to enable.
   */
  globeHeatmap: getEnvFlag('NEXT_PUBLIC_HARBOURVIEW_GLOBE_HEATMAP', false),
  /**
   * Selective bloom + vignette when heatmap is active.
   * Requires globeHeatmap. NEXT_PUBLIC_HARBOURVIEW_GLOBE_HEAT_BLOOM=true
   */
  globeHeatBloom: getEnvFlag('NEXT_PUBLIC_HARBOURVIEW_GLOBE_HEAT_BLOOM', false),
  /**
   * Atmosphere limb reacts to global heat metric (warm tint + intensity).
   * Requires globeHeatmap. NEXT_PUBLIC_HARBOURVIEW_GLOBE_HEAT_ATMOSPHERE=true
   */
  globeHeatAtmosphere: getEnvFlag('NEXT_PUBLIC_HARBOURVIEW_GLOBE_HEAT_ATMOSPHERE', true),
}
