import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const PRE_FIX = 'd91ee35bf008715b37a9e94df242242e73191917'
const oldSource = execFileSync('git', ['show', `${PRE_FIX}:scripts/generate-natural-earth-countries.mjs`], { encoding: 'utf8' })
const oldPath = '/tmp/pr1323-pre-source-hole-fix.mjs'
writeFileSync(oldPath, oldSource)

const oldGenerator = await import(pathToFileURL(oldPath).href)
const currentGenerator = await import(pathToFileURL(resolve('scripts/generate-natural-earth-countries.mjs')).href)

const geometry = {
  type: 'Polygon',
  coordinates: [
    [[160, 70], [-160, 70], [-160, 20], [160, 20], [160, 70]],
    [[170, 60], [-170, 60], [-170, 50], [170, 50], [170, 45], [-170, 45], [-170, 35], [170, 35], [170, 60]],
  ],
}

function classifyIslands(generator) {
  const fragments = generator.splitRingAtAntimeridian(geometry.coordinates[1])
  const areas = fragments.map(generator.signedRingAreaDeg2)
  const referenceIndex = areas.reduce(
    (best, area, index) => (Math.abs(area) > Math.abs(areas[best]) ? index : best),
    0,
  )
  const referenceSign = Math.sign(areas[referenceIndex])
  return fragments.filter((fragment, index) => {
    const sign = Math.sign(areas[index])
    return referenceSign !== 0 && sign !== 0 && sign !== referenceSign
  })
}

function disposition(generator) {
  const islands = classifyIslands(generator)
  const polygons = generator.normalizePolygons(geometry, 0)
  const sameRing = (a, b) => JSON.stringify(a) === JSON.stringify(b)
  return {
    islandCount: islands.length,
    preservedAsOuter: islands.filter((island) => polygons.some((polygon) => {
      const outer = polygon.rings.find((ring) => ring.kind === 'outer')
      return outer && sameRing(outer.points, island)
    })).length,
    misclassifiedAsHole: islands.filter((island) => polygons.some((polygon) =>
      polygon.rings.some((ring) => ring.kind === 'hole' && sameRing(ring.points, island)),
    )).length,
  }
}

const before = disposition(oldGenerator)
const after = disposition(currentGenerator)
console.log(JSON.stringify({ before, after }))

if (before.islandCount === 0) throw new Error('diagnostic geometry did not create a source-hole island')
if (before.preservedAsOuter !== 0 || before.misclassifiedAsHole === 0) {
  throw new Error('pre-fix generator did not reproduce the reviewed source-hole topology defect')
}
if (after.preservedAsOuter !== after.islandCount || after.misclassifiedAsHole !== 0) {
  throw new Error('current generator does not preserve all source-hole islands as solid outer geometry')
}
