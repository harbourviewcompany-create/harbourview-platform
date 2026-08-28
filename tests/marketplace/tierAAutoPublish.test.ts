import { describe, expect, it } from 'vitest'
import { decideTierAAutoPublish, tierAAutoPublishSuccessMessage } from '@/lib/marketplace/tierAAutoPublish'

describe('decideTierAAutoPublish', () => {
  it('auto-publishes clean consumables', () => {
    const d = decideTierAAutoPublish({
      categoryKey: 'consumables',
      title: 'Nitrile gloves 1000ct box',
      description: 'Powder-free exam gloves, carton of 10 boxes, EU stock',
    })
    expect(d.isTierACategory).toBe(true)
    expect(d.autoPublish).toBe(true)
    expect(d.status).toBe('approved_draft')
  })

  it('auto-publishes cultivation equipment without unsafe claims', () => {
    const d = decideTierAAutoPublish({
      categoryKey: 'cultivation_equipment',
      title: 'LED grow light 600W',
      description: 'Commercial fixture, used surplus, working condition',
    })
    expect(d.isTierACategory).toBe(true)
    expect(d.autoPublish).toBe(true)
    expect(d.status).toBe('approved_draft')
  })

  it('holds cannabis inventory for review', () => {
    const d = decideTierAAutoPublish({
      categoryKey: 'cannabis_inventory',
      title: 'EU-GMP dried flower 100kg',
      description: 'Export ready lot',
    })
    expect(d.isTierACategory).toBe(false)
    expect(d.autoPublish).toBe(false)
    expect(d.status).toBe('needs_review')
  })

  it('holds Tier A listing that contains regulated product terms', () => {
    const d = decideTierAAutoPublish({
      categoryKey: 'consumables',
      title: 'Dried flower packaging samples',
      description: 'Includes THC labels for dried flower lots',
    })
    expect(d.isTierACategory).toBe(true)
    expect(d.autoPublish).toBe(false)
    expect(d.status).toBe('needs_review')
    expect(d.holdReasons.some(r => r.includes('regulated_product') || r.includes('excluded'))).toBe(true)
  })

  it('holds genetics for review', () => {
    const d = decideTierAAutoPublish({
      categoryKey: 'genetics',
      title: 'Elite clone program',
      description: 'Tissue culture genetics',
    })
    expect(d.autoPublish).toBe(false)
    expect(d.status).toBe('needs_review')
  })
})

describe('tierAAutoPublishSuccessMessage', () => {
  it('returns publish message when auto-published', () => {
    expect(tierAAutoPublishSuccessMessage(true)).toMatch(/published/i)
  })
  it('returns review message when held', () => {
    expect(tierAAutoPublishSuccessMessage(false)).toMatch(/review/i)
  })
})
