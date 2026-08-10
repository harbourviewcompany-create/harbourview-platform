import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { test } from 'vitest'

function runGeometryProbe<T>(probe: string): T {
  const source = `
    import { readFile } from 'node:fs/promises'
    import { resolve } from 'node:path'
    import { pathToFileURL } from 'node:url'
    import { ShapeUtils, Vector2 } from 'three'

    const generator = await import(pathToFileURL(resolve('scripts/generate-natural-earth-countries.mjs')).href)
    const sourceGeoJson = JSON.parse(await readFile(resolve('data/globe/source/ne_50m_admin_0_countries.geojson'), 'utf8'))

    const iso2ForFeature = (feature) => String(
      feature.properties?.ISO_A2_EH ?? feature.properties?.ISO_A2 ?? feature.properties?.WB_A2 ?? ''
    ).toUpperCase()

    const pointEqual = (a, b) => a[0] === b[0] && a[1] === b[1]
    const maxRawLongitudeJump = (ring) => {
      let max = 0
      for (let index = 0; index < ring.length - 1; index += 1) {
        max = Math.max(max, Math.abs(ring[index + 1][0] - ring[index][0]))
      }
      return max
    }
    const unitSphere = ([lon, lat]) => {
      const lonRad = lon * Math.PI / 180
      const latRad = lat * Math.PI / 180
      const cosLat = Math.cos(latRad)
      return [cosLat * Math.cos(lonRad), Math.sin(latRad), cosLat * Math.sin(lonRad)]
    }
    const angularDistanceDeg = (a, b) => {
      const va = unitSphere(a)
      const vb = unitSphere(b)
      const dot = Math.max(-1, Math.min(1, va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2]))
      return Math.acos(dot) * 180 / Math.PI
    }
    const maxSphericalEdgeDeg = (ring) => {
      let max = 0
      for (let index = 0; index < ring.length - 1; index += 1) {
        max = Math.max(max, angularDistanceDeg(ring[index], ring[index + 1]))
      }
      return max
    }
    const ringReferencePoint = (ring) => ring.find(([lon]) => Math.abs(lon) < 179.999) ?? ring[0]
    const sourceRings = (feature) => {
      const polygons = feature.geometry?.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry?.coordinates ?? []
      return polygons.flatMap((polygon) => polygon)
    }
    const sourceTouchesSeam = (feature) => sourceRings(feature).some((ring) =>
      ring.some(([lon]) => Math.abs(lon) >= 179.999),
    )
    const sourceCrossesSeam = (feature) => sourceRings(feature).some((ring) =>
      ring.some((point, index) => {
        const next = ring[(index + 1) % ring.length]
        return next && generator.crossesAntimeridian(point, next)
      }),
    )
    const triangleAreas = (polygon) => {
      const outer = polygon.rings.find((ring) => ring.kind === 'outer')
      const holes = polygon.rings.filter((ring) => ring.kind === 'hole')
      if (!outer) return []
      const contour = outer.points.slice(0, -1).map(([x, y]) => new Vector2(x, y))
      const holeVectors = holes.map((hole) => hole.points.slice(0, -1).map(([x, y]) => new Vector2(x, y)))
      const vertices = [...contour, ...holeVectors.flat()]
      return ShapeUtils.triangulateShape(contour, holeVectors).map(([a, b, c]) => {
        const pa = vertices[a]
        const pb = vertices[b]
        const pc = vertices[c]
        return Math.abs((pb.x - pa.x) * (pc.y - pa.y) - (pb.y - pa.y) * (pc.x - pa.x)) / 2
      })
    }

    ${probe}
  `

  const result = spawnSync(process.execPath, ['--input-type=module', '--eval', source], {
  cwd: process.cwd(),
  encoding: 'utf8',
  maxBuffer: 20 * 1024 * 1024,
  timeout: 30_000,
})

const failureContext = [
  `status=${String(result.status)}`,
  `signal=${String(result.signal)}`,
  `error=${result.error ? String(result.error) : 'none'}`,
  `stderr=${result.stderr || '<empty>'}`,
  `stdout=${result.stdout || '<empty>'}`,
].join('\n')
assert.equal(result.status, 0, failureContext)
  return JSON.parse(result.stdout) as T
}

