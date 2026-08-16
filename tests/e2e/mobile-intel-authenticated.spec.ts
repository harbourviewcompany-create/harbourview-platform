import { expect, test, type Browser, type BrowserContextOptions, type Page } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'

const BASE_URL = process.env.HARBOURVIEW_PUBLIC_BASE_URL || process.env.PLAYWRIGHT_BASE_URL
const BYPASS_TOKEN = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
const evidenceRoot = path.join(process.cwd(), 'artifacts', 'mobile-command-v2')

function sharedContextOptions(): BrowserContextOptions {
  if (!BASE_URL) throw new Error('HARBOURVIEW_PUBLIC_BASE_URL or PLAYWRIGHT_BASE_URL is required')
  return { baseURL: BASE_URL, ...(BYPASS_TOKEN ? { extraHTTPHeaders: { 'x-vercel-protection-bypass': BYPASS_TOKEN } } : {}) }
}

async function authenticate(browser: Browser) {
  const email = process.env.E2E_TEST_USER_EMAIL
  const password = process.env.E2E_TEST_USER_PASSWORD
  if (!email || !password) throw new Error('E2E_TEST_USER_EMAIL and E2E_TEST_USER_PASSWORD are required')
  const context = await browser.newContext({ ...sharedContextOptions(), viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  try {
    const page = await context.newPage()
    await page.goto('/login?next=%2Fdashboard', { waitUntil: 'domcontentloaded' })
    await page.getByLabel('Email address', { exact: true }).fill(email)
    await page.getByLabel('Password', { exact: true }).fill(password)
    const submit = page.locator('form').getByRole('button', { name: 'Sign in', exact: true })
    await expect(submit).toBeEnabled(); await submit.click()
    await page.waitForURL(url => url.pathname.startsWith('/dashboard'), { timeout: 45_000 })
    return await context.storageState()
  } finally { await context.close() }
}

async function assertMobileIntelLayout(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  const activeTab = page.locator('.hvm-op-secondary-nav [aria-current="page"]')
  await expect(activeTab).toBeVisible()
  await expect.poll(async () => activeTab.evaluate(element => {
    const button = element.getBoundingClientRect(); const nav = element.parentElement!.getBoundingClientRect()
    return button.left >= nav.left - 1 && button.right <= nav.right + 1
  }), { message: 'active Intel tab should settle fully inside the secondary navigation viewport' }).toBe(true)
  const bottomNav = await page.locator('.hvm-op-bottom-nav').boundingBox(); const main = await page.locator('.hvm-op-main').boundingBox()
  expect(bottomNav).not.toBeNull(); expect(main).not.toBeNull(); expect(main!.y + main!.height).toBeLessThanOrEqual(bottomNav!.y + 1)
}

async function openIntelState(page: Page, section: string, expectedTab: string, file: string) {
  const response = await page.goto(`/dashboard?country=CA&role=exporter&page=briefing&section=${encodeURIComponent(section)}`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
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
  state: 'loaded', query: 'Dravet syndrome', message: 'Reviewed evidence records match this clinical question.',
  synthesis: {
    recordCount: 1, currentRecordCount: 1, gradedRecordCount: 0, ungradedRecordCount: 1,
    regulatedDrugRecordCount: 1, generalCannabisRecordCount: 0, evidenceTypes: { 'product-monograph': 1 },
    hasMaterialConflict: false, hasDegradedSource: false, lastVerifiedAt: '2026-08-14T13:55:00Z',
    summary: '1 published source record; 0 clinically graded and 1 ungraded. This count summary does not infer efficacy or comparative superiority.',
  },
  changes: [{
    id: '00000000-0000-4000-8000-000000000141', evidenceRecordId: '00000000-0000-4000-8000-000000000140', eventType: 'published',
    title: 'Regulated cannabinoid medicine indication added to Clinical Evidence V1',
    summary: 'A Canadian regulated-drug indication record was added with explicit product-monograph provenance and ungraded certainty; it does not generalize to cannabis products or genetics.',
    materiality: 'medium', jurisdiction: ['Canada'], professionRelevance: ['doctor','nurse_practitioner','pharmacist','other'],
    occurredAt: '2026-08-14T13:45:00Z', verifiedAt: '2026-08-14T13:55:00Z',
    primarySource: { title: 'EPIDIOLEX Product Monograph', publisher: 'Jazz Pharmaceuticals Research UK Limited', url: 'https://pp.jazzpharma.com/pi/epidiolex.ca.PM-en.pdf', sourceId: 'ca-epidiolex-pm-2024-10-30' },
  }],
  records: [{
    id: '00000000-0000-4000-8000-000000000140', slug: 'ca-epidiolex-dravet-indication', title: 'EPIDIOLEX authorized indication — Dravet syndrome',
    summary: 'The Canadian product monograph identifies EPIDIOLEX as adjunctive therapy for seizures associated with Dravet syndrome in patients 2 years of age and older. This is regulatory product-indication metadata, not an independent Harbourview efficacy recommendation.',
    condition: 'Dravet syndrome', conditionAliases: ['DS'], population: 'Patients 2 years of age and older with seizures associated with Dravet syndrome',
    intervention: 'Cannabidiol (EPIDIOLEX)', formulation: 'Oral solution 100 mg/mL', cannabinoid: ['CBD'], interventionClass: 'regulated-cannabinoid-drug',
    comparator: null, outcome: 'Authorized indication metadata; no comparative conclusion is asserted.', evidenceType: 'product-monograph', evidenceStrength: 'ungraded',
    evidenceStrengthMethod: 'Regulatory indication record; Harbourview Clinical Evidence V1 does not convert authorization into a clinical certainty grade.',
    uncertainty: 'Product-monograph authorization does not establish comparative superiority or substitute for patient-specific clinical judgment.', conflictStatus: 'none',
    jurisdiction: ['Canada'], professionRelevance: ['doctor','nurse_practitioner','pharmacist','other'],
    primarySource: { title: 'EPIDIOLEX Product Monograph', publisher: 'Jazz Pharmaceuticals Research UK Limited', url: 'https://pp.jazzpharma.com/pi/epidiolex.ca.PM-en.pdf', sourceId: 'ca-epidiolex-pm-2024-10-30' },
    publicationDate: '2024-10-30', effectiveDate: '2023-11-15', verifiedAt: '2026-08-14T13:55:00Z', supersessionState: 'current', supersededById: null,
    reviewStatus: 'published', gradingMethodKey: 'harbourview-clinical-evidence-v1', publicationScope: 'source-metadata', freshnessStatus: 'current',
  }],
}

const clinicalStateFixtures = {
  loaded: clinicalVisualFixture,
  'no-evidence': { ...clinicalVisualFixture, state: 'no-evidence', query: 'recognized condition', records: [], changes: [], synthesis: { ...clinicalVisualFixture.synthesis, recordCount: 0, currentRecordCount: 0, regulatedDrugRecordCount: 0, ungradedRecordCount: 0, evidenceTypes: {}, lastVerifiedAt: null, summary: 'No published evidence records are available for deterministic synthesis.' }, message: 'The condition is recognized, but no reviewed evidence record is available in this evidence spine.' },
  'no-match': { ...clinicalVisualFixture, state: 'no-match', query: 'unmapped term', records: [], changes: [], synthesis: { ...clinicalVisualFixture.synthesis, recordCount: 0, currentRecordCount: 0, regulatedDrugRecordCount: 0, ungradedRecordCount: 0, evidenceTypes: {}, lastVerifiedAt: null, summary: 'No published evidence records are available for deterministic synthesis.' }, message: 'No reviewed condition or evidence record matches this search.' },
  stale: { ...clinicalVisualFixture, state: 'stale', message: 'Only stale, review-required or superseded evidence matches. Do not treat it as current guidance.', records: clinicalVisualFixture.records.map(record => ({ ...record, freshnessStatus: 'review-required', supersessionState: 'partially-superseded' })) },
  conflicted: { ...clinicalVisualFixture, state: 'conflicted', message: 'Materially conflicting evidence is present. Inspect the underlying sources before relying on a conclusion.', records: clinicalVisualFixture.records.map(record => ({ ...record, conflictStatus: 'material-conflict', evidenceStrength: 'conflicted' })), synthesis: { ...clinicalVisualFixture.synthesis, hasMaterialConflict: true } },
  'degraded-source': { ...clinicalVisualFixture, state: 'degraded-source', message: 'A source required by this evidence set is degraded or has unresolved currentness. Verify the primary source before relying on it.', records: clinicalVisualFixture.records.map(record => ({ ...record, freshnessStatus: 'source-degraded', freshnessReason: 'Source currentness could not be confirmed.' })), synthesis: { ...clinicalVisualFixture.synthesis, hasDegradedSource: true } },
  permission: { ...clinicalVisualFixture, state: 'permission', query: '', records: [], changes: [], synthesis: { ...clinicalVisualFixture.synthesis, recordCount: 0, currentRecordCount: 0, regulatedDrugRecordCount: 0, ungradedRecordCount: 0, evidenceTypes: {}, lastVerifiedAt: null, summary: 'No published evidence records are available for deterministic synthesis.' }, message: 'Clinical evidence is not available under the current access context.' },
  error: { ...clinicalVisualFixture, state: 'error', query: '', records: [], changes: [], synthesis: { ...clinicalVisualFixture.synthesis, recordCount: 0, currentRecordCount: 0, regulatedDrugRecordCount: 0, ungradedRecordCount: 0, evidenceTypes: {}, lastVerifiedAt: null, summary: 'No published evidence records are available for deterministic synthesis.' }, message: 'Clinical evidence could not be loaded. Retry before relying on this workspace.' },
} as const

test.describe('Mobile Intel authenticated evidence', () => {
  test.describe.configure({ mode: 'serial' })

  test('captures all six required Intel states from the authenticated isolated production build', async ({ browser }) => {
    test.setTimeout(360_000); await fs.mkdir(evidenceRoot, { recursive: true }); const storageState = await authenticate(browser)
    const context = await browser.newContext({ ...sharedContextOptions(), viewport: { width: 390, height: 844 }, storageState, isMobile: true, hasTouch: true })
    try {
      const page = await context.newPage()
      await openIntelState(page, 'weekly-signals', 'Weekly signals', 'intel-auth-01-weekly-signals-390x844.png')
      await openIntelState(page, 'personal-briefing', 'Personal briefing', 'intel-auth-02-personal-briefing-390x844.png')
      await openIntelState(page, 'regulatory', 'Regulatory watch', 'intel-auth-03-regulatory-watch-390x844.png')
      await openIntelState(page, 'local-intel', 'Local intelligence', 'intel-auth-04-local-intelligence-390x844.png')
      await openIntelState(page, 'search', 'Search', 'intel-auth-05-search-empty-390x844.png')
      const input = page.getByLabel('Search signals, markets, regulations, authorities, operators or actions'); await expect(input).toBeVisible(); await input.fill('Canada')
      await expect(page.locator('.hvm2-search-summary')).toContainText('matched record'); await expect(page.locator('.hvm2-search-results')).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
      await page.screenshot({ path: path.join(evidenceRoot, 'intel-auth-06-search-canada-390x844.png'), fullPage: false })
      for (const viewport of [{ width: 320, height: 568 },{ width: 375, height: 812 },{ width: 390, height: 844 },{ width: 430, height: 932 }]) {
        await page.setViewportSize(viewport); await openIntelState(page, 'search', 'Search', `intel-auth-responsive-search-${viewport.width}x${viewport.height}.png`)
        const responsiveInput = page.getByLabel('Search signals, markets, regulations, authorities, operators or actions'); await responsiveInput.fill('Canada')
        await expect(page.locator('.hvm2-search-results')).toBeVisible(); await assertMobileIntelLayout(page)
      }
      await page.setViewportSize({ width: 390, height: 844 }); await openIntelState(page, 'search', 'Search', 'intel-auth-accessibility-base-390x844.png')
      await page.addStyleTag({ content: `.hvm2-section-heading h2,.hvm-op-page-title{font-size:200%!important}.hvm2-section-heading p,.hvm2-intel-search-result>strong,.hvm2-intel-search-result>p,.hvm2-intel-search-result>small,.hvm2-search-summary,.hvm2-search-filters button,.hvm-op-secondary-nav button,.hvm-op-context-trigger>span:first-child,.hvm2-bottom-nav small{font-size:200%!important}.hvm2-intel-search-result,.hvm-op-secondary-nav button,.hvm2-search-filters button{min-height:44px;height:auto!important}` })
      const largeTextInput = page.getByLabel('Search signals, markets, regulations, authorities, operators or actions'); await largeTextInput.fill('Canada')
      await expect(page.locator('.hvm2-search-results')).toBeVisible(); await assertMobileIntelLayout(page)
      await page.screenshot({ path: path.join(evidenceRoot, 'intel-auth-accessibility-search-390x844-200pct.png'), fullPage: false })
    } finally { await context.close() }
  })

  test('captures authenticated Clinical Evidence V1 loaded and adverse states at all required mobile viewports', async ({ browser }) => {
    test.setTimeout(420_000); await fs.mkdir(evidenceRoot, { recursive: true }); const storageState = await authenticate(browser)
    for (const viewport of [{ width: 375, height: 812 },{ width: 390, height: 844 },{ width: 430, height: 932 }] as const) {
      for (const [stateName, fixture] of Object.entries(clinicalStateFixtures)) {
        const context = await browser.newContext({ ...sharedContextOptions(), viewport, storageState, isMobile: true, hasTouch: true })
        try {
          const page = await context.newPage()
          await page.route('**/api/clinical/evidence**', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixture) }))
          const response = await page.goto('/dashboard?country=CA&role=exporter&page=clinical&section=clinical', { waitUntil: 'domcontentloaded', timeout: 60_000 })
          expect(response?.status()).toBeLessThan(400); await expect(page.locator('#clinical')).toBeVisible()
          await expect(page.getByText('Professional clinical command', { exact: true })).toBeVisible()
          await expect(page.getByRole('region', { name: 'Evidence command · Canada · Exporter' })).toBeVisible()
          if (stateName !== 'loaded') await expect(page.getByText(fixture.message, { exact: true })).toBeVisible()
          await expect(page.getByText(/under the ACMPR framework/i)).toHaveCount(0)
          for (const label of ['Command','Market','Intel','Actions']) await expect(page.locator('.hvm-op-bottom-nav')).toContainText(label)
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
          if (stateName === 'loaded') {
            await expect(page.getByText('EPIDIOLEX authorized indication — Dravet syndrome', { exact: true })).toBeVisible()
            await expect(page.getByText('1 reviewed record', { exact: true })).toBeVisible()
            await expect(page.getByText('1 current · 0 graded · 1 ungraded', { exact: true })).toBeVisible()
            await expect(page.getByText(/Counts describe the reviewed corpus only; they do not infer efficacy or comparative superiority\./)).toBeVisible()
          }
          await page.screenshot({ path: path.join(evidenceRoot, `clinical-evidence-${stateName}-${viewport.width}x${viewport.height}.png`), fullPage: false })
        } finally { await context.close() }
      }
    }
  })
})
