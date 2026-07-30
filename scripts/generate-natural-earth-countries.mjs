#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '..')

const SOURCE_PATH = resolve(repoRoot, 'data/globe/source/ne_50m_admin_0_countries.geojson')
const OUTPUT_PATH = resolve(repoRoot, 'data/globe/natural-earth-countries.ts')

const SIMPLIFY_TOLERANCE_DEG = 0.12
const MIN_POLYGON_AREA_DEG2 = 0.008
const SKIP_ISO2 = new Set(['AQ'])

function perpendicularDistanceDeg(point, lineStart, lineEnd) {
  const [x, y] = point
  const [x1, y1] = lineStart
  const [x2, y2] = lineEnd
  const dx = x2 - x1
  const dy = y2 - y1

  if (dx === 0 && dy === 0) {
    const ddx = x - x1
    const ddy = y - y1
    return Math.sqrt(ddx * ddx + ddy * ddy)
  }

  const t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)
  const tClamped = Math.max(0, Math.min(1, t))
  const projX = x1 + tClamped * dx
  const projY = y1 + tClamped * dy
  const ddx = x - projX
  const ddy = y - projY

  return Math.sqrt(ddx * ddx + ddy * ddy)
}

function douglasPeucker(points, tolerance) {
  if (points.length < 3) return points.slice()

  const keep = new Array(points.length).fill(false)
  keep[0] = true
  keep[points.length - 1] = true

  const stack = [[0, points.length - 1]]

  while (stack.length > 0) {
    const [startIndex, endIndex] = stack.pop()
    let maxDistance = 0
    let maxIndex = startIndex

    for (let i = startIndex + 1; i < endIndex; i += 1) {
      const distance = perpendicularDistanceDeg(points[i], points[startIndex], points[endIndex])

      if (distance > maxDistance) {
        maxDistance = distance
        maxIndex = i
      }
    }

    if (maxDistance > tolerance) {
      keep[maxIndex] = true
      stack.push([startIndex, maxIndex])
      stack.push([maxIndex, endIndex])
    }
  }

  return points.filter((_, index) => keep[index])
}

function roundCoordinate(value) {
  return Math.round(value * 1000) / 1000
}

function simplifyRing(points, tolerance) {
  if (!Array.isArray(points) || points.length < 3) return null

  const cleaned = points.map((point) => [roundCoordinate(point[0]), roundCoordinate(point[1])])
  const simplified = douglasPeucker(cleaned, tolerance)

  if (simplified.length < 4) return null

  const first = simplified[0]
  const last = simplified[simplified.length - 1]

  if (first[0] !== last[0] || first[1] !== last[1]) {
    simplified.push([first[0], first[1]])
  }

  return simplified
}

function ringAreaDeg2(ring) {
  let area = 0
  for (let i = 0; i < ring.length - 1; i += 1) {
    const [x1, y1] = ring[i]
    const [x2, y2] = ring[i + 1]
    area += x1 * y2 - x2 * y1
  }

  return Math.abs(area / 2)
}

/**
 * Antimeridian ring split — durable fix for Russia / Fiji / NZ / US Alaska tails.
 *
 * Natural Earth 50m sometimes emits outer rings whose consecutive vertices jump
 * across ±180°. Those rings are valid on a sphere but self-intersecting in the
 * planar lon/lat domain earcut uses. Result: empty or inverted plate → ocean void.
 */
function lonDelta(a, b) {
  let d = b - a
  while (d > 180) d -= 360
  while (d < -180) d += 360
  return d
}

function crossesAntimeridian(a, b) {
  return Math.abs(lonDelta(a[0], b[0])) > 180
}

function interpolateAntimeridianCrossing(a, b) {
  const dLon = lonDelta(a[0], b[0])
  const targetLon = a[0] + dLon > 0 ? 180 : -180
  const unwrappedB = a[0] + dLon
  const t = (targetLon - a[0]) / (unwrappedB - a[0] || 1)
  const lat = a[1] + t * (b[1] - a[1])
  return {
    lat: Math.round(lat * 1000) / 1000,
    leaveLon: targetLon,
    enterLon: -targetLon,
  }
}

