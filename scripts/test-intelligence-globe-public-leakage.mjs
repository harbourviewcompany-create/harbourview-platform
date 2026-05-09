import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { execSync } from 'node:child_process'

const sourceFiles = [
  'app/intelligence/page.tsx',
  'components/intelligence/CountryIntelligenceMap.tsx',
  'lib/intelligence/public-country-map.ts',
]

const forbidden = [
  'sourceUrl',
  'sourceName',
  'sourceEvidence',
  'provenanceSummary',
  'provenance',
  'internalReviewNotes',
  'reviewedBy',
  'lastReviewedAt',
  'nextReviewDueAt',
  'private_notes',
  'analyst_notes',
  'contactEmail',
  'Evidence captured',
  'View source listing',
  'raw source',
  'private contacts',
  'confirmed buyers',
  'live transaction flow',
  'live-demand',
  'hello@harbourview.co',
]

console.log('Running intelligence map public leakage assertions...')

for (const sourceFile of sourceFiles) {
  const source = readFileSync(sourceFile, 'utf8')

  for (const value of forbidden) {
    if (source.includes(value)) {
      throw new Error(`Forbidden public intelligence token appears in ${sourceFile}: ${value}`)
    }
  }
}

execSync(
  'npx tsc lib/intelligence/fixtures.ts lib/intelligence/schema.ts lib/intelligence/public-country-map.ts --module commonjs --target es2020 --moduleResolution node --esModuleInterop --skipLibCheck --resolveJsonModule --outDir .tmp/intelligence-map-test',
  { stdio: 'inherit' },
)
execSync('cp lib/intelligence/country-fixtures.json .tmp/intelligence-map-test/country-fixtures.json', {
  stdio: 'inherit',
})

const fixturesModule = await import(pathToFileURL(`${process.cwd()}/.tmp/intelligence-map-test/fixtures.js`))
const mapModule = await import(pathToFileURL(`${process.cwd()}/.tmp/intelligence-map-test/public-country-map.js`))

const publicMapRecords = mapModule.projectPublicCountryMapRecords(
  fixturesModule.publicCountryIntelligenceFixtures,
)

const serialized = JSON.stringify(publicMapRecords)

for (const value of forbidden) {
  if (serialized.includes(value)) {
    throw new Error(`Forbidden public intelligence token appears in projected map output: ${value}`)
  }
}

for (const record of publicMapRecords) {
  for (const quarantinedKey of fixturesModule.privateIntelligenceFieldQuarantine) {
    if (Object.prototype.hasOwnProperty.call(record, quarantinedKey)) {
      throw new Error(`Quarantined key leaked into public map projection: ${quarantinedKey}`)
    }
  }

  if (Object.prototype.hasOwnProperty.call(record, 'sourcePrototype')) {
    throw new Error('Prototype source identifier leaked into public map projection: sourcePrototype')
  }
}

console.log(`PASS: ${publicMapRecords.length} public intelligence map records validated with no forbidden leakage.`)
