import { getGlobeCountryGeometries } from '@/lib/globe/country-geometry-store'

export type InteractiveFallbackReason = 'geometry-payload-missing' | 'hit-layer-unavailable'

export interface InteractiveReadinessResult {
  interactiveReady: boolean
  fallbackReason?: InteractiveFallbackReason
}

export function evaluateInteractiveReadiness(hitLayerMounted: boolean): InteractiveReadinessResult {
  const hasGeometryPayload = getGlobeCountryGeometries().length > 0

  if (!hasGeometryPayload) {
    return { interactiveReady: false, fallbackReason: 'geometry-payload-missing' }
  }

  if (!hitLayerMounted) {
    return { interactiveReady: false, fallbackReason: 'hit-layer-unavailable' }
  }

  return { interactiveReady: true }
}

export function logInteractiveFallback(reason: InteractiveFallbackReason) {
  console.warn('[harbourview-globe] interactive fallback engaged', { reason })
}

