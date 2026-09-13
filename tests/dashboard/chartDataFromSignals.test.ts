import { describe, expect, it } from 'vitest'
import { chartDataFromSignals } from '@/lib/dashboard/chartDataFromSignals'
import type { CommandCentreSignal } from '@/lib/dashboard/commandCentreLiveData'

const sample: CommandCentreSignal[] = [
  {
    id: 's1',
    date: '2026-09-01',
    cat: 'regulatory',
    pri: 'HIGH',
    score: 80,
    headline: 'Test DE',
    country: 'DE',
    verification: 'reviewed',
    tier: 'A',
    reviewed: true,
    top_lane: null,
  },
  {
    id: 's2',
    date: '2026-09-01',
    cat: 'market',
    pri: 'URGENT',
    score: 60,
    headline: 'Test DE 2',
    country: 'DE',
    verification: null,
    tier: null,
    reviewed: false,
    top_lane: null,
  },
  {
    id: 's3',
    date: '2026-09-02',
    cat: 'market',
    pri: 'HIGH',
    score: 90,
    headline: 'Test CA',
    country: 'CA',
    verification: 'reviewed',
    tier: 'A',
    reviewed: true,
    top_lane: null,
  },
]

describe('chartDataFromSignals', () => {
  it('aggregates timeline by date and opportunities by country', () => {
    const { timeline, opportunities } = chartDataFromSignals(sample)

    expect(timeline).toHaveLength(2)
    expect(timeline[0].date).toBe('2026-09-01')
    expect(timeline[0].signals).toBe(2)
    expect(timeline[0].score).toBe(70)

    expect(opportunities.some(o => o.country === 'DE')).toBe(true)
    expect(opportunities.find(o => o.country === 'DE')?.signals).toBe(2)
    expect(opportunities.find(o => o.country === 'CA')?.score).toBe(90)
  })

  it('returns empty series for empty input', () => {
    const { timeline, opportunities } = chartDataFromSignals([])
    expect(timeline).toEqual([])
    expect(opportunities).toEqual([])
  })
})
