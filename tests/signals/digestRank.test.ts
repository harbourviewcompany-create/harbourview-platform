import { describe, it, expect } from 'vitest'
import {
  isDigestEligible,
  digestRankScore,
  rankDigestCandidates,
  type DigestCandidate,
} from '@/lib/signals/digestRank'

function row(partial: Partial<DigestCandidate> & { id: string }): DigestCandidate {
  return {
    quality_label: 'signal',
    quality_confidence: 0.9,
    content_type: 'story',
    impact: 'high',
    is_representative: true,
    country: 'Germany',
    corroboration_count: 1,
    ...partial,
  }
}

describe('isDigestEligible', () => {
  it('accepts story / research / market', () => {
    expect(isDigestEligible(row({ content_type: 'story' }))).toBe(true)
    expect(isDigestEligible(row({ content_type: 'research' }))).toBe(true)
    expect(isDigestEligible(row({ content_type: 'market' }))).toBe(true)
  })

  it('accepts high-impact regulatory with solid confidence', () => {
    expect(
      isDigestEligible(
        row({ content_type: 'regulatory', impact: 'high', quality_confidence: 0.8 }),
      ),
    ).toBe(true)
  })

  it('rejects spam and non-representative rows', () => {
    expect(isDigestEligible(row({ quality_label: 'spam' }))).toBe(false)
    expect(isDigestEligible(row({ is_representative: false }))).toBe(false)
  })

  it('rejects low-impact regulatory', () => {
    expect(
      isDigestEligible(
        row({ content_type: 'regulatory', impact: 'low', quality_confidence: 0.95 }),
      ),
    ).toBe(false)
  })
})

describe('digestRankScore', () => {
  it('ranks high-impact corroborated stories above lone low-impact items', () => {
    const strong = digestRankScore(
      row({
        content_type: 'story',
        impact: 'high',
        quality_confidence: 0.92,
        corroboration_count: 5,
      }),
    )
    const weak = digestRankScore(
      row({
        content_type: 'regulatory',
        impact: 'low',
        quality_confidence: 0.55,
        corroboration_count: 1,
      }),
    )
    expect(strong).toBeGreaterThan(weak)
  })

  it('soft-boosts helpful feedback and penalizes not_helpful', () => {
    const base = digestRankScore(row({ id: 'a', feedback_score: 0 }))
    const boosted = digestRankScore(row({ id: 'b', feedback_score: 16 }))
    const penalized = digestRankScore(row({ id: 'c', feedback_score: -24 }))
    expect(boosted).toBeGreaterThan(base)
    expect(penalized).toBeLessThan(base)
  })

  it('clamps extreme feedback so votes cannot dominate classifier', () => {
    const clampedHigh = digestRankScore(row({ id: 'h', feedback_score: 999 }))
    const normalHigh = digestRankScore(row({ id: 'n', feedback_score: 25 }))
    expect(clampedHigh).toBe(normalHigh)
  })
})

describe('rankDigestCandidates', () => {
  it('caps per-country and prefers higher rank scores', () => {
    const rows: DigestCandidate[] = []
    for (let i = 0; i < 6; i++) {
      rows.push(
        row({
          id: `us-${i}`,
          country: 'United States',
          quality_confidence: 0.99 - i * 0.01,
          content_type: 'story',
          impact: 'high',
        }),
      )
    }
    rows.push(
      row({
        id: 'ls-1',
        country: 'Lesotho',
        quality_confidence: 0.85,
        content_type: 'market',
        impact: 'high',
      }),
    )

    const ranked = rankDigestCandidates(rows, { maxPerCountry: 3, limit: 10 })
    const usCount = ranked.filter((r) => r.market === 'United States').length
    expect(usCount).toBe(3)
    expect(ranked.some((r) => r.market === 'Lesotho')).toBe(true)
    expect(ranked[0].id).toBe('us-0')
  })

  it('returns empty when nothing is eligible', () => {
    expect(
      rankDigestCandidates([
        row({ id: 'x', quality_label: 'boilerplate', content_type: 'noise' }),
      ]),
    ).toEqual([])
  })

  it('surfaces highly rated non-US items over flat US volume when feedback is strong', () => {
    const rows: DigestCandidate[] = [
      row({
        id: 'us-mediocre',
        country: 'United States',
        quality_confidence: 0.82,
        content_type: 'story',
        impact: 'medium',
        feedback_score: -12,
      }),
      row({
        id: 'br-strong',
        country: 'Brazil',
        quality_confidence: 0.88,
        content_type: 'market',
        impact: 'high',
        feedback_score: 20,
        corroboration_count: 3,
      }),
    ]
    const ranked = rankDigestCandidates(rows, { maxPerCountry: 3, limit: 5 })
    expect(ranked[0].id).toBe('br-strong')
  })
})
