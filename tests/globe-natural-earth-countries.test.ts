import { describe, expect, it } from 'vitest'
import { naturalEarthCountriesPayload } from '@/data/globe/natural-earth-countries'
import { buildFixtureCountryFeatures } from '@/lib/globe/globe-geometry'
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

  it('buildFixtureCountryFeatures is sourced from Natural Earth production payload, not pseudo fixture coordinates', () => {
    const features = buildFixtureCountryFeatures()

    expect(features.length).toBe(naturalEarthCountriesPayload.countries.length)
    const usCountryName = naturalEarthCountriesPayload.countries.find((country) => country.iso2 === 'US')?.name
    expect(features.find((feature) => feature.iso2 === 'US')?.name).toBe(usCountryName)
  })
})

describe('Natural Earth geometry topology validation', () => {
  it('supports multipolygon topology and interior holes for complex countries', () => {
    const france = naturalEarthCountriesPayload.countries.find((country) => country.iso2 === 'FR')
    const spain = naturalEarthCountriesPayload.countries.find((country) => country.iso2 === 'ES')
    expect(france).toBeTruthy()
    expect(spain).toBeTruthy()

    const outerA = france!.polygons[0].rings.find((ring) => ring.kind === 'outer')
    const outerB = spain!.polygons[0].rings.find((ring) => ring.kind === 'outer')
    expect(outerA).toBeTruthy()
    expect(outerB).toBeTruthy()

    const hole = outerA!.points.slice(0, 6).reverse()
    const complexCountry = {
      ...france!,
      iso2: 'XZ' as string,
      iso3: 'XZZ' as string,
      polygons: [
        { rings: [{ kind: 'outer' as const, points: outerA!.points }, { kind: 'hole' as const, points: [...hole, hole[0]] }] },
        { rings: [{ kind: 'outer' as const, points: outerB!.points }] },
      ],
    } as Parameters<typeof createCountryBufferGeometry>[0]

    const geometry = createCountryBufferGeometry(complexCountry)
    const position = geometry.getAttribute('position')

    expect(complexCountry.polygons.length).toBe(2)
    expect(position.count).toBeGreaterThan(100)
    expect(geometry.index?.count).toBeGreaterThan(300)
    expect(geometry.userData.empty).not.toBe(true)

    geometry.computeVertexNormals()
    const normals = geometry.getAttribute('normal')

    for (let index = 0; index < Math.min(normals.count, 400); index += 1) {
      const x = normals.getX(index)
      const y = normals.getY(index)
      const z = normals.getZ(index)
      const magnitude = Math.sqrt(x * x + y * y + z * z)
      expect(Number.isFinite(magnitude)).toBe(true)
      expect(magnitude).toBeGreaterThan(0.5)
      expect(magnitude).toBeLessThan(1.5)
    }

    geometry.dispose()
  })

  it('produces valid, indexed geometry for small countries without degenerating normals', () => {
    const smallCountry = naturalEarthCountriesPayload.countries.find((country) => country.iso2 === 'LU')
    expect(smallCountry).toBeTruthy()

    const geometry = createCountryBufferGeometry(smallCountry!)
    const position = geometry.getAttribute('position')

    expect(position.count).toBeGreaterThan(5)
    expect(geometry.index?.count).toBeGreaterThan(9)

    geometry.computeVertexNormals()
    const normals = geometry.getAttribute('normal')

    for (let index = 0; index < normals.count; index += 1) {
      const x = normals.getX(index)
      const y = normals.getY(index)
      const z = normals.getZ(index)
      expect(Number.isFinite(x)).toBe(true)
      expect(Number.isFinite(y)).toBe(true)
      expect(Number.isFinite(z)).toBe(true)
    }

    geometry.dispose()
  })
})
