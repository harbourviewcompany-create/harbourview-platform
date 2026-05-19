import { BufferAttribute, BufferGeometry } from 'three'
import type { HarbourviewCountryGeometry } from './geojson-country-types'
import { lonLatToVector3 } from './globe-geometry'

export interface GlobeExtrusionConfig {
  radius: number
  plateLift: number
  extrusionHeight: number
}

const DEFAULT_CONFIG: GlobeExtrusionConfig = {
  radius: 2.35,
  plateLift: 0.024,
  extrusionHeight: 0.06,
}

function removeClosingDuplicate(points: [number, number][]) {
  if (points.length < 2) return points

  const first = points[0]
  const last = points[points.length - 1]

  if (first[0] === last[0] && first[1] === last[1]) {
    return points.slice(0, -1)
  }

  return points
}

function projectRingVertices(points: [number, number][], radius: number) {
  return points.flatMap((point) => {
    const vector = lonLatToVector3(point[0], point[1], radius)
    return [vector.x, vector.y, vector.z]
  })
}

function createTopFanIndices(vertexCount: number) {
  const indices: number[] = []

  for (let index = 1; index < vertexCount - 1; index += 1) {
    indices.push(0, index, index + 1)
  }

  return indices
}

function createWallIndices(vertexCount: number) {
  const indices: number[] = []
  const bottomOffset = vertexCount

  for (let index = 0; index < vertexCount; index += 1) {
    const next = (index + 1) % vertexCount

    indices.push(index, bottomOffset + index, next)
    indices.push(next, bottomOffset + index, bottomOffset + next)
  }

  return indices
}

export function createCountryBufferGeometry(
  country: HarbourviewCountryGeometry,
  config: Partial<GlobeExtrusionConfig> = {},
) {
  const mergedConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  }

  const geometry = new BufferGeometry()
  const outerRing = country.polygons[0]?.rings.find((ring) => ring.kind === 'outer')

  if (!outerRing || outerRing.points.length < 3) {
    return geometry
  }

  const points = removeClosingDuplicate(outerRing.points)

  if (points.length < 3) return geometry

  const topRadius = mergedConfig.radius + mergedConfig.plateLift + mergedConfig.extrusionHeight
  const bottomRadius = mergedConfig.radius + mergedConfig.plateLift
  const topVertices = projectRingVertices(points, topRadius)
  const bottomVertices = projectRingVertices(points, bottomRadius)
  const vertexCount = topVertices.length / 3
  const indices = [...createTopFanIndices(vertexCount), ...createWallIndices(vertexCount)]

  geometry.setAttribute('position', new BufferAttribute(new Float32Array([...topVertices, ...bottomVertices]), 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()

  geometry.userData = {
    iso2: country.iso2,
    iso3: country.iso3,
    centroid: country.centroid,
    bbox: country.bbox,
    plateLift: mergedConfig.plateLift,
    extrusionHeight: mergedConfig.extrusionHeight,
  }

  return geometry
}

export function estimateCountryTriangleCount(country: HarbourviewCountryGeometry) {
  const outerRing = country.polygons[0]?.rings.find((ring) => ring.kind === 'outer')
  if (!outerRing) return 0

  const vertexCount = removeClosingDuplicate(outerRing.points).length

  return Math.max(0, vertexCount - 2) + vertexCount * 2
}
