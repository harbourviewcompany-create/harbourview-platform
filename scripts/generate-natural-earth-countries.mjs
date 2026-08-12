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

function signedRingAreaDeg2(ring) {
  let area = 0
  for (let i = 0; i < ring.length - 1; i += 1) {
    const [x1, y1] = ring[i]
    const [x2, y2] = ring[i + 1]
    area += x1 * y2 - x2 * y1
  }
  return area / 2
}

function ringAreaDeg2(ring) {
  return Math.abs(signedRingAreaDeg2(ring))
}

function lonDelta(a, b) {
  let d = b - a
  while (d > 180) d -= 360
  while (d < -180) d += 360
  return d
}

/**
 * Detect a raw GeoJSON edge crossing ±180. Do not use lonDelta here: lonDelta
 * deliberately normalizes the jump into [-180, 180].
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

function samePoint(a, b) {
  return a[0] === b[0] && a[1] === b[1]
}

function sameSeamLocation(a, b) {
  return Math.abs(a[0]) === 180 && Math.abs(b[0]) === 180
}

function normalizeEquivalentSeamAliases(points) {
  const normalized = points.map(([lon, lat]) => [lon, lat])
  const isClosed = normalized.length >= 2 && samePoint(normalized[0], normalized[normalized.length - 1])
  const logicalLength = isClosed ? normalized.length - 1 : normalized.length
  let changed = false

  for (let index = 1; index < logicalLength; index += 1) {
    if (sameSeamLocation(normalized[index - 1], normalized[index])) {
      if (normalized[index][0] !== normalized[index - 1][0]) changed = true
      normalized[index][0] = normalized[index - 1][0]
    }
  }

  if (logicalLength >= 2 && sameSeamLocation(normalized[logicalLength - 1], normalized[0])) {
    const seamLon = normalized[0][0]
    for (let index = logicalLength - 1; index > 0; index -= 1) {
      if (!sameSeamLocation(normalized[index], normalized[(index + 1) % logicalLength])) break
      if (normalized[index][0] !== seamLon) changed = true
      normalized[index][0] = seamLon
    }
  }

  if (isClosed) {
    normalized[normalized.length - 1] = [...normalized[0]]
  }

  return { points: normalized, changed }
}

function reverseClosedRing(ring) {
  const open = ring.slice(0, -1).reverse()
  return [...open, [...open[0]]]
}

/**
 * Split a closed ring into planar-contiguous polygons at ±180. Every returned
 * fragment is itself a valid closed ring: its synthetic closing edge runs only
 * along one antimeridian meridian. This is the key topology invariant that the
 * previous splitter missed; closing an open fragment directly creates a false
 * cross-mainland chord which Earcut triangulates as real geometry.
 */
function splitRingAtAntimeridian(ring) {
  if (!Array.isArray(ring) || ring.length < 4) return [ring]

  const { points: pts, changed: seamAliasesNormalized } = normalizeEquivalentSeamAliases(ring)
  if (pts.length >= 2 && samePoint(pts[0], pts[pts.length - 1])) pts.pop()
  if (pts.length < 3) return [ring]

  const crossingIndices = []
  for (let i = 0; i < pts.length; i += 1) {
    if (crossesAntimeridian(pts[i], pts[(i + 1) % pts.length])) crossingIndices.push(i)
  }
  if (crossingIndices.length === 0) {
    return seamAliasesNormalized ? [closeRing(pts) ?? ring] : [ring]
  }

  // Start immediately after a crossing so every fragment begins at a synthetic
  // seam-entry point and ends at a seam-leave point on the same ±180 meridian.
  const firstCrossingIndex = crossingIndices[0]
  const startIndex = (firstCrossingIndex + 1) % pts.length
  const firstCrossing = interpolateAntimeridianCrossing(pts[firstCrossingIndex], pts[startIndex])
  let current = [[firstCrossing.enterLon, firstCrossing.lat], [...pts[startIndex]]]
  const runs = []

  for (let step = 0; step < pts.length; step += 1) {
    const aIndex = (startIndex + step) % pts.length
    const bIndex = (aIndex + 1) % pts.length
    const a = pts[aIndex]
    const b = pts[bIndex]

    if (!crossesAntimeridian(a, b)) {
      if (step < pts.length - 1 && !samePoint(current[current.length - 1], b)) current.push([...b])
      continue
    }

    const crossing = interpolateAntimeridianCrossing(a, b)
    const leave = [crossing.leaveLon, crossing.lat]
    if (!samePoint(current[current.length - 1], leave)) current.push(leave)

    const closed = closeRing(current)
    if (closed && closed.length >= 4) runs.push(closed)

    if (step < pts.length - 1) {
      current = [[crossing.enterLon, crossing.lat], [...b]]
    }
  }

  if (runs.length === 0) return [ring]

  // With two crossings every output run represents a solid fragment of the
  // same source ring, so normalize accidental split-orientation differences.
  // With four or more crossings an opposite-winding run can represent a real
  // cutout between same-side sections. Preserve those signs so normalizePolygons
  // can attach the cutout as a hole instead of filling it as another solid outer.
  if (crossingIndices.length > 2) return runs

  const signedAreas = runs.map((candidate) => signedRingAreaDeg2(candidate))
  const referenceIndex = signedAreas.reduce(
    (best, area, index) => (Math.abs(area) > Math.abs(signedAreas[best]) ? index : best),
    0,
  )
  const targetSign = Math.sign(signedAreas[referenceIndex])
  return runs.map((candidate, index) => {
    const sign = Math.sign(signedAreas[index])
    return targetSign !== 0 && sign !== 0 && sign !== targetSign
      ? reverseClosedRing(candidate)
      : candidate
  })
}

