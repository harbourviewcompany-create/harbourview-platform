import { describe, expect, it } from 'vitest'
import { naturalEarthFixturePayload } from '@/data/globe/natural-earth-fixture'
import { createCountryFocusPose } from '@/lib/globe/camera-focus'
import { createCountryBufferGeometry, estimateCountryTriangleCount } from '@/lib/globe/polygon-buffer-geometry'

describe('Harbourview globe polygon rendering stage', () => {
  it('ships a Natural Earth-derived fixture payload with provenance', () => {
    expect(naturalEarthFixturePayload.provenance.source).toBe('Natural Earth Admin 0 Countries')
    expect(naturalEarthFixturePayload.provenance.sourceLicense).toBe('Public domain')
    expect(naturalEarthFixturePayload.countries.length).toBeGreaterThanOrEqual(5)
  })

  it('creates indexed BufferGeometry for a fixture country', () => {
    const germany = naturalEarthFixturePayload.countries.find((country) => country.iso2 === 'DE')
    expect(germany).toBeTruthy()

    const geometry = createCountryBufferGeometry(germany!)

    expect(geometry.getAttribute('position').count).toBeGreaterThan(6)
    expect(geometry.index?.count).toBeGreaterThan(6)
    expect(geometry.userData.iso2).toBe('DE')
  })

  it('estimates top fan plus wall triangles for extruded country plates', () => {
    const canada = naturalEarthFixturePayload.countries.find((country) => country.iso2 === 'CA')
    expect(canada).toBeTruthy()

    expect(estimateCountryTriangleCount(canada!)).toBeGreaterThan(12)
  })

  it('creates camera focus poses from country centroids', () => {
    const portugal = naturalEarthFixturePayload.countries.find((country) => country.iso2 === 'PT')
    expect(portugal).toBeTruthy()

    const pose = createCountryFocusPose(portugal!)

    expect(pose.position).toHaveLength(3)
    expect(pose.target).toHaveLength(3)
    expect(Math.abs(pose.position[0]) + Math.abs(pose.position[1]) + Math.abs(pose.position[2])).toBeGreaterThan(4)
  })
})
