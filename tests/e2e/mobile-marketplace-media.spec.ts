import { expect, test, type Browser, type BrowserContextOptions, type Page } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'

const BASE_URL = process.env.HARBOURVIEW_PUBLIC_BASE_URL || process.env.PLAYWRIGHT_BASE_URL
const evidenceRoot = path.join(process.cwd(), 'artifacts', 'mobile-marketplace-media')

const VIEWPORTS = [
  { width: 320, height: 700 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
] as const

const MARKET_TABS = ['Cannabis', 'Wanted', 'Opportunities', 'Equipment', 'Consumables', 'Services', 'New products'] as const

function contextOptions(): BrowserContextOptions {
  if (!BASE_URL) throw new Error('HARBOURVIEW_PUBLIC_BASE_URL or PLAYWRIGHT_BASE_URL is required')
  return { baseURL: BASE_URL }
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
    await page.locator('form').getByRole('button', { name: 'Sign in', exact: true }).click()
    await page.waitForURL(url => url.pathname.startsWith('/dashboard'), { timeout: 45_000 })
    return await context.storageState()
  } finally {
    await context.close()
  }
}

async function assertAllHealthyMedia(page: Page) {
  const cards = page.locator('.hvm2-listing-card')
  await expect(cards.first()).toBeVisible({ timeout: 30_000 })
  const cardCount = await cards.count()
  expect(cardCount).toBeGreaterThan(0)

  for (let index = 0; index < cardCount; index += 1) {
    const card = cards.nth(index)
    await card.scrollIntoViewIfNeeded()
    const media = card.locator('.hvm2-listing-media')
    await expect(media).toBeVisible()

    const kind = await media.getAttribute('data-media-kind')
    expect(['actual', 'representative']).toContain(kind)

    const image = media.locator('img')
    await expect(image).toBeVisible()
    await expect.poll(async () => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true)

    const alt = await image.getAttribute('alt')
    expect(alt?.trim().length ?? 0).toBeGreaterThan(8)

    if (kind === 'representative') {
      await expect(media.locator('.hvm2-listing-media-badge')).toHaveText(/^(Representative|Illustrative) image$/)
    } else {
      await expect(media.locator('.hvm2-listing-media-badge')).toHaveCount(0)
    }
  }

  const geometry = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  expect(geometry.scrollWidth - geometry.clientWidth).toBeLessThanOrEqual(1)
}

async function verifyEveryLoadedMarketplaceView(page: Page) {
  for (const tabName of MARKET_TABS) {
    const tab = page.getByRole('tab', { name: new RegExp(`^${tabName},`) })
    await expect(tab).toBeVisible()
    await tab.click()
    await expect(tab).toHaveAttribute('aria-selected', 'true')

    const cards = page.locator('.hvm2-listing-card')
    if (await cards.count() > 0) await assertAllHealthyMedia(page)
  }
}

test.describe('Mobile Marketplace media production path', () => {
  test.describe.configure({ mode: 'serial' })

  test('renders every loaded listing media card at 320x700, 375x812, 390x844 and 430x932 without the retired N+1 route', async ({ browser }) => {
    test.setTimeout(600_000)
    await fs.mkdir(evidenceRoot, { recursive: true })
    const storageState = await authenticate(browser)

    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({
        ...contextOptions(),
        viewport,
        storageState,
        isMobile: true,
        hasTouch: true,
      })
      const retiredRouteRequests: string[] = []

      try {
        const page = await context.newPage()
        page.on('request', request => {
          if (/\/api\/marketplace\/items\/[^/]+\/card-image/.test(new URL(request.url()).pathname)) {
            retiredRouteRequests.push(request.url())
          }
        })

        const response = await page.goto(
          '/dashboard?country=CA&role=exporter&page=marketplace&section=marketplace&marketView=cannabis',
          { waitUntil: 'domcontentloaded', timeout: 60_000 },
        )
        expect(response?.status()).toBeLessThan(400)
        await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})

        await expect(page.locator('[data-mobile-command-version="2"]')).toBeVisible()
        await expect(page.locator('[data-active-destination="marketplace"]')).toBeVisible()
        await expect(page.locator('#marketplace')).toBeVisible()
        await expect(page.getByRole('tab', { name: /Cannabis/ })).toHaveAttribute('aria-selected', 'true')
        await expect(page.locator('.hvm-op-bottom-nav')).toBeVisible()
        await expect(page.locator('.hvm-op-bottom-nav [aria-current="page"]')).toContainText('Market')
        await verifyEveryLoadedMarketplaceView(page)

        expect(retiredRouteRequests).toEqual([])
        await page.getByRole('tab', { name: /^Cannabis,/ }).click()
        await page.screenshot({
          path: path.join(evidenceRoot, `${viewport.width}x${viewport.height}-market.png`),
          fullPage: false,
        })
      } finally {
        await context.close()
      }
    }
  })

  test('preserves tabs, search, reviewed-introduction and Supply behavior with media enabled', async ({ browser }) => {
    test.setTimeout(300_000)
    const storageState = await authenticate(browser)
    const context = await browser.newContext({
      ...contextOptions(),
      viewport: { width: 390, height: 844 },
      storageState,
      isMobile: true,
      hasTouch: true,
    })

    try {
      const page = await context.newPage()
      await page.goto(
        '/dashboard?country=CA&role=exporter&page=marketplace&section=marketplace&marketView=cannabis',
        { waitUntil: 'domcontentloaded', timeout: 60_000 },
      )
      await expect(page.locator('#marketplace')).toBeVisible()
      await expect(page.getByRole('tab', { name: /Cannabis/ })).toBeVisible()
      await expect(page.getByRole('tab', { name: /Wanted/ })).toBeVisible()
      await expect(page.getByRole('tab', { name: /Equipment/ })).toBeVisible()

      const search = page.getByRole('textbox', { name: 'Search cannabis' })
      await expect(search).toBeVisible()
      const firstTitle = (await page.locator('.hvm2-listing-card h3').first().textContent())?.trim() ?? ''
      expect(firstTitle.length).toBeGreaterThan(3)
      await search.fill(firstTitle.slice(0, Math.min(18, firstTitle.length)))
      await expect(page.locator('.hvm2-listing-card').first()).toBeVisible()
      await assertAllHealthyMedia(page)
      await search.fill('')

      await page.locator('.hvm2-listing-card .hvm2-inline-cta').first().click()
      const introduction = page.locator('[data-mobile-command-tool="introduction"]')
      await expect(introduction).toBeVisible()
      await introduction.getByRole('button', { name: 'Close marketplace workflow' }).click()
      await expect(introduction).toHaveCount(0)

      await page.goto(
        '/dashboard?country=CA&role=exporter&page=marketplace&section=supply&marketView=cannabis',
        { waitUntil: 'domcontentloaded', timeout: 60_000 },
      )
      await expect(page.locator('#supply')).toBeVisible()
      await expect(page.locator('.hvm-op-bottom-nav [aria-current="page"]')).toContainText('Market')
      await assertAllHealthyMedia(page)
    } finally {
      await context.close()
    }
  })
})
