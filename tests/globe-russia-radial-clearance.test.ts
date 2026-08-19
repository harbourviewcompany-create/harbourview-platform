import { describe, expect, it } from 'vitest'
import { naturalEarthCountriesPayload } from '@/data/globe/natural-earth-countries'
import { createCountryBufferGeometry } from '@/lib/globe/polygon-buffer-geometry'
import {
  MAX_TOP_FACE_SPHERICAL_EDGE_DEG,
  refineLongSphericalTriangles,
  sphericalAngularDistanceDeg,
} from '@/lib/globe/spherical-triangle-refinement'

const OCEAN_RADIUS = 2.35
// Production idle plate top: radius + plateLift + extrusionHeight
const PROD_TOP_RADIUS = 2.35 + 0.026 + 0.058

describe('Russia radial clearance (Siberia void regression)', () => {
  it('keeps every Russia top-face triangle centroid outside the ocean sphere', () => {
    const russia = naturalEarthCountriesPayload.countries.find((c) => c.iso2 === 'RU')
    expect(russia).toBeTruthy()

    const geometry = createCountryBufferGeometry(russia!, {
      geometryMode: 'extruded',
      plateLift: 0.026,
      extrusionHeight: 0.058,
      simplifyTolerance: 0.04, // forced to 0 inside createCountryBufferGeometry for RU
    })

    const pos = geometry.getAttribute('position')
    const idx = geometry.index
    expect(pos).toBeTruthy()
    expect(idx).toBeTruthy()

    const pa = pos!.array as Float32Array
    const ia = idx!.array as Uint16Array | Uint32Array

    let belowOcean = 0
    let minCentroidRadius = Infinity
    // Only the top-face region is near PROD_TOP_RADIUS; walls span top→bottom.
    // A triangle is a top-face candidate when all three vertices are near top radius.
    for (let t = 0; t < ia.length; t += 3) {
      const a = ia[t]
      const b = ia[t + 1]
      const c = ia[t + 2]
      const ax = pa[a * 3]
      const ay = pa[a * 3 + 1]
      const az = pa[a * 3 + 2]
      const bx = pa[b * 3]
      const by = pa[b * 3 + 1]
      const bz = pa[b * 3 + 2]
      const cx = pa[c * 3]
      const cy = pa[c * 3 + 1]
      const cz = pa[c * 3 + 2]

      const ra = Math.sqrt(ax * ax + ay * ay + az * az)
      const rb = Math.sqrt(bx * bx + by * by + bz * bz)
      const rc = Math.sqrt(cx * cx + cy * cy + cz * cz)
      const nearTop =
        Math.abs(ra - PROD_TOP_RADIUS) < 0.002 &&
        Math.abs(rb - PROD_TOP_RADIUS) < 0.002 &&
        Math.abs(rc - PROD_TOP_RADIUS) < 0.002
      if (!nearTop) continue

      const mx = (ax + bx + cx) / 3
      const my = (ay + by + cy) / 3
      const mz = (az + bz + cz) / 3
      const mr = Math.sqrt(mx * mx + my * my + mz * mz)
      minCentroidRadius = Math.min(minCentroidRadius, mr)
      // Chord centroid must clear the ocean with margin so depth-test cannot
      // let the ink ocean show through as a Russia-shaped void.
      if (mr < OCEAN_RADIUS + 0.02) belowOcean += 1
    }

    expect(belowOcean).toBe(0)
    expect(minCentroidRadius).toBeGreaterThan(OCEAN_RADIUS + 0.02)
    geometry.dispose()
  })

  it('refines long Russia-like diagonals to ≤ MAX_TOP_FACE_SPHERICAL_EDGE_DEG with geodesic midpoints', () => {
    // Synthetic 40° diagonal at ~65°N (Siberia latitude band)
    const points: [number, number][] = [
      [90, 65],
      [130, 65],
      [110, 55],
    ]
    const triangles: [number, number, number][] = [[0, 1, 2]]
    expect(sphericalAngularDistanceDeg(points[0], points[1])).toBeGreaterThan(35)

    const refined = refineLongSphericalTriangles(points, triangles)
    for (const [a, b, c] of refined.triangles) {
      const edges: [[number, number], [number, number]][] = [
        [refined.points[a], refined.points[b]],
        [refined.points[b], refined.points[c]],
        [refined.points[c], refined.points[a]],
      ]
      for (const [u, v] of edges) {
        expect(sphericalAngularDistanceDeg(u, v)).toBeLessThanOrEqual(
          MAX_TOP_FACE_SPHERICAL_EDGE_DEG + 1e-6,
        )
      }
    }
    expect(refined.points.length).toBeGreaterThan(3)
  })
})
