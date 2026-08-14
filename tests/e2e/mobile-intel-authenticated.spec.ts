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

async function assertMobileIntelLayout(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)

  const activeTab = page.locator('.hvm-op-secondary-nav [aria-current="page"]')
  await expect(activeTab).toBeVisible()
  await expect.poll(
    async () => activeTab.evaluate(element => {
      const button = element.getBoundingClientRect()
      const nav = element.parentElement!.getBoundingClientRect()
      return button.left >= nav.left - 1 && button.right <= nav.right + 1
    }),
    { message: 'active Intel tab should settle fully inside the secondary navigation viewport' },
  ).toBe(true)

  const bottomNav = await page.locator('.hvm-op-bottom-nav').boundingBox()
  const main = await page.locator('.hvm-op-main').boundingBox()
  expect(bottomNav).not.toBeNull()
  expect(main).not.toBeNull()
  expect(main!.y + main!.height).toBeLessThanOrEqual(bottomNav!.y + 1)
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

  await assertMobileIntelLayout(page)
  await page.screenshot({ path: path.join(evidenceRoot, file), fullPage: false })
}

const clinicalVisualFixture = {
  state: 'loaded',
  query: '',
  message: 'Reviewed evidence records match this clinical question.',
  changes: [{
    id: '00000000-0000-4000-8000-000000000141',
    evidenceRecordId: '00000000-0000-4000-8000-000000000140',
    eventType: 'updated',
    title: 'Current Cannabis Regulations medical-document authority verified',
    summary: 'Current federal medical-document authority is verified; legacy ACMPR-era framing is not treated as current.',
    materiality: 'high',
    jurisdiction: ['Canada'],
    professionRelevance: ['doctor', 'nurse_practitioner', 'pharmacist', 'other'],
    occurredAt: '2026-08-14T12:00:00Z',
    verifiedAt: '2026-08-14T12:00:00Z',
    primarySource: {
      title: 'Cannabis Regulations §273',
      publisher: 'Justice Laws Website',
      url: 'https://laws-lois.justice.gc.ca/eng/regulations/SOR-2018-144/section-273.html',
      sourceId: 'SOR-2018-144-s273',
    },
  }],
  records: [{
    id: '00000000-0000-4000-8000-000000000140',
    slug: 'ca-cannabis-regulations-medical-document-273',
    title: 'Medical document requirements under Cannabis Regulations §273',
    summary: 'Primary federal legal requirements for the contents and validity of a medical document used for access to cannabis for medical purposes.',
    condition: null,
    conditionAliases: [],
    population: null,
    intervention: null,
    formulation: null,
    cannabinoid: [],
    interventionClass: 'general-cannabis',
    comparator: null,
    outcome: null,
    evidenceType: 'regulation',
    evidenceStrength: 'ungraded',
    evidenceStrengthMethod: 'Legal authority; clinical evidence certainty is not applicable.',
    uncertainty: 'This record describes federal legal requirements and does not establish efficacy, safety or appropriateness for an individual patient.',
    conflictStatus: 'none',
    jurisdiction: ['Canada'],
    professionRelevance: ['doctor', 'nurse_practitioner', 'pharmacist', 'other'],
    primarySource: {
      title: 'Cannabis Regulations §273',
      publisher: 'Justice Laws Website',
      url: 'https://laws-lois.justice.gc.ca/eng/regulations/SOR-2018-144/section-273.html',
      sourceId: 'SOR-2018-144-s273',
    },
    publicationDate: null,
    effectiveDate: null,
    verifiedAt: '2026-08-14T12:00:00Z',
    supersessionState: 'current',
    supersededById: null,
    reviewStatus: 'published',
  }],
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

      for (const viewport of [
        { width: 320, height: 568 },
        { width: 375, height: 812 },
        { width: 390, height: 844 },
        { width: 430, height: 932 },
      ]) {
        await page.setViewportSize(viewport)
        await openIntelState(page, 'search', 'Search', `intel-auth-responsive-search-${viewport.width}x${viewport.height}.png`)
        const responsiveInput = page.getByLabel('Search signals, markets, regulations, authorities, operators or actions')
        await responsiveInput.fill('Canada')
        await expect(page.locator('.hvm2-search-results')).toBeVisible()
        await assertMobileIntelLayout(page)
      }

      await page.setViewportSize({ width: 390, height: 844 })
      await openIntelState(page, 'search', 'Search', 'intel-auth-accessibility-base-390x844.png')
      await page.addStyleTag({
        content: `
          .hvm2-section-heading h2,.hvm-op-page-title{font-size:200%!important}
          .hvm2-section-heading p,.hvm2-intel-search-result>strong,.hvm2-intel-search-result>p,.hvm2-intel-search-result>small,.hvm2-search-summary,.hvm2-search-filters button,.hvm-op-secondary-nav button,.hvm-op-context-trigger>span:first-child,.hvm2-bottom-nav small{font-size:200%!important}
          .hvm2-intel-search-result,.hvm-op-secondary-nav button,.hvm2-search-filters button{min-height:44px;height:auto!important}
        `,
      })
      const largeTextInput = page.getByLabel('Search signals, markets, regulations, authorities, operators or actions')
      await largeTextInput.fill('Canada')
      await expect(page.locator('.hvm2-search-results')).toBeVisible()
      await assertMobileIntelLayout(page)
      await page.screenshot({ path: path.join(evidenceRoot, 'intel-auth-accessibility-search-390x844-200pct.png'), fullPage: false })
    } finally {
      await context.close()
    }
  })

  test('captures authenticated Clinical evidence-spine UI at the required mobile viewports', async ({ browser }) => {
    test.setTimeout(300_000)
    await fs.mkdir(evidenceRoot, { recursive: true })
    const storageState = await authenticate(browser)

    for (const viewport of [
      { width: 375, height: 812 },
      { width: 390, height: 844 },
      { width: 430, height: 932 },
    ] as const) {
      const context = await browser.newContext({
        ...sharedContextOptions(),
        viewport,
        storageState,
        isMobile: true,
        hasTouch: true,
      })

      try {
        const page = await context.newPage()
        await page.route('**/api/clinical/evidence**', route => route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(clinicalVisualFixture),
        }))
        const response = await page.goto('/dashboard?country=CA&role=exporter&page=clinical&section=clinical', {
          waitUntil: 'domcontentloaded',
          timeout: 60_000,
        })
        expect(response?.status()).toBeLessThan(400)
        await expect(page.locator('#clinical')).toBeVisible()
        await expect(page.getByText('Professional clinical command', { exact: true })).toBeVisible()
        await expect(page.getByText('Evidence by condition · Canada', { exact: true })).toBeVisible()
        await expect(page.getByText('Medical document requirements under Cannabis Regulations §273', { exact: true })).toBeVisible()
        await expect(page.getByText(/under the ACMPR framework/i)).toHaveCount(0)
        await expect(page.locator('.hvm-op-bottom-nav')).toContainText('Command')
        await expect(page.locator('.hvm-op-bottom-nav')).toContainText('Market')
        await expect(page.locator('.hvm-op-bottom-nav')).toContainText('Intel')
        await expect(page.locator('.hvm-op-bottom-nav')).toContainText('Actions')
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
        await page.screenshot({
          path: path.join(evidenceRoot, `clinical-evidence-auth-${viewport.width}x${viewport.height}.png`),
          fullPage: false,
        })
      } finally {
        await context.close()
      }
    }
  })
})
