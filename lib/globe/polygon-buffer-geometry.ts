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
  simplifyTolerance?: number // Douglas-Peucker tolerance in degrees
}

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

// [Existing functions remain - adding simplifyRing here]

function simplifyRing(pts: [number, number][], tolerance: number = 0.0): [number, number][] {
  if (tolerance <= 0 || pts.length <= 4) return normalizeRing(pts)

  const simplified: [number, number][] = []
  function dp(start: number, end: number) {
    simplified.push(pts[start])
    if (end - start < 2) {
      if (end > start) simplified.push(pts[end])
      return
    }
    let maxDist = 0
    let index = start
    const [x1, y1] = pts[start]
    const [x2, y2] = pts[end]
    for (let i = start + 1; i < end; i++) {
      const [x0, y0] = pts[i]
      const dist = Math.abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1) / Math.hypot(y2 - y1, x2 - x1)
      if (dist > maxDist) {
        maxDist = dist
        index = i
      }
    }
    if (maxDist > tolerance) {
      dp(start, index)
      dp(index, end)
    } else {
      simplified.push(pts[end])
    }
  }
  dp(0, pts.length - 1)
  return normalizeRing(simplified)
}

// Updated createTopFaceWithHoles
function createTopFaceWithHoles(
  outerRaw: [number, number][],
  holesRaw: [number, number][][],
  radius: number,
  simplifyTolerance: number = 0.0,
): { positions: number[]; indices: number[] } {
  const outer = simplifyRing(outerRaw, simplifyTolerance)
  const holes = holesRaw.map(h => simplifyRing(h, simplifyTolerance))

  const meanLon = outer.reduce((s, [lon]) => s + lon, 0) / outer.length
  const toV2 = ([lon, lat]: [number, number]) => new Vector2(lon - meanLon, lat)

  const v2Outer = outer.map(toV2)
  const v2Holes = holes.map((h) => h.map(toV2))

  const allPoints: [number, number][] = [...outer, ...holes.flat()]
  const positions = projectRingVertices(allPoints, radius)
  const allV2 = [...v2Outer, ...v2Holes.flat()]

  let indices: number[] = []
  try {
    const rawTriangles = ShapeUtils.triangulateShape(v2Outer, v2Holes)

    const n = allV2.length
    for (const [a, b, c] of rawTriangles) {
      if (a >= n || b >= n || c >= n) continue
      // ... (keep the full winding correction logic from original)
      const ax = positions[a * 3] , ay = positions[a * 3 + 1], az = positions[a * 3 + 2]
      const bx = positions[b * 3], by = positions[b * 3 + 1], bz = positions[b * 3 + 2]
      const cx = positions[c * 3], cy = positions[c * 3 + 1], cz = positions[c * 3 + 2]
      const ex = bx - ax, ey = by - ay, ez = bz - az
      const fx = cx - ax, fy = cy - ay, fz = cz - az
      const nx = ey * fz - ez * fy
      const ny = ez * fx - ex * fz
      const nz = ex * fy - ey * fx
      const lenSq = nx * nx + ny * ny + nz * nz
      if (lenSq < 1e-20) continue

      const dot = nx * ax + ny * ay + nz * az
      if (dot >= 0) {
        indices.push(a, b, c)
      } else {
        indices.push(a, c, b)
      }
    }
  } catch {
    indices = createTopFanIndices(outer.length)
  }

  return { positions, indices }
}

// Rest of file unchanged
