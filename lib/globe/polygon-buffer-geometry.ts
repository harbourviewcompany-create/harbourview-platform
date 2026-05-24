import { BufferAttribute, BufferGeometry, ShapeUtils, Vector2 } from 'three'
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
  if (pointsEqual(first, last)) return points.slice(0, -1)
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
  return Math.abs(ringArea2D(points))
}

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
 * Triangulate the top face of a polygon with optional holes.
 * Returns positions (flat x,y,z for [outer..., ...holes flattened]) and indices.
 * Uses ShapeUtils.triangulateShape (earcut) for correct non-convex + hole support.
 */
function createTopFaceWithHoles(
  outer: [number, number][],
  holes: [number, number][][],
  radius: number,
): { positions: number[]; indices: number[] } {
  // Project to a tangent plane centred on the polygon's mean longitude
  // to avoid anti-meridian distortion and make the 2-D coords sensible for earcut.
  const meanLon = outer.reduce((sum, [lon]) => sum + lon, 0) / outer.length
  const toV2 = ([lon, lat]: [number, number]) => new Vector2(lon - meanLon, lat)

  const v2Outer = outer.map(toV2)
  const v2Holes = holes.map((h) => h.map(toV2))

  // Vertex layout expected by triangulateShape:
  //   [outer[0], outer[1], ..., hole0[0], hole0[1], ..., hole1[0], ...]
  const allPoints: [number, number][] = [...outer, ...holes.flat()]
  const positions = projectRingVertices(allPoints, radius)

  let indices: number[]
  try {
    const rawTriangles = ShapeUtils.triangulateShape(v2Outer, v2Holes)
    // Filter oversized bridge triangles: earcut creates spanning triangles across
    // large concavities (e.g. Hudson Bay in Canada, Arctic coast in Russia).
    // Triangles with area > 4× the polygon average are artifacts — remove them.
    if (rawTriangles.length > 0) {
      const totalArea = Math.abs(ringArea2D(outer))
      const maxAllowed = (totalArea / rawTriangles.length) * 4
      const filtered = rawTriangles.filter(([i, j, k]) => {
        const ax = v2Outer[i].x, ay = v2Outer[i].y
        const bx = v2Outer[j].x, by = v2Outer[j].y
        const cx = v2Outer[k].x, cy = v2Outer[k].y
        return Math.abs((bx - ax) * (cy - ay) - (cx - ax) * (by - ay)) / 2 <= maxAllowed
      })
      indices = filtered.flatMap((t) => [t[0], t[1], t[2]])
    } else {
      indices = []
    }
  } catch {
    // Degenerate polygon — earcut failed, fall back to fan (no holes)
    indices = createTopFanIndices(outer.length)
  }

  return { positions, indices }
}

/**
 * Generate wall (side face) indices connecting top outer ring to bottom outer ring.
 * Top vertices: indices 0 .. outerCount-1 (within the top-face position block)
 * Bottom vertices: immediately after top-face block.
 */
function createWallIndices(
  outerCount: number,
  topBase: number,
  bottomBase: number,
): number[] {
  const indices: number[] = []
  for (let i = 0; i < outerCount; i += 1) {
    const next = (i + 1) % outerCount
    const t0 = topBase + i
    const t1 = topBase + next
    const b0 = bottomBase + i
    const b1 = bottomBase + next
    indices.push(t0, b0, t1, t1, b0, b1)
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

function createTinyCountryMarker(center: [number, number], radius: number, markerRadius: number) {
  const [lon, lat] = center
  const ring: [number, number][] = []
  const radialStep = 360 / 6
  const angularScale = markerRadius * 57.2958
  for (let degree = 0; degree < 360; degree += radialStep) {
    const rad = (degree * Math.PI) / 180
    ring.push([lon + Math.cos(rad) * angularScale, lat + Math.sin(rad) * angularScale])
  }
  return projectRingVertices(ring, radius)
}

export function createCountryBufferGeometry(
  country: HarbourviewCountryGeometry,
  config: Partial<GlobeExtrusionConfig> = {},
) {
  try {
    return _createCountryBufferGeometryInner(country, config)
  } catch (err) {
    console.warn(`[globe] geometry failed for ${country?.iso2}:`, err)
    const fallback = new BufferGeometry()
    fallback.userData = { iso2: country?.iso2, iso3: country?.iso3, empty: true, error: true }
    return fallback
  }
}

function _createCountryBufferGeometryInner(
  country: HarbourviewCountryGeometry,
  config: Partial<GlobeExtrusionConfig> = {},
) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }

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
    const { outer, holes } = polygon

    const areaDeg2 = calculatePlanarArea(outer)
    const isTinyCountry =
      mergedConfig.tinyCountryIso2.includes(country.iso2) ||
      areaDeg2 < mergedConfig.minimumAreaDeg2

    if (isTinyCountry) {
      // Tiny countries: simple marker dot, no holes, no walls
      const markerVerts = createTinyCountryMarker(country.centroid, topRadius, mergedConfig.tinyMarkerRadius)
      const markerCount = markerVerts.length / 3
      allPositions.push(...markerVerts)
      allIndices.push(...createTopFanIndices(markerCount).map((i) => i + vertexOffset))
      vertexOffset += markerCount
      continue
    }

    // --- Top face (with holes properly triangulated) ---
    const topFace = createTopFaceWithHoles(outer, holes, topRadius)
    const topFaceBase = vertexOffset

    allPositions.push(...topFace.positions)
    allIndices.push(...topFace.indices.map((i) => i + topFaceBase))
    vertexOffset += topFace.positions.length / 3

    if (!useSurfaceMode) {
      // --- Bottom outer ring (no holes needed — ocean sphere fills the base) ---
      const outerCount = outer.length
      const bottomVerts = projectRingVertices(outer, bottomRadius)
      const bottomBase = vertexOffset

      allPositions.push(...bottomVerts)
      // Walls: connect outer top ring (first outerCount verts of topFace) to outer bottom ring
      allIndices.push(...createWallIndices(outerCount, topFaceBase, bottomBase))
      vertexOffset += outerCount
    }
  }

  geometry.setAttribute('position', new BufferAttribute(new Float32Array(allPositions), 3))
  geometry.setIndex(allIndices)
  // Sphere-surface geometry: correct normal = normalised position (always radially outward).
  // computeVertexNormals() produces artefacts where triangle winding varies; this is exact.
  const posAttr = geometry.getAttribute('position') as BufferAttribute
  const normalData = new Float32Array(posAttr.count * 3)
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i), y = posAttr.getY(i), z = posAttr.getZ(i)
    const invLen = 1 / Math.sqrt(x * x + y * y + z * z)
    normalData[i * 3] = x * invLen
    normalData[i * 3 + 1] = y * invLen
    normalData[i * 3 + 2] = z * invLen
  }
  geometry.setAttribute('normal', new BufferAttribute(normalData, 3))
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
    const wallTriangles = polygon.outer.length * 2
    return sum + topTriangles + wallTriangles
  }, 0)
}

export const polygonGeometryInternals = {
  normalizeRing,
  normalizePolygonTopology,
  ringArea2D,
}
