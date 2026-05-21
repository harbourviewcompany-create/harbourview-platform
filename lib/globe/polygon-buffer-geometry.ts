import { BufferAttribute, BufferGeometry, ShapeUtils } from 'three'
import type { HarbourviewCountryGeometry } from './geojson-country-types'
import { lonLatToVector3 } from './globe-geometry'

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

function normalizeOuterRing(points: [number, number][]) {
  return removeClosingDuplicate(removeSequentialDuplicates(points))
}

function projectRingVertices(points: [number, number][], radius: number) {
  return points.flatMap((point) => {
    const vector = lonLatToVector3(point[0], point[1], radius)
    return [vector.x, vector.y, vector.z]
  })
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

function createSurfaceIndices(points: [number, number][]) {
  const projected = projectRingToLonLatPlane(points)
  return ShapeUtils.triangulateShape(projected, []).flatMap((triangle) => [triangle[0], triangle[1], triangle[2]])
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
  const outerRing = country.polygons[0]?.rings.find((ring) => ring.kind === 'outer')

  if (!outerRing || outerRing.points.length < 3) {
    geometry.userData = { iso2: country.iso2, iso3: country.iso3, empty: true }
    return geometry
  }

  const points = normalizeOuterRing(outerRing.points)

  if (points.length < 3) {
    geometry.userData = { iso2: country.iso2, iso3: country.iso3, empty: true }
    return geometry
  }

  const topRadius = mergedConfig.radius + mergedConfig.plateLift + mergedConfig.extrusionHeight
  const bottomRadius = mergedConfig.radius + mergedConfig.plateLift
  const areaDeg2 = calculatePlanarArea(points)
  const isTinyCountry =
    mergedConfig.tinyCountryIso2.includes(country.iso2) || areaDeg2 < mergedConfig.minimumAreaDeg2
  const useSurfaceMode = mergedConfig.geometryMode === 'surface'

  const topVertices = isTinyCountry
    ? createTinyCountryMarker(country.centroid, topRadius, mergedConfig.tinyMarkerRadius)
    : projectRingVertices(points, topRadius)
  const vertexCount = topVertices.length / 3

  let indices: number[]
  let positionData: number[]
  if (useSurfaceMode) {
    indices = isTinyCountry ? createTopFanIndices(vertexCount) : createSurfaceIndices(points)
    positionData = topVertices
  } else {
    const bottomVertices = isTinyCountry
      ? createTinyCountryMarker(country.centroid, bottomRadius, mergedConfig.tinyMarkerRadius)
      : projectRingVertices(points, bottomRadius)
    indices = [...createTopFanIndices(vertexCount), ...createWallIndices(vertexCount)]
    positionData = [...topVertices, ...bottomVertices]
  }

  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positionData), 3))
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
    geometryMode: mergedConfig.geometryMode,
    tinyCountryFallback: isTinyCountry,
  }

  return geometry
}

export function estimateCountryTriangleCount(country: HarbourviewCountryGeometry) {
  const outerRing = country.polygons[0]?.rings.find((ring) => ring.kind === 'outer')
  if (!outerRing) return 0

  const vertexCount = normalizeOuterRing(outerRing.points).length

  if (vertexCount < 3) return 0

  return Math.max(0, vertexCount - 2) + vertexCount * 2
}

export const polygonGeometryInternals = {
  normalizeOuterRing,
}
