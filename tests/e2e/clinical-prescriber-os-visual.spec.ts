import { expect, test, type Browser, type BrowserContextOptions, type Page } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'

const BASE_URL = process.env.HARBOURVIEW_PUBLIC_BASE_URL || process.env.PLAYWRIGHT_BASE_URL
const evidenceRoot = path.join(process.cwd(), 'artifacts', 'clinical-prescriber-os')

const VIEWPORTS = [
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
] as const

function sharedContextOptions(): BrowserContextOptions {
  if (!BASE_URL) throw new Error('HARBOURVIEW_PUBLIC_BASE_URL or PLAYWRIGHT_BASE_URL is required')
  return { baseURL: BASE_URL }
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
    await page.locator('form').getByRole('button', { name: 'Sign in', exact: true }).click()
    await page.waitForURL(url => url.pathname.startsWith('/dashboard'), { timeout: 45_000 })
    return context.storageState()
  } finally {
    await context.close()
  }
}

async function mockClinicalApis(page: Page) {
  await page.route('**/api/clinical/evidence?**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        state: 'empty',
        query: '',
        records: [],
        changes: [],
        message: 'Enter a condition or clinical question to search reviewed evidence.',
      }),
    })
  })
  await page.route('**/api/clinical/formulary?**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ products: [], skus: [] }),
    })
  })
  await page.route('**/api/clinical/interactions?**', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ state: 'empty', interactions: [] }) })
  })
  await page.route('**/api/clinical/education**', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ modules: [] }) })
  })
  await page.route('**/api/clinical/jurisdiction?**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        state: 'loaded',
        profile: {
          country: 'Canada',
          iso2: 'CA',
          status: 'loaded',
          legalPathway: 'Governed jurisdiction context',
          summary: 'Visual fixture: jurisdiction context is loaded without asserting a clinical rule.',
          primaryAuthority: { name: 'Primary authority fixture', role: 'Regulator', url: 'https://example.org/authority/clinical' },
          keyRules: [],
          accessNotes: 'Visual fixture only.',
          lastReviewed: '2026-08-18',
          pathway: null,
        },
      }),
    })
  })
  await page.route('**/api/clinical/workspace?**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ state: 'empty', safety: [], regimens: [], monitoring: [], guidelines: [] }),
    })
  })
  await page.route('**/api/clinical/authority?**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        state: 'unknown',
        verifiedClinician: false,
        professional: null,
        jurisdiction: 'CA',
        capabilities: { recommend: null, prescribe: null, dispense: null, claimAppropriateness: null },
        evidenceVersion: null,
        effectiveFrom: null,
        effectiveTo: null,
        notes: 'Visual fixture: professional authority intentionally unresolved.',
      }),
    })
  })
  await page.route('**/api/clinical/patients', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ patients: [] }) })
  })
  await page.route('**/api/clinical/ask?**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        state: 'no-match',
        question: 'visual fixture',
        answer: 'No governed evidence matched this question.',
        citations: [],
        unresolved: ['No prescriber-inspectable governed evidence is available for this question.'],
      }),
    })
  })
}

async function assertNoHorizontalPageOverflow(page: Page) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  expect(metrics.scrollWidth, `horizontal page overflow: ${JSON.stringify(metrics)}`).toBeLessThanOrEqual(metrics.clientWidth)
}

test.describe('Clinical Prescriber OS mobile visual evidence', () => {
  test.describe.configure({ mode: 'serial' })

  test('captures the unified Clinical command and full workspace at required mobile viewports', async ({ browser }) => {
    test.setTimeout(420_000)
    await fs.mkdir(evidenceRoot, { recursive: true })
    const storageState = await authenticate(browser)

    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({
        ...sharedContextOptions(),
        viewport,
        storageState,
        isMobile: true,
        hasTouch: true,
      })
      try {
        const page = await context.newPage()
        await mockClinicalApis(page)
        const response = await page.goto('/dashboard?country=CA&role=exporter&page=clinical&section=clinical', { waitUntil: 'domcontentloaded' })
        expect(response?.status()).toBeLessThan(400)

        const surface = page.locator('[data-clinical-surface="prescriber-os"]')
        await expect(surface).toBeVisible({ timeout: 30_000 })
        await expect(surface.getByRole('heading', { name: 'Prescriber command', exact: true })).toBeVisible()
        await expect(surface.getByRole('button', { name: 'Open Clinical workspace', exact: true })).toBeVisible()
        await expect(page.locator('.hvm-op-bottom-nav [aria-current="page"]')).toContainText('Command')
        await assertNoHorizontalPageOverflow(page)

        await page.screenshot({
          path: path.join(evidenceRoot, `${viewport.width}x${viewport.height}-clinical-command.png`),
          fullPage: false,
        })

        await surface.getByRole('button', { name: 'Open Clinical workspace', exact: true }).click()
        for (const label of ['Decision', 'Evidence', 'Safety', 'Products', 'Regimen', 'Monitoring', 'Guidelines', 'Documentation', 'History']) {
          await expect(surface.getByRole('tab', { name: label, exact: true })).toBeAttached()
        }
        await expect(surface.getByText('Patient-specific action remains blocked until patient, open encounter, core consent, professional authority, product, safety and monitoring requirements are resolved.', { exact: true })).toBeVisible()
        await expect(surface.getByLabel('Patient / encounter context')).toBeVisible()
        await assertNoHorizontalPageOverflow(page)

        await page.screenshot({
          path: path.join(evidenceRoot, `${viewport.width}x${viewport.height}-clinical-workspace.png`),
          fullPage: false,
        })
      } finally {
        await context.close()
      }
    }
  })
})