test('synthetic antimeridian fragments close on the seam without false mainland chords', () => {
  const result = runGeometryProbe<{
    count: number
    fragments: Array<{
      closed: boolean
      firstLon: number
      penultimateLon: number
      maxRawLongitudeJump: number
      maxSphericalEdgeDeg: number
      signedArea: number
    }>
  }>(`
    const synthetic = [[170, 62], [-170, 61], [-164, 53], [166, 52], [170, 62]]
    const fragments = generator.splitRingAtAntimeridian(synthetic)
    console.log(JSON.stringify({
      count: fragments.length,
      fragments: fragments.map((ring) => ({
        closed: pointEqual(ring[0], ring[ring.length - 1]),
        firstLon: ring[0][0],
        penultimateLon: ring[ring.length - 2][0],
        maxRawLongitudeJump: maxRawLongitudeJump(ring),
        maxSphericalEdgeDeg: maxSphericalEdgeDeg(ring),
        signedArea: generator.signedRingAreaDeg2(ring),
      })),
    }))
  `)

  assert.equal(result.count, 2)
  for (const fragment of result.fragments) {
    assert.equal(fragment.closed, true)
    assert.equal(Math.abs(fragment.firstLon), 180)
    assert.equal(fragment.penultimateLon, fragment.firstLon, 'synthetic closure must remain on one seam meridian')
    assert.ok(fragment.maxRawLongitudeJump <= 180, `unexpected longitude jump ${fragment.maxRawLongitudeJump}`)
    assert.ok(fragment.maxSphericalEdgeDeg < 30, `unexpected spherical edge ${fragment.maxSphericalEdgeDeg}`)
    assert.notEqual(Math.sign(fragment.signedArea), 0)
  }
  assert.equal(
    Math.sign(result.fragments[0].signedArea),
    Math.sign(result.fragments[1].signedArea),
    'split fragments must preserve consistent winding',
  )
})

test('Natural Earth seam-affected countries preserve closure, winding, hole ownership and Earcut validity', () => {
  const result = runGeometryProbe<{
    crossingIso2: string[]
    affectedIso2: string[]
    selected: Record<string, {
      polygonCount: number
      maxRawLongitudeJump: number
      maxSphericalEdgeDeg: number
      misplacedHoleCount: number
      invalidWindingCount: number
      degenerateTriangleCount: number
      triangleCount: number
      sourceHoleCount: number
      generatedHoleCount: number
    }>
  }>(`
    const crossingIso2 = sourceGeoJson.features.filter(sourceCrossesSeam).map(iso2ForFeature).filter(Boolean).sort()
    const affectedIso2 = sourceGeoJson.features
      .filter((feature) => sourceCrossesSeam(feature) || sourceTouchesSeam(feature))
      .map(iso2ForFeature)
      .filter(Boolean)
      .sort()
    const regressionIso2 = Array.from(new Set([...affectedIso2, 'RU', 'FJ', 'NZ', 'US']))
    const selected = {}

    for (const iso2 of regressionIso2) {
      const feature = sourceGeoJson.features.find((candidate) => iso2ForFeature(candidate) === iso2)
      if (!feature) continue
      const country = generator.transformFeature(feature)
      if (!country) continue
      let maxJump = 0
      let maxSpherical = 0
      let misplacedHoleCount = 0
      let invalidWindingCount = 0
      let degenerateTriangleCount = 0
let triangleCount = 0
const sourcePolygons = feature.geometry?.type === 'Polygon'
  ? [feature.geometry.coordinates]
  : feature.geometry?.coordinates ?? []
const sourceHoleCount = sourcePolygons.reduce(
  (sum, polygon) => sum + Math.max(0, polygon.length - 1),
  0,
)
const generatedHoleCount = country.polygons.reduce(
  (sum, polygon) => sum + polygon.rings.filter((ring) => ring.kind === 'hole').length,
  0,
)

for (const polygon of country.polygons) {
        const outer = polygon.rings.find((ring) => ring.kind === 'outer')
        if (!outer) continue
        if (!pointEqual(outer.points[0], outer.points[outer.points.length - 1])) {
          throw new Error(iso2 + ': outer ring is open')
        }
        maxJump = Math.max(maxJump, maxRawLongitudeJump(outer.points))
        maxSpherical = Math.max(maxSpherical, maxSphericalEdgeDeg(outer.points))
        const outerWinding = Math.sign(generator.signedRingAreaDeg2(outer.points))
        if (outerWinding === 0) invalidWindingCount += 1

        for (const hole of polygon.rings.filter((ring) => ring.kind === 'hole')) {
          if (!pointEqual(hole.points[0], hole.points[hole.points.length - 1])) {
            throw new Error(iso2 + ': hole ring is open')
          }
          maxJump = Math.max(maxJump, maxRawLongitudeJump(hole.points))
          maxSpherical = Math.max(maxSpherical, maxSphericalEdgeDeg(hole.points))
          const holeWinding = Math.sign(generator.signedRingAreaDeg2(hole.points))
          if (holeWinding === 0 || holeWinding === outerWinding) invalidWindingCount += 1
          if (!generator.pointInRing(ringReferencePoint(hole.points), outer.points)) misplacedHoleCount += 1
        }

        const areas = triangleAreas(polygon)
        triangleCount += areas.length
        degenerateTriangleCount += areas.filter((area) => !Number.isFinite(area) || area <= 1e-10).length
      }

      selected[iso2] = {
        polygonCount: country.polygons.length,
        maxRawLongitudeJump: maxJump,
        maxSphericalEdgeDeg: maxSpherical,
        misplacedHoleCount,
        invalidWindingCount,
        degenerateTriangleCount,
        triangleCount,
        sourceHoleCount,
        generatedHoleCount,
      }
    }

    console.log(JSON.stringify({ crossingIso2, affectedIso2, selected }))
  `)

  for (const required of ['RU', 'FJ', 'NZ', 'US']) {
    assert.ok(result.selected[required], `missing ${required} regression geometry`)
    assert.ok(result.selected[required].polygonCount > 0)
  }
  assert.ok(result.affectedIso2.includes('RU'), 'Russia must exercise the pre-split seam topology path')
  assert.ok(result.affectedIso2.length >= 2, 'expected multiple Natural Earth seam-affected countries')

  for (const iso2 of Object.keys(result.selected)) {
    const geometry = result.selected[iso2]
    assert.ok(geometry.maxRawLongitudeJump <= 180, `${iso2}: raw longitude jump ${geometry.maxRawLongitudeJump}`)
    assert.ok(geometry.maxSphericalEdgeDeg < 90, `${iso2}: suspicious cross-globe boundary edge ${geometry.maxSphericalEdgeDeg}`)
    assert.equal(geometry.misplacedHoleCount, 0, `${iso2}: hole assigned outside its outer ring`)
    assert.equal(geometry.invalidWindingCount, 0, `${iso2}: invalid or same-direction outer/hole winding`)
    assert.equal(geometry.degenerateTriangleCount, 0, `${iso2}: Earcut emitted degenerate triangles`)
assert.ok(
  geometry.generatedHoleCount >= geometry.sourceHoleCount,
  `${iso2}: source holes lost (${geometry.sourceHoleCount} source, ${geometry.generatedHoleCount} generated)`,
)
assert.ok(geometry.triangleCount > 0, `${iso2}: expected triangulated geometry`)
  }
})

