import { describe, expect, it } from 'vitest'
import {
  computeWeightBasedCannabinoidDose,
  DOSING_ALGORITHM_VERSION,
} from '../../lib/clinical/dosing'

describe('computeWeightBasedCannabinoidDose', () => {
  it('computes total and per-dose mg', () => {
    const out = computeWeightBasedCannabinoidDose({
      weightKg: 70,
      mgPerKgPerDay: 2.5,
      dosesPerDay: 2,
    })
    expect(out.totalMgPerDay).toBe(175)
    expect(out.mgPerDose).toBe(87.5)
    expect(out.algorithmVersion).toBe(DOSING_ALGORITHM_VERSION)
    expect(out.cautions.length).toBeGreaterThan(0)
  })

  it('splits THC/CBD when percents provided', () => {
    const out = computeWeightBasedCannabinoidDose({
      weightKg: 80,
      mgPerKgPerDay: 1,
      dosesPerDay: 1,
      productThcPercent: 10,
      productCbdPercent: 10,
    })
    expect(out.thcMgPerDay).toBe(40)
    expect(out.cbdMgPerDay).toBe(40)
  })

  it('rejects invalid weight', () => {
    expect(() =>
      computeWeightBasedCannabinoidDose({
        weightKg: 0,
        mgPerKgPerDay: 1,
        dosesPerDay: 1,
      }),
    ).toThrow(/weightKg/)
  })
})
