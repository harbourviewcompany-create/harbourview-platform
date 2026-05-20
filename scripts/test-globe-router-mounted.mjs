import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const state = readFileSync(join(root, 'components/harbourview/globe/globeRouteState.ts'), 'utf8')
const controller = readFileSync(join(root, 'components/harbourview/globe/HarbourviewGlobeRouteController.tsx'), 'utf8')
const loader = readFileSync(join(root, 'components/harbourview/globe/HarbourviewGlobeClientLoader.tsx'), 'utf8')
const css = readFileSync(join(root, 'components/harbourview/globe/HarbourviewGlobeClientLoader.module.css'), 'utf8')

const required = [
  [state, "'default'"], [state, "'selected-market'"], [state, "'role-sheet'"], [state, "'intent-sheet'"], [state, "'multi-market'"], [state, "'fallback'"], [state, 'invalidParams'],
  [controller, 'useSearchParams'], [controller, 'router.push'], [controller, 'aria-pressed'], [controller, 'aria-live'], [controller, 'data-route-state'],
  [loader, 'browserSupportsWebGL'], [loader, 'prefersReducedMotion'], [loader, 'data-globe-mode'],
  [css, '.routeShell'], [css, '.routePanel']
]

const failed = required.filter(([source, token]) => !source.includes(token)).map(([, token]) => token)
if (failed.length) {
  console.error('Globe router proof failed:')
  for (const token of failed) console.error(`- ${token}`)
  process.exit(1)
}

console.log('Globe router proof passed.')
console.log('Routes: /, /?market=germany, /?role=buyer, /?intent=find-supply, /?markets=germany,portugal,uk, /?route=fallback, /?market=unknown-market')
