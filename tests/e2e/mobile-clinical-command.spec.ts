import { expect, test, type Browser, type BrowserContextOptions, type Page, type Route } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'

const BASE_URL = process.env.HARBOURVIEW_PUBLIC_BASE_URL || process.env.PLAYWRIGHT_BASE_URL
const BYPASS_TOKEN = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
const evidenceRoot = path.join(process.cwd(), 'artifacts', 'mobile-clinical')

const REQUIRED_VIEWPORTS = [
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
] as const

type EvidenceMode = 'loaded' | 'no-match' | 'stale' | 'permission' | 'error'

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
    const submit = page.locator('form').getByRole('button', { name: 'Sign in', exact: true })
    await expect(submit).toBeEnabled()
    await submit.click()
    await page.waitForURL(url => url.pathname.startsWith('/dashboard'), { timeout: 45_000 })
    return await context.storageState()
  } finally {
    await context.close()
  }
}

function responseFor(mode: EvidenceMode, query = '') {
  if (mode === 'loaded') {
    return {
      state: 'loaded',
      query,
      records: [],
      changes: [],
      message: query ? 'Reviewed evidence search completed.' : 'Reviewed evidence workspace is ready.',
    }
  }
  if (mode === 'no-match') {
    return {
      state: 'no-match',
      query,
      records: [],
      changes: [],
      message: 'No reviewed evidence matched the submitted question.',
    }
  }
  if (mode === 'stale') {
    return {
      state: 'stale',
      query,
      records: [],
      changes: [],
      message: 'Only stale or review-required evidence is available for this context.',
    }
  }
  if (mode === 'permission') {
    return {
      state: 'permission',
      query,
      records: [],
      changes: [],
      message: 'Clinical evidence is not available to this access context.',
      diagnostic: { category: 'permission', retryable: false, httpStatus: 403 },
    }
  }
  return {
    state: 'error',
    query,
    records: [],
    changes: [],
    message: 'Clinical evidence could not be loaded. Retry before relying on this workspace.',
    diagnostic: { category: 'upstream', retryable: true, httpStatus: 503 },
  }
}

async function installEvidenceMock(page: Page, getMode: () => EvidenceMode) {
  await page.route('**/api/clinical/evidence**', async (route: Route) => {
    const url = new URL(route.request().url())
    const query = url.searchParams.get('q') ?? ''
    const mode = query && getMode() === 'loaded' ? 'loaded' : getMode()
    await route.fulfill({
      status: mode === 'permission' ? 403 : mode === 'error' ? 503 : 200,
      contentType: 'application/json',
      body: JSON.stringify(responseFor(mode, query)),
    })
  })
}

async function assertNoHorizontalOverflow(page: Page, label: string) {
  const geometry = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  expect(geometry.scrollWidth, `${label}: document has horizontal overflow`).toBeLessThanOrEqual(geometry.clientWidth)
}

