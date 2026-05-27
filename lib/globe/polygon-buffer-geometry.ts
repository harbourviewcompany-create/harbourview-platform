import { BufferAttribute, BufferGeometry, ShapeUtils, Vector2 } from 'three'
import type { HarbourviewCountryGeometry } from './geojson-country-types'

const GLOBE_DEBUG = typeof process !== 'undefined' && process.env?.GLOBE_DEBUG === '1'

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
 * Normalise all longitudes in a ring to be within ±180° of the ring's mean.
 * Using the mean (instead of the first vertex) produces a better-centered
 * 2-D projection that reduces edge distortion and improves earcut quality.
 */
function normalizeLongitudes(pts: [number, number][]): [number, number][] {
  if (pts.length === 0) return pts
  const ref = pts.reduce((s, p) => s + p[0], 0) / pts.length
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
 *  1. Normalise longitudes around the ring's mean longitude to handle anti-meridian.
 *  2. Project to a flat 2-D plane (lon – meanLon, lat) for earcut.
 *  3. Run ShapeUtils.triangulateShape (earcut).
 *  4. Apply bridge-triangle filter that removes water-spanning artefacts.
 *  5. Fall back to fan triangulation only if earcut throws.
 *
 * DO NOT ADD: 3D winding check (needFlip). It evaluates one triangle and
 * flips all — produces mass-invisible faces for US, CN, and northern-hemisphere
 * countries where CCW in V2 (lon/lat) space != outward-facing in 3D sphere space.
 */
function createTopFaceWithHoles(
  outer: [number, number][],
  holes: [number, number][][],
  radius: number,
  iso2?: string,
): { positions: number[]; indices: number[] } {
  // Normalize all rings using the outer ring's mean as reference,
  // so holes share the same longitude frame as their containing polygon.
  const normalizedOuter = normalizeLongitudes(outer)
  const meanLon = normalizedOuter.reduce((s, [lon]) => s + lon, 0) / normalizedOuter.length
  const normalizedHoles = holes.map((h) => {
    const nh = normalizeLongitudes(h)
    // Re-anchor hole to outer's mean if it drifted during its own normalization
    return nh.map(([lon, lat]) => {
      let l = lon
      while (l - meanLon > 180) l -= 360
      while (l - meanLon < -180) l += 360
      return [l, lat] as [number, number]
    })
  })

  const toV2 = ([lon, lat]: [number, number]) => new Vector2(lon - meanLon, lat)

  const v2Outer = normalizedOuter.map(toV2)
  const v2Holes = normalizedHoles.map((h) => h.map(toV2))
  const allV2 = [...v2Outer, ...v2Holes.flat()]
  const allPoints: [number, number][] = [...normalizedOuter, ...normalizedHoles.flat()]
  const positions = projectRingVertices(allPoints, radius)

  let indices: number[]
  try {
    const rawTriangles = ShapeUtils.triangulateShape(v2Outer, v2Holes)

    const n = allV2.length
    if (rawTriangles.some(([a, b, c]) => a >= n || b >= n || c >= n)) {
      if (GLOBE_DEBUG) console.warn(`[globe] earcut index out of range for ${iso2}`)
      throw new RangeError('earcut index out of range')
    }

    // Bridge triangle filter — non-adjacent long-edge test.
    // Earcut can generate "span-of-water bridges" that connect distant
    // coastline vertices across interior water bodies. This filter removes
    // triangles with outer-ring edges that are both:
    //   a) between non-adjacent vertices (skip > ADJACENCY_TOLERANCE), AND
    //   b) longer than the adaptive threshold.
    //
    // Previous threshold (bboxDiag > 62) missed medium countries like Brazil
    // (59.6) and Australia (52) that can still produce bridge artefacts.
    // Now runs for all polygons with bboxDiag > 30.
    //
    // The adjacency tolerance is raised from 1 to 3 to preserve triangles
    // near peninsulas and narrow isthmuses where vertices 2-3 apart are
    // connected by legitimate short edges.
    //
    // DO NOT replace with area-average filter (collapses for non-convex coasts),
    // centroid-outside-polygon (fails: CA ring traces around Hudson Bay),
    // or 3D winding check (flips all triangles on bad sample -> mass voids).
    const ADJACENCY_TOLERANCE = 3
    const MIN_BBOX_DIAG = 30
    const RATIO = 0.55

    let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity
    for (const v of v2Outer) {
      if (v.x < xMin) xMin = v.x; if (v.x > xMax) xMax = v.x
      if (v.y < yMin) yMin = v.y; if (v.y > yMax) yMax = v.y
    }
    const bboxDiag = Math.sqrt((xMax - xMin) ** 2 + (yMax - yMin) ** 2)
    const outerN = v2Outer.length

    let triangles = rawTriangles
    if (bboxDiag > MIN_BBOX_DIAG) {
      const thresh2 = (bboxDiag * RATIO) ** 2
      triangles = rawTriangles.filter(([a, b, c]) => {
        for (const [p, q] of [[a, b], [b, c], [a, c]] as [number, number][]) {
          if (p >= outerN || q >= outerN) continue
          const sep = Math.abs(p - q)
          if (Math.min(sep, outerN - sep) <= ADJACENCY_TOLERANCE) continue
          const dx = v2Outer[p].x - v2Outer[q].x
          const dy = v2Outer[p].y - v2Outer[q].y
          if (dx * dx + dy * dy > thresh2) return false
        }
        return true
      })
      if (triangles.length === 0) {
        if (GLOBE_DEBUG) console.warn(`[globe] bridge filter removed all triangles for ${iso2}, restoring raw`)
        triangles = rawTriangles
      }
      const removed = rawTriangles.length - triangles.length
      if (GLOBE_DEBUG && removed > 0) {
        const pct = ((removed / rawTriangles.length) * 100).toFixed(1)
        console.log(`[globe] ${iso2}: removed ${removed}/${rawTriangles.length} bridge triangles (${pct}%), bboxDiag=${bboxDiag.toFixed(1)}`)
      }
    }

    // Per-triangle winding fix: for each triangle, compute its face normal
    // via the cross product and check if it faces outward (same direction as
    // the radial vector at the triangle centroid). If inward, flip the winding.
    // This replaces the previous approach of flipping ALL triangles based on
    // one sample, which caused mass-invisible faces for US, CN, and
    // northern-hemisphere countries. Per-triangle is correct because earcut
    // in 2D produces consistent winding, but the spherical projection can
    // invert the sense of individual triangles near concavities.
    const posArr = positions
    const triCount = triangles.length
    const fixedTriangles: [number, number, number][] = new Array(triCount)
    for (let t = 0; t < triCount; t++) {
      const [ai, bi, ci] = triangles[t]
      const ax = posArr[ai * 3], ay = posArr[ai * 3 + 1], az = posArr[ai * 3 + 2]
      const bx = posArr[bi * 3], by = posArr[bi * 3 + 1], bz = posArr[bi * 3 + 2]
      const cx = posArr[ci * 3], cy = posArr[ci * 3 + 1], cz = posArr[ci * 3 + 2]

      // Face normal from cross product (b-a) x (c-a)
      const e1x = bx - ax, e1y = by - ay, e1z = bz - az
      const e2x = cx - ax, e2y = cy - ay, e2z = cz - az
      const nx = e1y * e2z - e1z * e2y
      const ny = e1z * e2x - e1x * e2z
      const nz = e1x * e2y - e1y * e2x

      // Centroid of the triangle
      const mx = (ax + bx + cx) / 3
      const my = (ay + by + cy) / 3
      const mz = (az + bz + cz) / 3

      // Outward normal = radial direction at centroid
      // If face normal and radial point the same way, winding is correct
      const dot = nx * mx + ny * my + nz * mz

      fixedTriangles[t] = dot >= 0 ? [ai, bi, ci] : [ai, ci, bi]
    }

    indices = fixedTriangles.flatMap(([a, b, c]) => [a, b, c])
  } catch (err) {
    if (GLOBE_DEBUG) console.warn(`[globe] earcut failed for ${iso2}, using fan fallback:`, err)
    indices = createTopFanIndices(normalizedOuter.length)
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

    const topFace = createTopFaceWithHoles(outer, holes, topRadius, country.iso2)
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
  normalizeLongitudes,
  ringArea2D,
}
