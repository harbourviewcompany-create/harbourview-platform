import { describe, expect, it } from 'vitest'
import { matchWatchRuleHits } from '@/components/dashboard/mobile-command/watchRuleHits'

describe('matchWatchRuleHits', () => {
  const rules = [
    { id: 'r1', keywords: ['BfArM', 'import quota'], is_active: true },
    { id: 'r2', keywords: ['packaging'], is_active: true },
    { id: 'r3', keywords: ['ignored'], is_active: false },
  ]

  it('matches active keyword rules against session signals', () => {
    const hits = matchWatchRuleHits(
      [
        {
          id: 's1',
          title: 'BfArM raises import quota for medical cannabis',
          market: 'Germany',
          commercialImpact: 'Quota headroom expands for licensed importers',
          confidence: 90,
          timeAgo: '2h ago',
        },
        {
          id: 's2',
          title: 'Kenya court updates',
          market: 'Kenya',
          commercialImpact: 'Monitor',
          confidence: 70,
          timeAgo: '1d ago',
        },
      ],
      rules,
    )

    expect(hits).toHaveLength(1)
    expect(hits[0].signalId).toBe('s1')
    expect(hits[0].matchedKeywords).toContain('BfArM')
    expect(hits[0].matchedKeywords).toContain('import quota')
  })

  it('returns empty when no active rules match', () => {
    const hits = matchWatchRuleHits(
      [{ id: 's1', title: 'Unrelated market note', market: 'Global' }],
      rules,
    )
    expect(hits).toEqual([])
  })

  it('ignores inactive rules', () => {
    const hits = matchWatchRuleHits(
      [{ id: 's1', title: 'Something ignored by policy', market: 'Global' }],
      rules,
    )
    expect(hits).toEqual([])
  })
})
