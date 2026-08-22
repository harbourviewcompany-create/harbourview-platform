import { describe, expect, it } from 'vitest'
import {
  buildHeatPoints,
  computeDensityField,
  densityToUint8,
  meanTopHeat,
  resolveHeatQuality,
  type HeatPoint,
} from '@/lib/globe/heat-density'
import type { GlobeCountryMarker, GlobeSignal } from '@/lib/globe/supabaseGlobeData'

function marker(
  partial: Partial<GlobeCountryMarker> & Pick<GlobeCountryMarker, 'iso2' | 'lat' | 'lng'>,
): GlobeCountryMarker {
  return {
    name: partial.iso2,
    opportunityScore: null,
    signalsStatus: null,
    marketAccessStatus: null,
    regulatoryTier: null,
    ...partial,
  }
}

describe('buildHeatPoints', () => {
  it('uses max of opportunity and signal activity', () => {
    const countries = [
      marker({ iso2: 'DE', lat: 51.1, lng: 10.4, opportunityScore: 80 }),
      marker({ iso2: 'US', lat: 39, lng: -98, opportunityScore: 20 }),
    ]
    const signals: Record<string, GlobeSignal[]> = {
      US: Array.from({ length: 8 }, (_, i) => ({
        id: `s${i}`,
        headline: 'x',
        score: 50,
        cat: null,
        createdAt: '2026-01-01T00:00:00Z',
        countryIso2: 'US',
      })),
    }
    const points = buildHeatPoints(countries, signals)
    const de = points.find((p) => p.lat === 51.1)
    const us = points.find((p) => p.lat === 39)
    expect(de?.weight).toBeCloseTo(0.8, 5)
    expect(us?.weight).toBeCloseTo(0.8, 5) // 8/10 signals
  })

  it('drops near-zero and invalid coords', () => {
    const countries = [
      marker({ iso2: 'XX', lat: NaN, lng: 0, opportunityScore: 100 }),
      marker({ iso2: 'YY', lat: 0, lng: 0, opportunityScore: 1 }),
    ]
    expect(buildHeatPoints(countries, {})).toHaveLength(0)
  })
})

describe('meanTopHeat', () => {
  it('returns 0 for empty', () => {
    expect(meanTopHeat([])).toBe(0)
  })

  it('averages top quartile', () => {
    const points: HeatPoint[] = [
      { lat: 0, lng: 0, weight: 1 },
      { lat: 0, lng: 1, weight: 0.5 },
      { lat: 0, lng: 2, weight: 0.25 },
      { lat: 0, lng: 3, weight: 0.1 },
    ]
    // top 25% of 4 = 1 value → 1
    expect(meanTopHeat(points)).toBeCloseTo(1, 5)
  })
})

describe('computeDensityField', () => {
  it('peaks near a single high-weight point', () => {
    const points: HeatPoint[] = [{ lat: 0, lng: 0, weight: 1 }]
    const field = computeDensityField(points, 64, 32)
    // equirect: lat 0 → mid row, lng 0 → mid col
    const midY = Math.floor(32 / 2)
    const midX = Math.floor(64 / 2)
    const peak = field[midY * 64 + midX]
    const corner = field[0]
    expect(peak).toBeGreaterThan(corner)
    expect(peak).toBeGreaterThan(0.2)
  })

  it('returns zeros for empty points', () => {
    const field = computeDensityField([], 16, 8)
    expect(field.every((v) => v === 0)).toBe(true)
  })
})

describe('densityToUint8', () => {
  it('maps 0–1 to 0–255', () => {
    const out = densityToUint8(new Float32Array([0, 0.5, 1, 1.5, -0.1]))
    expect([...out]).toEqual([0, 128, 255, 255, 0])
  })
})

describe('resolveHeatQuality', () => {
  it('forces low under reduced motion', () => {
    expect(resolveHeatQuality({ prefersReducedMotion: true })).toBe('low')
  })

  it('defaults to medium when motion allowed', () => {
    expect(resolveHeatQuality({ prefersReducedMotion: false, forceLow: false })).toBe('medium')
  })
})
