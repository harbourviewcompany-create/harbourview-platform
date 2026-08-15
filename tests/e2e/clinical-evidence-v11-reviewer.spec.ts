import { expect, test, type Browser, type Page } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || process.env.HARBOURVIEW_PUBLIC_BASE_URL || 'http://127.0.0.1:3000'
const evidenceRoot = path.join(process.cwd(), 'artifacts', 'clinical-evidence-v1-1')

const loadedRecord = {
  id: '00000000-0000-4000-8000-000000000901',
  slug: 'ci-reviewed-regulated-cannabinoid-evidence',
  title: 'Reviewed regulated cannabinoid drug evidence fixture',
  summary: 'Deterministic CI fixture for the Clinical Command evidence presentation contract.',
  condition: 'Visual verification condition',
  conditionAliases: [],
  population: 'Adults',
  intervention: 'Regulated cannabinoid medicine',
  formulation: 'Standardized oral formulation',
  cannabinoid: ['CBD'],
  interventionClass: 'regulated-cannabinoid-drug',
  comparator: 'Standard care',
  outcome: 'Reviewed evidence outcome',
  evidenceType: 'systematic-review',
  evidenceStrength: 'moderate',
  evidenceStrengthMethod: 'GRADE',
  uncertainty: 'Fixture uncertainty is intentionally visible for presentation verification.',
  conflictStatus: 'none',
  jurisdiction: ['Canada'],
  professionRelevance: ['doctor', 'pharmacist'],
  primarySource: {
    title: 'Clinical visual fixture',
    publisher: 'Harbourview CI',
    url: 'https://example.invalid/clinical-fixture',
    sourceId: 'clinical-visual-fixture',
  },
  publicationDate: '2026-08-01',
  effectiveDate: null,
  verifiedAt: '2026-08-15T00:00:00Z',
  supersessionState: 'current',
  supersededById: null,
  reviewStatus: 'published',
  sourceRegistryId: null,
  gradingMethodKey: 'grade',
  publicationScope: 'clinical-synthesis',
  freshnessStatus: 'current',
  reviewDueAt: null,
  sourceCurrentnessCheckedAt: '2026-08-15T00:00:00Z',
  freshnessReason: null,
}

const loadedChange = {
  id: '00000000-0000-4000-8000-000000000902',
  evidenceRecordId: loadedRecord.id,
  eventType: 'updated',
  title: 'Reviewed clinical evidence changed',
  summary: 'A governed evidence record changed and requires applicability review.',
  materiality: 'high',
  jurisdiction: ['Canada'],
  professionRelevance: ['doctor', 'pharmacist'],
  occurredAt: '2026-08-15T00:00:00Z',
  verifiedAt: '2026-08-15T00:00:00Z',
  primarySource: loadedRecord.primarySource,
}

function synthesis(overrides: Record<string, unknown> = {}) {
  return {
    recordCount: 1,
    currentRecordCount: 1,
    gradedRecordCount: 1,
    ungradedRecordCount: 0,
    regulatedDrugRecordCount: 1,
    generalCannabisRecordCount: 0,
    hasMaterialConflict: false,
    ...overrides,
  }
}

