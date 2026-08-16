import { expect, test, type Browser } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || process.env.HARBOURVIEW_PUBLIC_BASE_URL || 'http://127.0.0.1:3000'
const evidenceRoot = path.join(process.cwd(), 'artifacts', 'clinical-evidence-operating-system')

const corpus = {
  recordCount: 7,
  currentRecordCount: 7,
  gradedRecordCount: 2,
  conditionCount: 4,
  conceptCount: 4,
  sourceCount: 6,
  independentStudyCount: 0,
  studyFamilyCount: 0,
  claimCount: 0,
  claimAnchoredRecordCount: 0,
  lastVerifiedAt: '2026-08-16T14:00:00Z',
  gradingMethodKey: 'harbourview-clinical-evidence-v1',
  gradingMethodVersion: '1.0.0',
  gradingMethodTitle: 'Harbourview Clinical Evidence V1',
}

const resolution = {
  normalizedQuery: 'dravet',
  recognized: true,
  canonicalLabel: 'Dravet syndrome',
  conceptMatches: [{
    conceptId: '00000000-0000-4000-8000-000000000801',
    conceptType: 'condition',
    canonicalLabel: 'Dravet syndrome',
    matchedLabel: 'Dravet syndrome',
    matchKind: 'prefix-canonical',
    matchRank: 2,
    aliases: ['DS', 'SMEI', 'Severe myoclonic epilepsy of infancy'],
  }],
  expandedTerms: ['Dravet syndrome', 'DS', 'SMEI', 'Severe myoclonic epilepsy of infancy'],
}

const baseResult = {
  state: 'empty',
  query: '',
  records: [],
  changes: [],
  message: 'Enter a condition or clinical question to search reviewed evidence.',
  synthesis: {
    recordCount: 0,
    currentRecordCount: 0,
    gradedRecordCount: 0,
    ungradedRecordCount: 0,
    regulatedDrugRecordCount: 0,
    generalCannabisRecordCount: 0,
    evidenceTypes: {},
    hasMaterialConflict: false,
    hasDegradedSource: false,
    lastVerifiedAt: null,
    independentStudyCount: null,
    studyFamilyCount: 0,
    claimCount: 0,
    claimAnchoredRecordCount: 0,
    summary: 'No published evidence records are available for deterministic synthesis.',
  },
  corpus,
}

const dravetRecord = {
  id: '00000000-0000-4000-8000-000000000901',
  slug: 'ca-epidiolex-dravet-indication',
  title: 'EPIDIOLEX authorized indication — Dravet syndrome',
  summary: 'The Canadian product monograph identifies EPIDIOLEX as adjunctive therapy for seizures associated with Dravet syndrome in patients 2 years of age and older. This is regulatory product-indication metadata, not an independent Harbourview efficacy recommendation.',
  condition: 'Dravet syndrome',
  conditionAliases: ['DS'],
  population: 'Patients 2 years of age and older with seizures associated with Dravet syndrome',
  intervention: 'Cannabidiol (EPIDIOLEX)',
  formulation: 'Oral solution 100 mg/mL',
  cannabinoid: ['CBD'],
  interventionClass: 'regulated-cannabinoid-drug',
  comparator: null,
  outcome: 'Authorized indication metadata; no comparative conclusion is asserted.',
  evidenceType: 'product-monograph',
  evidenceDomain: 'regulatory',
  evidenceStrength: 'ungraded',
  evidenceStrengthMethod: 'Harbourview Clinical Evidence V1',
  uncertainty: 'Product-monograph authorization does not establish comparative superiority or substitute for patient-specific clinical judgment.',
  conflictStatus: 'none',
  jurisdiction: ['Canada'],
  professionRelevance: [],
  primarySource: {
    title: 'EPIDIOLEX Product Monograph',
    publisher: 'Jazz Pharmaceuticals Research UK Limited',
    url: 'https://pp.jazzpharma.com/pi/epidiolex.ca.PM-en.pdf',
    sourceId: '02543079',
  },
  publicationDate: '2024-10-30',
  effectiveDate: '2023-11-15',
  verifiedAt: '2026-08-14T13:45:00Z',
  supersessionState: 'current',
  supersededById: null,
  reviewStatus: 'published',
  freshnessStatus: 'current',
  claims: [],
  studyFamilies: [],
}

const dravetLoaded = {
  ...baseResult,
  state: 'loaded',
  query: 'Dravet',
  records: [dravetRecord],
  message: 'Reviewed evidence records match this clinical question.',
  synthesis: {
    recordCount: 1,
    currentRecordCount: 1,
    gradedRecordCount: 0,
    ungradedRecordCount: 1,
    regulatedDrugRecordCount: 1,
    generalCannabisRecordCount: 0,
    evidenceTypes: { 'product-monograph': 1 },
    hasMaterialConflict: false,
    hasDegradedSource: false,
    lastVerifiedAt: '2026-08-14T13:45:00Z',
    independentStudyCount: null,
    studyFamilyCount: 0,
    claimCount: 0,
    claimAnchoredRecordCount: 0,
    summary: '1 published source record; 0 clinically graded and 1 ungraded. This count summary does not infer efficacy or comparative superiority.',
  },
  resolution,
}

