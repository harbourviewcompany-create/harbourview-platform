import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const requiredRoutes = [
  '/intelligence/source-engine',
  '/intelligence/watchlists',
  '/education/compliance-readiness',
  '/education/export-import-readiness',
  '/education/pharmaceutical-medical-cannabis',
  '/education/cannabis-history-library',
  '/policy-standards/regulatory-change-tracker',
]

const requiredTerms = [
  'source-engine requests',
  'watchlists',
  'market-access briefing',
  'request triage',
  'compliance readiness',
  'export and import readiness',
  'pharmaceutical and medical cannabis',
  'history and market-development library',
  'regulatory change',
  'copy-safety',
  'legal advice',
  'medical advice',
  'source URLs',
  'sourceEvidence',
  'provenanceSummary',
]

const forbiddenPublicAssertions = [
  'guaranteed access',
  'guaranteed buyer',
  'guaranteed seller',
  'shipment clearance',
  'licence confirmation',
  'treatment recommendation',
  'dosage guidance',
]

function routeFileFor(route) {
  return path.join(repoRoot, 'app', ...route.slice(1).split('/'), 'page.tsx')
}

const missingRoutes = requiredRoutes.filter((route) => !fs.existsSync(routeFileFor(route)))
const relevantFiles = requiredRoutes.map((route) => routeFileFor(route)).filter((file) => fs.existsSync(file))
relevantFiles.push(path.join(repoRoot, 'components', 'PublicSurfacePage.tsx'))

const sourceText = relevantFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n').toLowerCase()
const missingTerms = requiredTerms.filter((term) => !sourceText.includes(term.toLowerCase()))

const forbiddenHits = forbiddenPublicAssertions.filter((term) => {
  const normalized = term.toLowerCase()
  const index = sourceText.indexOf(normalized)
  if (index === -1) return false
  const windowStart = Math.max(0, index - 80)
  const context = sourceText.slice(windowStart, index + normalized.length + 80)
  return !context.includes('no ') && !context.includes('does not') && !context.includes('not ')
})

if (missingRoutes.length > 0 || missingTerms.length > 0 || forbiddenHits.length > 0) {
  if (missingRoutes.length > 0) {
    console.error('Missing HAR-39/HAR-40 public route files:')
    for (const route of missingRoutes) console.error(`- ${route}`)
  }

  if (missingTerms.length > 0) {
    console.error('Missing required HAR-39/HAR-40 public-surface terms:')
    for (const term of missingTerms) console.error(`- ${term}`)
  }

  if (forbiddenHits.length > 0) {
    console.error('Potential unqualified public assertions detected:')
    for (const term of forbiddenHits) console.error(`- ${term}`)
  }

  process.exit(1)
}

console.log(`HAR-39/HAR-40 public surface route coverage passed for ${requiredRoutes.length} routes.`)
console.log(`HAR-39/HAR-40 copy-safety term coverage passed for ${requiredTerms.length} required terms.`)
console.log('HAR-39/HAR-40 public assertion guard passed.')
