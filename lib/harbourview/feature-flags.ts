import { getEnvFlag } from './env'

export const featureFlags = {
  interactiveGlobe: getEnvFlag('NEXT_PUBLIC_HARBOURVIEW_INTERACTIVE_GLOBE', true),
  countryCards: getEnvFlag('NEXT_PUBLIC_HARBOURVIEW_GLOBE_COUNTRY_CARDS', true),
  expandedMode: getEnvFlag('NEXT_PUBLIC_HARBOURVIEW_GLOBE_EXPANDED_MODE', true),
  beam: getEnvFlag('NEXT_PUBLIC_HARBOURVIEW_GLOBE_BEAM', true),
  water: getEnvFlag('NEXT_PUBLIC_HARBOURVIEW_GLOBE_WATER', true),
  globeForceFallback: getEnvFlag('NEXT_PUBLIC_HARBOURVIEW_GLOBE_FORCE_FALLBACK', false),
  /**
   * Colours country and live subnational plates from evidence-backed
   * regulatory tiers.
   */
  globeRegulatoryTiers: getEnvFlag('NEXT_PUBLIC_HARBOURVIEW_GLOBE_REGULATORY_TIERS', true),
  /**
   * Continuous spherical Gaussian density surface built from live country
   * opportunity + signal activity. Quality automatically scales down on
   * constrained devices.
   */
  globeHeatmap: getEnvFlag('NEXT_PUBLIC_HARBOURVIEW_GLOBE_HEATMAP', true),
  /**
   * Selective bloom + vignette for the live heat surface and event markers.
   */
  globeHeatBloom: getEnvFlag('NEXT_PUBLIC_HARBOURVIEW_GLOBE_HEAT_BLOOM', false),
  /**
   * Atmosphere limb reacts to the live global heat metric.
   */
  globeHeatAtmosphere: getEnvFlag('NEXT_PUBLIC_HARBOURVIEW_GLOBE_HEAT_ATMOSPHERE', false),
}
