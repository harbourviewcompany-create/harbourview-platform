import fs from 'node:fs'

const types = fs.readFileSync('lib/compliance/types.ts', 'utf8')
const countries = fs.readFileSync('lib/compliance/countries.ts', 'utf8')
const page = fs.readFileSync('app/compliance/country-pathways/[country]/page.tsx', 'utf8')

const requiredTypeFields = [
  'ComplianceReviewStatus',
  'ComplianceSourceConfidence',
  'ComplianceCountryPublicStatus',
  'reviewStatus',
  'sourceConfidence',
  'publicStatus',
  'publicStatusLabel',
  'publicStatusExplanation',
  'lastReviewed',
  'nextReviewDue',
  'sourceBasis',
  'reviewOwner',
]

const requiredCountryFields = [
  'getPublicStatusLabel',
  'getPublicStatusExplanation',
  'publicStatusLabel',
  'publicStatusExplanation',
  'sourceConfidence',
  'sourceBasis',
  'reviewOwner',
]

const requiredPageLabels = [
  'Country status',
  'Review:',
  'Source confidence:',
  'Last reviewed',
  'Next review due',
  'Review owner',
  'Compliance boundary',
]

const missingTypeFields = requiredTypeFields.filter((field) => !types.includes(field))
const missingCountryFields = requiredCountryFields.filter((field) => !countries.includes(field))
const missingPageLabels = requiredPageLabels.filter((label) => !page.includes(label))

if (missingTypeFields.length || missingCountryFields.length || missingPageLabels.length) {
  console.error(JSON.stringify({ missingTypeFields, missingCountryFields, missingPageLabels }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({ ok: true }, null, 2))
