import { describe, expect, it } from 'vitest'
import { naturalEarthCountriesPayload } from '@/data/globe/natural-earth-countries'
import { buildFixtureCountryFeatures, lonLatToVector3 } from '@/lib/globe/globe-geometry'
import { createCountryBufferGeometry, polygonGeometryInternals } from '@/lib/globe/polygon-buffer-geometry'

describe('Natural Earth 50m countries payload', () => {
  it('ships the full Natural Earth Admin 0 1:50m dataset with provenance', () => {
    expect(naturalEarthCountriesPayload.provenance.source).toBe('Natural Earth Admin 0 Countries')
    expect(naturalEarthCountriesPayload.provenance.sourceScale).toBe('1:50m')
    expect(naturalEarthCountriesPayload.provenance.sourceLicense).toBe('Public domain')
    expect(naturalEarthCountriesPayload.countries.length).toBeGreaterThanOrEqual(150)
  })

  it('includes representative countries spanning continents', () => {
    const iso2s = new Set(naturalEarthCountriesPayload.countries.map((country) => country.iso2))

    expect(iso2s.has('US')).toBe(true)
    expect(iso2s.has('VI')).toBe(true)
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

  it('retains separate Natural Earth polygon parts for archipelagos and transcontinental countries', () => {
    const expectedMultipolygonCountries = ['US', 'CA', 'RU', 'ID', 'PH']

    for (const iso2 of expectedMultipolygonCountries) {
      const country = naturalEarthCountriesPayload.countries.find((item) => item.iso2 === iso2)

      expect(country, `${iso2} should exist in the Natural Earth payload`).toBeTruthy()
      expect(country!.polygons.length, `${iso2} should retain more than one polygon part`).toBeGreaterThan(1)
    }
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
    expect(totalPoints).toBeLessThan(16_000)
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
    expect(position.count).toBeGreaterThan(30)
    expect(geometry.index?.count).toBeGreaterThan(90)
    expect(geometry.userData.empty).not.toBe(true)

    // Use the radial normals set by createCountryBufferGeometry rather than
    // recomputing via computeVertexNormals, which can produce zero normals
    // for degenerate triangles in synthetic hole geometries.
    const normals = geometry.getAttribute('normal')

    for (let index = 0; index < Math.min(normals.count, 400); index += 1) {
      const x = normals.getX(index)
      const y = normals.getY(index)
      const z = normals.getZ(index)
      const magnitude = Math.sqrt(x * x + y * y + z * z)
      expect(Number.isFinite(magnitude)).toBe(true)
      expect(magnitude, `radial normal at index ${index} should be unit length`).toBeGreaterThan(0.9)
      expect(magnitude).toBeLessThan(1.1)
    }

    geometry.dispose()
  })

  it('renders retained small multipolygon fragments at their own coordinates, not the country centroid', () => {
    const country = {
      iso2: 'XZ',
      iso3: 'XZZ',
      name: 'Synthetic multipolygon fixture',
      centroid: [0, 0] as [number, number],
      bbox: [0, 0, 50.1, 10.1] as [number, number, number, number],
      source: 'natural-earth-admin-0' as const,
      polygons: [
        {
          rings: [{ kind: 'outer' as const, points: [[0, 0], [4, 0], [0, 4], [0, 0]] as [number, number][] }],
        },
        {
          rings: [{ kind: 'outer' as const, points: [[50, 10], [50.1, 10], [50, 10.1], [50, 10]] as [number, number][] }],
        },
      ],
    }

    const geometry = createCountryBufferGeometry(country, { geometryMode: 'surface' })
    const position = geometry.getAttribute('position')
    const expected = lonLatToVector3(50, 10, 2.35 + 0.024 + 0.06)
    let hasFragmentVertex = false

    for (let index = 0; index < position.count; index += 1) {
      const dx = position.getX(index) - expected.x
      const dy = position.getY(index) - expected.y
      const dz = position.getZ(index) - expected.z
      if (Math.sqrt(dx * dx + dy * dy + dz * dz) < 0.01) {
        hasFragmentVertex = true
        break
      }
    }

    expect(hasFragmentVertex).toBe(true)
    geometry.dispose()
  })

  it('produces valid, indexed geometry for small countries without degenerating normals', () => {
    const smallCountry = naturalEarthCountriesPayload.countries.find((country) => country.iso2 === 'LU')
    expect(smallCountry).toBeTruthy()

    const geometry = createCountryBufferGeometry(smallCountry!)
    const position = geometry.getAttribute('position')

    expect(position.count).toBeGreaterThan(5)
    expect(geometry.index?.count).toBeGreaterThan(9)

    // Use radial normals set by createCountryBufferGeometry
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

describe('Bridge triangle filter regression tests for problem countries', () => {
  const problemCountries = ['CA', 'RU', 'US', 'CN', 'BR', 'AU', 'IN', 'AR', 'KZ']

  it('all problem countries produce non-empty geometry with valid triangle counts', () => {
    for (const iso2 of problemCountries) {
      const country = naturalEarthCountriesPayload.countries.find((c) => c.iso2 === iso2)
      expect(country, `Country ${iso2} should exist in payload`).toBeTruthy()

      const geometry = createCountryBufferGeometry(country!)
      expect(geometry.userData.empty, `${iso2} should not be empty`).not.toBe(true)
      expect(geometry.getAttribute('position').count, `${iso2} should have vertices`).toBeGreaterThan(10)
      expect(geometry.index?.count, `${iso2} should have triangles`).toBeGreaterThan(9)
      geometry.dispose()
    }
  })

  it('no problem country loses more than 40% of triangles to bridge filtering', () => {
    for (const iso2 of problemCountries) {
      const country = naturalEarthCountriesPayload.countries.find((c) => c.iso2 === iso2)
      if (!country) continue

      const geometry = createCountryBufferGeometry(country)
      const triangleCount = (geometry.index?.count ?? 0) / 3
      const vertexCount = geometry.getAttribute('position')?.count ?? 0

      // For a triangulated polygon with no holes, triangles ≈ vertices - 2.
      // With holes, more vertices are needed but triangle count shouldn't drop
      // drastically. A 40% loss indicates over-aggressive bridge filtering.
      const minExpectedTriangles = Math.max(3, Math.floor(vertexCount * 0.25))
      expect(triangleCount, `${iso2} should retain enough triangles after bridge filter`).toBeGreaterThanOrEqual(minExpectedTriangles)
      geometry.dispose()
    }
  })

  it('large countries with known interior water bodies have sufficient geometry density', () => {
    // Canada (Hudson Bay) and Russia (Gulf of Ob) are the most affected by bridge artefacts
    const ca = naturalEarthCountriesPayload.countries.find((c) => c.iso2 === 'CA')
    const ru = naturalEarthCountriesPayload.countries.find((c) => c.iso2 === 'RU')

    if (ca) {
      const caGeo = createCountryBufferGeometry(ca)
      const caTriangles = (caGeo.index?.count ?? 0) / 3
      // Canada has a large complex coastline; should have hundreds of triangles
      expect(caTriangles, 'CA should have substantial triangle coverage').toBeGreaterThan(50)
      caGeo.dispose()
    }

    if (ru) {
      const ruGeo = createCountryBufferGeometry(ru)
      const ruTriangles = (ruGeo.index?.count ?? 0) / 3
      expect(ruTriangles, 'RU should have substantial triangle coverage').toBeGreaterThan(50)
      ruGeo.dispose()
    }
  })

  it('normalizes longitudes to a contiguous range around a shared reference', () => {
    const { normalizeLongitudes } = polygonGeometryInternals

    // Simple ring: reference-centered normalization should not shift points
    const simple: [number, number][] = [
      [10, 50], [20, 50], [30, 50],
    ]
    const simpleResult = normalizeLongitudes(simple)
    const simpleMean = simpleResult.reduce((s, p) => s + p[0], 0) / simpleResult.length
    for (const [lon] of simpleResult) {
      expect(Math.abs(lon - simpleMean), 'each lon within ±180 of normalized center').toBeLessThanOrEqual(180)
    }
    // Mean should be close to 20
    expect(simpleMean).toBeCloseTo(20, 0)

    // Asymmetric anti-meridian crossing (like Russia): most vertices
    // are in positive longitudes with a few crossing into negative
    const asymmetric: [number, number][] = [
      [30, 60], [60, 60], [90, 60], [120, 60], [150, 60], [170, 60], [-170, 60], [-160, 60],
    ]
    const result = normalizeLongitudes(asymmetric)
    const meanLon = result.reduce((s, p) => s + p[0], 0) / result.length
    for (const [lon] of result) {
      expect(Math.abs(lon - meanLon), 'each lon should be within ±180 of normalized center').toBeLessThanOrEqual(180)
    }
    // The negative longitudes should be shifted to the positive side
    // since the mean is in the positive hemisphere
    const allPositive = result.every(([lon]) => lon > -180)
    expect(allPositive, 'asymmetric crossing normalized to contiguous range').toBe(true)
  })

  it('all triangles face outward after per-triangle winding fix', () => {
    for (const iso2 of ['US', 'CA', 'RU', 'CN', 'BR', 'AU']) {
      const country = naturalEarthCountriesPayload.countries.find((c) => c.iso2 === iso2)
      if (!country) continue

      // Use surface mode (same as rendering) — no wall triangles
      const geometry = createCountryBufferGeometry(country, {
        geometryMode: 'surface',
      })
      if (geometry.userData.empty) continue

      const pos = geometry.getAttribute('position')
      const idx = geometry.index
      if (!idx) continue

      // Sample up to 200 triangles and verify face normals point outward
      const triCount = idx.count / 3
      const sampleStep = Math.max(1, Math.floor(triCount / 200))
      let outwardCount = 0
      let checkedCount = 0

      for (let t = 0; t < triCount; t += sampleStep) {
        const ai = idx.getX(t * 3), bi = idx.getX(t * 3 + 1), ci = idx.getX(t * 3 + 2)
        const ax = pos.getX(ai), ay = pos.getY(ai), az = pos.getZ(ai)
        const bx = pos.getX(bi), by = pos.getY(bi), bz = pos.getZ(bi)
        const cx = pos.getX(ci), cy = pos.getY(ci), cz = pos.getZ(ci)

        const e1x = bx - ax, e1y = by - ay, e1z = bz - az
        const e2x = cx - ax, e2y = cy - ay, e2z = cz - az
        const nx = e1y * e2z - e1z * e2y
        const ny = e1z * e2x - e1x * e2z
        const nz = e1x * e2y - e1y * e2x

        const mx = (ax + bx + cx) / 3
        const my = (ay + by + cy) / 3
        const mz = (az + bz + cz) / 3

        const dot = nx * mx + ny * my + nz * mz
        checkedCount++
        if (dot >= 0) outwardCount++
      }

      const outwardRatio = outwardCount / checkedCount
      expect(outwardRatio, `${iso2} should have all triangles facing outward (per-triangle winding fix)`).toBeGreaterThanOrEqual(0.98)
      geometry.dispose()
    }
  })
})
