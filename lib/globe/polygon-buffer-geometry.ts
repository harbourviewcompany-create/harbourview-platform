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
  /** Douglas-Peucker tolerance in degrees. 0 = no simplification. */
  simplifyTolerance?: number
}

// Rings above this point count are never simplified, regardless of the
// requested tolerance - see fix(globe): stop simplifying dense rings.
const RING_SIMPLIFY_MAX_POINTS = 400

const DEFAULT_CONFIG: GlobeExtrusionConfig = {
  radius: 2.35,
  plateLift: 0.024,
  extrusionHeight: 0.06,
  geometryMode: 'extruded',
  minimumAreaDeg2: 0.12,
  tinyCountryIso2: ['SG', 'MC', 'VA', 'LI', 'SM', 'MT', 'MV', 'BH', 'AD'],
  tinyMarkerRadius: 0.016,
  simplifyTolerance: 0.0,
}

/**
 * Iterative Douglas-Peucker line simplification.
 *
 * Replaces the previous recursive implementation which could blow the JS call
 * stack on highly complex polygons (Russia, Antarctica — thousands of points).
 * Uses an explicit stack of [startIndex, endIndex] pairs instead of call frames.
 */
function douglasPeucker(points: [number, number][], tolerance: number): [number, number][] {
  if (points.length <= 2 || tolerance <= 0) return points

  // keepFlags[i] = true means point i survives simplification
  const keepFlags = new Uint8Array(points.length)
  keepFlags[0] = 1
  keepFlags[points.length - 1] = 1

  // Explicit stack: each entry is a [start, end] index pair to process
  const stack: [number, number][] = [[0, points.length - 1]]

  while (stack.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const [start, end] = stack.pop()!
    if (end - start < 2) continue

    const [ax, ay] = points[start]
    const [bx, by] = points[end]
    const abLen = Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2)

    let maxDist = 0
    let maxIdx  = start

    for (let i = start + 1; i < end; i++) {
      const [px, py] = points[i]
      const dist = abLen === 0
        ? Math.sqrt((px - ax) ** 2 + (py - ay) ** 2)
        : Math.abs((by - ay) * px - (bx - ax) * py + bx * ay - by * ax) / abLen
      if (dist > maxDist) { maxDist = dist; maxIdx = i }
    }

    if (maxDist > tolerance) {
      keepFlags[maxIdx] = 1
      stack.push([start, maxIdx])
      stack.push([maxIdx, end])
    }
  }

  return points.filter((_, i) => keepFlags[i] === 1)
}

function pointsEqual(a: [number, number], b: [number, number]) {
  return a[0] === b[0] && a[1] === b[1]
}

function removeClosingDuplicate(pts: [number, number][]) {
  if (pts.length < 2) return pts
  return pointsEqual(pts[0], pts[pts.length - 1]) ? pts.slice(0, -1) : pts
}

function removeSequentialDuplicates(pts: [number, number][]) {
  return pts.filter((p, i) => i === 0 || !pointsEqual(p, pts[i - 1]))
}

function normalizeRing(pts: [number, number][]) {
  return removeClosingDuplicate(removeSequentialDuplicates(pts))
}

function ringArea2D(pts: [number, number][]) {
  let area = 0
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i]
    const [x2, y2] = pts[(i + 1) % pts.length]
    area += x1 * y2 - x2 * y1
  }
  return area / 2
}

function calculatePlanarArea(pts: [number, number][]) {
  return Math.abs(ringArea2D(pts))
}

/**
 * Normalise all longitudes in a ring to be within ±180° of a shared reference.
 * Resolves anti-meridian crossings (Russia, USA, Fiji, etc.) so that the
 * 2-D projection is a contiguous strip rather than a >300° span.
 */
function normalizeLongitudesAround(pts: [number, number][], referenceLongitude: number): [number, number][] {
  return pts.map(([lon, lat]) => {
    let l = lon
    while (l - referenceLongitude > 180) l -= 360
    while (l - referenceLongitude < -180) l += 360
    return [l, lat]
  })
}

