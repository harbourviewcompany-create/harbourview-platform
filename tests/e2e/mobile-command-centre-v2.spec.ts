import { expect, test, type Browser, type BrowserContextOptions, type Locator, type Page } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'
import { COMMAND_CENTRE_PAGE_IDS } from '@/lib/platform/commandCentreRegistry'
import { SECTION_GROUPS, SECTION_NAV } from '@/components/dashboard/mobile-command/contracts'

/** Derived from SECTION_NAV so rail-label changes stay synchronized with the UI contract. */
function railLabelsFor(group: keyof typeof SECTION_GROUPS): string[] {
  return SECTION_GROUPS[group].map(id => {
    const entry = SECTION_NAV.find(section => section.id === id)
    if (!entry) throw new Error(`SECTION_NAV has no entry for grouped section "${id}"`)
    return entry.label
  })
}

const COMMAND_RAIL_LABELS = railLabelsFor('overview')
const MARKET_RAIL_LABELS = railLabelsFor('marketplace')

const BASE_URL = process.env.HARBOURVIEW_PUBLIC_BASE_URL || process.env.PLAYWRIGHT_BASE_URL
const BYPASS_TOKEN = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
const IS_ISOLATED_LOCAL_RUN = Boolean(process.env.HARBOURVIEW_ALLOW_LOCAL_SUPABASE === '1' && BASE_URL?.includes('127.0.0.1'))
const evidenceRoot = path.join(process.cwd(), 'artifacts', 'mobile-command-v2')

/** The nine widths this gate is named after. */
const WIDTHS = [320, 360, 375, 390, 430, 768, 820, 1024, 1440] as const

type FailedResponse = {
  method: string
  pathname: string
  search: string
  status: number
}

function safeFileToken(value: string | undefined) {
  return (value || 'local').replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 80)
}

function sanitizeDiagnostic(value: string) {
  return value
    .replace(/([?&](?:email|password|token|code|key|secret|access_token|refresh_token)=)[^&\s]+/gi, '$1[redacted]')
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [redacted]')
    .replace(/sb_[A-Za-z0-9_-]+/g, 'sb_[redacted]')
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[redacted-jwt]')
    // Bare addresses too, not just `?email=`. This suite types
    // E2E_TEST_USER_EMAIL into the login form, so an application error or a
    // console message can carry it in a message body where the query-parameter
    // rule above never sees it — and this output lands in CI logs and in an
    // artifact retained for 14 days.
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[redacted-email]')
}

function sanitizeSearchForEvidence(search: string) {
  const params = new URLSearchParams(search)
  for (const key of [...params.keys()]) {
    if (/email|password|token|code|key|secret/i.test(key)) params.set(key, '[redacted]')
  }
  const output = params.toString()
  return output ? `?${output}` : ''
}

function sanitizeUrlForEvidence(value: string) {
  const url = new URL(value)
  return `${url.origin}${url.pathname}${sanitizeSearchForEvidence(url.search)}`
}

function isGenericResourceConsoleError(message: string) {
  return message.includes('Failed to load resource: the server responded with a status of')
}

/**
 * Collapse a defect list into a few `×N` lines suitable for a CI log.
 *
 * The 1440px pass walks every Command Centre page, so a single endpoint that
 * fails on load shows up ~38 times. Printing all of them buries the signal and
 * printing none of them leaves the log useless — which is exactly what happened
 * before: this gate threw counts only, the offending requests went to an
 * evidence JSON inside a 30MB artifact, and a red run said nothing actionable.
 * It stayed red on main for hours because of it. Deduplicating first means one
 * broken endpoint reads as one line with a count, which is also what
 * distinguishes "one endpoint, every page" from "many endpoints, one page" —
 * the two failure shapes need different fixes.
 */
function summarizeDefects(label: string, entries: string[], limit = 8) {
  if (!entries.length) return []
  const counts = new Map<string, number>()
  for (const entry of entries) counts.set(entry, (counts.get(entry) ?? 0) + 1)
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1])
  const lines = ranked
    .slice(0, limit)
    .map(([entry, count]) => `  ${label}${count > 1 ? ` ×${count}` : ''}: ${entry}`)
  if (ranked.length > limit) lines.push(`  … ${ranked.length - limit} more distinct ${label}s`)
  return lines
}

