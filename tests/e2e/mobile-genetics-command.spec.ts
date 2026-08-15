import { expect, test, type Browser } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'

const BASE_URL = process.env.HARBOURVIEW_PUBLIC_BASE_URL || process.env.PLAYWRIGHT_BASE_URL
const evidenceRoot = path.join(process.cwd(), 'artifacts', 'mobile-genetics-command')

const MOBILE_VIEWPORTS = [
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
] as const

const LARGE_VIEWPORTS = [
  { width: 768, height: 960, label: 'tablet' },
  { width: 1440, height: 960, label: 'desktop' },
] as const

async function authenticatedState(browser: Browser) {
  if (!BASE_URL) throw new Error('HARBOURVIEW_PUBLIC_BASE_URL or PLAYWRIGHT_BASE_URL is required')
  const email = process.env.E2E_TEST_USER_EMAIL
  const password = process.env.E2E_TEST_USER_PASSWORD
  if (!email || !password) throw new Error('E2E_TEST_USER_EMAIL and E2E_TEST_USER_PASSWORD are required')

  const context = await browser.newContext({ baseURL: BASE_URL, viewport: { width: 390, height: 844 } })
  try {
    const page = await context.newPage()
    await page.goto('/login?next=%2Fdashboard', { waitUntil: 'domcontentloaded' })
    await page.getByLabel('Email address', { exact: true }).fill(email)
    await page.getByLabel('Password', { exact: true }).fill(password)
    await page.locator('form').getByRole('button', { name: 'Sign in', exact: true }).click()
    await page.waitForURL(url => url.pathname.startsWith('/dashboard'), { timeout: 45_000 })
    return context.storageState()
  } finally {
    await context.close()
  }
}

