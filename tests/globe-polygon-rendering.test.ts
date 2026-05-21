import { describe, expect, it } from 'vitest'
import { naturalEarthFixturePayload } from '@/data/globe/natural-earth-fixture'
import { bboxFocusDistance, createCountryFocusPose, easeInOutCubic, getInitialCameraPose } from '@/lib/globe/camera-focus'
import { GLOBE_CAMERA_CONFIG } from '@/config/globe/camera'
import type { HarbourviewCountryGeometry } from '@/lib/globe/geojson-country-types'
import { naturalEarthIngestionInternals, transformNaturalEarthCountries } from '@/lib/globe/natural-earth-ingestion'
import { buildCountryMeshDescriptor } from '@/lib/globe/country-mesh-generation'
import { createCountryBufferGeometry, estimateCountryTriangleCount, polygonGeometryInternals } from '@/lib/globe/polygon-buffer-geometry'

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

  it('derives a tighter focus distance for small bboxes than large ones', () => {
    const smallIslandDistance = bboxFocusDistance([0, 0, 1.5, 1.5])
    const continentalDistance = bboxFocusDistance([-12, 35, 30, 60])
    const giantDistance = bboxFocusDistance([20, 41, 180, 81])

    expect(smallIslandDistance).toBeLessThan(continentalDistance)
    expect(continentalDistance).toBeLessThan(giantDistance)
    expect(smallIslandDistance).toBeGreaterThanOrEqual(4.4)
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
    const normalized = polygonGeometryInternals.normalizeOuterRing([
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
