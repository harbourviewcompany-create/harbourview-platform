import { expect, test, type Browser, type BrowserContextOptions } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'

const BASE_URL = process.env.HARBOURVIEW_PUBLIC_BASE_URL || process.env.PLAYWRIGHT_BASE_URL
const BYPASS_TOKEN = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
const evidenceRoot = path.join(process.cwd(), 'artifacts', 'jurisdiction-command')

const VIEWPORTS = [
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
] as const

function contextOptions(): BrowserContextOptions {
  if (!BASE_URL) throw new Error('HARBOURVIEW_PUBLIC_BASE_URL or PLAYWRIGHT_BASE_URL is required')
  return {
    baseURL: BASE_URL,
    ...(BYPASS_TOKEN ? { extraHTTPHeaders: { 'x-vercel-protection-bypass': BYPASS_TOKEN } } : {}),
  }
}

async function authenticate(browser: Browser) {
  const email = process.env.E2E_TEST_USER_EMAIL
  const password = process.env.E2E_TEST_USER_PASSWORD
  if (!email || !password) throw new Error('E2E_TEST_USER_EMAIL and E2E_TEST_USER_PASSWORD are required')

  const context = await browser.newContext({
    ...contextOptions(),
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  })
  try {
    const page = await context.newPage()
    await page.goto('/login?next=%2Fdashboard', { waitUntil: 'domcontentloaded' })
    await page.getByLabel('Email address', { exact: true }).fill(email)
    await page.getByLabel('Password', { exact: true }).fill(password)
    await page.locator('form').getByRole('button', { name: 'Sign in', exact: true }).click()
    await page.waitForURL(url => url.pathname.startsWith('/dashboard'), { timeout: 45_000 })
    return await context.storageState()
  } finally {
    await context.close()
  }
}

async function assertNoHorizontalOverflow(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
}

test.describe('Jurisdiction Command mobile evidence', () => {
  test('All roles remains useful and captures all required mobile viewports', async ({ browser }) => {
    await fs.mkdir(evidenceRoot, { recursive: true })
    const storageState = await authenticate(browser)

    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({
        ...contextOptions(),
        storageState,
        viewport,
        isMobile: true,
        hasTouch: true,
      })
      try {
        const page = await context.newPage()
        const response = await page.goto('/dashboard?country=CA&section=jurisdiction&page=access-pathway', {
          waitUntil: 'domcontentloaded',
          timeout: 60_000,
        })
        expect(response?.status()).toBeLessThan(400)
        await expect(page.locator('[data-jurisdiction-command="v1"]')).toBeVisible()
        await expect(page.getByText('Jurisdiction command', { exact: true })).toBeVisible()
        await expect(page.getByRole('heading', { name: 'Material deltas', exact: true })).toBeVisible()
        await expect(page.getByRole('heading', { name: 'What are you trying to do?', exact: true })).toBeVisible()
        await expect(page.getByRole('heading', { name: 'Access pathway', exact: true })).toBeVisible()
        await expect(page.getByRole('heading', { name: 'Market signals', exact: true })).toBeVisible()
        await expect(page.getByRole('heading', { name: 'Verified counterparties', exact: true })).toBeVisible()
        await expect(page.getByRole('heading', { name: 'Can this answer be trusted?', exact: true })).toBeVisible()
        await expect(page.getByRole('heading', { name: 'Compare access posture', exact: true })).toBeVisible()
        await expect(page.getByText('Country-level access remains available in All roles')).toBeVisible()
        await expect(page.getByText('No access pathway is available for this context', { exact: false })).toHaveCount(0)
        await expect(page.locator('.hvm-op-bottom-nav')).toBeVisible()
        await expect(page.locator('[data-route-coverage]')).toHaveAttribute('data-route-coverage', /jurisdiction-baseline|trade-flow-match|unsupported/)
        await expect(page.locator('text=Loading reviewed changes and live intelligence…')).toHaveCount(0, { timeout: 15_000 })
        await assertNoHorizontalOverflow(page)
        await page.screenshot({
          path: path.join(evidenceRoot, `all-roles-${viewport.width}x${viewport.height}.png`),
          fullPage: true,
        })
      } finally {
        await context.close()
      }
    }
  })

  test('reviewed trade-flow and role pathway resolve without inference', async ({ browser }) => {
    await fs.mkdir(evidenceRoot, { recursive: true })
    const storageState = await authenticate(browser)
    const context = await browser.newContext({
      ...contextOptions(),
      storageState,
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    })

    try {
      const page = await context.newPage()
      await page.goto('/dashboard?country=CA&role=exporter&section=jurisdiction&page=access-pathway&activity=import&market=DE&product=Dried%20flower', {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      })
      await expect(page.locator('[data-jurisdiction-command="v1"]')).toBeVisible()
      await expect(page.locator('[data-route-coverage="trade-flow-match"]')).toBeVisible({ timeout: 15_000 })
      await expect(page.getByText('DE → CA', { exact: false })).toBeVisible()
      await expect(page.getByText('Permit required', { exact: false })).toBeVisible()
      await expect(page.getByText('Export readiness', { exact: false })).toBeVisible()
      await expect(page.getByText('Satisfied', { exact: true }).first()).toBeVisible()
      await assertNoHorizontalOverflow(page)
      await page.screenshot({
        path: path.join(evidenceRoot, 'exporter-import-route-390x844.png'),
        fullPage: true,
      })
    } finally {
      await context.close()
    }
  })
})
