import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const imageMapPath = path.join(root, 'lib/fixtures/representativeImages.ts')

const source = fs.readFileSync(imageMapPath, 'utf8')
const imagePaths = [...source.matchAll(/src:\s*'([^']+)'/g)]
  .map((match) => match[1])
  .filter((value, index, values) => values.indexOf(value) === index)
  .sort()
const statuses = [...source.matchAll(/status:\s*'([^']+)'/g)].map((match) => match[1])

const failures = []

if (imagePaths.length === 0) {
  failures.push('No representative image paths were found in lib/fixtures/representativeImages.ts')
}

if (statuses.length === 0) {
  failures.push('No representative image statuses were found in lib/fixtures/representativeImages.ts')
}

for (const status of statuses) {
  if (status !== 'representative') {
    failures.push(`Unexpected image status "${status}". Public listing fixtures must remain representative unless supplier-provided or verified evidence exists.`)
  }
}

for (const imagePath of imagePaths) {
  if (!imagePath.startsWith('/')) {
    failures.push(`${imagePath}: image path must be site-root relative`)
    continue
  }

  if (/^https?:\/\//i.test(imagePath)) {
    failures.push(`${imagePath}: remote image URLs are not allowed for representative listing imagery`)
    continue
  }

  if (!/\.webp$/i.test(imagePath)) {
    failures.push(`${imagePath}: representative listing image paths must use local .webp assets`)
    continue
  }

  const publicPath = path.join(root, 'public', imagePath)

  if (!fs.existsSync(publicPath)) {
    failures.push(`${imagePath}: missing local public asset`)
    continue
  }

  const stat = fs.statSync(publicPath)

  if (!stat.isFile()) {
    failures.push(`${imagePath}: expected a file`)
    continue
  }

  if (stat.size < 300) {
    failures.push(`${imagePath}: asset is unexpectedly small (${stat.size} bytes)`)
  }

  const header = fs.readFileSync(publicPath, { length: 12 })
  if (header.toString('ascii', 0, 4) !== 'RIFF' || header.toString('ascii', 8, 12) !== 'WEBP') {
    failures.push(`${imagePath}: asset does not have a valid WebP RIFF/WEBP header`)
  }

  if (/logo|brand|certificate|license|licence/i.test(imagePath)) {
    failures.push(`${imagePath}: path suggests a logo, certificate or licence image, which is not allowed for representative public listing images`)
  }
}

if (failures.length) {
  console.error('Public image asset verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`ok ${imagePaths.length} local public representative WebP image assets resolve from fixture paths`)