function isExpectedLocalDegradation(response: FailedResponse) {
  if (!IS_ISOLATED_LOCAL_RUN || response.status >= 500) return false
  return (
    (response.pathname === '/api/ai/briefing' && response.status === 503)
    || (response.pathname === '/api/country-intel' && response.status === 404)
  )
}

async function writeWidthEvidence(page: Page | null, width: number, report: Record<string, unknown>) {
  const screenshot = `mobile-command-v2-${width}.png`
  if (page) {
    try {
      await page.screenshot({ path: path.join(evidenceRoot, screenshot), fullPage: true })
      report.screenshot = screenshot
    } catch (error) {
      report.screenshotError = sanitizeDiagnostic(error instanceof Error ? error.message : String(error))
    }
  }
  await fs.writeFile(
    path.join(evidenceRoot, `mobile-command-v2-${width}.json`),
    `${JSON.stringify(report, null, 2)}\n`,
  )
}

const MOBILE_VIEWPORTS = [
  { width: 320, height: 700, file: '320x700-command.png' },
  { width: 375, height: 812, file: '375x812-command.png' },
  { width: 390, height: 844, file: '390x844-command.png' },
  { width: 430, height: 932, file: '430x932-command.png' },
] as const

const REQUIRED_EVIDENCE_VIEWPORTS = [
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
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

async function assertFourModeNavigation(page: Page) {
  const nav = page.locator('.hvm-op-bottom-nav')
  await expect(nav).toBeVisible()
  await expect(nav.getByText('Command', { exact: true })).toBeVisible()
  await expect(nav.getByText('Market', { exact: true })).toBeVisible()
  await expect(nav.getByText('Intel', { exact: true })).toBeVisible()
  await expect(nav.getByText('Actions', { exact: true })).toBeVisible()
  await expect(nav.getByText('Clinical', { exact: true })).toHaveCount(0)
  await expect(nav.getByText('Context', { exact: true })).toHaveCount(0)
  await expect(nav.locator('button')).toHaveCount(4)
  await expect(nav.locator('[aria-current="page"]')).toContainText('Command')
}

async function assertSingleRowHorizontalRail(rail: Locator, description: string, requireOverflow = true) {
  await expect(rail).toBeVisible()
  const geometry = await rail.evaluate(element => {
    const railElement = element as HTMLElement
    const style = getComputedStyle(railElement)
    const buttonRects = [...railElement.querySelectorAll('button')].map(button => {
      const rect = (button as HTMLElement).getBoundingClientRect()
      return { top: rect.top, height: rect.height, width: rect.width }
    })
    return {
      flexWrap: style.flexWrap,
      overflowX: style.overflowX,
      clientWidth: railElement.clientWidth,
      scrollWidth: railElement.scrollWidth,
      buttonRects,
    }
  })

  expect(geometry.flexWrap, `${description}: rail must not wrap`).toBe('nowrap')
  expect(['auto', 'scroll'], `${description}: rail must be horizontally navigable`).toContain(geometry.overflowX)
  expect(geometry.buttonRects.length, `${description}: rail has no targets`).toBeGreaterThan(0)

  const rowTop = Math.min(...geometry.buttonRects.map(rect => rect.top))
  const rowBottom = Math.max(...geometry.buttonRects.map(rect => rect.top))
  expect(rowBottom - rowTop, `${description}: targets occupy more than one row`).toBeLessThanOrEqual(1)

  for (const [index, rect] of geometry.buttonRects.entries()) {
    expect(rect.height, `${description}: target ${index + 1} is shorter than 44px`).toBeGreaterThanOrEqual(44)
    expect(rect.width, `${description}: target ${index + 1} is narrower than 44px`).toBeGreaterThanOrEqual(44)
  }

  if (requireOverflow) {
    expect(
      geometry.scrollWidth,
      `${description}: expected horizontal overflow but scrollWidth=${geometry.scrollWidth} clientWidth=${geometry.clientWidth}`,
    ).toBeGreaterThan(geometry.clientWidth)
  }
}

/**
 * A scrollable rail must prove that each destination is reachable, not that all
 * destinations are simultaneously inside the phone viewport. Reveal one target
 * at a time and then verify full horizontal containment in the viewport.
 */
async function expectHorizontallyOnScreen(page: Page, locator: Locator, description: string) {
  await expect(locator).toBeVisible()
  await locator.scrollIntoViewIfNeeded()
  await expect(locator).toBeInViewport()
  const box = await locator.boundingBox()
  const viewport = page.viewportSize()
  expect(box, `${description}: element has no bounding box`).not.toBeNull()
  expect(viewport, `${description}: page has no viewport size`).not.toBeNull()
  if (!box || !viewport) return
  const left = Math.round(box.x)
  const right = Math.round(box.x + box.width)
  expect(
    left >= 0 && right <= viewport.width,
    `${description} is still clipped after rail scroll at ${viewport.width}px wide: left=${left} right=${right}`,
  ).toBe(true)
}

async function assertOperatorFirstCommand(page: Page, viewportHeight: number) {
  await expect(page.locator('.hvm-op-page-title')).toHaveText('Command')
  await expect(page.locator('.hvm-op-context-trigger')).toBeVisible()
  await expect(page.locator('.hvm-op-pulse')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Requires attention', exact: true })).toBeVisible()
  await expect(page.locator('.hvm-op-current-chip:visible')).toHaveCount(0)

  await expect(page.getByText('Operator command centre', { exact: true })).toHaveCount(0)
  await expect(page.getByText('All Command Centre modules', { exact: true })).toHaveCount(0)
  await expect(page.getByText('32 available', { exact: true })).toHaveCount(0)
  await expect(page.locator('[data-command-module]')).toHaveCount(0)
  await expect(page.locator('.hvm2-section-rail')).toHaveCount(0)
  const commandRail = page.locator('.hvm-op-secondary-nav')
  await expect(commandRail).toBeVisible()
  await expect(commandRail.locator('button')).toHaveCount(COMMAND_RAIL_LABELS.length)
  await assertSingleRowHorizontalRail(commandRail, 'Command rail')
  for (const label of COMMAND_RAIL_LABELS) {
    await expectHorizontallyOnScreen(page, commandRail.getByText(label, { exact: true }), `Command rail "${label}"`)
  }
  await commandRail.evaluate(element => { (element as HTMLElement).scrollLeft = 0 })

  const mainBox = await page.locator('.hvm-op-main').boundingBox()
  expect(mainBox, 'the main content pane has no bounding box').not.toBeNull()
  expect(
    (mainBox?.height ?? 0) > 120,
    `the content pane collapsed to ${Math.round(mainBox?.height ?? 0)}px at ${viewportHeight}px tall — rail chrome is consuming it`,
  ).toBe(true)

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
        await assertFourModeNavigation(page)
        await assertOperatorFirstCommand(page, viewport.height)
        await page.screenshot({ path: path.join(evidenceRoot, viewport.file), fullPage: false })
      } finally {
        await context.close()
      }
    }
  })

  test('captures exact Jurisdiction evidence at 375x812, 390x844 and 430x932', async ({ browser }) => {
    test.setTimeout(420_000)
    await fs.mkdir(evidenceRoot, { recursive: true })
    const storageState = await authenticate(browser)

    for (const viewport of REQUIRED_EVIDENCE_VIEWPORTS) {
      const context = await browser.newContext({
        ...sharedContextOptions(),
        viewport: { width: viewport.width, height: viewport.height },
        storageState,
        isMobile: true,
        hasTouch: true,
      })

      try {
        const page = await context.newPage()
        const response = await page.goto('/dashboard?country=CA&role=exporter&page=access-pathway&section=jurisdiction', { waitUntil: 'domcontentloaded' })
        expect(response?.status()).toBeLessThan(400)
        await expect(page.locator('#jurisdiction')).toBeVisible()
        await expect(page.locator('[data-active-destination="overview"]')).toBeVisible()
        await assertFourModeNavigation(page)
        await expect(page.locator('.hvm-op-current-chip:visible')).toHaveCount(0)
        const rail = page.locator('.hvm-op-secondary-nav')
        await assertSingleRowHorizontalRail(rail, `Jurisdiction Command rail ${viewport.width}x${viewport.height}`)
        await page.screenshot({
          path: path.join(evidenceRoot, `${viewport.width}x${viewport.height}-jurisdiction.png`),
          fullPage: false,
        })
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

  test('keeps the content pane usable when the viewport is too short for the rail', async ({ browser }) => {
    test.setTimeout(180_000)
    const storageState = await authenticate(browser)

    // WCAG 1.4.10 reflow: a 1280x1024 desktop window at 400% zoom presents as
    // roughly 320x256 CSS pixels, which enters this renderer. The shell is
    // `height: 100dvh; overflow: hidden`, so if the rail refuses to shrink the
    // content pane is squeezed to nothing and the dashboard becomes
    // unreachable. The other assertions in this file all run at 700px or
    // taller, so none of them exercise this.
    for (const [width, height] of [[320, 320], [320, 256]] as const) {
      const context = await browser.newContext({
        ...sharedContextOptions(),
        viewport: { width, height },
        storageState,
        isMobile: true,
        hasTouch: true,
      })

      try {
        const page = await context.newPage()
        await page.goto('/dashboard?country=CA&role=exporter&page=briefing&section=overview', { waitUntil: 'domcontentloaded' })
        await expect(page.locator('[data-active-destination="overview"]')).toBeVisible()

        const mainBox = await page.locator('.hvm-op-main').boundingBox()
        expect(mainBox, `no content pane at ${width}x${height}`).not.toBeNull()
        expect(
          (mainBox?.height ?? 0) >= 96,
          `the content pane collapsed to ${Math.round(mainBox?.height ?? 0)}px at ${width}x${height} — the rail is not yielding`,
        ).toBe(true)

        const bottomNav = page.locator('.hvm-op-bottom-nav')
        await bottomNav.scrollIntoViewIfNeeded()
        await expect(bottomNav).toBeInViewport()
      } finally {
        await context.close()
      }
    }
  })

  test('preserves a Clinical deep link under the Command destination', async ({ browser }) => {
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
      await expect(page.locator('[data-active-destination="overview"]')).toBeVisible()
      await expect(page.locator('.hvm-op-bottom-nav [aria-current="page"]')).toContainText('Command')
      const rail = page.locator('.hvm-op-secondary-nav')
      await expect(rail).toBeVisible()
      await assertSingleRowHorizontalRail(rail, 'Clinical Command rail')
      await expectHorizontallyOnScreen(page, rail.getByText('Clinical', { exact: true }), 'rail "Clinical"')
    } finally {
      await context.close()
    }
  })

  test('reaches the supported operational sections Command owns and proves a late domain can be scrolled to and activated', async ({ browser }) => {
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
      await page.goto('/dashboard?country=CA&role=exporter&page=access-pathway&section=jurisdiction', { waitUntil: 'domcontentloaded' })
      await expect(page.locator('#jurisdiction')).toBeVisible()
      await expect(page.locator('[data-active-destination="overview"]')).toBeVisible()
      await expect(page.locator('.hvm-op-bottom-nav [aria-current="page"]')).toContainText('Command')

      const rail = page.locator('.hvm-op-secondary-nav')
      await expect(rail).toBeVisible()
      await assertSingleRowHorizontalRail(rail, 'Command operational-domain rail')
      for (const id of ['genetics', 'talent', 'clinical', 'compliance', 'education', 'directories', 'network'] as const) {
        const label = SECTION_NAV.find(section => section.id === id)?.label
        if (!label) throw new Error(`SECTION_NAV has no entry for operational section "${id}"`)
        await expectHorizontallyOnScreen(page, rail.getByText(label, { exact: true }), `rail "${label}"`)
      }

      const lateDomain = rail.getByText('Network', { exact: true })
      await lateDomain.scrollIntoViewIfNeeded()
      await expect(lateDomain).toBeInViewport()
      await lateDomain.click()
      await expect(page.locator('#network')).toBeVisible({ timeout: 20_000 })
    } finally {
      await context.close()
    }
  })

  test('rails marketplace controls under Market and keeps operational domains out of it', async ({ browser }) => {
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
      await page.goto('/dashboard?country=CA&role=exporter&page=marketplace&section=marketplace', { waitUntil: 'domcontentloaded' })
      await expect(page.locator('#marketplace')).toBeVisible()
      await expect(page.locator('[data-active-destination="marketplace"]')).toBeVisible()
      await expect(page.locator('.hvm-op-bottom-nav [aria-current="page"]')).toContainText('Market')

      const rail = page.locator('.hvm-op-secondary-nav')
      await expect(rail).toBeVisible()
      await expect(rail.locator('button')).toHaveCount(MARKET_RAIL_LABELS.length)
      await assertSingleRowHorizontalRail(rail, 'Market rail')
      for (const label of MARKET_RAIL_LABELS) {
        await expectHorizontallyOnScreen(page, rail.getByText(label, { exact: true }), `Market rail "${label}"`)
      }
      for (const label of ['Genetics', 'Talent', 'Clinical', 'Directories', 'Network']) {
        await expect(rail.getByText(label, { exact: true })).toHaveCount(0)
      }
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

        // Wait for the real desktop shell before asserting on the renderer
        // marker. CommandCentre is dynamic with ssr: false and its `loading`
        // fallback (CommandBootShell) is an in-flow <main class="min-h-screen">,
        // so straight after domcontentloaded the marker has height purely
        // because the boot shell is still mounted. This assertion used to pass
        // by winning that race -- it resolved against the loading state and
        // never observed the settled one, where the only child is the
        // position:fixed .cc-app.
        //
        // That mattered: the marker had a zero-area box in the settled state on
        // every desktop page, and this test could not see it. The Genetics spec
        // waited for networkidle, did observe it, and reported the bare
        // "element(s) not found" that led to the fix in
        // DashboardResponsiveShell. Anchoring on .cc-app makes this test check
        // the state users actually get.
        await expect(page.locator('.cc-app')).toBeVisible()
        await expect(page.locator('[data-dashboard-renderer="desktop"]:visible')).toBeVisible()
        await expect(page.locator('[data-mobile-command-version="2"]:visible')).toHaveCount(0)
      } finally {
        await context.close()
      }
    }
  })
})

