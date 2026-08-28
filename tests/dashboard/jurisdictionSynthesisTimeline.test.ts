import { describe, expect, it } from 'vitest'
import {
  classifySynthesisTimeline,
  resolveSynthesisEvidenceAt,
  resolveSynthesisEventAt,
} from '@/lib/intelligence/jurisdictionSynthesisTimeline'

const NOW = Date.parse('2026-08-28T12:00:00Z')

describe('jurisdiction synthesis two-clock timeline', () => {
  it('keeps a newly published future-effective rule out of past/present changes', () => {
    const row = {
      headline: 'New Mexico banking exit becomes effective November 1, 2026',
      source_published_at: '2026-08-25T00:00:00Z',
      event_effective_at: '2026-11-01T00:00:00Z',
      observed_at: '2026-08-26T06:50:00Z',
    }

    expect(resolveSynthesisEvidenceAt(row, NOW)).toBe(Date.parse('2026-08-25T00:00:00Z'))
    expect(resolveSynthesisEventAt(row)).toBe(Date.parse('2026-11-01T00:00:00Z'))
    expect(classifySynthesisTimeline(row, NOW)).toEqual({
      kind: 'upcoming',
      evidenceAt: Date.parse('2026-08-25T00:00:00Z'),
      eventAt: Date.parse('2026-11-01T00:00:00Z'),
    })
  })

  it('keeps a current publication about an already-effective event in recent evidence', () => {
    const row = {
      headline: 'Michigan reports immediate cannabis licence suspension',
      source_published_at: '2026-08-25T00:00:00Z',
      event_effective_at: '2026-08-25T00:00:00Z',
    }

    expect(classifySynthesisTimeline(row, NOW).kind).toBe('recent')
  })

  it('uses an old effective date to defeat a legacy rediscovery timestamp when source publication is unknown', () => {
    const row = {
      headline: 'Slovenia law effective August 20, 2025',
      date: '2026-08-27T06:15:41Z',
      event_effective_at: '2025-08-20T00:00:00Z',
      observed_at: '2026-08-27T06:50:00Z',
    }

    expect(resolveSynthesisEvidenceAt(row, NOW)).toBe(Date.parse('2025-08-20T00:00:00Z'))
    expect(classifySynthesisTimeline(row, NOW).kind).toBe('out_of_window')
  })

  it('uses observation only as evidence eligibility when a future event has no publication timestamp', () => {
    const row = {
      headline: 'Rule effective September 15, 2026',
      event_effective_at: '2026-09-15T00:00:00Z',
      observed_at: '2026-08-28T10:00:00Z',
    }

    const result = classifySynthesisTimeline(row, NOW)
    expect(result.kind).toBe('upcoming')
    expect(result.evidenceAt).toBe(Date.parse('2026-08-28T10:00:00Z'))
    expect(result.eventAt).toBe(Date.parse('2026-09-15T00:00:00Z'))
  })
})