function pointOnSegment(point, a, b, epsilon = 1e-9) {
  const cross = (point[1] - a[1]) * (b[0] - a[0]) - (point[0] - a[0]) * (b[1] - a[1])
  if (Math.abs(cross) > epsilon) return false
  const minX = Math.min(a[0], b[0]) - epsilon
  const maxX = Math.max(a[0], b[0]) + epsilon
  const minY = Math.min(a[1], b[1]) - epsilon
  const maxY = Math.max(a[1], b[1]) + epsilon
  return point[0] >= minX && point[0] <= maxX && point[1] >= minY && point[1] <= maxY
}

function pointInRing(point, ring) {
  let inside = false
  for (let i = 0, j = ring.length - 2; i < ring.length - 1; j = i, i += 1) {
    const a = ring[j]
    const b = ring[i]
    if (pointOnSegment(point, a, b)) return true
    const intersects = ((b[1] > point[1]) !== (a[1] > point[1])) &&
      (point[0] < ((a[0] - b[0]) * (point[1] - b[1])) / (a[1] - b[1]) + b[0])
    if (intersects) inside = !inside
  }
  return inside
}

function ringReferencePoint(ring) {
  return ring.find(([lon]) => Math.abs(lon) < 179.999) ?? ring[0]
}

function classifySplitRingFragments(ring, tolerance) {
  const fragments = splitRingAtAntimeridian(ring)
    .map((part) => simplifyRing(part, tolerance))
    .filter(Boolean)

  if (fragments.length === 0) return { primary: [], cutouts: [] }

  const signedAreas = fragments.map((fragment) => signedRingAreaDeg2(fragment))
  const referenceIndex = signedAreas.reduce(
    (best, area, index) => (Math.abs(area) > Math.abs(signedAreas[best]) ? index : best),
    0,
  )
  const referenceSign = Math.sign(signedAreas[referenceIndex])
  const primary = []
  const cutouts = []

  for (let index = 0; index < fragments.length; index += 1) {
    const sign = Math.sign(signedAreas[index])
    if (referenceSign !== 0 && sign !== 0 && sign !== referenceSign) cutouts.push(fragments[index])
    else primary.push(fragments[index])
  }

  return { primary, cutouts }
}