function normalizeLongitudes(pts: [number, number][]): [number, number][] {
  if (pts.length === 0) return pts
  return normalizeLongitudesAround(pts, pts[0][0])
}

function normalizeReferenceLongitude(lon: number) {
  if (!Number.isFinite(lon)) return 0
  let normalized = ((lon + 180) % 360 + 360) % 360 - 180
  if (normalized === -180 && lon > 0) normalized = 180
  return normalized
}

function minimumCircularSpanReferenceLongitude(pts: [number, number][]) {
  if (pts.length === 0) return 0

  const sortedLongitudes = pts
    .map(([lon]) => ((lon % 360) + 360) % 360)
    .sort((a, b) => a - b)

  if (sortedLongitudes.length === 1) {
    return normalizeReferenceLongitude(sortedLongitudes[0])
  }

  let largestGap = -1
  let largestGapStartIndex = 0
  for (let i = 0; i < sortedLongitudes.length; i++) {
    const current = sortedLongitudes[i]
    const next = i === sortedLongitudes.length - 1 ? sortedLongitudes[0] + 360 : sortedLongitudes[i + 1]
    const gap = next - current
    if (gap > largestGap) {
      largestGap = gap
      largestGapStartIndex = i
    }
  }

  const spanStart = sortedLongitudes[(largestGapStartIndex + 1) % sortedLongitudes.length]
  const spanWidth = 360 - largestGap
  return normalizeReferenceLongitude(spanStart + spanWidth / 2)
}

function getOuterRingPoints(country: HarbourviewCountryGeometry) {
  return country.polygons.flatMap((polygon) => {
    const outerRing = polygon.rings.find((r) => r.kind === 'outer')
    return outerRing ? normalizeRing(outerRing.points) : []
  })
}

function countryMinimumCircularSpanReferenceLongitude(country: HarbourviewCountryGeometry) {
  const outerPoints = getOuterRingPoints(country)
  if (outerPoints.length === 0) return normalizeReferenceLongitude(country.centroid[0])
  return minimumCircularSpanReferenceLongitude(outerPoints)
}

function projectRingVertices(pts: [number, number][], radius: number): number[] {
  const out: number[] = []
  for (const [lon, lat] of pts) {
    const phi = ((90 - lat) * Math.PI) / 180
    const theta = ((lon + 180) * Math.PI) / 180
    out.push(
      -radius * Math.sin(phi) * Math.cos(theta),
       radius * Math.cos(phi),
       radius * Math.sin(phi) * Math.sin(theta),
    )
  }
  return out
}

function createTopFanIndices(n: number) {
  const idx: number[] = []
  for (let i = 1; i < n - 1; i++) idx.push(0, i, i + 1)
  return idx
}

/**
 * Triangulate the top face of a polygon ring (with holes) onto the sphere.
 */
function createTopFaceWithHoles(
  outerRaw: [number, number][],
  holesRaw: [number, number][][],
  radius: number,
): { positions: number[]; indices: number[] } {
  const outer = outerRaw
  const holes = holesRaw

  const meanLon = outer.reduce((s, [lon]) => s + lon, 0) / outer.length
  const toV2 = ([lon, lat]: [number, number]) => new Vector2(lon - meanLon, lat)

  const v2Outer = outer.map(toV2)
  const v2Holes = holes.map((h) => h.map(toV2))

  const allPoints: [number, number][] = [...outer, ...holes.flat()]
  const positions = projectRingVertices(allPoints, radius)
  const allV2 = [...v2Outer, ...v2Holes.flat()]

  let indices: number[]
  try {
    const rawTriangles = ShapeUtils.triangulateShape(v2Outer, v2Holes)

    const n = allV2.length
    if (rawTriangles.some(([a, b, c]) => a >= n || b >= n || c >= n)) {
      throw new RangeError('earcut index out of range')
    }

    // Push earcut indices as-is. The global Float32 winding pass in
    // _createCountryBufferGeometryInner is the single source of truth for
    // outward-facing orientation. Running a separate Float64 winding check here
    // can double-flip borderline triangles (GPU FMA arithmetic differs from
    // CPU float64), which is what caused the Russia black-void regression.
    indices = rawTriangles.flat()
  } catch {
    indices = createTopFanIndices(outer.length)
  }

  return { positions, indices }
}

