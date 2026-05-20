import { describe, expect, it } from 'vitest'
import { getCountryFocusVector, lonLatToVector3 } from '@/lib/globe/globe-geometry'
import { resolveCountryMaterialState } from '@/lib/globe/globe-materials'

describe('Harbourview globe foundation', () => {
  it('projects lon/lat coordinates onto the globe sphere', () => {
    const vector = lonLatToVector3(10, 52)

    expect(vector.x).toBeTypeOf('number')
    expect(vector.y).toBeTypeOf('number')
    expect(vector.z).toBeTypeOf('number')
    expect(Math.abs(vector.y)).toBeGreaterThan(0.5)
  })

  it('returns normalized focus vectors for countries', () => {
    const vector = getCountryFocusVector({
      iso2: 'DE',
      name: 'Germany',
      centroid: { lon: 10.4, lat: 51.1 },
      rings: [],
    })

    const magnitude = Math.sqrt(vector.x ** 2 + vector.y ** 2 + vector.z ** 2)

    expect(Math.round(magnitude)).toBe(1)
  })

  it('uses stronger emissive values for selected countries', () => {
    const idle = resolveCountryMaterialState({
      visualState: 'idle',
      layerId: 'country_select',
    })

    const selected = resolveCountryMaterialState({
      visualState: 'selected',
      layerId: 'country_select',
    })

    expect(selected.emissiveIntensity).toBeGreaterThan(idle.emissiveIntensity)
    expect(selected.borderColor).not.toBe(idle.borderColor)
  })

  it('distinguishes documentation burden from opportunity heat', () => {
    const burden = resolveCountryMaterialState({
      visualState: 'idle',
      layerId: 'documentation_burden',
    })

    const opportunity = resolveCountryMaterialState({
      visualState: 'idle',
      layerId: 'opportunity_heat',
    })

    expect(burden.plateBase).not.toBe(opportunity.plateBase)
    expect(burden.emissive).not.toBe(opportunity.emissive)
  })
})
