import { describe, expect, it } from 'vitest'
import { naturalEarthCountriesPayload } from '@/data/globe/natural-earth-countries'
import { naturalEarthFixturePayload } from '@/data/globe/natural-earth-fixture'
import { bboxFocusDistance, createCountryFocusPose, easeInOutCubic, getInitialCameraPose } from '@/lib/globe/camera-focus'
import { GLOBE_CAMERA_CONFIG } from '@/config/globe/camera'
import type { HarbourviewCountryGeometry } from '@/lib/globe/geojson-country-types'
import { naturalEarthIngestionInternals, transformNaturalEarthCountries } from '@/lib/globe/natural-earth-ingestion'
import { buildCountryMeshDescriptor } from '@/lib/globe/country-mesh-generation'
import {
  createCountryBufferGeometry,
  estimateCountryTriangleCount,
  polygonGeometryInternals,
} from '@/lib/globe/polygon-buffer-geometry'

const longitudeSpan = (longitudes: number[]) => Math.max(...longitudes) - Math.min(...longitudes)

const allNormalizedOuterLongitudes = (country: HarbourviewCountryGeometry) =>
  polygonGeometryInternals
    .normalizePolygonTopology(country)
    .flatMap((polygon) => polygon.outer.map(([lon]) => lon))

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

  it('caps focus target distance for selected/search camera states', () => {
    const portugal = naturalEarthFixturePayload.countries.find((country) => country.iso2 === 'PT')
    expect(portugal).toBeTruthy()

    const defaultPose = createCountryFocusPose(portugal!)
    const cappedPose = createCountryFocusPose(portugal!, {
      targetDistanceMax: GLOBE_CAMERA_CONFIG.selectedTargetDistanceMax,
    })

    const vectorLength = (vector: [number, number, number]) =>
      Math.sqrt(vector[0] ** 2 + vector[1] ** 2 + vector[2] ** 2)

    expect(vectorLength(defaultPose.target)).toBeCloseTo(2.1, 5)
    expect(vectorLength(cappedPose.target)).toBeCloseTo(GLOBE_CAMERA_CONFIG.selectedTargetDistanceMax, 5)
    expect(vectorLength(cappedPose.target)).toBeLessThan(vectorLength(defaultPose.target))
  })

  it('clamps unsafe target distance overrides to the default safe max', () => {
    const portugal = naturalEarthFixturePayload.countries.find((country) => country.iso2 === 'PT')
    expect(portugal).toBeTruthy()

    const unsafePose = createCountryFocusPose(portugal!, { targetDistanceMax: 100 })

    const targetDistance = Math.sqrt(
      unsafePose.target[0] ** 2 + unsafePose.target[1] ** 2 + unsafePose.target[2] ** 2,
    )
    expect(targetDistance).toBeCloseTo(2.1, 5)
  })

  it('derives a tighter focus distance for small bboxes than large ones', () => {
    const smallIslandDistance = bboxFocusDistance([0, 0, 1.5, 1.5])
    const continentalDistance = bboxFocusDistance([-12, 35, 30, 60])
    const giantDistance = bboxFocusDistance([20, 41, 180, 81])

    expect(smallIslandDistance).toBeLessThan(continentalDistance)
    expect(continentalDistance).toBeLessThan(giantDistance)
    // MIN_FOCUS_DISTANCE = 3.2 (intentionally allows tight zoom for tiny countries like Luxembourg)
    expect(smallIslandDistance).toBeGreaterThanOrEqual(3.2)
    expect(giantDistance).toBeLessThanOrEqual(6.8)
  })

  it('returns the initial camera pose for return-to-globe behavior', () => {
    const pose = getInitialCameraPose()

    expect(pose.position).toEqual([...GLOBE_CAMERA_CONFIG.initialPosition])
    expect(pose.target).toEqual([...GLOBE_CAMERA_CONFIG.initialTarget])
  })

  it('produces an ease-in-out curve that is symmetric and clamped', () => {
    expect(easeInOutCubic(0)).toBe(0)
    expect(easeInOutCubic(1)).toBe(1)
    expect(easeInOutCubic(-0.5)).toBe(0)
    expect(easeInOutCubic(1.5)).toBe(1)
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 5)
    expect(easeInOutCubic(0.25)).toBeLessThan(0.25)
    expect(easeInOutCubic(0.75)).toBeGreaterThan(0.75)
  })

  it('normalizes closing and sequential duplicate polygon vertices', () => {
    const normalized = polygonGeometryInternals.normalizeRing([
      [0, 0],
      [1, 0],
      [1, 0],
      [1, 1],
      [0, 0],
    ])

    expect(normalized).toEqual([
      [0, 0],
      [1, 0],
      [1, 1],
    ])
  })

  it('uses minimum circular-span longitude as the antimeridian unwrap anchor for synthetic countries', () => {
    const antimeridianCountry: HarbourviewCountryGeometry = {
      iso2: 'AM',
      iso3: 'AMR',
      name: 'Antimeridian fixture',
      centroid: [0, 12],
      bbox: [-170, 10, 170, 14],
      source: 'natural-earth-admin-0',
      polygons: [
        {
          rings: [
            {
              kind: 'outer',
              points: [[170, 10], [-170, 10], [-170, 14], [170, 14], [170, 10]],
            },
          ],
        },
      ],
    }

    const referenceLongitude =
      polygonGeometryInternals.countryMinimumCircularSpanReferenceLongitude(antimeridianCountry)
    const normalizedLongitudes = allNormalizedOuterLongitudes(antimeridianCountry)

    expect(Math.abs(referenceLongitude)).toBeCloseTo(180, 5)
    expect(longitudeSpan(normalizedLongitudes)).toBeCloseTo(20, 5)
    expect(normalizedLongitudes.every((lon) => Math.abs(lon) >= 170)).toBe(true)
  })

  it('keeps every generated Natural Earth Russia polygon on a contiguous antimeridian span', () => {
    const russia = naturalEarthCountriesPayload.countries.find((country) => country.iso2 === 'RU')
    expect(russia).toBeTruthy()

    const referenceLongitude = polygonGeometryInternals.countryMinimumCircularSpanReferenceLongitude(
      russia!,
    )
    const normalizedPolygons = polygonGeometryInternals.normalizePolygonTopology(russia!)
    const geometry = createCountryBufferGeometry(russia!, { geometryMode: 'surface' })

    expect(referenceLongitude).toBeGreaterThan(90)
    expect(referenceLongitude).toBeLessThan(120)
    expect(normalizedPolygons.length).toBeGreaterThan(0)
    const normalizedLongitudes = allNormalizedOuterLongitudes(russia!)
    expect(Math.max(...normalizedLongitudes)).toBeGreaterThanOrEqual(180)
    for (const polygon of normalizedPolygons) {
      const polygonLongitudes = polygon.outer.map(([lon]) => lon)
      expect(longitudeSpan(polygonLongitudes)).toBeLessThan(180)
    }
    expect(geometry.getAttribute('position').count).toBeGreaterThan(100)
    expect(geometry.index?.count).toBeGreaterThan(150)

    geometry.dispose()
  })

  it('produces zero inward-facing triangles for Russia extruded plate (wall winding regression)', () => {
    const russia = naturalEarthCountriesPayload.countries.find((country) => country.iso2 === 'RU')
    expect(russia).toBeTruthy()

    const geometry = createCountryBufferGeometry(russia!, {
      geometryMode: 'extruded',
      simplifyTolerance: 0.04,
    })

    const posAttr = geometry.getAttribute('position')
    const idxAttr = geometry.index
    expect(posAttr).toBeTruthy()
    expect(idxAttr).toBeTruthy()

    const pa = posAttr.array as Float32Array
    const ia = idxAttr!.array as Uint16Array | Uint32Array
    let inward = 0
    for (let t = 0; t < ia.length; t += 3) {
      const a = ia[t], b = ia[t + 1], c = ia[t + 2]
      const ax = pa[a * 3], ay = pa[a * 3 + 1], az = pa[a * 3 + 2]
      const bx = pa[b * 3], by = pa[b * 3 + 1], bz = pa[b * 3 + 2]
      const cx = pa[c * 3], cy = pa[c * 3 + 1], cz = pa[c * 3 + 2]
      const ex = bx - ax, ey = by - ay, ez = bz - az
      const fx = cx - ax, fy = cy - ay, fz = cz - az
      const nx = ey * fz - ez * fy, ny = ez * fx - ex * fz, nz = ex * fy - ey * fx
      if (nx * nx + ny * ny + nz * nz < 1e-20) continue
      if (nx * (ax + bx + cx) + ny * (ay + by + cy) + nz * (az + bz + cz) < 0) inward++
    }

    expect(inward).toBe(0)
    geometry.dispose()
  })

  it('produces zero inward-facing triangles for Russia with exact production parameters', () => {
    const russia = naturalEarthCountriesPayload.countries.find((country) => country.iso2 === 'RU')
    expect(russia).toBeTruthy()

    // plateLift=0.026 + extrusionHeight=0.058 + radius=2.35 → topRadius=2.434 (same as default)
    // bottomRadius differs: 2.376 vs default 2.374 — validates global winding pass at prod values
    const geometry = createCountryBufferGeometry(russia!, {
      geometryMode: 'extruded',
      plateLift: 0.026,
      extrusionHeight: 0.058,
      simplifyTolerance: 0.04,
    })

    const posAttr = geometry.getAttribute('position')
    const idxAttr = geometry.index
    expect(posAttr).toBeTruthy()
    expect(idxAttr).toBeTruthy()

    const pa = posAttr.array as Float32Array
    const ia = idxAttr!.array as Uint16Array | Uint32Array
    let inward = 0
    for (let t = 0; t < ia.length; t += 3) {
      const a = ia[t], b = ia[t + 1], c = ia[t + 2]
      const ax = pa[a * 3], ay = pa[a * 3 + 1], az = pa[a * 3 + 2]
      const bx = pa[b * 3], by = pa[b * 3 + 1], bz = pa[b * 3 + 2]
      const cx = pa[c * 3], cy = pa[c * 3 + 1], cz = pa[c * 3 + 2]
      const ex = bx - ax, ey = by - ay, ez = bz - az
      const fx = cx - ax, fy = cy - ay, fz = cz - az
      const nx = ey * fz - ez * fy, ny = ez * fx - ex * fz, nz = ex * fy - ey * fx
      if (nx * nx + ny * ny + nz * nz < 1e-20) continue
      if (nx * (ax + bx + cx) + ny * (ay + by + cy) + nz * (az + bz + cz) < 0) inward++
    }

    expect(inward).toBe(0)
    geometry.dispose()
  })

  it('never returns empty/sparse geometry for Russia under production idle LOD inputs', () => {
    const russia = naturalEarthCountriesPayload.countries.find((country) => country.iso2 === 'RU')
    expect(russia).toBeTruthy()

    // Simulate the exact idle-path inputs CountryPolygonMeshLayer used to pass
    // (medium LOD). createCountryBufferGeometry must ignore that for RU and
    // still produce a dense, outward-facing plate.
    const geometry = createCountryBufferGeometry(russia!, {
      geometryMode: 'extruded',
      plateLift: 0.026,
      extrusionHeight: 0.058,
      simplifyTolerance: 0.04, // medium LOD — must be ignored for RU
    })

    expect(geometry.userData.empty).not.toBe(true)
    expect(geometry.userData.error).not.toBe(true)

    const posAttr = geometry.getAttribute('position')
    const idxAttr = geometry.index
    expect(posAttr).toBeTruthy()
    expect(idxAttr).toBeTruthy()
    expect(posAttr!.count).toBeGreaterThan(100)
    expect(idxAttr!.count).toBeGreaterThan(150)

    const pa = posAttr!.array as Float32Array
    const ia = idxAttr!.array as Uint16Array | Uint32Array
    let inward = 0
    for (let t = 0; t < ia.length; t += 3) {
      const a = ia[t], b = ia[t + 1], c = ia[t + 2]
      const ax = pa[a * 3], ay = pa[a * 3 + 1], az = pa[a * 3 + 2]
      const bx = pa[b * 3], by = pa[b * 3 + 1], bz = pa[b * 3 + 2]
      const cx = pa[c * 3], cy = pa[c * 3 + 1], cz = pa[c * 3 + 2]
      const ex = bx - ax, ey = by - ay, ez = bz - az
      const fx = cx - ax, fy = cy - ay, fz = cz - az
      const nx = ey * fz - ez * fy, ny = ez * fx - ex * fz, nz = ex * fy - ey * fx
      if (nx * nx + ny * ny + nz * nz < 1e-20) continue
      if (nx * (ax + bx + cx) + ny * (ay + by + cy) + nz * (az + bz + cz) < 0) inward++
    }
    expect(inward).toBe(0)

    geometry.dispose()
  })

  it('returns empty geometry metadata for invalid country rings', () => {
    const invalidCountry: HarbourviewCountryGeometry = {
      iso2: 'ZZ',
      iso3: 'ZZZ',
      name: 'Invalid fixture',
      centroid: [0, 0],
      bbox: [0, 0, 0, 0],
      source: 'natural-earth-admin-0',
      polygons: [{ rings: [{ kind: 'outer', points: [[0, 0], [1, 1]] }] }],
    }

    const geometry = createCountryBufferGeometry(invalidCountry)

    expect(geometry.getAttribute('position')).toBeUndefined()
    expect(geometry.userData.empty).toBe(true)
  })

  it('transforms Polygon and MultiPolygon Natural Earth features into the same Harbourview geometry contract', () => {
    const payload = transformNaturalEarthCountries({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { ISO_A2: 'AA', ISO_A3: 'AAA', NAME: 'Polygonland' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]],
          },
        },
        {
          type: 'Feature',
          properties: { ISO_A2: 'BB', ISO_A3: 'BBB', NAME: 'Multipolygonland' },
          geometry: {
            type: 'MultiPolygon',
            coordinates: [[[[2, 2], [3, 2], [3, 3], [2, 2]]]],
          },
        },
      ],
    })

    expect(payload.countries).toHaveLength(2)
    expect(payload.countries[0].polygons).toHaveLength(1)
    expect(payload.countries[1].polygons).toHaveLength(1)
  })

  it('handles empty point arrays in ingestion helpers without Infinity values', () => {
    expect(naturalEarthIngestionInternals.calculateBoundingBox([])).toEqual([0, 0, 0, 0])
    expect(naturalEarthIngestionInternals.calculateCentroid([])).toEqual([0, 0])
  })

  it('builds projected mesh descriptors for valid countries', () => {
    const germany = naturalEarthFixturePayload.countries.find((country) => country.iso2 === 'DE')
    expect(germany).toBeTruthy()

    const descriptor = buildCountryMeshDescriptor(germany!)

    expect(descriptor.fallback.isFallback).toBe(false)
    expect(descriptor.projectedVertices.length).toBeGreaterThan(0)
    expect(descriptor.triangleCountEstimate).toBeGreaterThan(0)
  })

  it('excludes invalid countries with deterministic fallback reasons', () => {
    const invalidIso: HarbourviewCountryGeometry = {
      iso2: 'U1',
      iso3: 'BAD',
      name: 'Brokenland',
      centroid: [0, 0],
      bbox: [0, 0, 1, 1],
      source: 'natural-earth-admin-0',
      polygons: [{ rings: [{ kind: 'outer', points: [[0, 0], [1, 0], [0, 1]] }] }],
    }

    const invalidCoordinates: HarbourviewCountryGeometry = {
      ...invalidIso,
      iso2: 'BD',
      polygons: [{ rings: [{ kind: 'outer', points: [[200, 0], [1, 0], [0, 1]] }] }],
    }

    expect(buildCountryMeshDescriptor(invalidIso).fallback).toEqual({
      isFallback: true,
      reason: 'invalid-iso2',
    })

    expect(buildCountryMeshDescriptor(invalidCoordinates).fallback).toEqual({
      isFallback: true,
      reason: 'invalid-lon-lat',
    })
  })
})