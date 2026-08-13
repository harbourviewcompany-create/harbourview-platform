import { describe, expect, it } from 'vitest'
import { matchIntelCommercialFollowUps } from '@/lib/dashboard/intelCommercialBridge'
import { buildCommercialNextActions } from '@/lib/dashboard/buildCommercialActions'

describe('matchIntelCommercialFollowUps', () => {
  it('pairs Germany signals only with Germany listings', () => {
    const followUps = matchIntelCommercialFollowUps([{ id: 's1', title: 'BfArM import quota adjustment', market: 'Germany', commercialImpact: 'Quota headroom for medical importers' }],[{ id: 'l1', title: 'EU-GMP flower supply — 50kg', jurisdiction: 'Germany', category: 'Flower', view: 'cannabis', summary: 'Medical import ready' },{ id: 'l2', title: 'Canadian outdoor', jurisdiction: 'Canada', category: 'Flower', view: 'cannabis' }],'Germany')
    expect(followUps).toHaveLength(1); expect(followUps[0].listingId).toBe('l1')
  })
  it('returns empty when no jurisdiction overlap', () => { expect(matchIntelCommercialFollowUps([{ id:'s1', title:'Kenya court', market:'Kenya' }],[{ id:'l1', title:'DE supply', jurisdiction:'Germany', category:'Flower', view:'cannabis' }],'Germany')).toEqual([]) })
  it('dedupes by listing and prefers higher score', () => { const rows = matchIntelCommercialFollowUps([{ id:'s1', title:'import quota flower', market:'Germany' },{ id:'s2', title:'unrelated packaging note', market:'Germany' }],[{ id:'l1', title:'flower supply', jurisdiction:'Germany', category:'Flower', view:'cannabis', summary:'import ready' }],'Germany'); expect(rows).toHaveLength(1); expect(rows[0].listingId).toBe('l1') })
  it('boosts importer-preferred views', () => { const rows = matchIntelCommercialFollowUps([{ id:'s1', title:'market access', market:'Germany' }],[{ id:'svc', title:'Consulting', jurisdiction:'Germany', category:'Services', view:'services' },{ id:'can', title:'Flower lot', jurisdiction:'Germany', category:'Flower', view:'cannabis' }],'Germany',{ roleId:'importer', limit:2 }); expect(rows[0].listingId).toBe('can') })
  it('uses canonical SectionId commandHref typing and emits marketplace actions', () => {
    const href = (section: 'marketplace' | 'weekly-signals', changes?: Record<string,string|null>) => `/dashboard?section=${section}&view=${changes?.marketView ?? ''}`
    const actions = buildCommercialNextActions([{ id:'s1', title:'Import flower', market:'Germany' }],[{ id:'l1', title:'EU-GMP flower', jurisdiction:'Germany', category:'Flower', view:'cannabis' }],'Germany',href)
    expect(actions[0].href).toContain('section=marketplace')
  })
})