function createWallIndices(ringCount: number, topBase: number, bottomBase: number, reverse = false): number[] {
  const idx: number[] = []
  for (let i = 0; i < ringCount; i++) {
    const next = (i + 1) % ringCount
    const t0 = topBase + i, t1 = topBase + next
    const b0 = bottomBase + i, b1 = bottomBase + next
    if (reverse) {
      idx.push(t0, t1, b0, t1, b1, b0)
    } else {
      idx.push(t0, b0, t1, t1, b0, b1)
    }
  }
  return idx
}

type NormalizedPolygon = { outer: [number, number][]; holes: [number, number][][] }

function ensureWinding(pts: [number, number][], clockwise: boolean): [number, number][] {
  const isClockwise = ringArea2D(pts) < 0
  return isClockwise === clockwise ? pts : [...pts].reverse()
}

function normalizePolygonTopology(country: HarbourviewCountryGeometry): NormalizedPolygon[] {
  const countryReferenceLon = countryMinimumCircularSpanReferenceLongitude(country)

  return country.polygons
    .map((polygon) => {
      const outerRing = polygon.rings.find((r) => r.kind === 'outer')
      if (!outerRing) return null

      const rawOuter = normalizeRing(outerRing.points)
      if (rawOuter.length < 3) return null

      const outer = ensureWinding(normalizeLongitudesAround(rawOuter, countryReferenceLon), false)
      const holes = polygon.rings
        .filter((r) => r.kind === 'hole')
        .map((r) => normalizeLongitudesAround(normalizeRing(r.points), countryReferenceLon))
        .map((r) => ensureWinding(r, true))
        .filter((r) => r.length >= 3)
      return { outer, holes }
    })
    .filter((p): p is NormalizedPolygon => p !== null)
}

