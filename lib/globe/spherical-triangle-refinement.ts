export type LonLat = [number, number]
export type Triangle = [number, number, number]

/**
 * A top-face triangle edge longer than this is subdivided before projection.
 *
 * Russia's production Earcut mesh contained 46.29° interior diagonals. Once
 * those planar triangles were projected only at their vertices, their straight
 * 3D chords dipped below the 2.35-radius globe and the ocean sphere occluded
 * them as black wedges. 12° leaves a wide radial-clearance margin while adding
 * vertices only where Earcut produced very long interior diagonals.
 */
export const MAX_TOP_FACE_SPHERICAL_EDGE_DEG = 12
const MAX_REFINEMENT_PASSES = 8

function toUnitVector([lon, lat]: LonLat): [number, number, number] {
  const lonRad = (lon * Math.PI) / 180
  const latRad = (lat * Math.PI) / 180
  const cosLat = Math.cos(latRad)
  return [cosLat * Math.cos(lonRad), Math.sin(latRad), cosLat * Math.sin(lonRad)]
}

export function sphericalAngularDistanceDeg(a: LonLat, b: LonLat) {
  const av = toUnitVector(a)
  const bv = toUnitVector(b)
  const dot = Math.max(-1, Math.min(1, av[0] * bv[0] + av[1] * bv[1] + av[2] * bv[2]))
  return (Math.acos(dot) * 180) / Math.PI
}

function edgeKey(a: number, b: number) {
  return a < b ? `${a}:${b}` : `${b}:${a}`
}

function edgeEndpoints(key: string): [number, number] {
  const [a, b] = key.split(':').map(Number)
  return [a, b]
}

function triangleContainsEdge([a, b, c]: Triangle, u: number, v: number) {
  return (
    (a === u && b === v) || (a === v && b === u) ||
    (b === u && c === v) || (b === v && c === u) ||
    (c === u && a === v) || (c === v && a === u)
  )
}

function splitTriangleOnEdge(triangle: Triangle, u: number, v: number, midpoint: number): Triangle[] {
  const [a, b, c] = triangle
  const matches = (x: number, y: number) => (x === u && y === v) || (x === v && y === u)

  if (matches(a, b)) return [[a, midpoint, c], [midpoint, b, c]]
  if (matches(b, c)) return [[b, midpoint, a], [midpoint, c, a]]
  if (matches(c, a)) return [[c, midpoint, b], [midpoint, a, b]]
  return [triangle]
}

function midpointLonLat(a: LonLat, b: LonLat): LonLat {
  // The polygon-buffer stage has already unwrapped every ring around a local
  // longitude reference, so a planar midpoint is safe even at ±180 and remains
  // inside the Earcut source triangle in the same 2D coordinate system.
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
}

export function maxTriangleSphericalEdgeDeg(points: LonLat[], triangle: Triangle) {
  const [a, b, c] = triangle
  return Math.max(
    sphericalAngularDistanceDeg(points[a], points[b]),
    sphericalAngularDistanceDeg(points[b], points[c]),
    sphericalAngularDistanceDeg(points[c], points[a]),
  )
}

export function refineLongSphericalTriangles(
  inputPoints: LonLat[],
  inputTriangles: ReadonlyArray<ReadonlyArray<number>>,
  maxEdgeDeg = MAX_TOP_FACE_SPHERICAL_EDGE_DEG,
) {
  const points = inputPoints.map(([lon, lat]) => [lon, lat] as LonLat)
  let triangles: Triangle[] = inputTriangles.map((triangle) => {
    if (triangle.length !== 3) {
      throw new RangeError(`expected triangle tuple of length 3, got ${triangle.length}`)
    }
    const [a, b, c] = triangle
    if (![a, b, c].every(Number.isInteger)) {
      throw new RangeError('triangle indices must be integers')
    }
    return [a, b, c]
  })
  const midpointIndexByEdge = new Map<string, number>()

  for (let pass = 0; pass < MAX_REFINEMENT_PASSES; pass += 1) {
    const edgesToSplit = new Set<string>()

    for (const [a, b, c] of triangles) {
      const edges: [number, number][] = [[a, b], [b, c], [c, a]]
      for (const [u, v] of edges) {
        if (sphericalAngularDistanceDeg(points[u], points[v]) > maxEdgeDeg) {
          edgesToSplit.add(edgeKey(u, v))
        }
      }
    }

    if (edgesToSplit.size === 0) {
      return { points, triangles, passes: pass }
    }

    // Split each shared edge globally with one midpoint index. Processing the
    // edge set sequentially makes adjacent Earcut triangles conforming and
    // prevents T-junction cracks after the new midpoint is projected to sphere.
    for (const key of edgesToSplit) {
      const [u, v] = edgeEndpoints(key)
      let midpoint = midpointIndexByEdge.get(key)
      if (midpoint === undefined) {
        midpoint = points.length
        points.push(midpointLonLat(points[u], points[v]))
        midpointIndexByEdge.set(key, midpoint)
      }

      const next: Triangle[] = []
      for (const triangle of triangles) {
        if (triangleContainsEdge(triangle, u, v)) {
          next.push(...splitTriangleOnEdge(triangle, u, v, midpoint))
        } else {
          next.push(triangle)
        }
      }
      triangles = next
    }
  }

  const remainingMax = triangles.reduce(
    (max, triangle) => Math.max(max, maxTriangleSphericalEdgeDeg(points, triangle)),
    0,
  )
  if (remainingMax > maxEdgeDeg + 1e-9) {
    throw new RangeError(
      `spherical top-face refinement did not converge: ${remainingMax.toFixed(3)}° > ${maxEdgeDeg}°`,
    )
  }

  return { points, triangles, passes: MAX_REFINEMENT_PASSES }
}
