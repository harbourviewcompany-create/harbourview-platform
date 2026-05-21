import { describe, expect, it } from 'vitest'
import { GLOBE_PERFORMANCE_BUDGET } from '@/config/globe/camera'
import {
  resolveDprCeiling,
  resolveGlobeDeviceClass,
  shouldDegradePerformance,
} from '@/components/globe/r3f/performanceBudget'

describe('globe performance budget policy', () => {
  it('uses mobile DPR cap on mobile device class', () => {
    expect(
      resolveDprCeiling({
        deviceClass: 'mobile',
        prefersReducedMotion: false,
        saveData: false,
      }),
    ).toBe(GLOBE_PERFORMANCE_BUDGET.maxDprMobile)
  })

  it('uses desktop DPR cap on desktop device class', () => {
    expect(
      resolveDprCeiling({
        deviceClass: 'desktop',
        prefersReducedMotion: false,
        saveData: false,
      }),
    ).toBe(GLOBE_PERFORMANCE_BUDGET.maxDprDesktop)
  })

  it('drops DPR when reduced motion is enabled', () => {
    expect(
      resolveDprCeiling({
        deviceClass: 'desktop',
        prefersReducedMotion: true,
        saveData: false,
      }),
    ).toBe(1.25)
  })

  it('classifies narrow viewport as mobile', () => {
    expect(resolveGlobeDeviceClass(480)).toBe('mobile')
    expect(resolveGlobeDeviceClass(1024)).toBe('desktop')
  })

  it('triggers degrade mode when render counters exceed thresholds', () => {
    expect(
      shouldDegradePerformance({
        drawCalls: GLOBE_PERFORMANCE_BUDGET.maxDrawCalls + 1,
        triangles: GLOBE_PERFORMANCE_BUDGET.maxTriangles,
      }),
    ).toBe(true)

    expect(
      shouldDegradePerformance({
        drawCalls: GLOBE_PERFORMANCE_BUDGET.maxDrawCalls,
        triangles: GLOBE_PERFORMANCE_BUDGET.maxTriangles + 1,
      }),
    ).toBe(true)

    expect(
      shouldDegradePerformance({
        drawCalls: GLOBE_PERFORMANCE_BUDGET.maxDrawCalls,
        triangles: GLOBE_PERFORMANCE_BUDGET.maxTriangles,
      }),
    ).toBe(false)
  })
})
