import { describe, expect, it } from 'vitest'
import { naturalEarthCountriesPayload } from '@/data/globe/natural-earth-countries'
import { createCountryBufferGeometry } from '@/lib/globe/polygon-buffer-geometry'

describe('Natural Earth 110m countries payload', () => {
  it('ships the full Natural Earth Admin 0 1:110m dataset with provenance', () => {
    expect(naturalEarthCountriesPayload.provenance.source).toBe('Natural Earth Admin 0 Countries')
    expect(naturalEarthCountriesPayload.provenance.sourceScale).toBe('1:110m')
    expect(naturalEarthCountriesPayload.provenance.sourceLicense).toBe('Public domain')
    expect(naturalEarthCountriesPayload.countries.length).toBeGreaterThanOrEqual(150)
  })

  it('includes representative countries spanning continents', () => {
    const iso2s = new Set(naturalEarthCountriesPayload.countries.map((country) => country.iso2))

    expect(iso2s.has('US')).toBe(true)
    expect(iso2s.has('CA')).toBe(true)
    expect(iso2s.has('DE')).toBe(true)
    expect(iso2s.has('PT')).toBe(true)
    expect(iso2s.has('AU')).toBe(true)
    expect(iso2s.has('BR')).toBe(true)
    expect(iso2s.has('JP')).toBe(true)
    expect(iso2s.has('ZA')).toBe(true)
    expect(iso2s.has('IN')).toBe(true)
  })

  it('keeps every country within plausible lon/lat bounds', () => {
    for (const country of naturalEarthCountriesPayload.countries) {
      const [minLon, minLat, maxLon, maxLat] = country.bbox

      expect(minLon).toBeGreaterThanOrEqual(-180)
      expect(maxLon).toBeLessThanOrEqual(180)
      expect(minLat).toBeGreaterThanOrEqual(-90)
      expect(maxLat).toBeLessThanOrEqual(90)
      expect(minLon).toBeLessThanOrEqual(maxLon)
      expect(minLat).toBeLessThanOrEqual(maxLat)
    }
  })

  it('produces non-empty BufferGeometry for every country in the payload', () => {
    let emptyCount = 0

    for (const country of naturalEarthCountriesPayload.countries) {
      const geometry = createCountryBufferGeometry(country)
      if (geometry.userData.empty) {
        emptyCount += 1
        continue
      }
      expect(geometry.getAttribute('position').count).toBeGreaterThan(2)
      expect(geometry.index?.count).toBeGreaterThan(2)
      geometry.dispose()
    }

    expect(emptyCount).toBe(0)
  })

  it('keeps total vertex points within a sane mobile geometry budget', () => {
    const totalPoints = naturalEarthCountriesPayload.countries.reduce(
      (sum, country) =>
        sum +
        country.polygons.reduce(
          (innerSum, polygon) => innerSum + polygon.rings.reduce((c, ring) => c + ring.points.length, 0),
          0,
        ),
      0,
    )

    expect(totalPoints).toBeGreaterThan(2_000)
    expect(totalPoints).toBeLessThan(12_000)
  })
})
