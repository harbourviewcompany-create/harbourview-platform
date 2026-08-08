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
    return Math.hypot(x - x1, y - y1)
  }

  const t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)
  const clamped = Math.max(0, Math.min(1, t))
  const projX = x1 + clamped * dx
  const projY = y1 + clamped * dy
  return Math.hypot(x - projX, y - projY)
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

function closeRing(points) {
  if (!Array.isArray(points) || points.length < 3) return null
  const out = points.map(([lon, lat]) => [roundCoordinate(lon), roundCoordinate(lat)])
  const first = out[0]
  const last = out[out.length - 1]
  if (first[0] !== last[0] || first[1] !== last[1]) out.push([first[0], first[1]])
  return out.length >= 4 ? out : null
}

function simplifyRing(points, tolerance) {
  const closed = closeRing(points)
  if (!closed) return null

  // Douglas-Peucker needs distinct endpoints. Simplify the open path, then
  // restore closure. This avoids the degenerate first===last baseline.
  const open = closed.slice(0, -1)
  const simplifiedOpen = douglasPeucker(open, tolerance)
  if (simplifiedOpen.length < 3) return null
  return [...simplifiedOpen, [...simplifiedOpen[0]]]
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

function lonDelta(a, b) {
  let d = b - a
  while (d > 180) d -= 360
  while (d < -180) d += 360
  return d
}

/**
 * Detect a raw GeoJSON edge crossing ±180. Do not use lonDelta here: lonDelta
 * deliberately normalizes the jump into [-180, 180], which made the previous
 * `Math.abs(lonDelta(...)) > 180` condition impossible and left Russia's raw
 * antimeridian edge in the simplifier.
 */
function crossesAntimeridian(a, b) {
  return Math.abs(b[0] - a[0]) > 180
}

function interpolateAntimeridianCrossing(a, b) {
  const dLon = lonDelta(a[0], b[0])
  const unwrappedB = a[0] + dLon
  const targetLon = unwrappedB > a[0] ? 180 : -180
  const denominator = unwrappedB - a[0]
  const t = denominator === 0 ? 0 : (targetLon - a[0]) / denominator
  const lat = a[1] + t * (b[1] - a[1])
  return {
    lat: roundCoordinate(lat),
    leaveLon: targetLon,
    enterLon: -targetLon,
  }
}

/**
 * Split a raw closed ring into planar-contiguous pieces before simplification.
 * This is critical for Russia: simplifying a path containing a +180/-180 jump
 * can create long chords through the mainland, which earcut later interprets
 * as a real boundary and renders as the long-lived central black void.
 */
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

  if (!pts.some((point, i) => crossesAntimeridian(point, pts[(i + 1) % pts.length]))) {
    return [ring]
  }

  const path = []
  for (let i = 0; i < pts.length; i += 1) {
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
  for (let i = 1; i < path.length; i += 1) {
    const prev = current[current.length - 1]
    const next = path[i]
    if (crossesAntimeridian(prev, next)) {
      if (current.length >= 3) runs.push(current)
      current = [next]
    } else {
      current.push(next)
    }
  }
  if (current.length >= 3) runs.push(current)

  return runs.length > 0 ? runs : [ring]
}

function meanLongitude(points) {
  return points.reduce((sum, point) => sum + point[0], 0) / Math.max(1, points.length)
}

function normalizePolygons(geometry, tolerance) {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
  const normalized = []

  for (const polygon of polygons) {
    const rawOuter = polygon[0]
    if (!rawOuter) continue

    // Split first, simplify second. The old order was the Russia corruption bug.
    const rawOuterParts = splitRingAtAntimeridian(rawOuter)
    const simplifiedOuters = rawOuterParts
      .map((part) => simplifyRing(part, tolerance))
      .filter(Boolean)
      .filter((outer) => ringAreaDeg2(outer) >= MIN_POLYGON_AREA_DEG2)

    if (simplifiedOuters.length === 0) continue

    const holes = polygon
      .slice(1)
      .map((ring) => simplifyRing(ring, tolerance))
      .filter(Boolean)

    if (simplifiedOuters.length === 1) {
      normalized.push({
        rings: [
          { kind: 'outer', points: simplifiedOuters[0] },
          ...holes.map((points) => ({ kind: 'hole', points })),
        ],
      })
      continue
    }

    for (const outer of simplifiedOuters) {
      const lons = outer.map((point) => point[0])
      const minLon = Math.min(...lons)
      const maxLon = Math.max(...lons)
      const assignedHoles = holes.filter((hole) => {
        const meanLon = meanLongitude(hole)
        return meanLon >= minLon - 1e-6 && meanLon <= maxLon + 1e-6
      })
      normalized.push({
        rings: [
          { kind: 'outer', points: outer },
          ...assignedHoles.map((points) => ({ kind: 'hole', points })),
        ],
      })
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
      for (const [lon, lat] of ring.points) {
        minLon = Math.min(minLon, lon)
        minLat = Math.min(minLat, lat)
        maxLon = Math.max(maxLon, lon)
        maxLat = Math.max(maxLat, lat)
      }
    }
  }

  if (!Number.isFinite(minLon)) return [0, 0, 0, 0]
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
  for (const [lon, lat] of outer.points.slice(0, -1)) {
    sumLon += lon
    sumLat += lat
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
  return properties.NAME_LONG ?? properties.NAME ?? properties.ADMIN ?? properties.FORMAL_EN ?? 'Unknown'
}

function transformFeature(feature) {
  const properties = feature.properties ?? {}
  const iso2 = extractIso2(properties)
  const iso3 = extractIso3(properties)
  if (!iso2 || !iso3 || SKIP_ISO2.has(iso2)) return null

  const polygons = normalizePolygons(feature.geometry, SIMPLIFY_TOLERANCE_DEG)
  if (polygons.length === 0) return null

  const labelLon = typeof properties.LABEL_X === 'number' ? properties.LABEL_X : null
  const labelLat = typeof properties.LABEL_Y === 'number' ? properties.LABEL_Y : null
  const centroid = labelLon !== null && labelLat !== null
    ? [roundCoordinate(labelLon), roundCoordinate(labelLat)]
    : computeCentroid(polygons, [labelLon ?? 0, labelLat ?? 0])

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
      (polygon) => `      {\n        rings: [\n${polygon.rings
        .map(
          (ring) => `          {\n            kind: '${ring.kind}',\n            points: ${serializePoints(ring.points)},\n          },`,
        )
        .join('\n')}\n        ],\n      },`,
    )
    .join('\n')

  return `    {\n      iso2: '${country.iso2}',\n      iso3: '${country.iso3}',\n      name: ${JSON.stringify(country.name)},\n      centroid: [${country.centroid[0]}, ${country.centroid[1]}],\n      bbox: [${country.bbox[0]}, ${country.bbox[1]}, ${country.bbox[2]}, ${country.bbox[3]}],\n      source: 'natural-earth-admin-0',\n      polygons: [\n${polygons}\n      ],\n    },`
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

  const body = `import type { HarbourviewCountryGeometryPayload } from '@/lib/globe/geojson-country-types'\n\n// Generated by scripts/generate-natural-earth-countries.mjs.\n// Source: data/globe/source/ne_50m_admin_0_countries.geojson (Natural Earth Admin 0, 1:50m).\n// Do not edit by hand. Re-run the script to regenerate after updating the source data.\nexport const naturalEarthCountriesPayload: HarbourviewCountryGeometryPayload = {\n  provenance: {\n    source: 'Natural Earth Admin 0 Countries',\n    sourceScale: '1:50m',\n    sourceVersion: 'ne_50m_admin_0_countries (vendored)',\n    sourceLicense: 'Public domain',\n    boundaryModel: 'Natural Earth de facto boundaries',\n    generatedAt: '${new Date().toISOString()}',\n    generatedBy: 'scripts/generate-natural-earth-countries.mjs',\n    harbourviewTransformVersion: '1.3.0-natural-earth-50m-antimeridian-before-simplify',\n    notes: 'All Natural Earth polygon parts above ${MIN_POLYGON_AREA_DEG2} square degrees are retained; antimeridian-crossing outer rings are split before Douglas-Peucker simplification; coordinates rounded to 3 decimal places; source upgraded to 1:50m for higher polygon fidelity.',\n  },\n  countries: [\n${countries.map(serializeCountry).join('\n')}\n  ],\n}\n`

  await writeFile(OUTPUT_PATH, body, 'utf8')

  const totalPoints = countries.reduce(
    (sum, country) => sum + country.polygons.reduce(
      (polygonSum, polygon) => polygonSum + polygon.rings.reduce((ringSum, ring) => ringSum + ring.points.length, 0),
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
