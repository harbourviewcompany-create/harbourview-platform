import { describe, it, expect } from 'vitest'
import { parseCadenceHours } from '@/lib/intelligence-engine/queue/task-queue'

// Regression test for the 2026-07-02 fix: mapRow() previously hardcoded
// cadence_hours = 24 regardless of source_registry.crawl_cadence, which
// forced every successfully-crawled source back into the "due" queue every
// 24h even when configured weekly/monthly/quarterly/annual. At registry
// scale that manufactured re-crawl demand crowded out genuinely new sources
// indefinitely. See task-queue.ts doc comment for full root-cause writeup.
describe('parseCadenceHours', () => {
  it('resolves named cadences to the correct hour counts', () => {
    expect(parseCadenceHours('daily')).toBe(24)
    expect(parseCadenceHours('weekly')).toBe(24 * 7)
    expect(parseCadenceHours('monthly')).toBe(24 * 30)
    expect(parseCadenceHours('quarterly')).toBe(24 * 90)
    expect(parseCadenceHours('annual')).toBe(24 * 365)
  })

  it('is case-insensitive and trims whitespace', () => {
    expect(parseCadenceHours('Weekly')).toBe(24 * 7)
    expect(parseCadenceHours('  monthly  ')).toBe(24 * 30)
    expect(parseCadenceHours('QUARTERLY')).toBe(24 * 90)
  })

  it('parses raw numeric-hour strings directly, matching live data formats', () => {
    expect(parseCadenceHours('12')).toBe(12)
    expect(parseCadenceHours('24')).toBe(24)
    expect(parseCadenceHours('48')).toBe(48)
    expect(parseCadenceHours('72')).toBe(72)
  })

  it('falls back to 24h for null, empty, or unrecognized values rather than crashing', () => {
    expect(parseCadenceHours(null)).toBe(24)
    expect(parseCadenceHours('')).toBe(24)
    expect(parseCadenceHours('not-a-cadence')).toBe(24)
    expect(parseCadenceHours('-5')).toBe(24) // reject non-positive numerics
    expect(parseCadenceHours('0')).toBe(24)
  })
})
