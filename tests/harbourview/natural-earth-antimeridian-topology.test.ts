import { describe, expect, it } from 'vitest'
import { ShapeUtils, Vector2 } from 'three'
import { naturalEarthCountriesPayload } from '@/data/globe/natural-earth-countries'

const REQUIRED_REGRESSION_ISO2 = ['RU', 'FJ', 'NZ', 'US'] as const

type Point = [number, number]

function pointsEqual(a: Point, b: Point) {
  return a[0] === b[0] && a[1] === b[1]
}

function signedArea(points: Point[]) {
  const ring = pointsEqual(points[0], points[points.length - 1]) ? points.slice(0, -1) : points
  let area = 0
  for (let i = 0; i < ring.length; i += 1) {
    const [x1, y1] = ring[i]
    const [x2, y2] = ring[(i + 1) % ring.length]
    area += x1 * y2 - x2 * y1
  }
  return area / 2
}

function pointInRing([x, y]: Point, points: Point[]) {
  const ring = pointsEqual(points[0], points[points.length - 1]) ? points.slice(0, -1) : points
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    const crosses = (yi > y) !== (yj > y)
    if (crosses && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function maxRawLongitudeJump(points: Point[]) {
  let max = 0
  for (let i = 0; i < points.length - 1; i += 1) {
    max = Math.max(max, Math.abs(points[i + 1][0] - points[i][0]))
  }
  return max
}

function triangleArea2(a: Vector2, b: Vector2, c: Vector2) {
  return Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x))
}

function inspectCountry(iso2: string) {
  const country = naturalEarthCountriesPayload.countries.find((candidate) => candidate.iso2 === iso2)
  if (!country) throw new Error(`missing ${iso2}`)

  let maxJump = 0
  let openRingCount = 0
  let invalidWindingCount = 0
  let misplacedHoleCount = 0
  let degenerateTriangleCount = 0
  let triangleCount = 0

  for (const polygon of country.polygons) {
    const outer = polygon.rings.find((ring) => ring.kind === 'outer')
    if (!outer || outer.points.length < 4) continue

    if (!pointsEqual(outer.points[0], outer.points[outer.points.length - 1])) openRingCount += 1
    maxJump = Math.max(maxJump, maxRawLongitudeJump(outer.points))
    const outerArea = signedArea(outer.points)
    if (!Number.isFinite(outerArea) || outerArea === 0) invalidWindingCount += 1

    const outerOpen = outer.points.slice(0, -1)
    const holeRings = polygon.rings.filter((ring) => ring.kind === 'hole')
    const holesOpen: Point[][] = []

    for (const hole of holeRings) {
      if (!pointsEqual(hole.points[0], hole.points[hole.points.length - 1])) openRingCount += 1
      maxJump = Math.max(maxJump, maxRawLongitudeJump(hole.points))
      const holeArea = signedArea(hole.points)
      if (!Number.isFinite(holeArea) || holeArea === 0 || Math.sign(holeArea) === Math.sign(outerArea)) {
        invalidWindingCount += 1
      }
      const referencePoint = hole.points.find(([lon]) => Math.abs(lon) < 179.999) ?? hole.points[0]
      if (!pointInRing(referencePoint, outer.points)) misplacedHoleCount += 1
      holesOpen.push(hole.points.slice(0, -1))
    }

    const meanLon = outerOpen.reduce((sum, [lon]) => sum + lon, 0) / outerOpen.length
    const toV2 = ([lon, lat]: Point) => new Vector2(lon - meanLon, lat)
    const contour = outerOpen.map(toV2)
    const holes = holesOpen.map((ring) => ring.map(toV2))
    const vertices = [...contour, ...holes.flat()]
    const triangles = ShapeUtils.triangulateShape(contour, holes)
    triangleCount += triangles.length
    for (const [a, b, c] of triangles) {
      const area2 = triangleArea2(vertices[a], vertices[b], vertices[c])
      if (!Number.isFinite(area2) || area2 <= 1e-10) degenerateTriangleCount += 1
    }
  }

  return {
    polygonCount: country.polygons.length,
    maxJump,
    openRingCount,
    invalidWindingCount,
    misplacedHoleCount,
    degenerateTriangleCount,
    triangleCount,
    touchesSeam: country.polygons.some((polygon) => polygon.rings.some((ring) =>
      ring.points.some(([lon]) => Math.abs(lon) >= 179.999),
    )),
  }
}

describe('Natural Earth generated antimeridian topology regression', () => {
  it('keeps every generated seam-affected country closed, correctly wound and Earcut-valid', () => {
    const seamIso2 = naturalEarthCountriesPayload.countries
      .filter((country) => country.polygons.some((polygon) => polygon.rings.some((ring) =>
        ring.points.some(([lon]) => Math.abs(lon) >= 179.999),
      )))
      .map((country) => country.iso2)
    const regressionIso2 = [...new Set([...seamIso2, ...REQUIRED_REGRESSION_ISO2])]

    for (const required of REQUIRED_REGRESSION_ISO2) {
      expect(regressionIso2).toContain(required)
    }

    for (const iso2 of regressionIso2) {
      const result = inspectCountry(iso2)
      expect(result.polygonCount, `${iso2}: polygon count`).toBeGreaterThan(0)
      expect(result.openRingCount, `${iso2}: open rings`).toBe(0)
      expect(result.maxJump, `${iso2}: false cross-mainland longitude chord`).toBeLessThanOrEqual(180)
      expect(result.invalidWindingCount, `${iso2}: invalid outer/hole winding`).toBe(0)
      expect(result.misplacedHoleCount, `${iso2}: misplaced holes`).toBe(0)
      expect(result.degenerateTriangleCount, `${iso2}: degenerate Earcut triangles`).toBe(0)
      expect(result.triangleCount, `${iso2}: triangle count`).toBeGreaterThan(0)
    }
  })

  it('keeps Russia pre-split at the antimeridian without a generated mainland closure chord', () => {
    const result = inspectCountry('RU')
    expect(result.touchesSeam).toBe(true)
    expect(result.openRingCount).toBe(0)
    expect(result.maxJump).toBeLessThan(30)
    expect(result.invalidWindingCount).toBe(0)
    expect(result.misplacedHoleCount).toBe(0)
    expect(result.degenerateTriangleCount).toBe(0)
  })
})
