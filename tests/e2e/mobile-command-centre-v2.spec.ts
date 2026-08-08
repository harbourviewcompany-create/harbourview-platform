import { expect, test, type Browser, type BrowserContextOptions, type Page } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'

const BASE_URL = process.env.HARBOURVIEW_PUBLIC_BASE_URL || process.env.PLAYWRIGHT_BASE_URL
const BYPASS_TOKEN = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
const evidenceRoot = path.join(process.cwd(), 'artifacts', 'mobile-command-v2')

const MOBILE_VIEWPORTS = [
  { width: 320, height: 700, file: '320x700-command.png' },
  { width: 375, height: 812, file: '375x812-command.png' },
  { width: 390, height: 844, file: '390x844-command.png' },
  { width: 430, height: 932, file: '430x932-command.png' },
] as const

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

async function gotoCommand(page: Page) {
  const response = await page.goto('/dashboard?country=CA&role=exporter&section=overview&page=briefing', {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  })
  expect(response?.status()).toBeLessThan(400)
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
  await expect(page.locator('[data-mobile-command-version="2"]')).toBeVisible()
  await expect(page.locator('[data-active-destination="overview"]')).toBeVisible()
}

async function assertFiveJobNavigation(page: Page) {
  const nav = page.locator('.hvm-op-bottom-nav')
  await expect(nav).toBeVisible()
  await expect(nav.getByText('Command', { exact: true })).toBeVisible()
  await expect(nav.getByText('Market', { exact: true })).toBeVisible()
  await expect(nav.getByText('Intel', { exact: true })).toBeVisible()
  await expect(nav.getByText('Actions', { exact: true })).toBeVisible()
  // Clinical is a destination; Context is not one. See PrimarySectionId in
  // components/dashboard/mobile-command/contracts.ts for why.
  await expect(nav.getByText('Clinical', { exact: true })).toBeVisible()
  await expect(nav.getByText('Context', { exact: true })).toHaveCount(0)
  await expect(nav.locator('[aria-current="page"]')).toContainText('Command')
}

async function assertOperatorFirstCommand(page: Page, viewportHeight: number) {
  await expect(page.locator('.hvm-op-page-title')).toHaveText('Command')
  await expect(page.locator('.hvm-op-context-trigger')).toBeVisible()
  await expect(page.locator('.hvm-op-pulse')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Requires attention', exact: true })).toBeVisible()

  await expect(page.getByText('Operator command centre', { exact: true })).toHaveCount(0)
  await expect(page.getByText('All Command Centre modules', { exact: true })).toHaveCount(0)
  await expect(page.getByText('32 available', { exact: true })).toHaveCount(0)
  await expect(page.locator('[data-command-module]')).toHaveCount(0)
  await expect(page.locator('.hvm2-section-rail')).toHaveCount(0)
  await expect(page.locator('.hvm-op-secondary-nav')).toHaveCount(0)

  const intelligenceZero = page.locator('.hvm-op-compact-zero').filter({ hasText: 'Recent intelligence' })
  const opportunityZero = page.locator('.hvm-op-compact-zero').filter({ hasText: 'Commercial opportunities' })
  const populatedIntelligence = page.getByRole('heading', { name: 'Recent intelligence', exact: true })
  const populatedOpportunity = page.getByRole('heading', { name: 'Commercial opportunity', exact: true })

  if (await intelligenceZero.count()) {
    await expect(intelligenceZero).toContainText('No material updates in this context')
    await expect(intelligenceZero).toBeVisible()
  } else {
    await expect(populatedIntelligence).toBeVisible()
  }

  if (await opportunityZero.count()) {
    await expect(opportunityZero).toContainText('No matching opportunities currently')
    await expect(opportunityZero).toBeVisible()
  } else {
    await expect(populatedOpportunity).toBeVisible()
  }

  const nextOperatorSurface = await (await intelligenceZero.count() ? intelligenceZero : populatedIntelligence).boundingBox()
  expect(nextOperatorSurface).not.toBeNull()
  expect(nextOperatorSurface!.y).toBeLessThan(viewportHeight)

  const operatingPicture = page.locator('.hvm-op-operating-picture')
  await expect(operatingPicture).toBeAttached()
  const operatingPictureBox = await operatingPicture.boundingBox()
  expect(operatingPictureBox).not.toBeNull()
  if ((await intelligenceZero.count()) && (await opportunityZero.count()) && viewportHeight >= 812) {
    expect(operatingPictureBox!.y).toBeLessThan(viewportHeight)
  }

  const noHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)
  expect(noHorizontalOverflow).toBe(true)
}

