import { describe, expect, it } from 'vitest'
import { getCountryFocusVector, lonLatToVector3 } from '@/lib/globe/globe-geometry'
import { resolveCountryMaterialState } from '@/lib/globe/globe-materials'
import { GLOBE_CAMERA_CONFIG } from '@/config/globe/camera'

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

  it('defines deterministic globe camera defaults', () => {
    expect(GLOBE_CAMERA_CONFIG.initialPosition).toEqual([0, 0.6, 11.2])
    expect(GLOBE_CAMERA_CONFIG.initialTarget).toEqual([0, 0, 0])
    expect(GLOBE_CAMERA_CONFIG.fov).toBe(26)
    expect(GLOBE_CAMERA_CONFIG.near).toBe(0.1)
    expect(GLOBE_CAMERA_CONFIG.far).toBe(100)
    expect(GLOBE_CAMERA_CONFIG.rotateSpeed).toBe(0.52)
    expect(GLOBE_CAMERA_CONFIG.dampingFactor).toBe(0.085)
    expect(GLOBE_CAMERA_CONFIG.enableDamping).toBe(true)
    expect(GLOBE_CAMERA_CONFIG.enableZoom).toBe(true)
    expect(GLOBE_CAMERA_CONFIG.enablePan).toBe(false)
  })

  it('enforces orbit control limits to prevent camera regression', () => {
    expect(GLOBE_CAMERA_CONFIG.minDistance).toBeLessThanOrEqual(GLOBE_CAMERA_CONFIG.maxDistance)
    expect(GLOBE_CAMERA_CONFIG.minPolarAngle).toBeLessThan(GLOBE_CAMERA_CONFIG.maxPolarAngle)
    expect(GLOBE_CAMERA_CONFIG.minAzimuthAngle).toBeLessThan(GLOBE_CAMERA_CONFIG.maxAzimuthAngle)

    expect(GLOBE_CAMERA_CONFIG.minPolarAngle).toBeGreaterThanOrEqual(0)
    expect(GLOBE_CAMERA_CONFIG.maxPolarAngle).toBeLessThanOrEqual(Math.PI)
    // Azimuth limits: Infinity means unrestricted rotation (intentional — globe spins freely)
    expect(GLOBE_CAMERA_CONFIG.minAzimuthAngle).toBeDefined()
    expect(GLOBE_CAMERA_CONFIG.maxAzimuthAngle).toBeDefined()
  })
})
