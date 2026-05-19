const { mkdirSync } = await import('node:fs')
const { join } = await import('node:path')

const routes = [
  { slug: 'default', path: '/' },
  { slug: 'market-germany', path: '/?market=germany' },
  { slug: 'sheet-role', path: '/?sheet=role' },
  { slug: 'sheet-intent', path: '/?sheet=intent' },
  { slug: 'multi-market', path: '/?markets=germany,colombia&sheet=multi' },
  { slug: 'sheet-fallback', path: '/?sheet=fallback' },
  { slug: 'invalid-fallback', path: '/?market=unknown&sheet=bad' },
]

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000'
const outDir = join(process.cwd(), 'artifacts', 'globe-router')
mkdirSync(outDir, { recursive: true })

const { chromium } = await import('playwright')
const browser = await chromium.launch({ headless: true })

const checks = []

for (const viewport of [{ name: 'mobile', width: 390, height: 844 }, { name: 'desktop', width: 1440, height: 1080 }]) {
  const context = await browser.newContext({ viewport })
  const page = await context.newPage()

  for (const route of routes) {
    const url = `${BASE_URL}${route.path}`
    await page.goto(url, { waitUntil: 'networkidle' })

    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      contextVisible: Boolean([...document.querySelectorAll('p')].find((el) => el.textContent?.includes('Selected market context'))),
      fallbackVisible: Boolean(document.querySelector('[data-globe-mode]')),
      bodyText: document.body.innerText,
    }))

    checks.push({ viewport: viewport.name, route: route.slug, horizontalScroll: metrics.scrollWidth > metrics.clientWidth, contextVisible: metrics.contextVisible, fallbackVisible: metrics.fallbackVisible })

    await page.screenshot({ path: join(outDir, `${viewport.name}-${route.slug}.png`), fullPage: true })
  }

  await page.goto(`${BASE_URL}/?market=germany`, { waitUntil: 'networkidle' })
  await page.click('button:has-text("Colombia")')
  await page.goBack({ waitUntil: 'networkidle' })
  const backWorked = page.url().includes('market=germany')
  await page.goForward({ waitUntil: 'networkidle' })
  const forwardWorked = page.url().includes('markets=')
  checks.push({ viewport: viewport.name, route: 'history-nav', backWorked, forwardWorked })

  await context.close()
}

await browser.close()
console.log(JSON.stringify({ baseUrl: BASE_URL, outDir, checks }, null, 2))