test.describe('Mobile Command operator-first verification', () => {
  test.describe.configure({ mode: 'serial' })

  test('verifies approved mobile hierarchy and compact zero-state density at 320/375/390/430 and captures evidence', async ({ browser }) => {
    test.setTimeout(600_000)
    await fs.mkdir(evidenceRoot, { recursive: true })
    const storageState = await authenticate(browser)

    for (const viewport of MOBILE_VIEWPORTS) {
      const context = await browser.newContext({
        ...sharedContextOptions(),
        viewport: { width: viewport.width, height: viewport.height },
        storageState,
        isMobile: true,
        hasTouch: true,
      })

      try {
        const page = await context.newPage()
        await gotoCommand(page)
        await assertFiveJobNavigation(page)
        await assertOperatorFirstCommand(page, viewport.height)
        await page.screenshot({ path: path.join(evidenceRoot, viewport.file), fullPage: false })
      } finally {
        await context.close()
      }
    }
  })

  test('opens the compact context switcher and preserves jurisdiction/role controls', async ({ browser }) => {
    test.setTimeout(180_000)
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
      await gotoCommand(page)
      await page.locator('.hvm-op-context-trigger').click()

      const dialog = page.getByRole('dialog', { name: 'Operating context' })
      await expect(dialog).toBeVisible()
      await expect(dialog.getByText('Jurisdiction', { exact: true })).toBeVisible()
      await expect(dialog.getByText('Role', { exact: true })).toBeVisible()
      await expect(dialog.getByText('Organization', { exact: true })).toBeVisible()
      await page.screenshot({ path: path.join(evidenceRoot, '390x844-context-open.png'), fullPage: false })

      await dialog.getByRole('button', { name: 'Close context switcher' }).click()
      await expect(dialog).toHaveCount(0)
      await expect(page.locator('.hvm-op-context-trigger')).toBeFocused()
    } finally {
      await context.close()
    }
  })

  test('keeps Clinical reachable under Context without promoting it to primary navigation', async ({ browser }) => {
    test.setTimeout(180_000)
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
      await page.goto('/dashboard?country=CA&role=exporter&page=clinical&section=clinical', { waitUntil: 'domcontentloaded' })
      await expect(page.locator('#clinical')).toBeVisible()
      await expect(page.locator('[data-active-destination="jurisdiction"]')).toBeVisible()
      await expect(page.locator('.hvm-op-bottom-nav [aria-current="page"]')).toContainText('Context')
      await expect(page.locator('.hvm-op-bottom-nav').getByText('Clinical', { exact: true })).toHaveCount(0)
      await expect(page.locator('.hvm-op-secondary-nav').getByText('Clinical', { exact: true })).toBeVisible()
    } finally {
      await context.close()
    }
  })

  test('preserves Marketplace navigation and contained wanted-intake workflow', async ({ browser }) => {
    test.setTimeout(240_000)
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
      await gotoCommand(page)
      await page.locator('.hvm-op-bottom-nav').getByText('Market', { exact: true }).click()
      await expect(page.locator('[data-active-destination="marketplace"]')).toBeVisible({ timeout: 20_000 })
      await expect(page.locator('#marketplace')).toBeVisible()
      await expect(page.getByRole('tab', { name: /Cannabis/ })).toBeVisible()

      await page.getByRole('link', { name: /Post wanted demand/ }).click()
      await expect(page.locator('[data-mobile-command-tool="wanted-intake"]')).toBeVisible()
      await expect.poll(() => new URL(page.url()).searchParams.get('tool')).toBe('wanted-intake')

      await page.getByRole('button', { name: 'Close marketplace workflow' }).click()
      await expect(page.locator('[data-mobile-command-tool="wanted-intake"]')).toHaveCount(0)
    } finally {
      await context.close()
    }
  })

  test('keeps tablet and desktop renderers outside the mobile shell', async ({ browser }) => {
    test.setTimeout(240_000)
    const storageState = await authenticate(browser)

    for (const width of [768, 1440]) {
      const context = await browser.newContext({
        ...sharedContextOptions(),
        viewport: { width, height: 960 },
        storageState,
      })
      try {
        const page = await context.newPage()
        const response = await page.goto('/dashboard?country=CA&role=exporter', { waitUntil: 'domcontentloaded' })
        expect(response?.status()).toBeLessThan(400)
        await expect(page.locator('[data-dashboard-renderer="desktop"]:visible')).toBeVisible()
        await expect(page.locator('[data-mobile-command-version="2"]:visible')).toHaveCount(0)
      } finally {
        await context.close()
      }
    }
  })
})
