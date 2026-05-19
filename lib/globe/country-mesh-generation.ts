import type { BufferGeometry } from 'three'
import type { HarbourviewCountryGeometry } from './geojson-country-types'
import { lonLatToVector3 } from './globe-geometry'

export interface HarbourviewCountryMeshDescriptor {
  iso2: string
  iso3: string
  geometryId: string
  triangleCountEstimate: number
  projectedVertices: [number, number, number][][][]
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
  const projectedVertices = triangulateCountryGeometry(country)

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
  }
}

export function buildThreeCountryGeometry(_country: HarbourviewCountryGeometry): BufferGeometry | null {
  // Scaffold only.
  // Final implementation will convert triangulated polygon data into indexed BufferGeometry
  // with shared vertices, border extrusion support, and raycast-friendly topology.
  return null
}
