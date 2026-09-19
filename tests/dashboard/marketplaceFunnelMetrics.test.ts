import { describe, expect, it } from 'vitest'
import { buildMarketplaceFunnelMetrics, formatRate } from '@/lib/dashboard/marketplaceFunnelMetrics'
import { coverageOverridesFromSignals } from '@/lib/dashboard/coverageMap'

describe('buildMarketplaceFunnelMetrics', () => {
  it('computes contact, qualify, conversion, and loss rates', () => {
    const m = buildMarketplaceFunnelMetrics({
      receivedReviewing: 10,
      contacted: 5,
      qualified: 3,
      notFit: 2,
      closed: 1,
      wanted: 4,
      listings: 20,
    })
    expect(m.total).toBe(21) // 10 open + 5+3+2+1
    expect(m.contactRate).toBeCloseTo(11 / 21)
    expect(m.qualificationRate).toBeCloseTo(3 / 6) // 3 / (3+2+1)
    expect(m.conversionRate).toBeCloseTo(3 / 21)
    expect(m.wonProxy).toBe(3)
    expect(m.lostProxy).toBe(2)
    expect(m.lossRate).toBeCloseTo(2 / 5)
  })

  it('returns null rates on empty volume', () => {
    const m = buildMarketplaceFunnelMetrics({
      receivedReviewing: 0,
      contacted: 0,
      qualified: 0,
      closed: 0,
    })
    expect(m.contactRate).toBeNull()
    expect(m.conversionRate).toBeNull()
    expect(formatRate(null)).toBe('—')
  })
})

describe('coverageOverridesFromSignals', () => {
  it('escalates intel tiers with signal volume', () => {
    expect(coverageOverridesFromSignals(0).signals).toBe('mixed')
    expect(coverageOverridesFromSignals(2).signals).toBe('live')
    expect(coverageOverridesFromSignals(6).regulatory).toBe('live')
  })
})
