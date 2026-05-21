import { describe, expect, it } from 'vitest'
import { classifyGpuHint, selectQualityLevel, shouldBailoutToFallback } from '@/lib/harbourview/globe/quality'

describe('harbourview globe quality governance', () => {
  it('forces fallback when reduced motion is enabled', () => {
    expect(
      selectQualityLevel({
        reducedMotion: true,
        supportsWebGL: true,
        deviceMemoryGb: 16,
        hardwareConcurrency: 12,
        gpuHint: 'high',
      }),
    ).toBe('fallback')
  })

  it('selects high quality only when all capability hints are strong', () => {
    expect(
      selectQualityLevel({
        reducedMotion: false,
        supportsWebGL: true,
        deviceMemoryGb: 16,
        hardwareConcurrency: 12,
        gpuHint: 'high',
      }),
    ).toBe('high')
  })

  it('selects low quality when memory or core count are constrained', () => {
    expect(
      selectQualityLevel({
        reducedMotion: false,
        supportsWebGL: true,
        deviceMemoryGb: 4,
        hardwareConcurrency: 8,
        gpuHint: 'medium',
      }),
    ).toBe('low')

    expect(
      selectQualityLevel({
        reducedMotion: false,
        supportsWebGL: true,
        deviceMemoryGb: 8,
        hardwareConcurrency: 2,
        gpuHint: 'medium',
      }),
    ).toBe('low')
  })

  it('bails out to fallback on bad warmup frame-time budget', () => {
    expect(shouldBailoutToFallback([35, 33, 34, 36, 32, 35, 35, 33])).toBe(true)
    expect(
      selectQualityLevel({
        reducedMotion: false,
        supportsWebGL: true,
        deviceMemoryGb: 16,
        hardwareConcurrency: 12,
        gpuHint: 'high',
        warmupFrameTimesMs: [36, 35, 34, 35, 34, 35, 35, 36],
      }),
    ).toBe('fallback')
  })

  it('keeps interactive quality when frame times are healthy', () => {
    expect(shouldBailoutToFallback([16, 15, 17, 16, 18, 14, 16, 17])).toBe(false)
  })

  it('classifies software renderers as low GPU hints', () => {
    expect(classifyGpuHint('Google SwiftShader')).toBe('low')
  })
})
