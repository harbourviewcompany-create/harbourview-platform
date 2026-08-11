#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs'

const oldVersion = '1.5.0-natural-earth-50m-antimeridian-source-retention-alpha2'
const newVersion = '1.6.0-natural-earth-50m-source-retention-alpha2-centroid'

function replaceOnce(text, oldText, newText, label) {
  const parts = text.split(oldText)
  if (parts.length !== 2) throw new Error(`${label}: expected one target, found ${parts.length - 1}`)
  return parts[0] + newText + parts[1]
}

function apply() {
  const generatorPath = 'scripts/generate-natural-earth-countries.mjs'
  let generator = readFileSync(generatorPath, 'utf8')

  generator = replaceOnce(generator, 'function extractIso2(properties) {\n', `function pointInBoundingBox(point, bbox) {
  return point[0] >= bbox[0] && point[0] <= bbox[2] && point[1] >= bbox[1] && point[1] <= bbox[3]
}

function pointInGeneratedPolygons(point, polygons) {
  return polygons.some((polygon) => {
    const outer = polygon.rings.find((ring) => ring.kind === 'outer')
    if (!outer || !pointInRing(point, outer.points)) return false
    return !polygon.rings
      .filter((ring) => ring.kind === 'hole')
      .some((hole) => pointInRing(point, hole.points))
  })
}

function computeRetainedGeometryCentroid(polygons, bbox, fallback) {
  const candidate = computeCentroid(polygons, fallback)
  if (pointInBoundingBox(candidate, bbox) && pointInGeneratedPolygons(candidate, polygons)) return candidate

  const outers = polygons
    .flatMap((polygon) => polygon.rings.filter((ring) => ring.kind === 'outer'))
    .sort((a, b) => ringAreaDeg2(b.points) - ringAreaDeg2(a.points))
  const reference = outers[0] ? ringReferencePoint(outers[0].points) : fallback
  return [roundCoordinate(reference[0]), roundCoordinate(reference[1])]
}

function assertUniqueIso2RoutingKeys(countries) {
  const duplicateIso2 = [...countries.reduce((counts, country) => {
    counts.set(country.iso2, (counts.get(country.iso2) ?? 0) + 1)
    return counts
  }, new Map())]
    .filter(([, count]) => count > 1)
    .map(([iso2]) => iso2)
  if (duplicateIso2.length > 0) {
    throw new Error(\`Natural Earth output contains duplicate alpha-2 routing keys: \${duplicateIso2.join(', ')}\`)
  }
}

function extractIso2(properties) {
`, 'generator helper insertion')

  const oldTransform = `  let polygons = normalizePolygons(feature.geometry, SIMPLIFY_TOLERANCE_DEG)
  if (polygons.length === 0) {
    const sourcePolygons = feature.geometry.type === 'Polygon'
      ? [feature.geometry.coordinates]
      : feature.geometry.coordinates
    const hasSourceEligibleOuter = sourcePolygons.some((polygon) => {
      const rawOuter = closeRing(polygon[0])
      return rawOuter !== null && ringAreaDeg2(rawOuter) >= MIN_POLYGON_AREA_DEG2
    })
    if (hasSourceEligibleOuter) {
      polygons = normalizePolygons(feature.geometry, 0)
    }
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
`
  const newTransform = `  let polygons = normalizePolygons(feature.geometry, SIMPLIFY_TOLERANCE_DEG)
  let usedSourceRetentionFallback = false
  if (polygons.length === 0) {
    const sourcePolygons = feature.geometry.type === 'Polygon'
      ? [feature.geometry.coordinates]
      : feature.geometry.coordinates
    const hasSourceEligibleOuter = sourcePolygons.some((polygon) => {
      const rawOuter = closeRing(polygon[0])
      return rawOuter !== null && ringAreaDeg2(rawOuter) >= MIN_POLYGON_AREA_DEG2
    })
    if (hasSourceEligibleOuter) {
      polygons = normalizePolygons(feature.geometry, 0)
      usedSourceRetentionFallback = polygons.length > 0
    }
  }
  if (polygons.length === 0) return null

  const bbox = computeBoundingBox(polygons)
  const labelLon = typeof properties.LABEL_X === 'number' ? properties.LABEL_X : null
  const labelLat = typeof properties.LABEL_Y === 'number' ? properties.LABEL_Y : null
  const sourceCentroid = labelLon !== null && labelLat !== null
    ? [roundCoordinate(labelLon), roundCoordinate(labelLat)]
    : computeCentroid(polygons, [labelLon ?? 0, labelLat ?? 0])
  const centroid = usedSourceRetentionFallback && (
    !pointInBoundingBox(sourceCentroid, bbox) || !pointInGeneratedPolygons(sourceCentroid, polygons)
  )
    ? computeRetainedGeometryCentroid(polygons, bbox, sourceCentroid)
    : sourceCentroid

  return {
    iso2,
    iso3,
    name: extractName(properties),
    centroid,
    bbox,
    polygons,
    source: 'natural-earth-admin-0',
  }
`
  generator = replaceOnce(generator, oldTransform, newTransform, 'generator transform')

  const oldDuplicateBlock = `  const duplicateIso2 = [...countries.reduce((counts, country) => {
    counts.set(country.iso2, (counts.get(country.iso2) ?? 0) + 1)
    return counts
  }, new Map())]
    .filter(([, count]) => count > 1)
    .map(([iso2]) => iso2)
  if (duplicateIso2.length > 0) {
    throw new Error(\`Natural Earth output contains duplicate alpha-2 routing keys: \${duplicateIso2.join(', ')}\`)
  }

  countries.sort((a, b) => a.iso2.localeCompare(b.iso2))
`
  generator = replaceOnce(generator, oldDuplicateBlock, `  assertUniqueIso2RoutingKeys(countries)\n\n  countries.sort((a, b) => a.iso2.localeCompare(b.iso2))\n`, 'generator duplicate-key block')
  generator = replaceOnce(generator, oldVersion, newVersion, 'generator transform version')
  generator = replaceOnce(generator, 'export {\n  classifySplitRingFragments,\n', 'export {\n  assertUniqueIso2RoutingKeys,\n  classifySplitRingFragments,\n', 'generator export')
  writeFileSync(generatorPath, generator)

  const topologyPath = 'tests/harbourview/natural-earth-antimeridian-topology.test.ts'
  let topology = readFileSync(topologyPath, 'utf8')
  topology = replaceOnce(topology, oldVersion, newVersion, 'topology transform version')
  writeFileSync(topologyPath, topology)

  const testPath = 'tests/globe-natural-earth-countries.test.ts'
  let test = readFileSync(testPath, 'utf8')
  test = replaceOnce(test, "import { describe, expect, it } from 'vitest'\n", "import { describe, expect, it } from 'vitest'\nimport { readFile } from 'node:fs/promises'\n", 'Natural Earth test import')
  const anchor = "  it('includes representative countries spanning continents', () => {\n"
  const regression = `  it('executes source-retention fallback and duplicate alpha-2 rejection through the generator', async () => {
    const generatorUrl = new URL('../scripts/generate-natural-earth-countries.mjs', import.meta.url).href
    const generator = await import(/* @vite-ignore */ generatorUrl)
    const source = JSON.parse(await readFile(new URL('../data/globe/source/ne_50m_admin_0_countries.geojson', import.meta.url), 'utf8'))
    const iso2 = (feature: any) => String(
      feature.properties?.ISO_A2_EH ?? feature.properties?.ISO_A2 ?? feature.properties?.WB_A2 ?? ''
    ).toUpperCase()
    const feature = (code: string) => source.features.find((item: any) => iso2(item) === code)
    const insideBbox = (point: [number, number], bbox: [number, number, number, number]) =>
      point[0] >= bbox[0] && point[0] <= bbox[2] && point[1] >= bbox[1] && point[1] <= bbox[3]
    const insideGeometry = (point: [number, number], country: any) => country.polygons.some((polygon: any) => {
      const outer = polygon.rings.find((ring: any) => ring.kind === 'outer')
      if (!outer || !generator.pointInRing(point, outer.points)) return false
      return !polygon.rings
        .filter((ring: any) => ring.kind === 'hole')
        .some((hole: any) => generator.pointInRing(point, hole.points))
    })

    const viFeature = feature('VI')
    const ioFeature = feature('IO')
    const vcFeature = feature('VC')
    expect(viFeature).toBeTruthy()
    expect(ioFeature).toBeTruthy()
    expect(vcFeature).toBeTruthy()

    const viNormal = generator.normalizePolygons(viFeature.geometry, generator.SIMPLIFY_TOLERANCE_DEG)
    const viZero = generator.normalizePolygons(viFeature.geometry, 0)
    const vi = generator.transformFeature(viFeature)
    const io = generator.transformFeature(ioFeature)
    const vc = generator.transformFeature(vcFeature)

    expect(viNormal.length).toBe(0)
    expect(viZero.length).toBeGreaterThan(0)
    expect(vi).toBeTruthy()
    expect(insideBbox(io.centroid, io.bbox)).toBe(true)
    expect(insideGeometry(io.centroid, io)).toBe(true)
    expect(insideBbox(vc.centroid, vc.bbox)).toBe(true)
    expect(insideGeometry(vc.centroid, vc)).toBe(true)
    expect(() => generator.assertUniqueIso2RoutingKeys([vi, { ...vi, name: 'Duplicate VI fixture' }]))
      .toThrow(/duplicate alpha-2 routing keys/)
  }, 35_000)

`
  test = replaceOnce(test, anchor, regression + anchor, 'Natural Earth regression anchor')
  writeFileSync(testPath, test)
}

