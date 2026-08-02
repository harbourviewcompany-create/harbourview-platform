import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'

const baseUrl = process.env.PREVIEW_BASE_URL || 'https://fix-mobile-dashboard-navigat.harbourview-platform.pages.dev'
const outputDir = path.resolve('artifacts/pr1249-mobile-preview')
const screenshotsDir = path.join(outputDir, 'screenshots')
const routes = [
  '/countries/mexico',
  '/dashboard/country/mexico',
  '/dashboard/country/mexico/market',
  '/dashboard/country/mexico/education',
  '/dashboard/country/mexico/compliance',
  '/dashboard/country/mexico/signals',
  '/network/clinical-education',
  '/network/clinical-education/request',
]

function slug(route) {
  return route.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-') || 'root'
}

async function visibleText(page, selectors) {
  for (const selector of selectors) {
    const locator = page.locator(selector).filter({ visible: true }).first()
    if (await locator.count()) {
      const text = (await locator.innerText().catch(() => '')).trim()
      if (text) return text
    }
  }
  return null
}

async function activeState(page) {
  return page.evaluate(() => {
    const visible = (el) => {
      const style = getComputedStyle(el)
      const rect = el.getBoundingClientRect()
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0
    }
    const elements = [...document.querySelectorAll('a,button,[role="tab"],[aria-current]')].filter(visible)
    const describe = (el) => ({
      tag: el.tagName.toLowerCase(),
      text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120),
      href: el instanceof HTMLAnchorElement ? el.href : null,
      ariaCurrent: el.getAttribute('aria-current'),
      ariaSelected: el.getAttribute('aria-selected'),
      className: typeof el.className === 'string' ? el.className : '',
    })
    const active = elements.filter((el) => {
      const cls = typeof el.className === 'string' ? el.className.toLowerCase() : ''
      return el.getAttribute('aria-current') || el.getAttribute('aria-selected') === 'true' || /(^|\s)(active|selected|current)(\s|$)/.test(cls)
    }).map(describe)
    const bottomCandidates = elements.filter((el) => {
      const r = el.getBoundingClientRect()
      return r.top >= window.innerHeight * 0.72
    }).map(describe)
    return { active, bottomCandidates }
  })
}

await fs.mkdir(screenshotsDir, { recursive: true })
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  screen: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 1,
  ignoreHTTPSErrors: true,
})

const report = {
  baseUrl,
  viewport: { width: 390, height: 844 },
  checkedAt: new Date().toISOString(),
  routes: [],
}

for (const route of routes) {
  const page = await context.newPage()
  const responses = []
  const consoleErrors = []
  const pageErrors = []
  page.on('response', (response) => {
    if (response.request().isNavigationRequest() && response.request().frame() === page.mainFrame()) {
      responses.push({ url: response.url(), status: response.status(), statusText: response.statusText() })
    }
  })
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', (error) => pageErrors.push(error.message))

  const requestedUrl = new URL(route, baseUrl).toString()
  let navigationError = null
  let response = null
  try {
    response = await page.goto(requestedUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
    await page.waitForTimeout(1500)
  } catch (error) {
    navigationError = error instanceof Error ? error.message : String(error)
  }

  const screenshot = `screenshots/${slug(route)}.png`
  await page.screenshot({ path: path.join(outputDir, screenshot), fullPage: true }).catch(() => {})

  const title = await page.title().catch(() => null)
  const h1 = await visibleText(page, ['h1'])
  const selectedCountry = await visibleText(page, [
    '[data-testid*="country"]',
    '[aria-label*="country" i]',
    'select[name*="country" i] option:checked',
    '.hvm-country-name',
    '.country-name',
  ])
  const state = await activeState(page).catch(() => ({ active: [], bottomCandidates: [] }))

  report.routes.push({
    route,
    requestedUrl,
    redirectChain: responses,
    finalUrl: page.url(),
    finalStatus: response?.status() ?? responses.at(-1)?.status ?? null,
    title,
    h1,
    selectedCountry,
    activeTopTab: state.active.find((x) => x.ariaSelected === 'true' || x.ariaCurrent === 'page') ?? state.active[0] ?? null,
    activeBottomNavigation: state.bottomCandidates.find((x) => x.ariaCurrent || x.ariaSelected === 'true' || /(^|\s)(active|selected|current)(\s|$)/i.test(x.className)) ?? null,
    activeElements: state.active,
    consoleErrors,
    pageErrors,
    navigationError,
    screenshot,
  })
  await page.close()
}

await browser.close()
await fs.writeFile(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2))
await fs.writeFile(path.join(outputDir, 'report.md'), `# PR #1249 Mobile Preview Verification\n\nBase URL: ${baseUrl}\n\nViewport: 390x844\n\nRoutes checked: ${routes.length}\n`)

const failed = report.routes.filter((r) => r.navigationError || !r.finalStatus || r.finalStatus >= 400)
if (failed.length) {
  console.error(JSON.stringify(failed, null, 2))
  process.exitCode = 1
}
