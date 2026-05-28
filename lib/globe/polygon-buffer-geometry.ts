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
 * The critical problem with earcut on sphere projections:
 * Earcut creates "bridge" triangles across large concavities (Hudson Bay for Canada,
 * Gulf of Mexico for USA, Gulf of Ob for Russia). These are flat planes, not curved
 * to follow the sphere. Their centers dip BELOW the ocean sphere surface (radius 2.35),
 * so the ocean sphere renders on top of them — visually they appear as dark holes.
 *
 * Sagitta of a chord at topRadius (2.434) spanning angle θ: R × (1 - cos(θ/2))
 *   CA Hudson Bay bridge (~87°):  sagitta=0.67, centroid_r=1.77 < 2.35 → hole
 *   RU Gulf of Ob bridge (~153°): sagitta=1.87, centroid_r=0.57 < 2.35 → hole
 *   US diagonal bridge (~70°):    sagitta=0.44, centroid_r=1.99 < 2.35 → hole
 *   Valid interior triangle (~20°): sagitta=0.04, centroid_r=2.40 > 2.35 → visible ✓
 *
 * Fix: compute each triangle's 3D centroid. If centroid_radius < ocean_sphere_radius,
 * the triangle is occluded → remove it. No threshold tuning needed.
 *
 * DO NOT replace this with:
 *   - Area-average filter: collapses for non-convex coastlines
 *   - Per-triangle winding flip: triangles still exist below ocean sphere, still invisible
 *   - bboxDiag ratio threshold: requires tuning, breaks for different countries
 *   - Centroid-outside-polygon (2D ray cast): fails because CA outer ring traces AROUND
 *     Hudson Bay, so Hudson Bay centroid is geometrically inside the ring polygon
 */
function createTopFaceWithHoles(
  outerRaw: [number, number][],
  holesRaw: [number, number][][],
  radius: number,
): { positions: number[]; indices: number[] } {
  // Anti-meridian normalisation
  const outer = normalizeLongitudes(outerRaw)
  const holes = holesRaw.map((h) => normalizeLongitudes(h))

  // Flat 2-D projection centred on mean longitude for earcut
  const meanLon = outer.reduce((s, [lon]) => s + lon, 0) / outer.length
  const toV2 = ([lon, lat]: [number, number]) => new Vector2(lon - meanLon, lat)

  const v2Outer = outer.map(toV2)
  const v2Holes = holes.map((h) => h.map(toV2))

  // Combined vertex layout [outer, ...holes] mirrors earcut index space
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

    // Bridge triangle filter — 3D centroid below ocean sphere test.
    //
    // topRadius = cfg.radius + cfg.plateLift + cfg.extrusionHeight ≈ 2.434
    // ocean sphere radius = DEFAULT_CONFIG.radius = 2.35
    //
    // A bridge triangle's flat center dips below the ocean sphere surface.
    // We detect this by computing the 3D centroid and comparing its distance
    // from the origin against the ocean sphere radius.
    //
    // This is geometrically exact — no threshold tuning required.
    // Valid triangles span ≤30° (centroid_r ≥ 2.35). Bridge triangles span
    // ≥45° (centroid_r ≤ 2.25). The ocean sphere surface at 2.35 is the
    // natural discriminator.
    const oceanRadiusSq = DEFAULT_CONFIG.radius * DEFAULT_CONFIG.radius

    const filtered = rawTriangles.filter(([ti, tj, tk]) => {
      const cx = (positions[ti * 3]     + positions[tj * 3]     + positions[tk * 3])     / 3
      const cy = (positions[ti * 3 + 1] + positions[tj * 3 + 1] + positions[tk * 3 + 1]) / 3
      const cz = (positions[ti * 3 + 2] + positions[tj * 3 + 2] + positions[tk * 3 + 2]) / 3
      return cx * cx + cy * cy + cz * cz >= oceanRadiusSq
    })

    // Safety: if filter removed everything (degenerate input), fall back to unfiltered
    indices = (filtered.length > 0 ? filtered : rawTriangles).flatMap(([a, b, c]) => [a, b, c])
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
  normalizeLongitudes,
  ringArea2D,
}
