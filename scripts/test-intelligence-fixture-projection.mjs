import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
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

// Use tsx for full module resolution (handles zod and other node_modules)
mkdirSync('.tmp/intelligence-fixture-test', { recursive: true })
const runnerPath = '.tmp/intelligence-fixture-test/runner.ts'
writeFileSync(runnerPath, `
import { publicCountryIntelligenceFixtures, privateIntelligenceFieldQuarantine } from '${process.cwd()}/${sourcePath}'
import { PublicCountryIntelligenceFixturesSchema } from '${process.cwd()}/${schemaPath}'
import { writeFileSync } from 'node:fs'
const result = { publicCountryIntelligenceFixtures, privateIntelligenceFieldQuarantine }
writeFileSync('${process.cwd()}/.tmp/intelligence-fixture-test/result.json', JSON.stringify(result))
PublicCountryIntelligenceFixturesSchema.parse(publicCountryIntelligenceFixtures)
`)
execSync(`npx tsx --tsconfig ${process.cwd()}/tsconfig.json ${process.cwd()}/${runnerPath}`, { stdio: 'inherit', cwd: process.cwd() })

const { publicCountryIntelligenceFixtures: projected, privateIntelligenceFieldQuarantine } =
  JSON.parse(readFileSync('.tmp/intelligence-fixture-test/result.json', 'utf8'))
const serialized = JSON.stringify(projected)
for (const token of forbiddenPublicTokens) {
  if (serialized.includes(token)) {
    throw new Error(`Forbidden private token appears in public projection output: ${token}`)
  }
}

for (const record of projected) {
  for (const key of Object.keys(record)) {
    if (privateIntelligenceFieldQuarantine.includes(key)) {
      throw new Error(`Quarantined key leaked into public projection: ${key}`)
    }
  }
}

console.log(`PASS: ${projected.length} public intelligence fixtures validated and private fields quarantined.`)