const dravetNoEvidence = {
  ...baseResult,
  state: 'no-evidence',
  query: 'Dravet',
  message: 'The condition is recognized, but no reviewed evidence record is available in this evidence spine.',
  resolution,
}

async function authenticate(browser: Browser) {
  const email = process.env.E2E_TEST_USER_EMAIL
  const password = process.env.E2E_TEST_USER_PASSWORD
  if (!email || !password) throw new Error('E2E_TEST_USER_EMAIL and E2E_TEST_USER_PASSWORD are required')
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  try {
    const page = await context.newPage()
    await page.goto(`${BASE_URL}/login?next=%2Fdashboard`, { waitUntil: 'domcontentloaded' })
    await page.getByLabel('Email address', { exact: true }).fill(email)
    await page.getByLabel('Password', { exact: true }).fill(password)
    await page.locator('form').getByRole('button', { name: 'Sign in', exact: true }).click()
    await page.waitForURL(url => url.pathname.startsWith('/dashboard'), { timeout: 45_000 })
    return context.storageState()
  } finally {
    await context.close()
  }
}

test('Dravet resolves to the governed Dravet syndrome concept and loads the current reviewed corpus record at required mobile viewports', async ({ browser }) => {
  test.setTimeout(240_000)
  await fs.mkdir(evidenceRoot, { recursive: true })
  const storageState = await authenticate(browser)

  for (const viewport of [
    { width: 375, height: 812 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
  ]) {
    const context = await browser.newContext({ viewport, storageState, isMobile: true, hasTouch: true })
    try {
      const page = await context.newPage()
      await page.route('**/api/clinical/evidence**', route => {
        const url = new URL(route.request().url())
        const query = url.searchParams.get('q') ?? ''
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(query.toLocaleLowerCase() === 'dravet' ? dravetLoaded : baseResult),
        })
      })

      const response = await page.goto(`${BASE_URL}/dashboard?country=CA&page=clinical&section=clinical`, { waitUntil: 'domcontentloaded' })
      expect(response?.status()).toBeLessThan(400)
      await expect(page.locator('#clinical')).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Search the governed evidence corpus' })).toBeVisible()
      await expect(page.getByTestId('clinical-corpus-profile')).toBeVisible()

      await page.getByLabel('Condition, formulation or clinical evidence question').fill('Dravet')
      await page.getByRole('button', { name: 'Search evidence', exact: true }).click()

      await expect(page.locator('.hvc-state')).toHaveText('Current')
      await expect(page.locator('.hvc-resolution > strong')).toHaveText('Dravet syndrome')
      await expect(page.locator('.hvc-resolution').getByText('SMEI', { exact: true })).toBeVisible()
      await expect(page.getByText('EPIDIOLEX authorized indication — Dravet syndrome', { exact: true })).toBeVisible()
      await expect(page.getByText(/1 current · 0 graded · 1 ungraded/i)).toBeVisible()

      const nav = page.locator('.hvm-op-bottom-nav')
      const record = page.locator('.hvc-record').filter({ hasText: 'EPIDIOLEX authorized indication — Dravet syndrome' })
      await record.scrollIntoViewIfNeeded()
      const navBox = await nav.boundingBox()
      const recordBox = await record.boundingBox()
      if (navBox && recordBox) {
        expect(recordBox.y).toBeLessThan(navBox.y)
      }

      await page.screenshot({
        path: path.join(evidenceRoot, `clinical-os-dravet-${viewport.width}x${viewport.height}.png`),
        fullPage: false,
      })
    } finally {
      await context.close()
    }
  }
})

test('recognized concept with no eligible record has explicit zero-result recovery instead of collapsing to no-match', async ({ browser }) => {
  test.setTimeout(120_000)
  const storageState = await authenticate(browser)
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, storageState, isMobile: true, hasTouch: true })
  try {
    const page = await context.newPage()
    await page.route('**/api/clinical/evidence**', route => {
      const url = new URL(route.request().url())
      const query = url.searchParams.get('q') ?? ''
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(query.toLocaleLowerCase() === 'dravet' ? dravetNoEvidence : baseResult),
      })
    })

    await page.goto(`${BASE_URL}/dashboard?country=CA&page=clinical&section=clinical`, { waitUntil: 'domcontentloaded' })
    await page.getByLabel('Condition, formulation or clinical evidence question').fill('Dravet')
    await page.getByRole('button', { name: 'Search evidence', exact: true }).click()

    await expect(page.locator('.hvc-state')).toHaveText('No reviewed evidence')
    await expect(page.locator('.hvc-resolution > strong')).toHaveText('Dravet syndrome')
    await expect(page.locator('.hvc-state-panel').getByText(/zero result means no eligible reviewed record/i)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Search canonical term', exact: true })).toBeVisible()
  } finally {
    await context.close()
  }
})
