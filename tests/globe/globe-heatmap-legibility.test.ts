import { describe, expect, it } from 'vitest'
import { resolveCountryMaterialState } from '@/lib/globe/globe-materials'

describe('globe regulatory heatmap legibility', () => {
  it('paints published tiers distinctly from neutral gold', () => {
    const neutral = resolveCountryMaterialState({
      visualState: 'idle',
      layerId: 'market_openness',
      regulatoryTier: null,
    })
    const legal = resolveCountryMaterialState({
      visualState: 'idle',
      layerId: 'market_openness',
      regulatoryTier: 'legal_commercial_access',
    })
    const prohibited = resolveCountryMaterialState({
      visualState: 'idle',
      layerId: 'market_openness',
      regulatoryTier: 'prohibited',
    })

    expect(neutral.plateBase.toLowerCase()).not.toBe(legal.plateBase.toLowerCase())
    expect(legal.plateBase.toLowerCase()).not.toBe(prohibited.plateBase.toLowerCase())
    // Strong fill: legal should be clearly green-ward, not near pure gold
    expect(legal.metalness).toBeLessThan(0.3)
    expect(legal.emissiveIntensity).toBeGreaterThan(0.4)
    expect(legal.plateBase.toLowerCase()).toMatch(/^#[0-9a-f]{6}$/)
  })
})
