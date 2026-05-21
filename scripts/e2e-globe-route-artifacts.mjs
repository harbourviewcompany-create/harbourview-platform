import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const artifactRoot = process.env.HARBOURVIEW_GLOBE_E2E_ARTIFACT_DIR || 'ci-artifacts/globe-route-e2e'
const baseUrl = process.env.HARBOURVIEW_PUBLIC_BASE_URL || 'http://127.0.0.1:3000'

const states = [
  { id: 'default', query: '' },
  { id: 'country-selected', query: '?market=germany' },
  { id: 'role-sheet', query: '?role=buyer' },
  { id: 'intent-sheet', query: '?intent=find-supply' },
  { id: 'fallback', query: '?route=fallback' },
  { id: 'multi-market', query: '?markets=germany,portugal,uk' },
]

const publicRoutes = ['/', '/network', '/opportunities', '/education', '/compliance/service-support']
const globeTransitions = [
  '?market=germany',
  '?role=buyer',
  '?intent=find-supply',
  '?markets=germany,portugal,uk',
  '?route=fallback',
  '?market=unknown-market',
]

const browserLib = await import('playwright').catch(() => null)
if (!browserLib?.chromium) {
  console.error('Playwright is required. Install with: npm i -D playwright && npx playwright install --with-deps chromium')
  process.exit(1)
}

await mkdir(path.join(artifactRoot, 'screenshots', 'desktop'), { recursive: true })
await mkdir(path.join(artifactRoot, 'screenshots', 'mobile'), { recursive: true })

const summary = {
  baseUrl,
  checkedAt: new Date().toISOString(),
  screenshots: { desktop: {}, mobile: {} },
  consoleErrors: [],
  routePreservation: { publicRoutes: [], globeTransitions: [] },
}

const browser = await browserLib.chromium.launch({ headless: true })

const runViewport = async (label, viewport) => {
  const context = await browser.newContext({ viewport })
  const page = await context.newPage()
  const errors = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })

  for (const state of states) {
    await page.goto(`${baseUrl}/${state.query}`, { waitUntil: 'networkidle' })
    const shot = path.join(artifactRoot, 'screenshots', label, `${state.id}.png`)
    await page.screenshot({ path: shot, fullPage: true })
    summary.screenshots[label][state.id] = shot
  }

  if (errors.length) {
    summary.consoleErrors.push(...errors.map((error) => `${label}: ${error}`))
  }

  await context.close()
}

await runViewport('desktop', { width: 1440, height: 900 })
await runViewport('mobile', { width: 390, height: 844 })

const assertRoute = async (route) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await context.newPage()
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' })
  const current = new URL(page.url()).pathname
  summary.routePreservation.publicRoutes.push({ route, current, preserved: current === route })
  await context.close()
}

for (const route of publicRoutes) await assertRoute(route)

const transitionContext = await browser.newContext({ viewport: { width: 1280, height: 800 } })
const transitionPage = await transitionContext.newPage()
for (const transition of globeTransitions) {
  await transitionPage.goto(`${baseUrl}/${transition}`, { waitUntil: 'networkidle' })
  const url = new URL(transitionPage.url())
  summary.routePreservation.globeTransitions.push({ transition, pathname: url.pathname, search: url.search, preserved: url.pathname === '/' })
}
await transitionContext.close()

await browser.close()

const failures = []
if (summary.consoleErrors.length) failures.push(`Console errors detected (${summary.consoleErrors.length})`)
for (const routeCheck of summary.routePreservation.publicRoutes) {
  if (!routeCheck.preserved) failures.push(`Route not preserved: ${routeCheck.route} -> ${routeCheck.current}`)
}
for (const transitionCheck of summary.routePreservation.globeTransitions) {
  if (!transitionCheck.preserved) failures.push(`Globe transition rewrote pathname: ${transitionCheck.transition} -> ${transitionCheck.pathname}`)
}

const indexPath = path.join(artifactRoot, 'index.json')
const markdownPath = path.join(artifactRoot, 'index.md')
await writeFile(indexPath, `${JSON.stringify({ ...summary, failures }, null, 2)}\n`, 'utf8')

const lines = [
  '# Globe route e2e evidence',
  '',
  `- Base URL: ${baseUrl}`,
  `- Checked at: ${summary.checkedAt}`,
  `- Console errors: ${summary.consoleErrors.length}`,
  `- Failures: ${failures.length}`,
  '',
  '## Screenshot artifacts',
  '',
  '| Viewport | State | Path |',
  '|---|---|---|',
]
for (const viewport of ['desktop', 'mobile']) {
  for (const state of states) {
    lines.push(`| ${viewport} | ${state.id} | ${summary.screenshots[viewport][state.id]} |`)
  }
}
await writeFile(markdownPath, `${lines.join('\n')}\n`, 'utf8')

if (failures.length) {
  console.error('Globe route e2e evidence failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`Globe route e2e evidence generated at ${artifactRoot}`)
