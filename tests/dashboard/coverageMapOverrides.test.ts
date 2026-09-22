import { describe, expect, it } from 'vitest'
import { coverageOverridesFromLiveSources } from '@/lib/dashboard/coverageMap'

describe('coverageOverridesFromLiveSources', () => {
  it('promotes marketplace and evidence when volume is present', () => {
    const o = coverageOverridesFromLiveSources({
      signalCount: 6,
      marketplaceCount: 10,
      pipelineOpen: 4,
      evidenceCount: 6,
      hasPathway: true,
    })
    expect(o.signals).toBe('live')
    expect(o.regulatory).toBe('live')
    expect(o.marketplace).toBe('live')
    expect(o.pathway).toBe('live')
    expect(o.evidence).toBe('live')
  })

  it('marks empty marketplace as reference', () => {
    const o = coverageOverridesFromLiveSources({ signalCount: 0, marketplaceCount: 0 })
    expect(o.marketplace).toBe('reference')
    expect(o.signals).toBe('mixed')
  })
})