function createTinyCountryMarker(center: [number, number], radius: number, markerRadius: number) {
  const [lon, lat] = center
  const ring: [number, number][] = []
  const scale = markerRadius * 57.2958
  for (let deg = 0; deg < 360; deg += 60) {
    const r = (deg * Math.PI) / 180
    ring.push([lon + Math.cos(r) * scale, lat + Math.sin(r) * scale])
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
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const geometry = new BufferGeometry()
  const polygons = normalizePolygonTopology(country)

  if (polygons.length === 0) {
    geometry.userData = { iso2: country.iso2, iso3: country.iso3, empty: true }
    return geometry
  }

  const topRadius = cfg.radius + cfg.plateLift + cfg.extrusionHeight
  const bottomRadius = cfg.radius + cfg.plateLift
  const useSurface = cfg.geometryMode === 'surface'

  const allPositions: number[] = []
  const allIndices: number[] = []
  let vOffset = 0

  for (const { outer: rawOuter, holes: rawHoles } of polygons) {
    const tolerance = cfg.simplifyTolerance ?? 0
    const outer = tolerance > 0 && rawOuter.length <= RING_SIMPLIFY_MAX_POINTS ? douglasPeucker(rawOuter, tolerance) : rawOuter
    const holes = tolerance > 0 ? rawHoles.map((h) => (h.length <= RING_SIMPLIFY_MAX_POINTS ? douglasPeucker(h, tolerance) : h)) : rawHoles
    const isTinyCountry = cfg.tinyCountryIso2.includes(country.iso2)
    const isTinySinglePolygonCountry = country.polygons.length === 1 && calculatePlanarArea(outer) < cfg.minimumAreaDeg2
    const isTiny = isTinyCountry || isTinySinglePolygonCountry

    if (isTiny) {
      const mv = createTinyCountryMarker(country.centroid, topRadius, cfg.tinyMarkerRadius)
      const mc = mv.length / 3
      allPositions.push(...mv)
      allIndices.push(...createTopFanIndices(mc).map((i) => i + vOffset))
      vOffset += mc
      continue
    }

    const topFace = createTopFaceWithHoles(outer, holes, topRadius)
    const topFaceBase = vOffset
    allPositions.push(...topFace.positions)
    allIndices.push(...topFace.indices.map((i) => i + topFaceBase))
    vOffset += topFace.positions.length / 3

    if (!useSurface) {
      let topRingBase = topFaceBase

      const outerCount = outer.length
      const bottomVerts = projectRingVertices(outer, bottomRadius)
      const bottomBase = vOffset
      allPositions.push(...bottomVerts)
      allIndices.push(...createWallIndices(outerCount, topRingBase, bottomBase))
      vOffset += outerCount
      topRingBase += outerCount

      for (const hole of holes) {
        const holeCount = hole.length
        const holeBottomBase = vOffset
        allPositions.push(...projectRingVertices(hole, bottomRadius))
        allIndices.push(...createWallIndices(holeCount, topRingBase, holeBottomBase, true))
        vOffset += holeCount
        topRingBase += holeCount
      }
    }
  }

  // Global Float32 winding pass — the single source of truth for outward-facing
  // orientation across all triangle types (top faces and walls). Top faces arrive
  // from earcut without per-triangle correction; walls may have reversed winding
  // after 2D→sphere projection for antimeridian-spanning countries (Russia, Fiji,
  // USA Alaska). Positions are converted to Float32 first so the dot-product sign
  // matches GPU precision; using float64 (number[]) can produce a different sign
  // on borderline triangles due to FMA arithmetic on mobile GPUs.
  const posF32 = new Float32Array(allPositions)
  for (let t = 0; t < allIndices.length; t += 3) {
    const a = allIndices[t], b = allIndices[t + 1], c = allIndices[t + 2]
    const ax = posF32[a * 3], ay = posF32[a * 3 + 1], az = posF32[a * 3 + 2]
    const bx = posF32[b * 3], by = posF32[b * 3 + 1], bz = posF32[b * 3 + 2]
    const cx = posF32[c * 3], cy = posF32[c * 3 + 1], cz = posF32[c * 3 + 2]
    const ex = bx - ax, ey = by - ay, ez = bz - az
    const fx = cx - ax, fy = cy - ay, fz = cz - az
    const nx = ey * fz - ez * fy, ny = ez * fx - ex * fz, nz = ex * fy - ey * fx
    if (nx * nx + ny * ny + nz * nz < 1e-20) continue
    if (nx * (ax + bx + cx) + ny * (ay + by + cy) + nz * (az + bz + cz) < 0) {
      allIndices[t + 1] = c
      allIndices[t + 2] = b
    }
  }

  geometry.setAttribute('position', new BufferAttribute(posF32, 3))
  geometry.setIndex(allIndices)

  // Radial normals: always point outward from sphere centre — exact and fast.
  const pos = geometry.getAttribute('position') as BufferAttribute
  const nrm = new Float32Array(pos.count * 3)
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i)
    const inv = 1 / Math.sqrt(x * x + y * y + z * z)
    nrm[i * 3] = x * inv; nrm[i * 3 + 1] = y * inv; nrm[i * 3 + 2] = z * inv
  }
  geometry.setAttribute('normal', new BufferAttribute(nrm, 3))
  geometry.computeBoundingSphere()

  geometry.userData = {
    iso2: country.iso2, iso3: country.iso3,
    centroid: country.centroid, bbox: country.bbox,
    plateLift: cfg.plateLift, extrusionHeight: cfg.extrusionHeight,
    geometryMode: cfg.geometryMode,
  }
  return geometry
}

export function estimateCountryTriangleCount(country: HarbourviewCountryGeometry) {
  return normalizePolygonTopology(country).reduce((sum, { outer, holes }) => {
    const verts = [outer, ...holes].reduce((s, r) => s + r.length, 0)
    const wallVertices = [outer, ...holes].reduce((s, r) => s + r.length, 0)
    return sum + Math.max(0, verts - 2 + holes.length * 2) + wallVertices * 2
  }, 0)
}

export const polygonGeometryInternals = {
  normalizeRing,
  normalizeLongitudes,
  normalizeLongitudesAround,
  minimumCircularSpanReferenceLongitude,
  countryMinimumCircularSpanReferenceLongitude,
  normalizePolygonTopology,
  ringArea2D,
}
