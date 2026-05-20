import { expect, test } from '@playwright/test'

const publicRoutes = [
  '/',
  '/marketplace',
  '/marketplace/listings',
  '/marketplace/wanted',
  '/marketplace/sell',
  '/intelligence',
  '/signals',
  '/intake',
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
  'nextReviewDueAt',
]

async function assertNoForbiddenStrings(pageContent: string, route: string) {
  const hits = forbiddenStrings.filter((value) => pageContent.includes(value))
  expect(hits, `${route} leaked forbidden public strings: ${hits.join(', ')}`).toEqual([])
}

test.describe('production public routes', () => {
  for (const route of publicRoutes) {
    test(`${route} renders without public leakage`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: 'networkidle' })
      expect(response?.ok(), `${route} returned ${response?.status()}`).toBeTruthy()
      await expect(page.getByRole('link', { name: /Harbourview home/i })).toBeVisible()
      await assertNoForbiddenStrings(await page.content(), route)
    })
  }

  test('desktop homepage exposes expected route links and globe controller or fallback', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: /Market access backed by intelligence and relationships/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Speak Confidentially/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /Exchange Home/i }).or(page.getByRole('link', { name: /Explore Platform/i })).first()).toBeVisible()
    const globeControl = page.getByLabel(/Interactive Harbourview globe route controller/i)
    const fallbackImage = page.getByAltText(/Harbourview global market access/i)
    await expect(globeControl.or(fallbackImage).first()).toBeVisible()
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
    const status = response?.status() || 0
    const body = await page.content()
    expect(status, `/admin must not return a normal anonymous HTTP 200 admin surface`).not.toBe(200)
    await assertNoForbiddenStrings(body, '/admin anonymous')
  })
})

test.describe('mobile navigation and layout', () => {
  test('mobile hamburger opens and routes close safely', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    await expect(page.locator('body')).toBeVisible()
    const beforeWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(beforeWidth, 'homepage must not horizontally overflow before menu opens').toBeLessThanOrEqual(viewportWidth + 2)

    const toggle = page.getByRole('button', { name: /toggle menu/i })
    await expect(toggle).toBeVisible()
    await toggle.click()
    await expect(page.getByRole('navigation', { name: /Mobile navigation/i })).toBeVisible()
    await page.getByRole('link', { name: /Wanted Requests/i }).click()
    await expect(page).toHaveURL(/\/marketplace\/wanted/)

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
