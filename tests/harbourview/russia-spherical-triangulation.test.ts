import { describe, expect, it } from 'vitest'
import { ShapeUtils, Vector2 } from 'three'
import { naturalEarthCountriesPayload } from '@/data/globe/natural-earth-countries'
import { createCountryBufferGeometry, polygonGeometryInternals } from '@/lib/globe/polygon-buffer-geometry'
import {
  MAX_TOP_FACE_SPHERICAL_EDGE_DEG,
  sphericalAngularDistanceDeg,
} from '@/lib/globe/spherical-triangle-refinement'

const BASE_GLOBE_RADIUS = 2.35
const TOP_RADIUS = BASE_GLOBE_RADIUS + 0.024 + 0.06

function country(iso2: string) {
  const value = naturalEarthCountriesPayload.countries.find((candidate) => candidate.iso2 === iso2)
  if (!value) throw new Error(`missing ${iso2} generated geometry`)
  return value
}

function unitVectorToLonLat(x: number, y: number, z: number): [number, number] {
  const radius = Math.sqrt(x * x + y * y + z * z)
  const lat = Math.asin(y / radius) * 180 / Math.PI
  // Inverse of projectRingVertices: x = r*cos(lat)*cos(lon), z = -r*cos(lat)*sin(lon)
  const lon = Math.atan2(-z, x) * 180 / Math.PI
  return [lon, lat]
}

function inspectSurfaceMesh(iso2: string) {
  const geometry = createCountryBufferGeometry(country(iso2), {
    radius: BASE_GLOBE_RADIUS,
    plateLift: 0.024,
    extrusionHeight: 0.06,
    geometryMode: 'surface',
    simplifyTolerance: 0,
    minimumAreaDeg2: 0,
  })
  const position = geometry.getAttribute('position')
  const index = geometry.index
  if (!position || !index) throw new Error(`${iso2}: missing mesh buffers`)

  let maxEdgeDeg = 0
  let minTriangleCentroidRadius = Number.POSITIVE_INFINITY
  let degenerateTriangleCount = 0
  let triangleCount = 0

  for (let offset = 0; offset < index.count; offset += 3) {
    const ia = index.getX(offset)
    const ib = index.getX(offset + 1)
    const ic = index.getX(offset + 2)
    const a = [position.getX(ia), position.getY(ia), position.getZ(ia)] as const
    const b = [position.getX(ib), position.getY(ib), position.getZ(ib)] as const
    const c = [position.getX(ic), position.getY(ic), position.getZ(ic)] as const

    const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]] as const
    const ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]] as const
    const cross = [
      ab[1] * ac[2] - ab[2] * ac[1],
      ab[2] * ac[0] - ab[0] * ac[2],
      ab[0] * ac[1] - ab[1] * ac[0],
    ] as const
    const area2 = Math.sqrt(cross[0] ** 2 + cross[1] ** 2 + cross[2] ** 2)
    if (!Number.isFinite(area2) || area2 <= 1e-9) degenerateTriangleCount += 1

    const centroid = [
      (a[0] + b[0] + c[0]) / 3,
      (a[1] + b[1] + c[1]) / 3,
      (a[2] + b[2] + c[2]) / 3,
    ] as const
    const centroidRadius = Math.sqrt(centroid[0] ** 2 + centroid[1] ** 2 + centroid[2] ** 2)
    minTriangleCentroidRadius = Math.min(minTriangleCentroidRadius, centroidRadius)

    const pa = unitVectorToLonLat(...a)
    const pb = unitVectorToLonLat(...b)
    const pc = unitVectorToLonLat(...c)
    maxEdgeDeg = Math.max(
      maxEdgeDeg,
      sphericalAngularDistanceDeg(pa, pb),
      sphericalAngularDistanceDeg(pb, pc),
      sphericalAngularDistanceDeg(pc, pa),
    )
    triangleCount += 1
  }

  geometry.dispose()
  return { triangleCount, maxEdgeDeg, minTriangleCentroidRadius, degenerateTriangleCount }
}

