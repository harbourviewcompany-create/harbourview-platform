import fs from 'node:fs'

const fixture = fs.readFileSync('lib/fixtures/clinical-education.ts', 'utf8')
const components = fs.readFileSync('components/clinical-education/ClinicalEducationComponents.tsx', 'utf8')

const requiredFixtureFields = [
  'professionalReviewRequired',
  'sourceBasis',
  'reviewerRoleRequired',
  'audienceBoundary',
  'lastReviewed',
  'nextReviewDue',
  'publicUseApproved',
  'medicalAdviceBoundary',
]

const requiredModuleIds = [
  'clinical-overview',
  'dosage-forms',
  'product-documentation',
  'formulas-ratios',
  'onset-duration',
  'effects-monitoring',
]

const requiredBoundaries = [
  'not medical advice',
  'Not medical advice',
  'not patient-facing',
  'professional-review-required',
]

const missingFixtureFields = requiredFixtureFields.filter((field) => !fixture.includes(`${field}:`))
const missingModuleIds = requiredModuleIds.filter((id) => !fixture.includes(`id: '${id}'`))
const missingBoundaries = requiredBoundaries.filter((text) => !fixture.includes(text))
const missingRenderedControls = ['Source basis', 'Audience boundary', 'Last reviewed', 'Next review due', 'Review required'].filter((text) => !components.includes(text))

if (missingFixtureFields.length || missingModuleIds.length || missingBoundaries.length || missingRenderedControls.length) {
  console.error(JSON.stringify({ missingFixtureFields, missingModuleIds, missingBoundaries, missingRenderedControls }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({ ok: true, modules: requiredModuleIds.length }, null, 2))
