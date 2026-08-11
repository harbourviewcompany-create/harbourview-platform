import { expect, test, type Browser, type BrowserContextOptions, type Page } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'

const BASE_URL = process.env.HARBOURVIEW_PUBLIC_BASE_URL || process.env.PLAYWRIGHT_BASE_URL
const BYPASS_TOKEN = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
const evidenceRoot = path.join(process.cwd(), 'artifacts', 'mobile-command-v2')

function sharedContextOptions(): BrowserContextOptions {
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
    ...sharedContextOptions(),
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  })

  try {
    const page = await context.newPage()
    await page.goto('/login?next=%2Fdashboard', { waitUntil: 'domcontentloaded' })
    await page.getByLabel('Email address', { exact: true }).fill(email)
    await page.getByLabel('Password', { exact: true }).fill(password)
    const submit = page.locator('form').getByRole('button', { name: 'Sign in', exact: true })
    await expect(submit).toBeEnabled()
    await submit.click()
    await page.waitForURL(url => url.pathname.startsWith('/dashboard'), { timeout: 45_000 })
    return await context.storageState()
  } finally {
    await context.close()
  }
}

async function openIntelState(page: Page, section: string, expectedTab: string, file: string) {
  const response = await page.goto(
    `/dashboard?country=CA&role=exporter&page=briefing&section=${encodeURIComponent(section)}`,
    { waitUntil: 'domcontentloaded', timeout: 60_000 },
  )
  expect(response?.status()).toBeLessThan(400)
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})

  await expect(page.locator('[data-mobile-command-version="2"]')).toBeVisible()
  await expect(page.locator('.hvm-op-page-title')).toHaveText('Intel')
  await expect(page.locator('.hvm-op-bottom-nav [aria-current="page"]')).toContainText('Intel')
  await expect(page.locator(`#${section}`)).toBeVisible()
  await expect(page.locator('.hvm-op-secondary-nav [aria-current="page"]')).toHaveText(expectedTab)

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  await page.screenshot({ path: path.join(evidenceRoot, file), fullPage: false })
}

test.describe('Mobile Intel authenticated evidence', () => {
  test.describe.configure({ mode: 'serial' })

  test('captures all six required Intel states from the authenticated isolated production build', async ({ browser }) => {
    test.setTimeout(360_000)
    await fs.mkdir(evidenceRoot, { recursive: true })
    const storageState = await authenticate(browser)
    const context = await browser.newContext({
      ...sharedContextOptions(),
      viewport: { width: 390, height: 844 },
      storageState,
      isMobile: true,
      hasTouch: true,
    })

    try {
      const page = await context.newPage()
      await openIntelState(page, 'weekly-signals', 'Weekly signals', 'intel-auth-01-weekly-signals-390x844.png')
      await openIntelState(page, 'personal-briefing', 'Personal briefing', 'intel-auth-02-personal-briefing-390x844.png')
      await openIntelState(page, 'regulatory', 'Regulatory watch', 'intel-auth-03-regulatory-watch-390x844.png')
      await openIntelState(page, 'local-intel', 'Local intelligence', 'intel-auth-04-local-intelligence-390x844.png')
      await openIntelState(page, 'search', 'Search', 'intel-auth-05-search-empty-390x844.png')

      const input = page.getByLabel('Search signals, markets, regulations, authorities, operators or actions')
      await expect(input).toBeVisible()
      await input.fill('Canada')
      await expect(page.locator('.hvm2-search-summary')).toContainText('matched record')
      await expect(page.locator('.hvm2-search-results')).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
      await page.screenshot({ path: path.join(evidenceRoot, 'intel-auth-06-search-canada-390x844.png'), fullPage: false })
    } finally {
      await context.close()
    }
  })
})
