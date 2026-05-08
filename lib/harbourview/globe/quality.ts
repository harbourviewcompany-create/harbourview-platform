export type GlobeQualityLevel = 'high' | 'medium' | 'low' | 'fallback'

type NavigatorWithMemory = Navigator & {
  deviceMemory?: number
}

export function getInitialQuality(): GlobeQualityLevel {
  if (typeof window === 'undefined') return 'medium'

  const nav = navigator as NavigatorWithMemory
  const isLowMemory = nav.deviceMemory !== undefined && nav.deviceMemory <= 4

  if (isLowMemory) return 'low'

  return 'medium'
}