function result(state: string, overrides: Record<string, unknown> = {}) {
  return {
    state,
    query: '',
    records: state === 'permission' || state === 'error' || state === 'no-match' ? [] : [loadedRecord],
    changes: state === 'permission' || state === 'error' ? [] : [loadedChange],
    message: state === 'loaded'
      ? 'Reviewed clinical evidence loaded.'
      : state === 'no-match'
        ? 'No reviewed evidence matched this search.'
        : state === 'stale'
          ? 'Matching evidence requires currentness review.'
          : state === 'conflicted'
            ? 'Published evidence contains a material conflict requiring review.'
            : state === 'permission'
              ? 'Clinical evidence is not available to this access context.'
              : 'Clinical evidence could not be loaded. Retry before relying on this workspace.',
    synthesis: synthesis(state === 'conflicted' ? { hasMaterialConflict: true } : {}),
    ...overrides,
  }
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

async function gotoClinical(page: Page) {
  const response = await page.goto(`${BASE_URL}/dashboard?country=CA&page=clinical&section=clinical`, { waitUntil: 'domcontentloaded' })
  expect(response?.status()).toBeLessThan(400)
  await expect(page.locator('#clinical')).toBeVisible()
  await expect(page.locator('.hvc-statusbar')).toBeVisible()
  await expect(page.locator('.hvc-statusbar strong')).toContainText('Evidence command · Canada · All roles')
}

async function assertPrimaryActionClearsBottomNav(page: Page) {
  const action = page.locator('.hvc-search-row button')
  const nav = page.locator('.hvm-op-bottom-nav')
  await action.scrollIntoViewIfNeeded()
  await expect(action).toBeVisible()
  await expect(nav).toBeVisible()
  const actionBox = await action.boundingBox()
  const navBox = await nav.boundingBox()
  expect(actionBox).not.toBeNull()
  expect(navBox).not.toBeNull()
  if (!actionBox || !navBox) return
  expect(
    actionBox.y + actionBox.height,
    `Clinical primary action overlaps fixed bottom navigation: actionBottom=${actionBox.y + actionBox.height} navTop=${navBox.y}`,
  ).toBeLessThanOrEqual(navBox.y - 4)
}

test('authenticated Clinical reviewer can inspect governed queues and source provenance', async ({ browser }) => {
  test.setTimeout(180_000)
  const email = process.env.E2E_TEST_USER_EMAIL
  const password = process.env.E2E_TEST_USER_PASSWORD
  if (!email || !password) throw new Error('E2E_TEST_USER_EMAIL and E2E_TEST_USER_PASSWORD are required')
  await fs.mkdir(evidenceRoot, { recursive: true })

  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } })
  const page = await context.newPage()
  await page.goto(`${BASE_URL}/login?next=%2Fclinical%2Freview`, { waitUntil: 'domcontentloaded' })
  await page.getByLabel('Email address', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.locator('form').getByRole('button', { name: 'Sign in', exact: true }).click()
  await page.waitForURL(url => url.pathname === '/clinical/review', { timeout: 45_000 })

  await expect(page.getByRole('heading', { name: 'Clinical Evidence V1.1 Workbench' })).toBeVisible()
  await expect(page.getByText('Evidence operations queue', { exact: true })).toBeVisible()
  await expect(page.getByText('Freshness queue', { exact: true })).toBeVisible()
  await expect(page.getByText(/Living Systematic Review on Cannabis and Other Plant-Based Treatments for Chronic Pain/i)).toBeVisible()
  await expect(page.getByText(/source identification never implies a clinical conclusion or grade/i)).toBeVisible()
  await expect(page.getByText('9. Publication / supersession', { exact: true })).toBeVisible()
  await page.screenshot({ path: path.join(evidenceRoot, 'clinical-v1-1-reviewer-workbench-1440x1100.png'), fullPage: true })

  const sourceId = process.env.E2E_CLINICAL_SOURCE_ID
  if (!sourceId) throw new Error('E2E_CLINICAL_SOURCE_ID is required')
  await page.goto(`${BASE_URL}/clinical/review/source/${sourceId}`, { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: /Living Systematic Review on Cannabis and Other Plant-Based Treatments for Chronic Pain/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Side-by-side source inspection' })).toBeVisible()
  await expect(page.getByText('No immutable snapshot captured yet. The source remains in the snapshot-required queue.')).toBeVisible()
  await expect(page.getByText('No structured extraction exists yet. No evidence claim should progress to review from this source.')).toBeVisible()
  await page.screenshot({ path: path.join(evidenceRoot, 'clinical-v1-1-source-inspection-1440x1100.png'), fullPage: true })

  await context.close()
})

test('Clinical Command loaded state is usable at required mobile viewports', async ({ browser }) => {
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
      await page.route('**/api/clinical/evidence**', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(result('loaded')) }))
      await gotoClinical(page)
      await expect(page.locator('.hvc-state')).toHaveText('Current')
      await expect(page.getByText('Reviewed clinical evidence changed', { exact: true })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Search the governed evidence corpus' })).toBeVisible()
      await assertPrimaryActionClearsBottomNav(page)
      await page.screenshot({
        path: path.join(evidenceRoot, `clinical-command-loaded-${viewport.width}x${viewport.height}.png`),
        fullPage: false,
      })
    } finally {
      await context.close()
    }
  }
})