function splitRingAtAntimeridian(ring) {
  if (!Array.isArray(ring) || ring.length < 4) return [ring]

  const pts = ring.slice()
  if (
    pts.length >= 2 &&
    pts[0][0] === pts[pts.length - 1][0] &&
    pts[0][1] === pts[pts.length - 1][1]
  ) {
    pts.pop()
  }
  if (pts.length < 3) return [ring]

  let hasCrossing = false
  for (let i = 0; i < pts.length; i++) {
    if (crossesAntimeridian(pts[i], pts[(i + 1) % pts.length])) {
      hasCrossing = true
      break
    }
  }
  if (!hasCrossing) return [ring]

  const path = []
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]
    const b = pts[(i + 1) % pts.length]
    path.push(a)
    if (crossesAntimeridian(a, b)) {
      const { lat, leaveLon, enterLon } = interpolateAntimeridianCrossing(a, b)
      path.push([leaveLon, lat])
      path.push([enterLon, lat])
    }
  }

  const runs = []
  let current = [path[0]]
  for (let i = 1; i < path.length; i++) {
    const prev = current[current.length - 1]
    const next = path[i]
    if (crossesAntimeridian(prev, next)) {
      if (current.length >= 2) runs.push(current)
      current = [next]
    } else {
      current.push(next)
    }
  }
  if (current.length >= 2) runs.push(current)

  const closed = []
  for (const run of runs) {
    if (run.length < 3) continue
    const first = run[0]
    const last = run[run.length - 1]
    const out = run.map((p) => [p[0], p[1]])
    if (first[0] !== last[0] || first[1] !== last[1]) {
      out.push([first[0], first[1]])
    }
    if (out.length >= 4) closed.push(out)
  }

  return closed.length > 0 ? closed : [ring]
}

function splitPolygonAtAntimeridian(polygonRings) {
  const outer = polygonRings.find((r) => r.kind === 'outer')
  if (!outer) return [{ rings: polygonRings }]

  const splitOuters = splitRingAtAntimeridian(outer.points)
  if (splitOuters.length <= 1) return [{ rings: polygonRings }]

  const holes = polygonRings.filter((r) => r.kind === 'hole')

  return splitOuters.map((outerPoints) => {
    const lons = outerPoints.map((p) => p[0])
    const minLon = Math.min(...lons)
    const maxLon = Math.max(...lons)
    const assignedHoles = holes.filter((hole) => {
      const meanLon =
        hole.points.reduce((s, p) => s + p[0], 0) / Math.max(1, hole.points.length)
      return meanLon >= minLon - 1e-6 && meanLon <= maxLon + 1e-6
    })
    return {
      rings: [{ kind: 'outer', points: outerPoints }, ...assignedHoles],
    }
  })
}

function normalizePolygons(geometry, tolerance) {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates

  const normalized = []

  for (const polygon of polygons) {
    const rings = []

    polygon.forEach((ring, index) => {
      const simplified = simplifyRing(ring, tolerance)
      if (!simplified) return

      if (index === 0 && ringAreaDeg2(simplified) < MIN_POLYGON_AREA_DEG2) return

      rings.push({
        kind: index === 0 ? 'outer' : 'hole',
        points: simplified,
      })
    })

    if (!rings.some((ring) => ring.kind === 'outer')) continue

    // Durable antimeridian split: one self-crossing outer → N clean outers
    const split = splitPolygonAtAntimeridian(rings)
    for (const part of split) {
      if (part.rings.some((r) => r.kind === 'outer')) normalized.push(part)
    }
  }

  return normalized
}

function computeBoundingBox(polygons) {
  let minLon = Infinity
  let minLat = Infinity
  let maxLon = -Infinity
  let maxLat = -Infinity

  for (const polygon of polygons) {
    for (const ring of polygon.rings) {
      for (const point of ring.points) {
        if (point[0] < minLon) minLon = point[0]
        if (point[1] < minLat) minLat = point[1]
        if (point[0] > maxLon) maxLon = point[0]
        if (point[1] > maxLat) maxLat = point[1]
      }
    }
  }

  if (!isFinite(minLon)) return [0, 0, 0, 0]

  return [
    roundCoordinate(minLon),
    roundCoordinate(minLat),
    roundCoordinate(maxLon),
    roundCoordinate(maxLat),
  ]
}

function computeCentroid(polygons, fallback) {
  const outer = polygons[0]?.rings.find((ring) => ring.kind === 'outer')

  if (!outer || outer.points.length === 0) {
    return [roundCoordinate(fallback[0]), roundCoordinate(fallback[1])]
  }

  let sumLon = 0
  let sumLat = 0
  let count = 0

  for (const point of outer.points.slice(0, -1)) {
    sumLon += point[0]
    sumLat += point[1]
    count += 1
  }

  if (count === 0) return [roundCoordinate(fallback[0]), roundCoordinate(fallback[1])]

  return [roundCoordinate(sumLon / count), roundCoordinate(sumLat / count)]
}

function extractIso2(properties) {
  const value = properties.ISO_A2_EH ?? properties.ISO_A2 ?? properties.WB_A2
  if (!value || value === '-99') return null
  return String(value).toUpperCase()
}

