import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/globe/country-geometry-store', () => ({
  getGlobeCountryGeometries: vi.fn(() => [{ iso2: 'DE' }]),
}))

import { evaluateInteractiveReadiness } from '@/lib/harbourview/globe/interactive-readiness'

describe('interactive globe readiness', () => {
  it('renders static fallback path when hit layer is unavailable even with feature-enabled geometry payload', () => {
    const readiness = evaluateInteractiveReadiness(false)

    expect(readiness.interactiveReady).toBe(false)
    expect(readiness.fallbackReason).toBe('hit-layer-unavailable')
  })

  it('enables interactivity only after hit layer is mounted', () => {
    const readiness = evaluateInteractiveReadiness(true)

    expect(readiness.interactiveReady).toBe(true)
    expect(readiness.fallbackReason).toBeUndefined()
  })
})
