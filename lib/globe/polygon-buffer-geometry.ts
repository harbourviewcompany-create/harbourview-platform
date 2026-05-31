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
 *  1. Normalise longitudes (anti-meridian fix).
 *  2. Project to flat 2-D (lon – meanLon, lat) for earcut.
 *  3. Run ShapeUtils.triangulateShape (earcut).
 *  4. Per-triangle 3-D winding correction:
 *       - Outward-facing (dot > 0): keep unchanged.
 *       - Inward-facing (dot < 0): flip winding. High-latitude spherical
 *         projection causes legitimate land triangles to appear inward-facing;
 *         flipping corrects the winding without removing any geometry.
 *         The dataset carries no hole rings for high-latitude countries
 *         (Canada, Russia), so earcut produces no bridge triangles to discard.
 *  5. Fall back to fan triangulation if earcut throws.
 */
function createTopFaceWithHoles(
  outerRaw: [number, number][],
  holesRaw: [number, number][][],
  radius: number,
): { positions: number[]; indices: number[] } {

  const referenceLongitude = outerRaw[0]?.[0] ?? 0
  const outer = normalizeLongitudesAround(outerRaw, referenceLongitude)
  const holes = holesRaw.map((h) => normalizeLongitudesAround(h, referenceLongitude))

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

    indices = []
    for (const [a, b, c] of rawTriangles) {
      const ax = positions[a * 3], ay = positions[a * 3 + 1], az = positions[a * 3 + 2]
      const bx = positions[b * 3], by = positions[b * 3 + 1], bz = positions[b * 3 + 2]
      const cx = positions[c * 3], cy = positions[c * 3 + 1], cz = positions[c * 3 + 2]
      const ex = bx - ax, ey = by - ay, ez = bz - az
      const fx = cx - ax, fy = cy - ay, fz = cz - az
      const nx = ey * fz - ez * fy
      const ny = ez * fx - ex * fz
      const nz = ex * fy - ey * fx
      const lenSq = nx * nx + ny * ny + nz * nz
      if (lenSq < 1e-20) continue // degenerate — drop

      const dot = nx * ax + ny * ay + nz * az
      if (dot >= 0) {
        // Outward-facing: keep as-is
        indices.push(a, b, c)
      } else {
        // Inward-facing due to spherical curvature at high latitudes — flip winding.
        // Never remove: the dataset has no hole rings for Canada or Russia, so earcut
        // produces no bridge triangles; every inward-facing triangle is legitimate land.
        indices.push(a, c, b)
      }
    }
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
  if (!country?.polygons || !Array.isArray(country.polygons)) return []
  return country.polygons
    .map((polygon) => {
      if (!polygon?.rings || !Array.isArray(polygon.rings)) return null
      const outerRing = polygon.rings.find((r) => r?.kind === 'outer')
      if (!outerRing?.points || !Array.isArray(outerRing.points)) return null

      // Guard: filter out any undefined/non-array points before normalising
      const validPoints = outerRing.points.filter(
        (p): p is [number, number] => Array.isArray(p) && p.length >= 2 && Number.isFinite(p[0]) && Number.isFinite(p[1])
      )
      const rawOuter = normalizeRing(validPoints)
      if (rawOuter.length < 3) return null

      const referenceLongitude = rawOuter[0][0]
      const outer = ensureWinding(normalizeLongitudesAround(rawOuter, referenceLongitude), false)
      const holes = polygon.rings
        .filter((r) => r?.kind === 'hole' && Array.isArray(r.points))
        .map((r) => {
          const validHolePts = r.points.filter(
            (p): p is [number, number] => Array.isArray(p) && p.length >= 2 && Number.isFinite(p[0]) && Number.isFinite(p[1])
          )
          return normalizeLongitudesAround(normalizeRing(validHolePts), referenceLongitude)
        })
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

  for (const { outer, holes } of polygons) {
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
    const wallVertices = [outer, ...holes].reduce((s, r) => s + r.length, 0)
    return sum + Math.max(0, verts - 2 + holes.length * 2) + wallVertices * 2
  }, 0)
}

export const polygonGeometryInternals = {
  normalizeRing,
  normalizeLongitudes,
  normalizeLongitudesAround,
  normalizePolygonTopology,
  ringArea2D,
}