function extractIso3(properties) {
  const value = properties.ADM0_A3 ?? properties.ISO_A3 ?? properties.ISO_A3_EH ?? properties.WB_A3
  if (!value || value === '-99') return null
  return String(value).toUpperCase()
}

function extractName(properties) {
  return (
    properties.NAME_LONG ??
    properties.NAME ??
    properties.ADMIN ??
    properties.FORMAL_EN ??
    'Unknown'
  )
}

function transformFeature(feature) {
  const properties = feature.properties ?? {}
  const iso2 = extractIso2(properties)
  const iso3 = extractIso3(properties)

  if (!iso2 || !iso3) return null
  if (SKIP_ISO2.has(iso2)) return null

  const polygons = normalizePolygons(feature.geometry, SIMPLIFY_TOLERANCE_DEG)
  if (polygons.length === 0) return null

  const labelLon = typeof properties.LABEL_X === 'number' ? properties.LABEL_X : null
  const labelLat = typeof properties.LABEL_Y === 'number' ? properties.LABEL_Y : null
  const labelFallback = [labelLon ?? 0, labelLat ?? 0]
  const centroid =
    labelLon !== null && labelLat !== null
      ? [roundCoordinate(labelLon), roundCoordinate(labelLat)]
      : computeCentroid(polygons, labelFallback)

  return {
    iso2,
    iso3,
    name: extractName(properties),
    centroid,
    bbox: computeBoundingBox(polygons),
    polygons,
    source: 'natural-earth-admin-0',
  }
}

function serializePoints(points) {
  return `[${points.map((point) => `[${point[0]},${point[1]}]`).join(',')}]`
}

function serializeCountry(country) {
  const polygons = country.polygons
    .map(
      (polygon) => `      {
        rings: [
${polygon.rings
  .map(
    (ring) => `          {
            kind: '${ring.kind}',
            points: ${serializePoints(ring.points)},
          },`,
  )
  .join('\n')}
        ],
      },`,
    )
    .join('\n')

  return `    {
      iso2: '${country.iso2}',
      iso3: '${country.iso3}',
      name: ${JSON.stringify(country.name)},
      centroid: [${country.centroid[0]}, ${country.centroid[1]}],
      bbox: [${country.bbox[0]}, ${country.bbox[1]}, ${country.bbox[2]}, ${country.bbox[3]}],
      source: 'natural-earth-admin-0',
      polygons: [
${polygons}
      ],
    },`
}

async function main() {
  const sourceRaw = await readFile(SOURCE_PATH, 'utf8')
  const source = JSON.parse(sourceRaw)
  const countries = []

  for (const feature of source.features ?? []) {
    const country = transformFeature(feature)
    if (country) countries.push(country)
  }

  countries.sort((a, b) => a.iso2.localeCompare(b.iso2))

  const body = `import type { HarbourviewCountryGeometryPayload } from '@/lib/globe/geojson-country-types'

// Generated by scripts/generate-natural-earth-countries.mjs.
// Source: data/globe/source/ne_50m_admin_0_countries.geojson (Natural Earth Admin 0, 1:50m).
// Do not edit by hand. Re-run the script to regenerate after updating the source data.
export const naturalEarthCountriesPayload: HarbourviewCountryGeometryPayload = {
  provenance: {
    source: 'Natural Earth Admin 0 Countries',
    sourceScale: '1:50m',
    sourceVersion: 'ne_50m_admin_0_countries (vendored)',
    sourceLicense: 'Public domain',
    boundaryModel: 'Natural Earth de facto boundaries',
    generatedAt: '${new Date().toISOString()}',
    generatedBy: 'scripts/generate-natural-earth-countries.mjs',
    harbourviewTransformVersion: '1.2.0-natural-earth-50m-antimeridian-split',
    notes: 'All Natural Earth polygon parts above ${MIN_POLYGON_AREA_DEG2} square degrees are retained; Douglas-Peucker simplified at ${SIMPLIFY_TOLERANCE_DEG}\u00b0 tolerance; coordinates rounded to 3 decimal places; outer rings that cross ±180 are split into contiguous parts (fixes Russia / Fiji plate voids). Source upgraded to 1:50m for higher polygon fidelity.',
  },
  countries: [
${countries.map(serializeCountry).join('\n')}
  ],
}
`

  await writeFile(OUTPUT_PATH, body, 'utf8')

  const totalPoints = countries.reduce(
    (accumulator, country) =>
      accumulator + country.polygons.reduce(
        (innerAccumulator, polygon) => innerAccumulator + polygon.rings.reduce((c, ring) => c + ring.points.length, 0),
        0,
      ),
    0,
  )

  console.log(`Wrote ${OUTPUT_PATH}`)
  console.log(`Countries: ${countries.length}`)
  console.log(`Total vertex points: ${totalPoints}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
