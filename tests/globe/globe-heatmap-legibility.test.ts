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
    // Metallic plates with clear tier hue — not flat paint, not washed gold
    expect(legal.metalness).toBeGreaterThan(0.7)
    expect(legal.emissiveIntensity).toBeGreaterThan(0.25)
    expect(legal.plateBase.toLowerCase()).toMatch(/^#[0-9a-f]{6}$/)
    expect(legal.clearcoat).toBeGreaterThan(0.2)
    expect(legal.metalness).toBeGreaterThan(neutral.metalness - 0.2)
  })
})