test('Russia source is already seam-split and generated seam rings never close across the mainland', () => {
  const result = runGeometryProbe<{
    sourceCrossingRingCount: number
    sourceSeamRingCount: number
    generatedSeamRingCount: number
    badClosureCount: number
    maxRawLongitudeJump: number
    maxSphericalEdgeDeg: number
  }>(`
    const feature = sourceGeoJson.features.find((candidate) => iso2ForFeature(candidate) === 'RU')
    if (!feature) throw new Error('Russia source feature missing')
    const rings = sourceRings(feature)
    const sourceCrossingRings = rings.filter((ring) => ring.some((point, index) => {
      const next = ring[(index + 1) % ring.length]
      return next && generator.crossesAntimeridian(point, next)
    }))
    const sourceSeamRings = rings.filter((ring) => ring.some(([lon]) => Math.abs(lon) >= 179.999))
    const country = generator.transformFeature(feature)
    if (!country) throw new Error('Russia transform missing')
    const generatedSeamRings = country.polygons.flatMap((polygon) => polygon.rings).filter((ring) =>
      ring.points.some(([lon]) => Math.abs(lon) >= 179.999),
    )

    let badClosureCount = 0
    let maxJump = 0
    let maxSpherical = 0
    for (const ring of generatedSeamRings) {
      if (!pointEqual(ring.points[0], ring.points[ring.points.length - 1])) badClosureCount += 1
      maxJump = Math.max(maxJump, maxRawLongitudeJump(ring.points))
      maxSpherical = Math.max(maxSpherical, maxSphericalEdgeDeg(ring.points))
    }

    console.log(JSON.stringify({
      sourceCrossingRingCount: sourceCrossingRings.length,
      sourceSeamRingCount: sourceSeamRings.length,
      generatedSeamRingCount: generatedSeamRings.length,
      badClosureCount,
      maxRawLongitudeJump: maxJump,
      maxSphericalEdgeDeg: maxSpherical,
    }))
  `)

  assert.equal(result.sourceCrossingRingCount, 0, 'Natural Earth 50m Russia should already be split at ±180')
  assert.ok(result.sourceSeamRingCount > 0)
  assert.ok(result.generatedSeamRingCount > 0)
  assert.equal(result.badClosureCount, 0)
  assert.ok(result.maxRawLongitudeJump < 30, `Russia seam ring created false planar chord: ${result.maxRawLongitudeJump}°`)
  assert.ok(result.maxSphericalEdgeDeg < 10, `Russia seam ring created false spherical boundary chord: ${result.maxSphericalEdgeDeg}°`)
})
