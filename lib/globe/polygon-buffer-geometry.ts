import { BufferAttribute, BufferGeometry, Vector2, Vector3 } from 'three'
import { ShapeUtils } from 'three/src/extras/ShapeUtils.js'
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

function pointsEqual(first: [number, number], second: [number, number]) {
  return first[0] === second[0] && first[1] === second[1]
}

function removeClosingDuplicate(points: [number, number][]) {
  if (points.length < 2) return points

  const first = points[0]
  const last = points[points.length - 1]

  if (pointsEqual(first, last)) {
    return points.slice(0, -1)
  }

  return points
}

function removeSequentialDuplicates(points: [number, number][]) {
  return points.filter((point, index) => index === 0 || !pointsEqual(point, points[index - 1]))
}

function normalizeRing(points: [number, number][]) {
  return removeClosingDuplicate(removeSequentialDuplicates(points))
}

function ringArea2D(points: [number, number][]) {
  let area = 0
  for (let i = 0; i < points.length; i += 1) {
    const [x1, y1] = points[i]
    const [x2, y2] = points[(i + 1) % points.length]
    area += x1 * y2 - x2 * y1
  }
  return area / 2
}

function ensureWinding(points: [number, number][], clockwise: boolean) {
  const isClockwise = ringArea2D(points) < 0
  if (isClockwise === clockwise) return points
  return [...points].reverse()
}

type NormalizedPolygon = { outer: [number, number][]; holes: [number, number][][] }

function normalizePolygonTopology(country: HarbourviewCountryGeometry): NormalizedPolygon[] {
  return country.polygons
    .map((polygon) => {
      const outerRing = polygon.rings.find((ring) => ring.kind === 'outer')
      if (!outerRing) return null

      const outer = ensureWinding(normalizeRing(outerRing.points), false)
      if (outer.length < 3) return null

      const holes = polygon.rings
        .filter((ring) => ring.kind === 'hole')
        .map((ring) => ensureWinding(normalizeRing(ring.points), true))
        .filter((ring) => ring.length >= 3)

      return { outer, holes }
    })
    .filter((polygon): polygon is NormalizedPolygon => polygon !== null)
}

function validateTriangleOrientation(
  a: number,
  b: number,
  c: number,
  vertices: number[],
  expectedOutward: 1 | -1,
  validateNormals: boolean,
) {
  if (!validateNormals) return [a, b, c]

  const vA = new Vector3(vertices[a * 3], vertices[a * 3 + 1], vertices[a * 3 + 2])
  const vB = new Vector3(vertices[b * 3], vertices[b * 3 + 1], vertices[b * 3 + 2])
  const vC = new Vector3(vertices[c * 3], vertices[c * 3 + 1], vertices[c * 3 + 2])

  const normal = vB.clone().sub(vA).cross(vC.clone().sub(vA)).normalize()
  const centroidDirection = vA.clone().add(vB).add(vC).divideScalar(3).normalize()

  const alignment = normal.dot(centroidDirection)
  if (alignment * expectedOutward < 0) {
    return [a, c, b]
  }

  return [a, b, c]
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
  const polygons = normalizePolygonTopology(country)

  if (polygons.length === 0) {
    geometry.userData = { iso2: country.iso2, iso3: country.iso3, empty: true }
    return geometry
  }

  const topRadius = mergedConfig.radius + mergedConfig.plateLift + mergedConfig.extrusionHeight
  const bottomRadius = mergedConfig.radius + mergedConfig.plateLift

  const positions: number[] = []
  const indices: number[] = []

  for (const polygon of polygons) {
    const allRings = [polygon.outer, ...polygon.holes]
    const topVertexOffset = positions.length / 3

    for (const ring of allRings) {
      for (const point of ring) {
        const top = lonLatToVector3(point[0], point[1], topRadius)
        const bottom = lonLatToVector3(point[0], point[1], bottomRadius)
        positions.push(top.x, top.y, top.z)
        positions.push(bottom.x, bottom.y, bottom.z)
      }
    }

    const outerVector2 = polygon.outer.map(([x, y]) => new Vector2(x, y))
    const holeVector2 = polygon.holes.map((hole) => hole.map(([x, y]) => new Vector2(x, y)))
    const topTriangles = ShapeUtils.triangulateShape(outerVector2, holeVector2)

    for (const triangle of topTriangles) {
      const a = topVertexOffset + triangle[0] * 2
      const b = topVertexOffset + triangle[1] * 2
      const c = topVertexOffset + triangle[2] * 2
      indices.push(...validateTriangleOrientation(a, b, c, positions, 1, true))
    }

    let ringStart = 0
    for (const ring of allRings) {
      for (let i = 0; i < ring.length; i += 1) {
        const next = (i + 1) % ring.length
        const aTop = topVertexOffset + (ringStart + i) * 2
        const bTop = topVertexOffset + (ringStart + next) * 2
        const aBottom = aTop + 1
        const bBottom = bTop + 1

        indices.push(...validateTriangleOrientation(aTop, aBottom, bTop, positions, -1, true))
        indices.push(...validateTriangleOrientation(bTop, aBottom, bBottom, positions, -1, true))
      }
      ringStart += ring.length
    }
  }

  if (positions.length === 0 || indices.length === 0) {
    geometry.userData = { iso2: country.iso2, iso3: country.iso3, empty: true }
    return geometry
  }

  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
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
  const polygons = normalizePolygonTopology(country)

  return polygons.reduce((sum, polygon) => {
    const ringVertexCount = [polygon.outer, ...polygon.holes].reduce((rSum, ring) => rSum + ring.length, 0)
    const topTriangles = Math.max(0, ringVertexCount - 2 + polygon.holes.length * 2)
    const wallTriangles = ringVertexCount * 2
    return sum + topTriangles + wallTriangles
  }, 0)
}

export const polygonGeometryInternals = {
  normalizeRing,
  normalizePolygonTopology,
  ringArea2D,
}
