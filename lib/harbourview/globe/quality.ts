export type GlobeQualityLevel = 'high' | 'medium' | 'low' | 'fallback'

export function getInitialQuality(): GlobeQualityLevel {
  if (typeof window === 'undefined') return 'medium'

  const isLowMemory = (navigator as any).deviceMemory && (navigator as any).deviceMemory <= 4

  if (isLowMemory) return 'low'

  return 'medium'
}
