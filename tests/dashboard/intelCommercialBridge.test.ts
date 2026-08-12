import { describe, expect, it } from 'vitest'
import { matchIntelCommercialFollowUps } from '@/lib/dashboard/intelCommercialBridge'

describe('matchIntelCommercialFollowUps', () => {
  it('pairs Germany signals with Germany listings', () => {
    const followUps = matchIntelCommercialFollowUps(
      [
        {
          id: 's1',
          title: 'BfArM import quota adjustment',
          market: 'Germany',
          commercialImpact: 'Quota headroom for medical importers',
        },
      ],
      [
        {
          id: 'l1',
          title: 'EU-GMP flower supply — 50kg',
          jurisdiction: 'Germany',
          category: 'Flower',
          view: 'cannabis',
          summary: 'Medical import ready',
        },
        {
          id: 'l2',
          title: 'Canadian outdoor',
          jurisdiction: 'Canada',
          category: 'Flower',
          view: 'cannabis',
        },
      ],
      'Germany',
    )

    expect(followUps).toHaveLength(1)
    expect(followUps[0].listingId).toBe('l1')
    expect(followUps[0].reason).toMatch(/jurisdiction/i)
  })

  it('returns empty when no jurisdiction overlap', () => {
    const followUps = matchIntelCommercialFollowUps(
      [{ id: 's1', title: 'Kenya court', market: 'Kenya' }],
      [{ id: 'l1', title: 'DE supply', jurisdiction: 'Germany', category: 'Flower', view: 'cannabis' }],
      'Germany',
    )
    expect(followUps).toEqual([])
  })
})
