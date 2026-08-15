import { expect, test } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'

const BASE_URL = process.env.HARBOURVIEW_PUBLIC_BASE_URL || process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000'
const evidenceRoot = path.join(process.cwd(), 'artifacts', 'p0-identity-org-context')

const VIEWPORTS = [
  { width: 375, height: 812, file: '375x812-market-routing.png' },
  { width: 390, height: 844, file: '390x844-market-routing.png' },
  { width: 430, height: 932, file: '430x932-market-routing.png' },
] as const

test.beforeAll(async () => {
  await fs.mkdir(evidenceRoot, { recursive: true })
})

for (const viewport of VIEWPORTS) {
  test(`Market Routing exposes production identity entry at ${viewport.width}x${viewport.height}`, async ({ browser }) => {
    const context = await browser.newContext({
      baseURL: BASE_URL,
      viewport: { width: viewport.width, height: viewport.height },
      isMobile: true,
      hasTouch: true,
      reducedMotion: 'reduce',
    })
    const page = await context.newPage()
    try {
      const response = await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 })
      expect(response?.status()).toBeLessThan(400)

      const routing = page.getByText('Market Routing', { exact: true })
      await expect(routing).toBeVisible()
      await expect(page.getByRole('link', { name: 'Sign in', exact: true })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Create account', exact: true })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Create organization', exact: true })).toBeVisible()
      await expect(page.getByPlaceholder('Country, U.S. state, or province')).toBeVisible()

      const metrics = await page.evaluate(() => ({
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        scrollWidth: document.documentElement.scrollWidth,
      }))
      expect(metrics.innerWidth).toBe(viewport.width)
      expect(metrics.innerHeight).toBe(viewport.height)
      expect(metrics.scrollWidth).toBeLessThanOrEqual(viewport.width)

      await page.screenshot({
        path: path.join(evidenceRoot, viewport.file),
        fullPage: false,
        animations: 'disabled',
      })
    } finally {
      await context.close()
    }
  })
}

test('selected market keeps account and organization onboarding return context', async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: BASE_URL,
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 })
    const search = page.getByPlaceholder('Country, U.S. state, or province')
    await search.fill('Canada')
    await page.getByRole('option', { name: /Canada/ }).click()

    await expect(page.getByRole('button', { name: /Enter Canada Market/i })).toBeVisible({ timeout: 30_000 })
    // Market Routing remains mounted behind the selected-market sheet, so both
    // surfaces legitimately expose onboarding links. The selected sheet is the
    // later rendered instance; scope to it deterministically rather than using
    // an ambiguous page-wide strict locator.
    const createAccount = page.getByRole('link', { name: 'Create account', exact: true }).last()
    const createOrganization = page.getByRole('link', { name: 'Create organization', exact: true }).last()
    await expect(createAccount).toBeVisible()
    await expect(createOrganization).toBeVisible()

    const accountHref = await createAccount.getAttribute('href')
    const organizationHref = await createOrganization.getAttribute('href')
    expect(accountHref).toContain('next=')
    expect(decodeURIComponent(accountHref ?? '')).toContain('/dashboard?country=CA')
    expect(organizationHref).toContain('returnTo=')
    expect(decodeURIComponent(organizationHref ?? '')).toContain('/dashboard?country=CA')
  } finally {
    await context.close()
  }
})
