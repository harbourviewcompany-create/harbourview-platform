import { describe, expect, it } from 'vitest'
import {
  MARKET_ECONOMICS,
  formatMarketPrice,
  getMarketEconomics,
  isMarketPriceStale,
} from '@/data/harbourview/market-economics'

describe('market economics reviewed snapshot', () => {
  it('keeps market identifiers unique and source-backed', () => {
    const ids = MARKET_ECONOMICS.map((market) => market.iso2)
    expect(new Set(ids).size).toBe(ids.length)

    for (const market of MARKET_ECONOMICS) {
      expect(market.iso2).toMatch(/^[A-Z]{2}$/)
      const metrics = [market.upstreamPrice, market.downstreamPrice].filter(Boolean)
      expect(metrics.length).toBeGreaterThan(0)

      for (const metric of metrics) {
        expect(metric?.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(metric?.sourceLabel?.trim().length).toBeGreaterThan(0)
        expect(['high', 'medium', 'low']).toContain(metric?.confidence)
      }
    }
  })

  it('preserves the current H1 2026 Canadian export benchmarks', () => {
    expect(getMarketEconomics('DE')?.upstreamPrice?.value).toBe(2857)
    expect(getMarketEconomics('AU')?.upstreamPrice?.value).toBe(1179)
    expect(getMarketEconomics('MT')?.upstreamPrice?.value).toBe(1880)
    expect(getMarketEconomics('PT')?.upstreamPrice?.value).toBe(1490)
    expect(getMarketEconomics('CZ')?.upstreamPrice?.value).toBe(1336)
  })

  it('keeps official Australian import context separate from pricing', () => {
    const australia = getMarketEconomics('AU')
    expect(australia?.importContext?.totalKg).toBe(81119)
    expect(australia?.importContext?.canadianKg).toBe(49107)
    expect(australia?.importContext?.sourceLabel).toBe('Australian Office of Drug Control')
  })

  it('does not expose raw source URLs in client-visible snapshots', () => {
    expect(JSON.stringify(MARKET_ECONOMICS)).not.toContain('https://')
  })

  it('formats price units without converting currencies', () => {
    expect(formatMarketPrice(getMarketEconomics('DE')?.upstreamPrice)).toContain('/kg')
    expect(formatMarketPrice(getMarketEconomics('GB')?.downstreamPrice)).toContain('/g')
  })

  it('marks old metrics stale without mutating their review date', () => {
    const germany = getMarketEconomics('DE')?.upstreamPrice
    expect(germany).toBeDefined()
    expect(isMarketPriceStale(germany!, new Date('2026-10-08T12:00:00Z'))).toBe(false)
    expect(isMarketPriceStale(germany!, new Date('2027-02-01T12:00:00Z'))).toBe(true)
  })
})