async function assertClinicalCommandMobileContract(page: Page, width: number) {
  await expect(page.locator('#clinical')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Clinical command', exact: true })).toBeVisible()
  await expect(page.locator('#clinical [data-clinical-workspace="true"]')).toHaveCount(0)
  await expect(page.locator('#clinical').getByText('Open Clinical workspace →', { exact: true })).toBeVisible()
  await expect(page.locator('#clinical').getByText('Professional requirements', { exact: true })).toBeVisible()
  await expect(page.locator('#clinical').getByText('All roles', { exact: true })).toHaveCount(0)
  await expect(page.locator('#clinical').getByText('EvidenceSafetyInteractionsFormulationsGuidelinesPracticeMonitoring', { exact: true })).toHaveCount(0)
  await expect(page.locator('#clinical').getByText('0 reviewed records', { exact: true })).toHaveCount(0)

  const cards = page.locator('#clinical .hvc-command-summary > .hvc-command-card')
  expect(await cards.count()).toBeGreaterThanOrEqual(8)
  const first = await cards.nth(0).boundingBox()
  const second = await cards.nth(1).boundingBox()
  expect(first).not.toBeNull()
  expect(second).not.toBeNull()
  if (first && second) {
    expect(Math.abs(first.x - second.x), `Clinical cards are not one-column at ${width}px`).toBeLessThanOrEqual(1)
    expect(first.width, `Clinical card is pathologically narrow at ${width}px`).toBeGreaterThan(width * 0.78)
    expect(second.width, `Clinical card is pathologically narrow at ${width}px`).toBeGreaterThan(width * 0.78)
  }

  const rail = page.locator('.hvm-op-secondary-nav')
  const clinicalTab = rail.getByText('Clinical', { exact: true })
  await clinicalTab.scrollIntoViewIfNeeded()
  await expect(clinicalTab).toBeInViewport()
  const clinicalBox = await clinicalTab.boundingBox()
  expect(clinicalBox).not.toBeNull()
  if (clinicalBox) {
    expect(clinicalBox.x).toBeGreaterThanOrEqual(0)
    expect(clinicalBox.x + clinicalBox.width).toBeLessThanOrEqual(width)
  }

  const main = page.locator('.hvm-op-main')
  await main.evaluate(element => { element.scrollTop = element.scrollHeight })
  const lastCard = await cards.last().boundingBox()
  const bottomNav = await page.locator('.hvm-op-bottom-nav').boundingBox()
  expect(lastCard).not.toBeNull()
  expect(bottomNav).not.toBeNull()
  if (lastCard && bottomNav) {
    expect(lastCard.y + lastCard.height, 'Clinical content is hidden behind the fixed bottom navigation').toBeLessThanOrEqual(bottomNav.y + 1)
  }

  await assertNoHorizontalOverflow(page, `Clinical Command ${width}px`)
}

async function gotoClinicalCommand(page: Page) {
  const response = await page.goto('/dashboard?country=CA&page=clinical&section=clinical', { waitUntil: 'domcontentloaded' })
  expect(response?.status()).toBeLessThan(400)
  await expect(page.locator('[data-mobile-command-version="2"]')).toBeVisible()
  await expect(page.locator('#clinical')).toBeVisible()
}

async function gotoWorkspace(page: Page) {
  const response = await page.goto('/dashboard/clinical?country=CA', { waitUntil: 'domcontentloaded' })
  expect(response?.status()).toBeLessThan(400)
  await expect(page.locator('[data-clinical-workspace="true"]')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Evidence command · Canada', exact: true })).toBeVisible()
}

test.describe('Clinical mobile presentation architecture', () => {
  test.describe.configure({ mode: 'serial' })

  test('keeps Command Clinical concise and one-column at all required mobile viewports', async ({ browser }) => {
    test.setTimeout(420_000)
    await fs.mkdir(evidenceRoot, { recursive: true })
    const storageState = await authenticate(browser)

    for (const viewport of REQUIRED_VIEWPORTS) {
      const context = await browser.newContext({
        ...contextOptions(),
        viewport,
        storageState,
        isMobile: true,
        hasTouch: true,
      })
      try {
        const page = await context.newPage()
        await gotoClinicalCommand(page)
        await assertClinicalCommandMobileContract(page, viewport.width)
        await page.screenshot({
          path: path.join(evidenceRoot, `${viewport.width}x${viewport.height}-clinical-command.png`),
          fullPage: false,
        })
      } finally {
        await context.close()
      }
    }
  })

  test('renders the complete workspace as styled, separated controls with a Ready empty-query state', async ({ browser }) => {
    test.setTimeout(240_000)
    await fs.mkdir(evidenceRoot, { recursive: true })
    const storageState = await authenticate(browser)

    for (const viewport of REQUIRED_VIEWPORTS) {
      const context = await browser.newContext({ ...contextOptions(), viewport, storageState, isMobile: true, hasTouch: true })
      try {
        const page = await context.newPage()
        let mode: EvidenceMode = 'loaded'
        await installEvidenceMock(page, () => mode)
        await gotoWorkspace(page)
        await expect(page.locator('.hvc-results-head')).toContainText('Ready')
        await expect(page.getByText('0 reviewed records', { exact: true })).toHaveCount(0)
        await expect(page.getByText('Enter a condition, formulation, cannabinoid or clinical question to search reviewed evidence.', { exact: true })).toBeVisible()

        const lanes = page.locator('.hvc-lanes .hvc-lane')
        await expect(lanes).toHaveCount(7)
        for (const label of ['Evidence', 'Safety', 'Interactions', 'Formulations', 'Guidelines', 'Practice', 'Monitoring']) {
          await expect(page.locator('.hvc-lanes').getByRole('button', { name: label, exact: true })).toBeVisible()
        }
        const laneLayout = await page.locator('.hvc-lanes').evaluate(element => {
          const style = getComputedStyle(element)
          const buttons = [...element.querySelectorAll('button')].map(button => getComputedStyle(button).whiteSpace)
          return { display: style.display, overflowX: style.overflowX, buttonWhiteSpace: buttons }
        })
        expect(laneLayout.display).toBe('flex')
        expect(['auto', 'scroll']).toContain(laneLayout.overflowX)
        expect(laneLayout.buttonWhiteSpace.every(value => value === 'nowrap')).toBe(true)
        await assertNoHorizontalOverflow(page, `Clinical workspace ${viewport.width}px`)

        await page.screenshot({
          path: path.join(evidenceRoot, `${viewport.width}x${viewport.height}-workspace-empty-query.png`),
          fullPage: false,
        })
        mode = 'loaded'
      } finally {
        await context.close()
      }
    }
  })

  test('separates submitted zero-result, stale, permission and retryable error states', async ({ browser }) => {
    test.setTimeout(300_000)
    await fs.mkdir(evidenceRoot, { recursive: true })
    const storageState = await authenticate(browser)

    for (const state of ['no-match', 'stale', 'permission', 'error'] as const) {
      const context = await browser.newContext({
        ...contextOptions(),
        viewport: { width: 390, height: 844 },
        storageState,
        isMobile: true,
        hasTouch: true,
      })
      try {
        const page = await context.newPage()
        let mode: EvidenceMode = state === 'no-match' ? 'loaded' : state
        await installEvidenceMock(page, () => mode)
        await gotoWorkspace(page)

        if (state === 'no-match') {
          mode = 'no-match'
          await page.getByRole('search').getByRole('searchbox').fill('unmatched clinical concept')
          await page.getByRole('search').getByRole('button', { name: 'Search evidence' }).click()
          await expect(page.locator('.hvc-results-head')).toContainText('0 reviewed records')
          await expect(page.getByText('No match', { exact: true }).first()).toBeVisible()
        } else if (state === 'stale') {
          await expect(page.getByText('Currentness requires review', { exact: true })).toBeVisible()
        } else if (state === 'permission') {
          await expect(page.getByText('Access restricted', { exact: true })).toBeVisible()
        } else {
          const retry = page.getByRole('button', { name: 'Retry evidence service', exact: true })
          await expect(retry).toBeVisible()
          await page.screenshot({ path: path.join(evidenceRoot, '390x844-workspace-error-retry.png'), fullPage: false })
          mode = 'loaded'
          await retry.click()
          await expect(page.locator('.hvc-statusbar')).toContainText('Current')
        }

        await assertNoHorizontalOverflow(page, `Clinical workspace ${state}`)
        await page.screenshot({
          path: path.join(evidenceRoot, `390x844-workspace-${state}${state === 'error' ? '-recovered' : ''}.png`),
          fullPage: false,
        })
      } finally {
        await context.close()
      }
    }
  })
})
