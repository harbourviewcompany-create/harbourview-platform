import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const sourceFiles = [
  'app/page.tsx',
  'components/Nav.tsx',
  'components/Footer.tsx',
  'lib/institutional/content.ts',
  'app/marketplace/page.tsx',
  'app/intelligence/page.tsx',
  'app/contact/page.tsx',
  'app/intake/page.tsx',
]

const requiredRoutes = [
  '/',
  '/platform',
  '/network',
  '/marketplace',
  '/marketplace/listings',
  '/marketplace/wanted',
  '/marketplace/sell',
  '/marketplace/services',
  '/marketplace/business-opportunities',
  '/marketplace/consumables',
  '/marketplace/genetics',
  '/intelligence',
  '/intelligence/country-briefs',
  '/intelligence/licensing-pathways',
  '/intelligence/regulatory-pathways',
  '/intelligence/counterparty-intelligence',
  '/intelligence/logistics-trade-routes',
  '/source-methodology',
  '/markets',
  '/signals',
  '/education',
  '/compliance',
  '/professionals',
  '/policy-standards',
  '/assessments',
  '/institutional-partnerships',
  '/trust-governance',
  '/reviewed-connections',
  '/contact',
  '/intake',
]

const requiredRoles = [
  'operators',
  'buyers',
  'sellers',
  'exporters',
  'importers',
  'distributors',
  'pharmacists',
  'clinicians',
  'doctors',
  'lawyers',
  'compliance advisors',
  'regulators',
  'policymakers',
  'investors',
  'acquirers',
  'equipment',
  'consumables',
  'service providers',
  'labs',
  'logistics',
  'testing providers',
  'advocates',
  'educators',
  'enthusiasts',
  'associations',
  'institutions',
  'universities',
]

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8')
}

function normalizeHref(value) {
  if (!value.startsWith('/')) return null
  if (value.startsWith('//')) return null
  return value.split('#')[0].split('?')[0].replace(/\/$/, '') || '/'
}

function routeFileFor(route) {
  if (route === '/') return path.join(repoRoot, 'app', 'page.tsx')
  return path.join(repoRoot, 'app', ...route.slice(1).split('/'), 'page.tsx')
}

const publicHrefs = new Set(requiredRoutes)
const sourceText = sourceFiles.map((file) => read(file)).join('\n')

for (const match of sourceText.matchAll(/(?:href:\s*|href=)(["'`])([^"'`]+)\1/g)) {
  const route = normalizeHref(match[2])
  if (route) publicHrefs.add(route)
}

const missingRoutes = [...publicHrefs]
  .filter((route) => !fs.existsSync(routeFileFor(route)))
  .sort()

const missingRoles = requiredRoles.filter((role) => !sourceText.toLowerCase().includes(role))

if (missingRoutes.length > 0 || missingRoles.length > 0) {
  if (missingRoutes.length > 0) {
    console.error('Missing public route files:')
    for (const route of missingRoutes) console.error(`- ${route} -> ${path.relative(repoRoot, routeFileFor(route))}`)
  }

  if (missingRoles.length > 0) {
    console.error('Missing visible role-path terms:')
    for (const role of missingRoles) console.error(`- ${role}`)
  }

  process.exit(1)
}

console.log(`HAR-37 public IA route coverage passed for ${publicHrefs.size} public routes.`)
console.log(`HAR-37 visible role coverage passed for ${requiredRoles.length} role-path terms.`)
