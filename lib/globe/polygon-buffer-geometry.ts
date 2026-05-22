import { BufferAttribute, BufferGeometry, ShapeUtils } from 'three'
import type { HarbourviewCountryGeometry } from './geojson-country-types'

export interface GlobeExtrusionConfig {
  radius: number
  plateLift: number
  extrusionHeight: number
  geometryMode: 'extruded' | 'surface'
  minimumAreaDeg2: number
  tinyCountryIso2: string[]
  tinyMarkerRadius: number
}

const DEFAULT_CONFIG: GlobeExtrusionConfig = {
  radius: 2.35,
  plateLift: 0.024,
  extrusionHeight: 0.06,
  geometryMode: 'extruded',
  minimumAreaDeg2: 0.12,
  tinyCountryIso2: ['SG', 'MC', 'VA', 'LI', 'SM', 'MT', 'MV', 'BH', 'AD'],
  tinyMarkerRadius: 0.016,
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

function calculatePlanarArea(points: [number, number][]) {
  let area = 0
  for (let index = 0; index < points.length; index += 1) {
    const [x1, y1] = points[index]
    const [x2, y2] = points[(index + 1) % points.length]
    area += x1 * y2 - x2 * y1
  }
  return Math.abs(area) / 2
}

function projectRingToLonLatPlane(points: [number, number][]) {
  const meanLon = points.reduce((sum, [lon]) => sum + lon, 0) / points.length
  return points.map(([lon, lat]) => [lon - meanLon, lat] as [number, number])
}

/**
 * Project a 2D lon/lat ring onto a sphere of the given radius.
 * Returns a flat Float32Array-compatible number[] with x,y,z per vertex.
 */
function projectRingVertices(points: [number, number][], radius: number): number[] {
  const result: number[] = []
  for (const [lon, lat] of points) {
    const phi = ((90 - lat) * Math.PI) / 180
    const theta = ((lon + 180) * Math.PI) / 180
    result.push(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta),
    )
  }
  return result
}

function createTopFanIndices(vertexCount: number) {
  const indices: number[] = []

  for (let index = 1; index < vertexCount - 1; index += 1) {
    indices.push(0, index, index + 1)
  }

  return indices
}

/**
 * Generate wall (side face) indices for an extruded polygon.
 * Top vertices occupy indices 0..vertexCount-1,
 * Bottom vertices occupy indices vertexCount..2*vertexCount-1.
 */
function createWallIndices(vertexCount: number): number[] {
  const indices: number[] = []
  for (let i = 0; i < vertexCount; i += 1) {
    const next = (i + 1) % vertexCount
    const top0 = i
    const top1 = next
    const bot0 = vertexCount + i
    const bot1 = vertexCount + next
    // Two triangles per quad
    indices.push(top0, bot0, top1)
    indices.push(top1, bot0, bot1)
  }
  return indices
}

type NormalizedPolygon = { outer: [number, number][]; holes: [number, number][][] }

function ensureWinding(points: [number, number][], clockwise: boolean): [number, number][] {
  const area = ringArea2D(points)
  const isClockwise = area < 0
  if (isClockwise === clockwise) return points
  return [...points].reverse()
}

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

function createSurfaceIndices(points: [number, number][]) {
  const projected = projectRingToLonLatPlane(points)
  const v2 = projected.map(([x, y]) => ({ x, y }))
  return ShapeUtils.triangulateShape(v2, []).flatMap((triangle) => [triangle[0], triangle[1], triangle[2]])
}

function createTinyCountryMarker(center: [number, number], radius: number, markerRadius: number) {
  const [lon, lat] = center
  const ring: [number, number][] = []
  const radialStep = 360 / 6
  const angularScale = markerRadius * 57.2958
  for (let degree = 0; degree < 360; degree += radialStep) {
    const rad = (degree * Math.PI) / 180
    const dLon = Math.cos(rad) * angularScale
    const dLat = Math.sin(rad) * angularScale
    ring.push([lon + dLon, lat + dLat])
  }
  return projectRingVertices(ring, radius)
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
  const useSurfaceMode = mergedConfig.geometryMode === 'surface'

  const allPositions: number[] = []
  const allIndices: number[] = []
  let vertexOffset = 0

  for (const polygon of polygons) {
    const points = polygon.outer
    const areaDeg2 = calculatePlanarArea(points)
    const isTinyCountry =
      mergedConfig.tinyCountryIso2.includes(country.iso2) || areaDeg2 < mergedConfig.minimumAreaDeg2

    const topVertices = isTinyCountry
      ? createTinyCountryMarker(country.centroid, topRadius, mergedConfig.tinyMarkerRadius)
      : projectRingVertices(points, topRadius)
    const vertexCount = topVertices.length / 3

    let polyIndices: number[]
    let polyPositions: number[]

    if (useSurfaceMode) {
      polyIndices = isTinyCountry ? createTopFanIndices(vertexCount) : createSurfaceIndices(points)
      polyPositions = topVertices
    } else {
      const bottomVertices = isTinyCountry
        ? createTinyCountryMarker(country.centroid, bottomRadius, mergedConfig.tinyMarkerRadius)
        : projectRingVertices(points, bottomRadius)
      polyIndices = [...createTopFanIndices(vertexCount), ...createWallIndices(vertexCount)]
      polyPositions = [...topVertices, ...bottomVertices]
    }

    allPositions.push(...polyPositions)
    allIndices.push(...polyIndices.map((idx) => idx + vertexOffset))
    vertexOffset += polyPositions.length / 3
  }

  geometry.setAttribute('position', new BufferAttribute(new Float32Array(allPositions), 3))
  geometry.setIndex(allIndices)
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()

  geometry.userData = {
    iso2: country.iso2,
    iso3: country.iso3,
    centroid: country.centroid,
    bbox: country.bbox,
    plateLift: mergedConfig.plateLift,
    extrusionHeight: mergedConfig.extrusionHeight,
    geometryMode: mergedConfig.geometryMode,
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