function evidence() {
  const evidencePath = 'docs/control/EVIDENCE_LOG.md'
  let text = readFileSync(evidencePath, 'utf8')
  const sha = readFileSync('/tmp/normalized.sha', 'utf8').trim()
  const rowRegex = /^\| 2026-08-11 \| PR #1336 post-merge small-country retention remediation \|.*$/m
  const matches = text.match(new RegExp(rowRegex.source, 'gm')) ?? []
  if (matches.length !== 1) throw new Error(`expected one PR #1336 Build Evidence row, found ${matches.length}`)
  const newRow = `| 2026-08-11 | PR #1336 post-merge small-country retention remediation | \`node scripts/generate-natural-earth-countries.mjs\` x2; CI-gated Natural Earth generator regression; targeted topology/Russia/rendering Vitest; \`npm run lint\`; \`npm run typecheck\`; \`npm run test\`; \`npm run test:security\`; \`npm run build\` | PASS — transform \`${newVersion}\`; VI retained; duplicate alpha-2 rejection exercised; IO/VC fallback centroids validated inside retained geometry; IOA excluded; Russia geometry unchanged; normalized SHA-256 \`${sha}\` | PR #1336; centroid remediation verification workflow | **Current — GO on verified head** |`
  text = text.replace(rowRegex, newRow)
  writeFileSync(evidencePath, text)
}

const mode = process.argv[2]
if (mode === 'apply') apply()
else if (mode === 'evidence') evidence()
else throw new Error(`unknown mode: ${mode}`)
