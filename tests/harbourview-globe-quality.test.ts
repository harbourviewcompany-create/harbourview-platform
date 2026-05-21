import { describe, expect, it } from 'vitest'
import { GLOBE_QUALITY_BUDGETS } from '@/config/globe/quality-budgets'
import { downgradeQuality, resolveQualityTier } from '@/lib/harbourview/globe/quality'

describe('harbourview globe quality budgets', () => {
  it('defines deterministic numeric budgets for each quality tier', () => {
    expect(GLOBE_QUALITY_BUDGETS.high.maxFrameTimeMs).toBe(16.7)
    expect(GLOBE_QUALITY_BUDGETS.medium.maxFrameTimeMs).toBe(22)
    expect(GLOBE_QUALITY_BUDGETS.low.maxFrameTimeMs).toBe(28)
    expect(GLOBE_QUALITY_BUDGETS.fallback.maxFrameTimeMs).toBe(40)

    expect(GLOBE_QUALITY_BUDGETS.high.maxCountryMeshes).toBeGreaterThan(GLOBE_QUALITY_BUDGETS.low.maxCountryMeshes)
    expect(GLOBE_QUALITY_BUDGETS.fallback.maxDpr).toBe(1)
  })

  it('downgrades deterministically and bottoms out at fallback', () => {
    expect(downgradeQuality('high')).toBe('medium')
    expect(downgradeQuality('medium')).toBe('low')
    expect(downgradeQuality('low')).toBe('fallback')
    expect(downgradeQuality('fallback')).toBe('fallback')
  })

  it('activates fallback for capability failure and low-memory constraints', () => {
    expect(resolveQualityTier({ capabilityFailure: true, deviceMemoryGb: 16, hardwareConcurrency: 12 })).toBe('fallback')
    expect(resolveQualityTier({ deviceMemoryGb: 2, hardwareConcurrency: 2, forcedLowMemory: true })).toBe('fallback')
  })
})
