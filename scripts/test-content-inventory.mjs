import fs from 'node:fs'

const source = fs.readFileSync('lib/platform/contentInventory.ts', 'utf8')

const requiredRoutes = [
  '/',
  '/platform',
  '/marketplace',
  '/marketplace/services',
  '/marketplace/listings',
  '/marketplace/wanted',
  '/marketplace/sell',
  '/signals',
  '/compliance',
  '/compliance/country-pathways/[country]',
  '/education',
  '/network/clinical-education',
  '/network/clinical-education/[slug]',
  '/intelligence',
  '/source-methodology',
  '/trust-governance',
  '/reviewed-connections',
  '/admin',
  '/legal/privacy',
  '/legal/terms',
]

const requiredPillars = ['education', 'medical', 'regulatory', 'marketplace', 'services', 'intelligence', 'signals', 'trust', 'legal', 'admin']
const requiredFields = ['sourceBasis', 'reviewerRequired', 'relatedCapabilityIds', 'falseGoRisk', 'criticality', 'visibility', 'sensitivity']

const missingRoutes = requiredRoutes.filter((route) => !source.includes(`route: '${route}'`))
const missingPillars = requiredPillars.filter((pillar) => !source.includes(`pillar: '${pillar}'`))
const missingFields = requiredFields.filter((field) => !source.includes(`${field}:`))

if (missingRoutes.length || missingPillars.length || missingFields.length) {
  console.error(JSON.stringify({ missingRoutes, missingPillars, missingFields }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({ ok: true, routes: requiredRoutes.length, pillars: requiredPillars.length }, null, 2))