function normalizePolygons(geometry, tolerance) {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
  const normalized = []

  for (const polygon of polygons) {
    const rawOuter = polygon[0]
    if (!rawOuter) continue

    const {
      primary: outerCandidates,
      cutouts: rawTopologyCutouts,
    } = classifySplitRingFragments(rawOuter, tolerance)

    if (outerCandidates.length === 0) continue

    const topologyCutouts = rawTopologyCutouts.filter(
      (cutout) => ringAreaDeg2(cutout) >= MIN_POLYGON_AREA_DEG2,
    )
    const simplifiedOuters = outerCandidates.filter((outer) => ringAreaDeg2(outer) >= MIN_POLYGON_AREA_DEG2)
    const discardedOuters = outerCandidates.filter((outer) => ringAreaDeg2(outer) < MIN_POLYGON_AREA_DEG2)

    if (simplifiedOuters.length === 0) continue

    const sourceHoleFragments = []
    const rawSourceHoleIslands = []
    for (const rawHole of polygon.slice(1)) {
      const { primary, cutouts } = classifySplitRingFragments(rawHole, tolerance)
      sourceHoleFragments.push(...primary)
      rawSourceHoleIslands.push(
        ...cutouts.filter((cutout) => ringAreaDeg2(cutout) >= MIN_POLYGON_AREA_DEG2),
      )
    }

    const sourceHoleIslands = []
    for (const island of rawSourceHoleIslands) {
      const candidatePoints = island.slice(0, -1)
      const belongsToEligibleOuter = simplifiedOuters.some((outer) =>
        candidatePoints.some((point) => pointInRing(point, outer)),
      )
      if (belongsToEligibleOuter) {
        sourceHoleIslands.push(island)
        continue
      }

      const belongedToDiscardedOuter = discardedOuters.some((outer) =>
        candidatePoints.some((point) => pointInRing(point, outer)),
      )
      if (belongedToDiscardedOuter) continue

      throw new Error(
        `Natural Earth solid hole cutout could not be assigned to a split outer fragment: ${JSON.stringify({
          reference: ringReferencePoint(island),
          outerCount: simplifiedOuters.length,
          discardedOuterCount: discardedOuters.length,
        })}`,
      )
    }

    const simplifiedHoles = [
      ...sourceHoleFragments,
      ...topologyCutouts,
    ]

    const outputPolygons = [...simplifiedOuters, ...sourceHoleIslands].map((outer) => ({
      outer,
      holes: [],
    }))

    for (const hole of simplifiedHoles) {
      const candidatePoints = hole.slice(0, -1)
      const containingIndex = outputPolygons.findIndex(({ outer }) =>
        candidatePoints.some((point) => pointInRing(point, outer)),
      )
      if (containingIndex >= 0) {
        const assignedOuter = outputPolygons[containingIndex].outer
        const outerSign = Math.sign(signedRingAreaDeg2(assignedOuter))
        const holeSign = Math.sign(signedRingAreaDeg2(hole))
        const normalizedHole = outerSign !== 0 && holeSign !== 0 && outerSign === holeSign
          ? reverseClosedRing(hole)
          : hole
        outputPolygons[containingIndex].holes.push(normalizedHole)
        continue
      }

      const belongedToDiscardedOuter = discardedOuters.some((outer) =>
        candidatePoints.some((point) => pointInRing(point, outer)),
      )
      if (belongedToDiscardedOuter) continue

      throw new Error(
        `Natural Earth hole could not be assigned to a split outer fragment: ${JSON.stringify({
          reference: ringReferencePoint(hole),
          outerCount: outputPolygons.length,
          discardedOuterCount: discardedOuters.length,
        })}`,
      )
    }

    for (const outputPolygon of outputPolygons) {
      normalized.push({
        rings: [
          { kind: 'outer', points: outputPolygon.outer },
          ...outputPolygon.holes.map((points) => ({ kind: 'hole', points })),
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

  let polygons = normalizePolygons(feature.geometry, SIMPLIFY_TOLERANCE_DEG)
  // Preserve the U.S. Virgin Islands when simplification alone drops its
  // otherwise valid Natural Earth source geometry below the output threshold.
  // Keep every other country on the established generator path.
  if (polygons.length === 0 && iso2 === 'VI') {
    polygons = normalizePolygons(feature.geometry, 0)
  }
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

  const body = `import type { HarbourviewCountryGeometryPayload } from '@/lib/globe/geojson-country-types'\n\n// Generated by scripts/generate-natural-earth-countries.mjs.\n// Source: data/globe/source/ne_50m_admin_0_countries.geojson (Natural Earth Admin 0, 1:50m).\n// Do not edit by hand. Re-run the script to regenerate after updating the source data.\nexport const naturalEarthCountriesPayload: HarbourviewCountryGeometryPayload = {\n  provenance: {\n    source: 'Natural Earth Admin 0 Countries',\n    sourceScale: '1:50m',\n    sourceVersion: 'ne_50m_admin_0_countries (vendored)',\n    sourceLicense: 'Public domain',\n    boundaryModel: 'Natural Earth de facto boundaries',\n    generatedAt: '${new Date().toISOString()}',\n    generatedBy: 'scripts/generate-natural-earth-countries.mjs',\n    harbourviewTransformVersion: '1.4.1-natural-earth-50m-antimeridian-seam-closure-vi-retention',\n    notes: 'All Natural Earth polygon parts above ${MIN_POLYGON_AREA_DEG2} square degrees are retained; antimeridian-crossing outer and hole rings are split before simplification and each planar fragment is closed along ±180 before triangulation; coordinates rounded to 3 decimal places; source upgraded to 1:50m for higher polygon fidelity.',\n  },\n  countries: [\n${countries.map(serializeCountry).join('\n')}\n  ],\n}\n`

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

export {
  classifySplitRingFragments,
  closeRing,
  crossesAntimeridian,
  interpolateAntimeridianCrossing,
  normalizePolygons,
  pointInRing,
  ringAreaDeg2,
  signedRingAreaDeg2,
  SIMPLIFY_TOLERANCE_DEG,
  simplifyRing,
  splitRingAtAntimeridian,
  transformFeature,
}

const invokedAsScript = process.argv[1] ? resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false
if (invokedAsScript) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}