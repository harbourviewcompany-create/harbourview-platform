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

const protectedAdminStrings = [
  'Admin Review',
  'Internal listing review',
  'Intelligence Automation',
  'Marketplace moderation'
]

async function assertNoForbiddenStrings(pageContent, route) {
  const hits = forbiddenStrings.filter((value) => pageContent.includes(value))
  expect(hits, `${route} leaked forbidden public strings: ${hits.join(', ')}`).toEqual([])
}

async function assertNoProtectedAdminStrings(pageContent) {
  const hits = protectedAdminStrings.filter((value) => pageContent.includes(value))
  expect(hits, `anonymous admin response exposed protected strings: ${hits.join(', ')}`).toEqual([])
}

async function assertStableRenderedSurface(page, route) {
  await expect(page.locator('main').first(), `${route} must render a main landmark`).toBeVisible()

  if (route === '/') {
    await expect(page.getByRole('combobox', { name: /Search countries, provinces, and U\.S\. states/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Market access/i })).toBeVisible()
    return
  }

  if (route === '/intake') {
    await expect(page.getByRole('heading', { name: /Sign in to your account/i })).toBeVisible()
    await expect(page.getByRole('textbox', { name: /you@example\.com/i })).toBeVisible()
    return
  }

  await expect(page.locator('body')).toContainText(/Harbourview/i)
}

test.describe('production public routes', () => {
  for (const route of publicRoutes) {
    test(`${route} renders without public leakage`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: 'networkidle' })
      expect(response && response.ok(), `${route} returned ${response && response.status()}`).toBeTruthy()
      await assertStableRenderedSurface(page, route)
      await assertNoForbiddenStrings(await page.content(), route)
    })
  }

  test('desktop homepage exposes stable market-routing controller or fallback', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    await expect(page.locator('main').first()).toBeVisible()
    await expect(page.getByRole('combobox', { name: /Search countries, provinces, and U\.S\. states/i })).toBeVisible()

    const globeControl = page.getByLabel(/Interactive Harbourview globe route controller/i)
    const globeCanvas = page.getByLabel(/Harbourview country globe/i)
    const globeFallback = page.getByRole('heading', { name: /Market routing fallback/i })
    const marketAccess = page.getByRole('button', { name: /Market access/i })
    await expect(globeControl.or(globeCanvas).or(globeFallback).or(marketAccess).first()).toBeVisible()
  })

  test('intake route is safely authentication-gated for anonymous users', async ({ page }) => {
    await page.goto('/intake', { waitUntil: 'networkidle' })
    const body = await page.content()

    await expect(page.getByRole('heading', { name: /Sign in to your account/i })).toBeVisible()
    await expect(page.getByRole('textbox', { name: /you@example\.com/i })).toBeVisible()
    await expect(page.getByRole('textbox', { name: /••••••••/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Sign in$/i }).last()).toBeDisabled()
    expect(
      page.url().includes('next=%2Fintake') ||
      page.url().includes('next=/intake') ||
      body.includes('next=%2Fintake') ||
      body.includes('next=/intake'),
      'anonymous intake routing must preserve next=/intake'
    ).toBeTruthy()
    await assertNoForbiddenStrings(body, '/intake anonymous gate')
  })

  test('anonymous admin resolves only to the login surface', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'networkidle' })
    const body = await page.content()

    await expect(page.getByRole('heading', { name: /Sign in to your account/i })).toBeVisible()
    await expect(page.getByRole('textbox', { name: /you@example\.com/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Sign in$/i }).last()).toBeDisabled()
    expect(
      page.url().includes('next=%2Fadmin') ||
      page.url().includes('next=/admin') ||
      body.includes('next=%2Fadmin') ||
      body.includes('next=/admin'),
      'anonymous admin routing must preserve next=/admin'
    ).toBeTruthy()
    await assertNoProtectedAdminStrings(body)
    await assertNoForbiddenStrings(body, '/admin anonymous')
  })
})

test.describe('mobile navigation and layout', () => {
  test('mobile hamburger opens and routes close safely', async ({ page }, testInfo) => {
    const projectWidth = testInfo.project.use.viewport && testInfo.project.use.viewport.width
    test.skip(!projectWidth || projectWidth > 600, 'Mobile navigation assertion applies only to mobile projects')

    await page.goto('/marketplace', { waitUntil: 'networkidle' })
    await expect(page.locator('body')).toBeVisible()
    const beforeWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(beforeWidth, 'marketplace must not horizontally overflow before menu opens').toBeLessThanOrEqual(viewportWidth + 2)

    const toggle = page.getByRole('button', { name: /toggle menu/i })
    await expect(toggle).toBeVisible()
    await toggle.click()

    const mobileNav = page.getByRole('navigation', { name: /Mobile navigation/i })
    await expect(mobileNav).toBeVisible()
    await expect(mobileNav.getByRole('link', { name: /Marketplace/i }).first()).toBeVisible()
    await expect(mobileNav.getByRole('link', { name: /Intelligence/i }).first()).toBeVisible()
    await expect(mobileNav.getByRole('link', { name: /Education/i }).first()).toBeVisible()

    await page.screenshot({ path: `test-results/mobile-hamburger-open-${projectWidth}.png`, fullPage: true })

    await mobileNav.getByRole('link', { name: /Marketplace/i }).first().click()
    await expect.poll(() => new URL(page.url()).pathname).toBe('/marketplace')

    const afterWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const afterViewportWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(afterWidth, 'mobile routed page must not horizontally overflow').toBeLessThanOrEqual(afterViewportWidth + 2)
  })

  test('reduced motion homepage renders stable fallback or market-routing controls', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/', { waitUntil: 'networkidle' })

    const reducedMotionMarker = page.getByText(/Reduced motion mode/i)
    const globeFallback = page.getByRole('heading', { name: /Market routing fallback/i })
    const searchControl = page.getByRole('combobox', { name: /Search countries, provinces, and U\.S\. states/i })
    await expect(reducedMotionMarker.or(globeFallback).or(searchControl).first()).toBeVisible()
    await assertNoForbiddenStrings(await page.content(), '/ reduced motion')
  })
})
