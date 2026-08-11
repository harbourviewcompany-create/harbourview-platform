from pathlib import Path

path = Path('tests/harbourview/natural-earth-antimeridian-topology.test.ts')
text = path.read_text()

text = text.replace(
    "          const sourceAbsoluteArea = Math.abs(generator.signedRingAreaDeg2(sourceHole))\n",
    "          const expectedAbsoluteArea = eligibleFragments.reduce(\n            (sum, fragment) => sum + Math.abs(generator.signedRingAreaDeg2(fragment)),\n            0,\n          )\n",
)
text = text.replace('            sourceAbsoluteArea,\n', '            expectedAbsoluteArea,\n')
text = text.replace('      sourceAbsoluteArea: number\n', '      expectedAbsoluteArea: number\n')
text = text.replace(
    'Math.abs(sourceHole.sourceAbsoluteArea - sourceHole.matchedAbsoluteArea)',
    'Math.abs(sourceHole.expectedAbsoluteArea - sourceHole.matchedAbsoluteArea)',
)
text = text.replace(
    'source=${sourceHole.sourceAbsoluteArea}',
    'expected=${sourceHole.expectedAbsoluteArea}',
)

marker = "test('holes owned only by MIN_POLYGON_AREA_DEG2-discarded fragments are excluded', () => {"
regression = r'''test('multi-crossing source hole preserves opposite-winding solid islands', () => {
  const result = runGeometryProbe<{
    cutoutCount: number
    preservedIslandOuterCount: number
    cutoutMisclassifiedAsHoleCount: number
  }>(`
    const geometry = {
      type: 'Polygon',
      coordinates: [
        [[160, 70], [-160, 70], [-160, 20], [160, 20], [160, 70]],
        [[170, 60], [-170, 60], [-170, 50], [170, 50], [170, 45], [-170, 45], [-170, 35], [170, 35], [170, 60]],
      ],
    }
    const topology = generator.classifySplitRingFragments(geometry.coordinates[1], 0)
    const polygons = generator.normalizePolygons(geometry, 0)
    const sameRing = (a, b) => JSON.stringify(a) === JSON.stringify(b)
    const preservedIslandOuterCount = topology.cutouts.filter((cutout) =>
      polygons.some((polygon) => {
        const outer = polygon.rings.find((ring) => ring.kind === 'outer')
        return outer && sameRing(outer.points, cutout)
      }),
    ).length
    const cutoutMisclassifiedAsHoleCount = topology.cutouts.filter((cutout) =>
      polygons.some((polygon) => polygon.rings.some((ring) =>
        ring.kind === 'hole' && sameRing(ring.points, cutout),
      )),
    ).length
    console.log(JSON.stringify({
      cutoutCount: topology.cutouts.length,
      preservedIslandOuterCount,
      cutoutMisclassifiedAsHoleCount,
    }))
  `)

  assert.ok(result.cutoutCount > 0, 'synthetic source hole must contain an opposite-winding solid island')
  assert.equal(
    result.preservedIslandOuterCount,
    result.cutoutCount,
    'every opposite-winding source-hole fragment must survive as solid geography',
  )
  assert.equal(
    result.cutoutMisclassifiedAsHoleCount,
    0,
    'opposite-winding source-hole fragments must not be emitted as holes',
  )
}, 60_000)

'''
if 'multi-crossing source hole preserves opposite-winding solid islands' not in text:
    if marker not in text:
        raise SystemExit('source-hole regression insertion marker not found')
    text = text.replace(marker, regression + marker, 1)

if 'sourceAbsoluteArea' in text:
    raise SystemExit('stale sourceAbsoluteArea accounting remains after patch')

path.write_text(text)
