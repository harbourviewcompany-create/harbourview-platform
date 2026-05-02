import { getEnvFlag } from './env'

export const featureFlags = {
  interactiveGlobe: getEnvFlag('NEXT_PUBLIC_HARBOURVIEW_INTERACTIVE_GLOBE', true),
  countryCards: getEnvFlag('NEXT_PUBLIC_HARBOURVIEW_GLOBE_COUNTRY_CARDS', true),
  expandedMode: getEnvFlag('NEXT_PUBLIC_HARBOURVIEW_GLOBE_EXPANDED_MODE', true),
  beam: getEnvFlag('NEXT_PUBLIC_HARBOURVIEW_GLOBE_BEAM', true),
  water: getEnvFlag('NEXT_PUBLIC_HARBOURVIEW_GLOBE_WATER', true),
}
