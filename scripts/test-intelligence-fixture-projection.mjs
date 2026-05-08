import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { execSync } from 'node:child_process'

const sourcePath = 'lib/intelligence/fixtures.ts'
const schemaPath = 'lib/intelligence/schema.ts'
const jsonFixturePath = 'lib/intelligence/country-fixtures.json'
const source = readFileSync(sourcePath, 'utf8')

const forbiddenPublicTokens = [
  'accounts',
  'sourceName',
  'sourceUrl',
  'provenance',
  'sourceEvidence',
  'contactEmail',
  'pricing',
  'fees',
  'redFlags',
  'proofPack',
  'internalHarbourviewNotes',
  'internalReviewNotes',
  'analystNotes',
  'reviewedBy',
  'lastReviewedAt',
  'nextReviewDueAt',
  'confirmed buyers',
  'live transaction flow',
  'hello@harbourview.co'
]

const publicTypeBody = source.slice(
  source.indexOf('export type PublicCountryIntelligenceFixture'),
  source.indexOf('export const privateIntelligenceFieldQuarantine')
)

for (const token of forbiddenPublicTokens) {
  if (publicTypeBody.includes(token)) {
    throw new Error(`Forbidden private field appears in public fixture type: ${token}`)
  }
}

execSync(
  `npx tsc ${sourcePath} ${schemaPath} --module commonjs --target es2020 --moduleResolution node --esModuleInterop --skipLibCheck --resolveJsonModule --outDir .tmp/intelligence-fixture-test`,
  { stdio: 'inherit' }
)
execSync(`cp ${jsonFixturePath} .tmp/intelligence-fixture-test/country-fixtures.json`, { stdio: 'inherit' })

const fixtureModule = await import(pathToFileURL(`${process.cwd()}/.tmp/intelligence-fixture-test/fixtures.js`))
const schemaModule = await import(pathToFileURL(`${process.cwd()}/.tmp/intelligence-fixture-test/schema.js`))

const projected = fixtureModule.publicCountryIntelligenceFixtures
schemaModule.PublicCountryIntelligenceFixturesSchema.parse(projected)

const serialized = JSON.stringify(projected)
for (const token of forbiddenPublicTokens) {
  if (serialized.includes(token)) {
    throw new Error(`Forbidden private token appears in public projection output: ${token}`)
  }
}

for (const record of projected) {
  for (const key of Object.keys(record)) {
    if (fixtureModule.privateIntelligenceFieldQuarantine.includes(key)) {
      throw new Error(`Quarantined key leaked into public projection: ${key}`)
    }
  }
}

console.log(`PASS: ${projected.length} public intelligence fixtures validated and private fields quarantined.`)
