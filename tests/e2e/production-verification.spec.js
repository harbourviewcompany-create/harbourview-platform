const { expect, test } = require('@playwright/test')

const publicRoutes = [
  '/',
  '/marketplace',
  '/marketplace/listings',
  '/marketplace/wanted',
  '/marketplace/sell',
  '/intelligence',
  '/signals',
  '/intake'
]

const forbiddenStrings = [
  'View source listing',
  'sourceUrl',
  'sourceName',
  'Evidence captured',
  'provenanceSummary',
  'sourceEvidence',
  'verificationStatus',
  'availabilityStatus',
  'sellerAuthorizationStatus',
  'internalReviewNotes',
  'reviewedBy',
  'lastReviewedAt',
  'nextReviewDueAt'
]

async function assertNoForbiddenStrings(pageContent, route) {
  const hits = forbiddenStrings.filter((value) => pageContent.includes(value))
  expect(hits, `${route} leaked forbidden public strings: ${hits.join(', ')}`).toEqual([])
}

test.describe('production public routes', () => {
  for (const route of publicRoutes) {
    test(`${route} renders without public leakage`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: 'networkidle' })
      expect(response && response.ok(), `${route} returned ${response && response.status()}`).toBeTruthy()
      await expect(page.getByRole('link', { name: /Harbourview home/i })).toBeVisible()
      await assertNoForbiddenStrings(await page.content(), route)
    })
  }

  test('desktop homepage exposes expected route links and globe controller or fallback', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    await expect(page.getByRole('link', { name: /Harbourview home/i })).toBeVisible()
    await expect(
      page.getByRole('link', { name: /Exchange Home/i })
        .or(page.getByRole('link', { name: /Marketplace/i }))
        .first()
    ).toBeVisible()
    const globeControl = page.getByLabel(/Interactive Harbourview globe route controller/i)
    const globeCanvas = page.getByLabel(/Harbourview country globe/i)
    const globeFallback = page.getByRole('heading', { name: /Market routing fallback/i })
    await expect(globeControl.or(globeCanvas).or(globeFallback).first()).toBeVisible()
  })

  test('intake form renders and invalid submission remains safe', async ({ page }) => {
    await page.goto('/intake', { waitUntil: 'networkidle' })
    await expect(page.getByLabel(/name/i).first()).toBeVisible()
    await expect(page.getByLabel(/email/i).first()).toBeVisible()
    const submit = page.getByRole('button', { name: /submit|send|request|speak/i }).first()
    await expect(submit).toBeVisible()
    await submit.click()
    await assertNoForbiddenStrings(await page.content(), '/intake invalid submission')
  })

  test('anonymous admin is not publicly accessible', async ({ page }) => {
    const response = await page.goto('/admin', { waitUntil: 'networkidle' })
    const status = response ? response.status() : 0
    const finalPath = new URL(page.url()).pathname
    const body = await page.content()
    const deniedByStatus = status === 401 || status === 403
    const deniedByLoginRedirect = finalPath === '/login'
    expect(
      deniedByStatus || deniedByLoginRedirect,
      `/admin must deny anonymous access; status=${status}, finalPath=${finalPath}`
    ).toBeTruthy()
    await assertNoForbiddenStrings(body, '/admin anonymous')
  })
})

test.describe('mobile navigation and layout', () => {
  test('mobile hamburger opens and routes close safely', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/', { waitUntil: 'networkidle' })
    await expect(page.locator('body')).toBeVisible()
    const beforeWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(beforeWidth, 'homepage must not horizontally overflow before menu opens').toBeLessThanOrEqual(viewportWidth + 2)

    const toggle = page.getByRole('button', { name: /toggle menu/i })
    await expect(toggle).toBeVisible()
    await toggle.click()

    const mobileNav = page.getByRole('navigation', { name: /Mobile navigation/i })
    await expect(mobileNav).toBeVisible()

    const mobileLinkTexts = (await mobileNav.getByRole('link').allTextContents()).map((text) => text.trim())
    expect(mobileLinkTexts).toEqual(['Marketplace', 'Dashboard', 'Intelligence', 'Education', 'About', 'Contact'])

    for (const forbiddenLabel of [
      'Platform',
      'Exchange',
      'Start Confidential Intake',
      'Wanted Requests',
      'Sell or Export',
      'Markets',
      'Signals'
    ]) {
      await expect(mobileNav.getByText(forbiddenLabel, { exact: true })).toHaveCount(0)
    }

    await expect(mobileNav.getByRole('button')).toHaveCount(0)
    await page.screenshot({ path: 'test-results/mobile-hamburger-open-390.png', fullPage: true })

    await mobileNav.getByRole('link', { name: 'Marketplace' }).click()
    await expect.poll(() => new URL(page.url()).pathname).toBe('/marketplace')

    const afterWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const afterViewportWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(afterWidth, 'mobile routed page must not horizontally overflow').toBeLessThanOrEqual(afterViewportWidth + 2)
  })

  test('reduced motion homepage still renders stable fallback/globe area', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: /Market access backed by intelligence and relationships/i })).toBeVisible()
    await assertNoForbiddenStrings(await page.content(), '/ reduced motion')
  })
})
