import { expect, test, type Browser, type BrowserContextOptions, type Page } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'

const BASE_URL = process.env.HARBOURVIEW_PUBLIC_BASE_URL || process.env.PLAYWRIGHT_BASE_URL
const evidenceRoot = path.join(process.cwd(), 'artifacts', 'clinical-prescriber-os-reconciliation')

const VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 393, height: 852 },
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

function workspaceBody(state: 'loaded' | 'review-required' | 'permission' | 'error' = 'review-required') {
  return {
    state,
    jurisdiction: 'CA',
    safety: [],
    regimens: [],
    monitoring: [],
    guidelines: [],
    interactions: [],
    interactionState: state === 'review-required' ? 'review-required' : 'empty',
    interactionProvenanceRejected: state === 'review-required' ? 5 : 0,
    formulary: [],
    authority: {
      state: state === 'permission' ? 'permission' : 'unknown',
      verifiedClinician: false,
      jurisdiction: 'CA',
      professional: null,
      capabilities: { recommend: null, prescribe: null, dispense: null, claimAppropriateness: null },
      evidenceVersion: null,
      effectiveFrom: null,
      effectiveTo: null,
      notes: state === 'permission' ? 'Verified clinician access required.' : 'Professional authority intentionally unresolved in visual fixture.',
      ...(state === 'error' ? { error: 'Visual fixture: Clinical source unavailable.' } : {}),
    },
    diagnostics: state === 'review-required'
      ? ['5 interaction record(s) withheld pending inspectable provenance.']
      : state === 'error'
        ? ['Visual fixture: Clinical source unavailable.']
        : [],
  }
}

async function mockClinicalApis(page: Page, workspaceState: 'loaded' | 'review-required' | 'permission' | 'error' = 'review-required') {
  await page.route('**/api/clinical/workspace?**', async route => {
    await route.fulfill({
      status: workspaceState === 'permission' ? 403 : workspaceState === 'error' ? 503 : 200,
      contentType: 'application/json',
      body: JSON.stringify(workspaceBody(workspaceState)),
    })
  })

  await page.route('**/api/clinical/patients', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ patients: [] }) })
  })

  await page.route('**/api/clinical/ask?**', async route => {
    const requestUrl = new URL(route.request().url())
    const question = requestUrl.searchParams.get('q') ?? ''
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        state: 'no-match',
        question,
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

/** Clinical is in-shell only inside Command. */
async function assertClinicalWorkspaceInCommand(page: Page) {
  const commandSurface = page.getByTestId('clinical-mobile-decision-surface')
  await expect(commandSurface).toBeVisible({ timeout: 30_000 })
  await expect(page.getByTestId('clinical-workspace')).toBeVisible({ timeout: 30_000 })
  await expect(page.getByTestId('clinical-workspace-search')).toBeVisible()
  await expect(page.getByRole('link', { name: /Open Clinical workspace/i })).toHaveCount(0)
  await expect(page.getByRole('link', { name: /← Command Clinical/i })).toHaveCount(0)
  await expect(page.getByText(/Top graded/i)).toHaveCount(0)
  await assertNoHorizontalPageOverflow(page)
}

test.describe('Clinical Prescriber OS reconciled mobile hierarchy', () => {
  test.describe.configure({ mode: 'serial' })

  test('captures Command Clinical workspace (in-shell) at every required mobile viewport', async ({ browser }) => {
    test.setTimeout(480_000)
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
        await mockClinicalApis(page, 'review-required')
        const response = await page.goto('/dashboard?country=CA&role=physician&page=clinical&section=clinical', { waitUntil: 'domcontentloaded' })
        expect(response?.status()).toBeLessThan(400)
        await assertClinicalWorkspaceInCommand(page)

        await page.screenshot({
          path: path.join(evidenceRoot, `${viewport.width}x${viewport.height}-clinical-workspace-decision.png`),
          fullPage: false,
        })

        const requiredTabs = ['Decision', 'Evidence', 'Safety', 'Products', 'Regimen', 'Monitoring', 'Guidelines', 'Documentation', 'History']
        for (const label of requiredTabs) {
          await expect(page.getByRole('button', { name: label, exact: true })).toBeAttached()
        }
        await assertNoHorizontalPageOverflow(page)

        await page.getByRole('button', { name: 'Evidence', exact: true }).click()
        await expect(page.getByText('Awaiting explicit query', { exact: true })).toBeVisible()
        await expect(page.getByRole('link', { name: /Inspect primary source/i })).toHaveCount(0)
        const question = page.getByLabel('Clinical evidence question', { exact: true })
        await question.fill('Dravet syndrome')
        await page.getByRole('button', { name: 'Search evidence', exact: true }).click()
        await expect(page.getByText('No governed evidence matched this question.', { exact: true })).toBeVisible()
        await assertNoHorizontalPageOverflow(page)

        if (viewport.width === 390) {
          await page.screenshot({
            path: path.join(evidenceRoot, '390x844-clinical-explicit-no-match.png'),
            fullPage: false,
          })
        }
      } finally {
        await context.close()
      }
    }
  })

  test('shows unresolved jurisdiction instead of substituting a country', async ({ browser }) => {
    const storageState = await authenticate(browser)
    const context = await browser.newContext({ ...sharedContextOptions(), viewport: { width: 390, height: 844 }, storageState, isMobile: true, hasTouch: true })
    try {
      const page = await context.newPage()
      // Legacy path redirects into Command Clinical section
      const response = await page.goto('/dashboard/clinical', { waitUntil: 'domcontentloaded' })
      expect(response?.status()).toBeLessThan(400)
      await page.waitForURL(url => url.pathname === '/dashboard' && url.searchParams.get('section') === 'clinical')
      await expect(page.getByTestId('clinical-mobile-context-required')).toBeVisible()
      await expect(page.getByText('Jurisdiction required', { exact: true })).toBeVisible()
      await expect(page.getByText(/will not silently use Brazil/i)).toBeVisible()
      await assertNoHorizontalPageOverflow(page)
      await page.screenshot({ path: path.join(evidenceRoot, '390x844-clinical-jurisdiction-required.png'), fullPage: false })
    } finally {
      await context.close()
    }
  })

  for (const state of ['permission', 'error'] as const) {
    test(`renders ${state} as an explicit Clinical workspace state`, async ({ browser }) => {
      const storageState = await authenticate(browser)
      const context = await browser.newContext({ ...sharedContextOptions(), viewport: { width: 390, height: 844 }, storageState, isMobile: true, hasTouch: true })
      try {
        const page = await context.newPage()
        await mockClinicalApis(page, state)
        await page.goto('/dashboard?country=CA&role=physician&page=clinical&section=clinical', { waitUntil: 'domcontentloaded' })
        await expect(page.getByTestId('clinical-workspace')).toBeVisible()
        if (state === 'error') await expect(page.getByRole('alert')).toBeVisible()
        if (state === 'permission') await expect(page.getByText(/permission|verified clinician/i).first()).toBeVisible()
        await assertNoHorizontalPageOverflow(page)
      } finally {
        await context.close()
      }
    })
  }
})
