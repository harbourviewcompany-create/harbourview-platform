import { describe, expect, it } from 'vitest'
import {
  chartDataFromDashboardSignals,
  chartDataFromSignals,
} from '@/lib/dashboard/chartDataFromSignals'
import type { CommandCentreSignal } from '@/lib/dashboard/commandCentreLiveData'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'

const sampleCc: CommandCentreSignal[] = [
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

const sampleDashboard: DashboardSignal[] = [
  {
    id: 'd1',
    title: 'DE regulatory',
    type: 'regulatory',
    market: 'Germany',
    tag: { label: 'Reg', color: '#fff', bg: '#000', border: '#000' },
    timeAgo: '1d',
    confidence: 80,
    commercialImpact: 'High',
    jurisdiction: 'DE',
    freshnessAt: '2026-09-01T12:00:00.000Z',
  },
  {
    id: 'd2',
    title: 'DE market',
    type: 'market',
    market: 'Germany',
    tag: { label: 'Mkt', color: '#fff', bg: '#000', border: '#000' },
    timeAgo: '1d',
    confidence: 60,
    commercialImpact: 'Medium',
    jurisdictions: ['DE'],
    sourcePublishedAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'd3',
    title: 'CA opportunity',
    type: 'market',
    market: 'Canada',
    tag: { label: 'Mkt', color: '#fff', bg: '#000', border: '#000' },
    timeAgo: '2d',
    confidence: 90,
    commercialImpact: 'High',
    jurisdiction: 'CA',
    eventEffectiveAt: '2026-09-02T00:00:00.000Z',
  },
]

describe('chartDataFromSignals', () => {
  it('aggregates CommandCentreSignal by date and country', () => {
    const { timeline, opportunities } = chartDataFromSignals(sampleCc)
    expect(timeline).toHaveLength(2)
    expect(timeline[0].signals).toBe(2)
    expect(timeline[0].score).toBe(70)
    expect(opportunities.find(o => o.country === 'DE')?.signals).toBe(2)
    expect(opportunities.find(o => o.country === 'CA')?.score).toBe(90)
  })

  it('returns empty series for empty input', () => {
    const { timeline, opportunities } = chartDataFromSignals([])
    expect(timeline).toEqual([])
    expect(opportunities).toEqual([])
  })
})

describe('chartDataFromDashboardSignals', () => {
  it('aggregates live DashboardSignal feed into chart series', () => {
    const { timeline, opportunities } = chartDataFromDashboardSignals(sampleDashboard)
    expect(timeline.length).toBeGreaterThanOrEqual(2)
    expect(opportunities.find(o => o.country === 'DE')?.signals).toBe(2)
    expect(opportunities.find(o => o.country === 'CA')?.score).toBe(90)
  })

  it('handles empty live feed', () => {
    const { timeline, opportunities } = chartDataFromDashboardSignals([])
    expect(timeline).toEqual([])
    expect(opportunities).toEqual([])
  })
})