describe('Russia spherical top-face triangulation regression', () => {
  it('reproduces the exact long Earcut mainland diagonal before spherical refinement', () => {
    const russia = country('RU')
    const polygons = polygonGeometryInternals.normalizePolygonTopology(russia)
    let worst = { polygonIndex: -1, maxEdgeDeg: 0, points: [] as [number, number][] }

    polygons.forEach((polygon, polygonIndex) => {
      const meanLon = polygon.outer.reduce((sum, [lon]) => sum + lon, 0) / polygon.outer.length
      const toV2 = ([lon, lat]: [number, number]) => new Vector2(lon - meanLon, lat)
      const contour = polygon.outer.map(toV2)
      const holes = polygon.holes.map((hole) => hole.map(toV2))
      const points = [...polygon.outer, ...polygon.holes.flat()]
      for (const [a, b, c] of ShapeUtils.triangulateShape(contour, holes)) {
        const edge = Math.max(
          sphericalAngularDistanceDeg(points[a], points[b]),
          sphericalAngularDistanceDeg(points[b], points[c]),
          sphericalAngularDistanceDeg(points[c], points[a]),
        )
        if (edge > worst.maxEdgeDeg) {
          worst = { polygonIndex, maxEdgeDeg: edge, points: [points[a], points[b], points[c]] }
        }
      }
    })

    expect(worst.polygonIndex).toBe(9)
    expect(worst.maxEdgeDeg).toBeCloseTo(46.2924072767642, 8)
    expect(worst.points).toContainEqual([174.549, 64.684])
    expect(worst.points).toContainEqual([72.068, 66.253])
    expect(worst.points).toContainEqual([40.445, 64.779])
  })

  it('keeps every Russia top triangle above the globe with bounded spherical edges and no degenerates', () => {
    const result = inspectSurfaceMesh('RU')
    expect(result.triangleCount).toBeGreaterThan(1_000)
    expect(result.maxEdgeDeg).toBeLessThanOrEqual(MAX_TOP_FACE_SPHERICAL_EDGE_DEG + 1e-3)
    expect(result.minTriangleCentroidRadius).toBeGreaterThan(BASE_GLOBE_RADIUS)
    expect(result.degenerateTriangleCount).toBe(0)
  })

  it('regression-checks every generated seam country plus Fiji, New Zealand and the US/Aleutians', () => {
    const seamIso2 = naturalEarthCountriesPayload.countries
      .filter((candidate) => candidate.polygons.some((polygon) => polygon.rings.some((ring) =>
        ring.points.some(([lon]) => Math.abs(lon) >= 179.999),
      )))
      .map((candidate) => candidate.iso2)
    const regressionIso2 = [...new Set([...seamIso2, 'RU', 'FJ', 'NZ', 'US'])]

    expect(regressionIso2).toContain('RU')
    expect(regressionIso2).toContain('FJ')
    expect(regressionIso2).toContain('NZ')
    expect(regressionIso2).toContain('US')

    for (const iso2 of regressionIso2) {
      const result = inspectSurfaceMesh(iso2)
      expect(result.triangleCount, `${iso2}: triangle count`).toBeGreaterThan(0)
      expect(result.maxEdgeDeg, `${iso2}: long spherical triangle edge`).toBeLessThanOrEqual(
        MAX_TOP_FACE_SPHERICAL_EDGE_DEG + 1e-3,
      )
      expect(result.minTriangleCentroidRadius, `${iso2}: triangle submerged below globe`).toBeGreaterThan(
        BASE_GLOBE_RADIUS,
      )
      expect(result.degenerateTriangleCount, `${iso2}: degenerate triangle`).toBe(0)
    }
  })

  it('12° refinement has ample radial clearance at the production plate radius', () => {
    const worstChordMidpointRadius = TOP_RADIUS * Math.cos((MAX_TOP_FACE_SPHERICAL_EDGE_DEG / 2) * Math.PI / 180)
    expect(worstChordMidpointRadius).toBeGreaterThan(BASE_GLOBE_RADIUS + 0.05)
  })
})