/**
 * The nine-width sweep this workflow is named after.
 *
 * It was replaced by the four-viewport mobile block above, which left the job
 * called "Authenticated nine-width Command Centre evidence" checking four
 * widths and no desktop at all. Two things went missing with it: coverage of
 * 768/820/1024/1440, and the per-width browser-defect collection — which is the
 * only thing in this suite that catches a route returning 500 on a surface that
 * still *renders* correctly. That is not hypothetical: a fixture gap had
 * /api/dashboard/signals 500ing on every desktop page load while every visual
 * assertion passed, and only this sweep saw it.
 *
 * The two blocks are complementary and deliberately do not overlap. The block
 * above owns mobile hierarchy and zero-state density in detail; this one owns
 * breadth — every width loads, renders the right shell, does not overflow, and
 * emits no page errors, console errors or failed responses.
 */
test.describe('Command Centre authenticated responsive verification', () => {
  test.describe.configure({ mode: 'serial' })

  test('verifies mobile, tablet and desktop command surfaces from 320 through 1440', async ({ browser }) => {
    test.setTimeout(1_800_000)
    await fs.mkdir(evidenceRoot, { recursive: true })
    const storageState = await authenticate(browser)
    const aggregate: Array<Record<string, unknown>> = []
    const failures: string[] = []

    for (const width of WIDTHS) {
      const context = await browser.newContext({
        ...sharedContextOptions(),
        viewport: { width, height: width < 768 ? 900 : 960 },
        storageState,
        isMobile: width < 768,
        hasTouch: width < 768,
      })
      let page: Page | null = null
      const pageErrors: string[] = []
      const consoleErrors: string[] = []
      const expectedResourceConsoleErrors: string[] = []
      const expectedDegradedResponses: FailedResponse[] = []
      const unexpectedFailedResponses: FailedResponse[] = []
      const report: Record<string, unknown> = { width }

      try {
        page = await context.newPage()
        page.on('pageerror', error => pageErrors.push(sanitizeDiagnostic(error.message)))
        page.on('console', message => {
          if (message.type() !== 'error') return
          const diagnostic = sanitizeDiagnostic(message.text())
          if (IS_ISOLATED_LOCAL_RUN && isGenericResourceConsoleError(diagnostic)) {
            expectedResourceConsoleErrors.push(diagnostic)
          } else {
            consoleErrors.push(diagnostic)
          }
        })
        page.on('response', response => {
          if (response.status() < 400) return
          const url = new URL(response.url())
          const failedResponse: FailedResponse = {
            method: response.request().method(),
            pathname: url.pathname,
            search: sanitizeSearchForEvidence(url.search),
            status: response.status(),
          }
          if (isExpectedLocalDegradation(failedResponse)) {
            expectedDegradedResponses.push(failedResponse)
          } else {
            unexpectedFailedResponses.push(failedResponse)
          }
        })

        const response = await page.goto('/dashboard?country=CA&role=exporter', {
          waitUntil: 'domcontentloaded',
          timeout: 60_000,
        })
        await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})

        report.finalUrl = sanitizeUrlForEvidence(page.url())
        report.status = response?.status() ?? null
        expect(response?.status()).toBeLessThan(400)

        if (width < 768) {
          await expect(page.locator('[data-mobile-command-version="2"]')).toBeVisible()
          await expect(page.locator('[data-dashboard-renderer="mobile"]:visible')).toBeVisible()
          await expect(page.locator('.hvm-op-bottom-nav')).toBeVisible()
          await expect(page.locator('[data-active-destination="overview"]')).toBeVisible()

          const sectionCount = await page.locator('.hvm-op-main > section').count()
          expect(sectionCount).toBe(1)
          report.shell = 'mobile-operator-first'
        } else {
          const desktopRoot = page.locator('.cc-app:visible')
          await expect(page.locator('[data-mobile-command-version="2"]')).toHaveCount(0)
          await expect(desktopRoot).toBeVisible()
          await expect(desktopRoot.locator('.cc-page-title')).toHaveText('Briefing Room')

          if (width === 1440) {
            const verifiedPages: string[] = []
            for (const commandPage of COMMAND_CENTRE_PAGE_IDS) {
              const pageResponse = await page.goto(
                `/dashboard?country=CA&role=exporter&page=${encodeURIComponent(commandPage)}`,
                { waitUntil: 'domcontentloaded', timeout: 60_000 },
              )
              expect(pageResponse?.status()).toBeLessThan(400)
              const commandRoot = page.locator('.cc-app:visible')
              await expect(commandRoot).toBeVisible()
              expect(new URL(page.url()).searchParams.get('page')).toBe(commandPage)
              await expect(commandRoot.locator('.cc-main')).not.toBeEmpty()
              await expect(commandRoot.locator('.cc-main')).toContainText(/\S/)
              verifiedPages.push(commandPage)
            }
            report.verifiedDesktopPages = verifiedPages
          }
          report.shell = 'desktop-command-centre'
        }

        const geometry = await page.evaluate(() => {
          const root = document.documentElement
          const body = document.body
          return {
            scrollWidth: Math.max(root.scrollWidth, body.scrollWidth),
            clientWidth: root.clientWidth,
            horizontalOverflow: Math.max(0, Math.max(root.scrollWidth, body.scrollWidth) - root.clientWidth),
            viewportHeight: window.innerHeight,
          }
        })
        expect(geometry.horizontalOverflow).toBeLessThanOrEqual(1)
        report.geometry = geometry

        await page.waitForTimeout(500)
      } catch (error) {
        const diagnostic = sanitizeDiagnostic(error instanceof Error ? error.message : String(error))
        report.result = 'fail'
        report.failure = diagnostic
        failures.push(`${width}px: ${diagnostic}`)
      } finally {
        report.pageErrors = pageErrors
        report.consoleErrors = consoleErrors
        report.expectedResourceConsoleErrors = expectedResourceConsoleErrors
        report.expectedDegradedResponses = expectedDegradedResponses
        report.unexpectedFailedResponses = unexpectedFailedResponses

        if (report.result !== 'fail') {
          const defects = [
            ...summarizeDefects('page error', pageErrors),
            ...summarizeDefects('console error', consoleErrors),
            ...summarizeDefects(
              'failed response',
              unexpectedFailedResponses.map(
                entry => `${entry.status} ${entry.method} ${entry.pathname}${entry.search}`,
              ),
            ),
          ]
          if (defects.length) {
            const diagnostic = sanitizeDiagnostic([
              `Browser defects detected: ${pageErrors.length} page errors; ${consoleErrors.length} console errors; ${unexpectedFailedResponses.length} unexpected failed responses`,
              ...defects,
            ].join('\n'))
            report.result = 'fail'
            report.failure = diagnostic
            failures.push(`${width}px: ${diagnostic}`)
          } else {
            report.result = 'pass'
          }
        }
        await writeWidthEvidence(page, width, report).catch(error => {
          const diagnostic = sanitizeDiagnostic(error instanceof Error ? error.message : String(error))
          report.result = 'fail'
          report.failure = `evidence write failed: ${diagnostic}`
          failures.push(`${width}px: evidence write failed: ${diagnostic}`)
        })
        aggregate.push(report)
        await context.close().catch(() => {})
      }
    }

    const sourceSha = process.env.MOBILE_COMMAND_SOURCE_SHA || process.env.GITHUB_SHA || null
    await fs.writeFile(
      path.join(evidenceRoot, `mobile-command-v2-summary-${safeFileToken(sourceSha ?? undefined)}.json`),
      `${JSON.stringify({ generatedAt: new Date().toISOString(), sourceSha, failures, reports: aggregate }, null, 2)}\n`,
    )

    expect(failures, failures.join('\n')).toEqual([])
  })
})