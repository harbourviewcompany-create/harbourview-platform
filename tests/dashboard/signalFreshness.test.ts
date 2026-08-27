import { describe, expect, it } from 'vitest'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import {
  canonicalizeDashboardSignals,
  inferEventEffectiveAt,
  resolveSignalFreshness,
} from '@/lib/dashboard/signalFreshness'

const NOW = Date.parse('2026-08-27T23:00:00Z')
const tag = { label: 'REGULATION', color: '#fff', bg: '#000', border: '#333' }

function signal(overrides: Partial<DashboardSignal> & Pick<DashboardSignal, 'id' | 'title' | 'market'>): DashboardSignal {
  return {
    type: 'regulatory_change',
    tag,
    timeAgo: 'Recently',
    confidence: 90,
    commercialImpact: 'Review current implications.',
    ...overrides,
  }
}

describe('canonical signal freshness', () => {
  it('excludes an old 100% confidence signal instead of letting confidence outrank freshness', () => {
    const fresh = signal({
      id: 'fresh',
      title: 'Fresh reviewed development',
      market: 'Global',
      confidence: 94,
      publishedAt: '2026-08-27T12:00:00Z',
    })
    const texas = signal({
      id: 'texas',
      title: 'Texas Supreme Court greenlights ban on Delta-8 THC in new ruling',
      market: 'Global',
      confidence: 100,
      publishedAt: '2026-06-06T06:00:00Z',
    })

    expect(canonicalizeDashboardSignals([texas, fresh], 'all', { nowMs: NOW, windowDays: 7 }))
      .toEqual([expect.objectContaining({ id: 'fresh' })])
  })

  it('recognizes the Slovenia 2025 effective date instead of presenting a 2026 rediscovery as new', () => {
    const slovenia = signal({
      id: 'slovenia',
      title: 'Slovenia legalizes medical cannabis (marijuana): new law effective from August 20, 2025 - Sibiz d.o.o.',
      market: 'Slovenia',
      confidence: 95,
      publishedAt: '2026-08-27T06:15:41Z',
      ingestedAt: '2026-08-27T06:50:00Z',
    })

    expect(inferEventEffectiveAt(slovenia.title)).toBe('2025-08-20T00:00:00.000Z')
    expect(resolveSignalFreshness(slovenia)).toEqual({
      at: '2025-08-20T00:00:00.000Z',
      basis: 'event_effective',
    })
    expect(canonicalizeDashboardSignals([slovenia], 'all', { nowMs: NOW, windowDays: 7 })).toEqual([])
  })

  it('deduplicates repeated observations by canonical source URL while keeping the freshest copy', () => {
    const url = 'https://example.com/current-development?utm_source=feed'
    const older = signal({
      id: 'older',
      title: 'Same development',
      market: 'Germany',
      confidence: 99,
      sourceUrl: url,
      publishedAt: '2026-08-26T10:00:00Z',
    })
    const newer = signal({
      id: 'newer',
      title: 'Same development',
      market: 'Germany',
      confidence: 90,
      sourceUrl: 'https://example.com/current-development',
      publishedAt: '2026-08-27T10:00:00Z',
    })

    const result = canonicalizeDashboardSignals([older, newer], 'Germany', { nowMs: NOW, windowDays: 7 })
    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('newer')
  })

  it('places direct jurisdiction matches before broader watch, then recency, then confidence', () => {
    const germany = signal({
      id: 'de',
      title: 'Germany development',
      market: 'Germany',
      confidence: 80,
      publishedAt: '2026-08-26T08:00:00Z',
    })
    const global = signal({
      id: 'global',
      title: 'Global development',
      market: 'Global',
      confidence: 100,
      publishedAt: '2026-08-27T20:00:00Z',
    })
    const germanyTieHigherConfidence = signal({
      id: 'de-high',
      title: 'Germany second development',
      market: 'Germany',
      confidence: 99,
      publishedAt: '2026-08-26T08:00:00Z',
    })

    const result = canonicalizeDashboardSignals(
      [global, germany, germanyTieHigherConfidence],
      'Germany',
      { nowMs: NOW, windowDays: 7 },
    )
    expect(result.map(item => item.id)).toEqual(['de-high', 'de', 'global'])
  })
})