test('Clinical Command distinguishes no-match from infrastructure failure', async ({ browser }) => {
  test.setTimeout(180_000)
  await fs.mkdir(evidenceRoot, { recursive: true })
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
        body: JSON.stringify(query ? result('no-match', { query }) : result('loaded')),
      })
    })
    await gotoClinical(page)
    await page.getByLabel('Condition, formulation or clinical evidence question').fill('Headache')
    await page.getByRole('button', { name: 'Search evidence', exact: true }).click()
    await expect(page.locator('.hvc-state')).toHaveText('No match')
    await expect(page.locator('.hvc-state-panel').getByText('No reviewed evidence matched this search.', { exact: true })).toBeVisible()
    await page.screenshot({ path: path.join(evidenceRoot, 'clinical-command-no-match-390x844.png'), fullPage: false })
  } finally {
    await context.close()
  }
})

test('Clinical Command exposes stale and conflicting evidence as distinct states', async ({ browser }) => {
  test.setTimeout(180_000)
  await fs.mkdir(evidenceRoot, { recursive: true })
  const storageState = await authenticate(browser)

  for (const scenario of ['stale', 'conflicted'] as const) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, storageState, isMobile: true, hasTouch: true })
    try {
      const page = await context.newPage()
      const record = scenario === 'stale'
        ? { ...loadedRecord, freshnessStatus: 'stale', freshnessReason: 'Fixture source requires currentness review.' }
        : { ...loadedRecord, evidenceStrength: 'conflicted', conflictStatus: 'material-conflict' }
      await page.route('**/api/clinical/evidence**', route => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(result(scenario, {
          records: [record],
          synthesis: synthesis(scenario === 'conflicted' ? { hasMaterialConflict: true } : {}),
        })),
      }))
      await gotoClinical(page)
      await expect(page.locator('.hvc-state')).toHaveText(scenario === 'stale' ? 'Stale / review required' : 'Conflicting evidence')
      await page.screenshot({ path: path.join(evidenceRoot, `clinical-command-${scenario}-390x844.png`), fullPage: false })
    } finally {
      await context.close()
    }
  }
})

test('Clinical Command exposes permission state without masquerading as no evidence', async ({ browser }) => {
  test.setTimeout(180_000)
  await fs.mkdir(evidenceRoot, { recursive: true })
  const storageState = await authenticate(browser)
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, storageState, isMobile: true, hasTouch: true })
  try {
    const page = await context.newPage()
    await page.route('**/api/clinical/evidence**', route => route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify(result('permission')) }))
    await gotoClinical(page)
    await expect(page.locator('.hvc-state')).toHaveText('Restricted')
    await expect(page.locator('.hvc-state-panel').getByText('Clinical evidence is not available to this access context.', { exact: true })).toBeVisible()
    await page.screenshot({ path: path.join(evidenceRoot, 'clinical-command-permission-390x844.png'), fullPage: false })
  } finally {
    await context.close()
  }
})

test('Clinical Command retries a failed evidence request and recovers to loaded', async ({ browser }) => {
  test.setTimeout(180_000)
  await fs.mkdir(evidenceRoot, { recursive: true })
  const storageState = await authenticate(browser)
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, storageState, isMobile: true, hasTouch: true })
  try {
    const page = await context.newPage()
    let calls = 0
    await page.route('**/api/clinical/evidence**', route => {
      calls += 1
      const payload = calls === 1
        ? result('error', { diagnostic: { category: 'upstream', retryable: true, httpStatus: 503 } })
        : result('loaded')
      return route.fulfill({ status: calls === 1 ? 503 : 200, contentType: 'application/json', body: JSON.stringify(payload) })
    })
    await gotoClinical(page)
    await expect(page.locator('.hvc-state')).toHaveText('Unavailable')
    await expect(page.getByRole('button', { name: 'Retry evidence service', exact: true })).toBeVisible()
    await page.screenshot({ path: path.join(evidenceRoot, 'clinical-command-error-390x844.png'), fullPage: false })
    await page.getByRole('button', { name: 'Retry evidence service', exact: true }).click()
    await expect(page.locator('.hvc-state')).toHaveText('Current')
    await expect(page.getByText('Reviewed clinical evidence changed', { exact: true })).toBeVisible()
    expect(calls).toBeGreaterThanOrEqual(2)
    await page.screenshot({ path: path.join(evidenceRoot, 'clinical-command-retry-success-390x844.png'), fullPage: false })
  } finally {
    await context.close()
  }
})