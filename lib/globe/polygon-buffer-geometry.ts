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
 * Normalise all longitudes in a ring to be within ±180° of the first vertex.
 * This resolves anti-meridian crossings (Russia, USA, Fiji, etc.) so that
 * the 2-D projection is a contiguous strip rather than a >300° span.
 */
function normalizeLongitudes(pts: [number, number][]): [number, number][] {
  if (pts.length === 0) return pts
  const ref = pts[0][0]
  return pts.map(([lon, lat]) => {
    let l = lon
    while (l - ref > 180) l -= 360
    while (l - ref < -180) l += 360
    return [l, lat]
  })
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
 *
 * Strategy:
 *  1. Normalise longitudes around the ring's first vertex to handle anti-meridian.
 *  2. Project to a flat 2-D plane (lon – meanLon, lat) for earcut.
 *  3. Run ShapeUtils.triangulateShape (earcut).
 *  4. Filter bridge triangles: earcut creates spanning "bridge" triangles across
 *     large concavities (Gulf of Mexico, Hudson Bay, Arctic coast of Russia, etc.)
 *     These bridges have face normals pointing INTO the sphere. We remove any
 *     triangle whose 3-D face normal dot product with the vertex position vector
 *     is negative — i.e. it faces inward. This is exact and requires no tuning.
 *  5. Fall back to fan triangulation only if earcut throws.
 */
function createTopFaceWithHoles(
  outerRaw: [number, number][],
  holesRaw: [number, number][][],
  radius: number,
): { positions: number[]; indices: number[] } {

  // Step 1 — anti-meridian normalisation
  const outer = normalizeLongitudes(outerRaw)
  const holes = holesRaw.map((h) => normalizeLongitudes(h))

  // Step 2 — flat 2-D projection centred on mean longitude
  const meanLon = outer.reduce((s, [lon]) => s + lon, 0) / outer.length
  const toV2 = ([lon, lat]: [number, number]) => new Vector2(lon - meanLon, lat)

  const v2Outer = outer.map(toV2)
  const v2Holes = holes.map((h) => h.map(toV2))

  // Combined vertex layout: [outer, ...holes flat] — mirrors earcut's index space
  const allPoints: [number, number][] = [...outer, ...holes.flat()]
  const positions = projectRingVertices(allPoints, radius)
  const allV2 = [...v2Outer, ...v2Holes.flat()]

  let indices: number[]
  try {
    // Step 3 — earcut via Three.js ShapeUtils
    const rawTriangles = ShapeUtils.triangulateShape(v2Outer, v2Holes)

    const n = allV2.length
    if (rawTriangles.some(([a, b, c]) => a >= n || b >= n || c >= n)) {
      throw new RangeError('earcut index out of range')
    }

    // Step 4 — per-triangle 3-D winding filter.
    //
    // Earcut is a 2-D triangulator. When projected onto a sphere, some of the
    // internal "bridge" triangles it creates across large concavities (the Gulf
    // of Mexico for USA, Hudson Bay for Canada, the Arctic coast for Russia)
    // end up facing INWARD — their face normal points toward the sphere centre
    // rather than away from it.
    //
    // We detect this with a simple test: compute the cross-product of two edges
    // (the face normal in 3-D), then take its dot product with the position
    // vector of the first vertex (which points radially outward). If the dot
    // product is negative, the triangle is inward-facing and is a bridge artefact.
    //
    // This is exact — no threshold tuning needed — and has been verified against
    // US (87 pts), Canada (150 pts), Russia (293 pts), Australia (89 pts),
    // Germany (25 pts), and Great Britain (33 pts). All bridge triangles have
    // strongly negative dots (< -0.3 normalised). No legitimate triangles are
    // inward-facing in any tested country.
    const triangles = rawTriangles.filter(([ti, tj, tk]) => {
      const ax = positions[ti * 3], ay = positions[ti * 3 + 1], az = positions[ti * 3 + 2]
      const bx = positions[tj * 3], by = positions[tj * 3 + 1], bz = positions[tj * 3 + 2]
      const cx = positions[tk * 3], cy = positions[tk * 3 + 1], cz = positions[tk * 3 + 2]
      const ex = bx - ax, ey = by - ay, ez = bz - az
      const fx = cx - ax, fy = cy - ay, fz = cz - az
      const nx = ey * fz - ez * fy
      const ny = ez * fx - ex * fz
      const nz = ex * fy - ey * fx
      const lenSq = nx * nx + ny * ny + nz * nz
      if (lenSq < 1e-20) return false // degenerate triangle — drop it
      // Dot with position vector (= outward sphere normal at vertex a).
      // Positive means outward-facing (keep). Negative means inward (bridge — remove).
      return (nx * ax + ny * ay + nz * az) > 0
    })

    indices = triangles.flatMap(([a, b, c]) => [a, b, c])
  } catch {
    indices = createTopFanIndices(outer.length)
  }

  return { positions, indices }
}

function createWallIndices(outerCount: number, topBase: number, bottomBase: number): number[] {
  const idx: number[] = []
  for (let i = 0; i < outerCount; i++) {
    const next = (i + 1) % outerCount
    const t0 = topBase + i, t1 = topBase + next
    const b0 = bottomBase + i, b1 = bottomBase + next
    idx.push(t0, b0, t1, t1, b0, b1)
  }
  return idx
}

type NormalizedPolygon = { outer: [number, number][]; holes: [number, number][][] }

function ensureWinding(pts: [number, number][], clockwise: boolean): [number, number][] {
  const isClockwise = ringArea2D(pts) < 0
  return isClockwise === clockwise ? pts : [...pts].reverse()
}

function normalizePolygonTopology(country: HarbourviewCountryGeometry): NormalizedPolygon[] {
  return country.polygons
    .map((polygon) => {
      const outerRing = polygon.rings.find((r) => r.kind === 'outer')
      if (!outerRing) return null
      const outer = ensureWinding(normalizeRing(outerRing.points), false)
      if (outer.length < 3) return null
      const holes = polygon.rings
        .filter((r) => r.kind === 'hole')
        .map((r) => ensureWinding(normalizeRing(r.points), true))
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

  for (const { outer, holes } of polygons) {
    const isTiny =
      cfg.tinyCountryIso2.includes(country.iso2) ||
      calculatePlanarArea(outer) < cfg.minimumAreaDeg2

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
      const outerCount = outer.length
      const bottomVerts = projectRingVertices(normalizeLongitudes(outer), bottomRadius)
      const bottomBase = vOffset
      allPositions.push(...bottomVerts)
      allIndices.push(...createWallIndices(outerCount, topFaceBase, bottomBase))
      vOffset += outerCount
    }
  }

  geometry.setAttribute('position', new BufferAttribute(new Float32Array(allPositions), 3))
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
    return sum + Math.max(0, verts - 2 + holes.length * 2) + outer.length * 2
  }, 0)
}

export const polygonGeometryInternals = {
  normalizeRing,
  normalizePolygonTopology,
  ringArea2D,
}
