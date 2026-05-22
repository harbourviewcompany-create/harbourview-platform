import type { BufferGeometry } from 'three'
import type { HarbourviewCountryGeometry } from './geojson-country-types'
import { lonLatToVector3 } from './globe-geometry'

export interface HarbourviewCountryMeshDescriptor {
  iso2: string
  iso3: string
  geometryId: string
  triangleCountEstimate: number
  projectedVertices: [number, number, number][][][]
  fallback: {
    isFallback: boolean
    reason: 'none' | 'invalid-iso2' | 'empty-rings' | 'invalid-lon-lat' | 'empty-projected-vertices'
  }
}

function isValidIso2(iso2: string) {
  return /^[A-Z]{2}$/.test(iso2)
}

function isValidLonLat(point: [number, number]) {
  const [lon, lat] = point
  return Number.isFinite(lon) && Number.isFinite(lat) && lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90
}

function toFallbackDescriptor(country: HarbourviewCountryGeometry, reason: HarbourviewCountryMeshDescriptor['fallback']['reason']) {
  return {
    iso2: country.iso2,
    iso3: country.iso3,
    geometryId: `${country.iso3}-fallback`,
    triangleCountEstimate: 0,
    projectedVertices: [],
    fallback: {
      isFallback: true,
      reason,
    },
  }
}

export function triangulateCountryGeometry(country: HarbourviewCountryGeometry) {
  return country.polygons.map((polygon) =>
    polygon.rings.map((ring) =>
      ring.points.map((point) => {
        const vector = lonLatToVector3(point[0], point[1], 2.38)
        return [vector.x, vector.y, vector.z] as [number, number, number]
      }),
    ),
  )
}

export function buildCountryMeshDescriptor(country: HarbourviewCountryGeometry): HarbourviewCountryMeshDescriptor {
  if (!isValidIso2(country.iso2)) {
    return toFallbackDescriptor(country, 'invalid-iso2')
  }

  if (country.polygons.length === 0 || country.polygons.every((polygon) => polygon.rings.length === 0)) {
    return toFallbackDescriptor(country, 'empty-rings')
  }

  for (const polygon of country.polygons) {
    for (const ring of polygon.rings) {
      if (ring.points.length === 0) {
        return toFallbackDescriptor(country, 'empty-rings')
      }

      if (!ring.points.every(isValidLonLat)) {
        return toFallbackDescriptor(country, 'invalid-lon-lat')
      }
    }
  }

  const projectedVertices = triangulateCountryGeometry(country)

  const projectedVertexCount = projectedVertices.reduce(
    (sum, polygon) => sum + polygon.reduce((polygonSum, ring) => polygonSum + ring.length, 0),
    0,
  )

  if (projectedVertexCount === 0) {
    return toFallbackDescriptor(country, 'empty-projected-vertices')
  }

  const triangleCountEstimate = projectedVertices.reduce(
    (sum, polygon) =>
      sum + polygon.reduce((polygonSum, ring) => polygonSum + Math.max(0, ring.length - 2), 0),
    0,
  )

  return {
    iso2: country.iso2,
    iso3: country.iso3,
    geometryId: `${country.iso3}-mesh`,
    triangleCountEstimate,
    projectedVertices,
    fallback: {
      isFallback: false,
      reason: 'none',
    },
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function buildThreeCountryGeometry(country: HarbourviewCountryGeometry): BufferGeometry | null {
  // Scaffold only.
  // Final implementation will convert triangulated polygon data into indexed BufferGeometry
  // with shared vertices, border extrusion support, and raycast-friendly topology.
  return null
}
