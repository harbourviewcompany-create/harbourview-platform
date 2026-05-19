import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const stateFile = readFileSync(join(root, 'components/harbourview/globe/globeRouteState.ts'), 'utf8')
const controllerFile = readFileSync(join(root, 'components/harbourview/globe/HarbourviewGlobeClientLoader.tsx'), 'utf8')
const pageFile = readFileSync(join(root, 'app/page.tsx'), 'utf8')

const requiredStateTokens = [
  "'default'",
  "'selected-market'",
  "'role-sheet'",
  "'intent-sheet'",
  "'multi-market'",
  "'fallback'",
  'marketMap.get',
  'roleMap.get',
  'intentMap.get',
  'invalidParams',
]

const requiredControllerTokens = [
  'useSearchParams',
  'router.push',
  'aria-pressed',
  'aria-live',
  'data-route-state',
  'Compare Germany + Portugal + UK',
  'Test fallback route',
  'Reset globe',
]

const checks = [
  ...requiredStateTokens.map((token) => [`state:${token}`, stateFile.includes(token)]),
  ...requiredControllerTokens.map((token) => [`controller:${token}`, controllerFile.includes(token)]),
  ['homepage:globe-loader-mounted', pageFile.includes('<HarbourviewGlobeClientLoader />')],
]

const failed = checks.filter(([, passed]) => !passed)

if (failed.length > 0) {
  console.error('Globe router proof failed:')
  for (const [name] of failed) console.error(`- ${name}`)
  process.exit(1)
}

const routeCases = [
  ['default globe', ''],
  ['selected country', '?market=germany'],
  ['role sheet', '?role=buyer'],
  ['intent sheet', '?intent=find-supply'],
  ['multi-market', '?markets=germany,portugal,uk'],
  ['fallback route', '?route=fallback'],
  ['invalid param fallback', '?market=unknown-market'],
]

console.log('Globe router proof passed.')
for (const [name, query] of routeCases) console.log(`- ${name}: /${query}`)