async function assertGeneticsContract(page: import('@playwright/test').Page) {
  await expect(page.locator('#genetics')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Cultivar intelligence', exact: true })).toBeVisible()
  await expect(page.getByText('Visual Alpha', { exact: true })).toBeVisible()
  await expect(page.getByText('Alpha One, A1', { exact: true })).toBeVisible()
  await expect(page.getByText('Visual Breeding Co.', { exact: true })).toBeVisible()
  await expect(page.getByText('Public genotype summary', { exact: true })).toBeVisible()
  const germanyOpportunity = page.locator('.hvm2-genetics-opportunity').filter({ hasText: 'Germany' })
  await expect(germanyOpportunity).toBeVisible()
  await expect(germanyOpportunity.getByText('DE · Germany', { exact: true })).toBeVisible()

  const linkedCollaboration = page.locator('.hvm2-genetics-project').filter({ hasText: 'Visual verification collaboration' })
  await expect(linkedCollaboration).toBeVisible()
  await expect(linkedCollaboration.getByText('Visual verification collaboration', { exact: true })).toBeVisible()

  const networkCollaboration = page.locator('.hvm2-genetics-network-grid article').filter({ hasText: 'Visual verification collaboration' })
  await expect(networkCollaboration).toBeVisible()
  await expect(networkCollaboration.getByText('Visual verification collaboration', { exact: true })).toBeVisible()

  await expect(page.getByText('Visual Genetics Lab', { exact: true })).toBeVisible()
  await expect(page.locator('.hvm2-genetics-record[open]')).toHaveCount(1)

  const bodyText = await page.locator('body').innerText()
  expect(bodyText).not.toContain('PRIVATE VISUAL NOTE')
  expect(bodyText).not.toContain('private/visual-genetics.pdf')
  expect(bodyText).not.toContain('PRIVATE REVIEW NOTE')

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
}

test.describe('Genetics Command exact visual evidence', () => {
  test.describe.configure({ mode: 'serial' })

  test('captures Genetics at exactly 375x812, 390x844 and 430x932', async ({ browser }) => {
    test.setTimeout(360_000)
    if (!BASE_URL) throw new Error('HARBOURVIEW_PUBLIC_BASE_URL or PLAYWRIGHT_BASE_URL is required')
    await fs.mkdir(evidenceRoot, { recursive: true })
    const storageState = await authenticatedState(browser)

    for (const viewport of MOBILE_VIEWPORTS) {
      const context = await browser.newContext({
        baseURL: BASE_URL,
        viewport,
        storageState,
        isMobile: true,
        hasTouch: true,
      })
      try {
        const page = await context.newPage()
        const response = await page.goto('/dashboard?country=CA&role=exporter&page=genetics&section=genetics&cultivar=visual-alpha', { waitUntil: 'domcontentloaded' })
        expect(response?.status()).toBeLessThan(400)
        await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
        await assertGeneticsContract(page)
        await expect(page.locator('[data-mobile-command-version="2"]')).toBeVisible()
        await page.screenshot({
          path: path.join(evidenceRoot, `${viewport.width}x${viewport.height}-genetics.png`),
          fullPage: true,
        })
      } finally {
        await context.close()
      }
    }
  })

  test('captures tablet and desktop Genetics regression', async ({ browser }) => {
    test.setTimeout(240_000)
    if (!BASE_URL) throw new Error('HARBOURVIEW_PUBLIC_BASE_URL or PLAYWRIGHT_BASE_URL is required')
    await fs.mkdir(evidenceRoot, { recursive: true })
    const storageState = await authenticatedState(browser)

    for (const viewport of LARGE_VIEWPORTS) {
      const context = await browser.newContext({ baseURL: BASE_URL, viewport, storageState })
      try {
        const page = await context.newPage()

        // The desktop shell renders entirely client-side (CommandCentre and
        // DesktopCommandWorkspace are both dynamic with ssr: false), so an
        // uncaught render error replaces the whole subtree -- including the
        // [data-dashboard-renderer] wrapper -- and the assertion below reports
        // a bare "element(s) not found" that names neither the error nor the
        // page it happened on. Capturing the runtime errors lets the failure
        // say why rather than only what.
        const pageErrors: string[] = []
        const consoleErrors: string[] = []
        page.on('pageerror', error => pageErrors.push(error.stack ?? error.message))
        page.on('console', message => {
          if (message.type() === 'error') consoleErrors.push(message.text())
        })

        const response = await page.goto('/dashboard?country=CA&role=exporter&page=genetics&cultivar=visual-alpha', { waitUntil: 'domcontentloaded' })
        expect(response?.status()).toBeLessThan(400)
        await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})

        const shell = await page.evaluate(() => ({
          url: location.href,
          renderers: Array.from(document.querySelectorAll('[data-dashboard-renderer]'))
            .map(element => {
              const rect = element.getBoundingClientRect()
              return {
                renderer: element.getAttribute('data-dashboard-renderer'),
                width: Math.round(rect.width),
                height: Math.round(rect.height),
              }
            }),
          bootShells: document.querySelectorAll('[aria-busy="true"]').length,
          bodyText: (document.body.innerText || '').trim().slice(0, 400),
        }))

        // `:visible` treats a zero-area box the same as a missing node, so both
        // conditions produce the identical unhelpful message. Separate them.
        const desktopShell = shell.renderers.find(entry => entry.renderer === 'desktop')
        if (!desktopShell || desktopShell.width === 0 || desktopShell.height === 0) {
          throw new Error(
            (desktopShell
              ? `Desktop shell rendered but has a zero-area box (${desktopShell.width}x${desktopShell.height})`
              : 'No [data-dashboard-renderer="desktop"] rendered') +
            ` at ${viewport.label} (${viewport.width}x${viewport.height}).\n` +
            `url: ${shell.url}\n` +
            `renderers found: ${JSON.stringify(shell.renderers)}\n` +
            `boot shells still mounted: ${shell.bootShells}\n` +
            `page errors: ${pageErrors.length ? pageErrors.join('\n---\n') : '(none)'}\n` +
            `console errors: ${consoleErrors.length ? consoleErrors.join('\n---\n') : '(none)'}\n` +
            `body text: ${shell.bodyText || '(empty)'}`,
          )
        }

        await expect(page.locator('[data-dashboard-renderer="desktop"]:visible')).toBeVisible()
        await expect(page.locator('[data-mobile-command-version="2"]:visible')).toHaveCount(0)
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
        expect(overflow).toBeLessThanOrEqual(1)
        await page.screenshot({
          path: path.join(evidenceRoot, `${viewport.width}x${viewport.height}-${viewport.label}-genetics.png`),
          fullPage: true,
        })
      } finally {
        await context.close()
      }
    }
  })
})
