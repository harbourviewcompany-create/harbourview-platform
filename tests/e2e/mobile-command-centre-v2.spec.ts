import { expect, test, type Browser, type BrowserContextOptions, type Page } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'
import { COMMAND_CENTRE_PAGE_IDS } from '@/lib/platform/commandCentreRegistry'

const WIDTHS = [320, 360, 375, 390, 430, 768, 820, 1024, 1440] as const
const BASE_URL = process.env.HARBOURVIEW_PUBLIC_BASE_URL || process.env.PLAYWRIGHT_BASE_URL
const BYPASS_TOKEN = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
const IS_ISOLATED_LOCAL_RUN = Boolean(process.env.HARBOURVIEW_ALLOW_LOCAL_SUPABASE === '1' && BASE_URL?.includes('127.0.0.1'))
const SAFE_LISTING_ID = '00000000-0000-4000-8000-000000000127'
const SAFE_LISTING_TITLE = 'Visual Safe Bulk Flower Lot'
const MOBILE_SECTION_IDS = [
  'overview',
  'live-status',
  'market-intelligence',
  'marketplace',
  'supply',
  'next-actions',
  'weekly-signals',
  'personal-briefing',
  'search',
  'education',
  'jurisdiction',
  'market-status',
  'review-gates',
  'directories',
  'talent',
  'genetics',
  'clinical',
  'compliance',
  'network',
  'financing',
] as const

const evidenceRoot = path.join(process.cwd(), 'artifacts', 'mobile-command-v2')

type FailedResponse = {
  method: string
  pathname: string
  search: string
  status: number
}

type ExpectedCommandState = {
  page: string
  section: string
  marketView?: string
  tool?: string | null
  listing?: string | null
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

function isExpectedLocalDegradation(response: FailedResponse) {
  if (!IS_ISOLATED_LOCAL_RUN) return false
  const expectedReadOnlyPrefixes = [
    '/api/dashboard/',
    '/api/watchlist/',
    '/api/marketplace/my-',
    '/api/ai/briefing',
    '/api/country-intel',
  ]
  return expectedReadOnlyPrefixes.some(prefix => response.pathname.startsWith(prefix))
}

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

function contextOptions(width: number, storageState: BrowserContextOptions['storageState']): BrowserContextOptions {
  return {
    ...sharedContextOptions(),
    viewport: { width, height: width < 768 ? 900 : 960 },
    storageState,
    isMobile: width < 768,
    hasTouch: width < 768,
  }
}

async function expectCommandState(page: Page, expected: ExpectedCommandState) {
  await expect.poll(() => new URL(page.url()).pathname).toBe('/dashboard')
  const url = new URL(page.url())
  expect(url.searchParams.get('country')).toBe('CA')
  expect(url.searchParams.get('role')).toBe('exporter')
  expect(url.searchParams.get('page')).toBe(expected.page)
  expect(url.searchParams.get('section')).toBe(expected.section)
  if (expected.marketView !== undefined) expect(url.searchParams.get('marketView')).toBe(expected.marketView)
  if (expected.tool !== undefined) expect(url.searchParams.get('tool')).toBe(expected.tool)
  if (expected.listing !== undefined) expect(url.searchParams.get('listing')).toBe(expected.listing)
}

async function reloadTool(page: Page, tool: string, title: string) {
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.locator(`[data-mobile-command-tool="${tool}"]`)).toBeVisible()
  await expect(page.getByText(title, { exact: true })).toBeVisible()
}

async function closeMarketplaceTool(page: Page, tool: string) {
  await page.getByRole('button', { name: 'Close marketplace workflow' }).click()
  await expect(page.locator(`[data-mobile-command-tool="${tool}"]`)).toHaveCount(0)
  const url = new URL(page.url())
  expect(url.searchParams.get('tool')).toBeNull()
  expect(url.searchParams.get('listing')).toBeNull()
}

async function writeWidthEvidence(
  page: Page | null,
  width: number,
  report: Record<string, unknown>,
) {
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

test.describe('Command Centre authenticated responsive verification', () => {
  test.describe.configure({ mode: 'serial' })

  test('verifies mobile, tablet and desktop command surfaces from 320 through 1440', async ({ browser }) => {
    test.setTimeout(900_000)
    await fs.mkdir(evidenceRoot, { recursive: true })
    const storageState = await authenticate(browser)
    const aggregate: Array<Record<string, unknown>> = []
    const failures: string[] = []

    for (const width of WIDTHS) {
      const context = await browser.newContext(contextOptions(width, storageState))
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
          await expect(page.locator('.hvm2-bottom-nav')).toBeVisible()
          await expect(page.getByText('Operator command centre', { exact: true })).toBeVisible()
          await expect(page.locator('#market-intelligence')).toBeVisible()
          await expect(page.locator('#supply')).toBeVisible()
          await expect(page.locator('#directories')).toBeVisible()
          await expect(page.locator('#financing')).toBeVisible()
          await expect(page.getByText('⌘ Modules')).toHaveCount(0)
          await expect(page.locator('[data-command-module]')).toHaveCount(32)

          for (const section of MOBILE_SECTION_IDS) {
            await expect(page.locator(`#${section}`)).toHaveCount(1)
          }

          const commandLinkPaths = await page.locator('.hvm2-root a[href]').evaluateAll(links => links.map(link => {
            const href = (link as HTMLAnchorElement).href
            return new URL(href).pathname
          }))
          expect(commandLinkPaths.length).toBeGreaterThan(0)
          expect(commandLinkPaths.every(pathname => pathname === '/dashboard')).toBe(true)

          if (width === 390) {
            const equipmentTab = page.getByRole('tab', { name: /Equipment/ })
            await equipmentTab.click()
            await expectCommandState(page, {
              page: 'marketplace',
              section: 'marketplace',
              marketView: 'equipment',
              tool: null,
              listing: null,
            })
            await page.reload({ waitUntil: 'domcontentloaded' })
            await expect(equipmentTab).toHaveAttribute('aria-selected', 'true')

            const cannabisTab = page.getByRole('tab', { name: /Cannabis/ })
            await cannabisTab.click()
            await expectCommandState(page, {
              page: 'marketplace',
              section: 'marketplace',
              marketView: 'cannabis',
              tool: null,
              listing: null,
            })
            await page.reload({ waitUntil: 'domcontentloaded' })
            await expect(cannabisTab).toHaveAttribute('aria-selected', 'true')
            await expect(page.getByText(SAFE_LISTING_TITLE, { exact: true }).first()).toBeVisible()

            const marketplaceActions = page.locator('#marketplace .hvm2-quick-actions')
            const wantedAction = marketplaceActions.getByRole('link', { name: /Post wanted demand/ })
            await wantedAction.click()
            await expect(page.locator('[data-mobile-command-tool="wanted-intake"]')).toBeVisible()
            await expectCommandState(page, {
              page: 'marketplace',
              section: 'marketplace',
              marketView: 'wanted',
              tool: 'wanted-intake',
              listing: null,
            })
            await reloadTool(page, 'wanted-intake', 'Post a wanted requirement')
            await closeMarketplaceTool(page, 'wanted-intake')

            await cannabisTab.click()
            const supplyAction = marketplaceActions.getByRole('link', { name: /Submit supply/ })
            await supplyAction.click()
            await expect(page.locator('[data-mobile-command-tool="supply-intake"]')).toBeVisible()
            await expectCommandState(page, {
              page: 'marketplace',
              section: 'marketplace',
              marketView: 'cannabis',
              tool: 'supply-intake',
              listing: null,
            })
            await reloadTool(page, 'supply-intake', 'Submit supply for controlled review')
            await closeMarketplaceTool(page, 'supply-intake')

            const listingCard = page.locator('.hvm2-listing-card').filter({ hasText: SAFE_LISTING_TITLE }).first()
            await expect(listingCard).toBeVisible()
            await listingCard.getByRole('button', { name: 'Request reviewed introduction' }).click()
            await expect(page.locator('[data-mobile-command-tool="introduction"]')).toBeVisible()
            await expectCommandState(page, {
              page: 'marketplace',
              section: 'marketplace',
              marketView: 'cannabis',
              tool: 'introduction',
              listing: SAFE_LISTING_ID,
            })
            await reloadTool(page, 'introduction', `Request access to ${SAFE_LISTING_TITLE}`)
            const safeContext = page.locator('[data-mobile-command-tool="introduction"] .hvm2-workspace-context')
            await expect(safeContext).toContainText(SAFE_LISTING_TITLE)
            await expect(safeContext).toContainText('Publicly approved bulk flower supply fixture')
            await closeMarketplaceTool(page, 'introduction')

            const financingAction = marketplaceActions.getByRole('link', { name: /Request financing/ })
            await financingAction.click()
            await expect(page.locator('[data-mobile-command-tool="financing-intake"]')).toBeVisible()
            await expectCommandState(page, {
              page: 'trade-calc',
              section: 'financing',
              marketView: 'cannabis',
              tool: 'financing-intake',
              listing: null,
            })
            await reloadTool(page, 'financing-intake', 'Request financing support')
            await page.getByRole('button', { name: 'Close financing workflow' }).click()
            await expect(page.locator('[data-mobile-command-tool="financing-intake"]')).toHaveCount(0)
            expect(new URL(page.url()).searchParams.get('tool')).toBeNull()

            report.marketViewReload = 'equipment -> cannabis'
            report.containedWorkflows = ['wanted-intake', 'supply-intake', 'introduction', 'financing-intake']
            report.reloadRestored = ['marketView', 'wanted-intake', 'supply-intake', 'introduction', 'financing-intake']
            report.safeIntroductionListing = SAFE_LISTING_ID
          }

          const geometry = await page.evaluate(() => {
            const root = document.documentElement
            const body = document.body
            const bottomNav = document.querySelector<HTMLElement>('.hvm2-bottom-nav')
            const navRect = bottomNav?.getBoundingClientRect() ?? null
            return {
              scrollWidth: Math.max(root.scrollWidth, body.scrollWidth),
              clientWidth: root.clientWidth,
              horizontalOverflow: Math.max(0, Math.max(root.scrollWidth, body.scrollWidth) - root.clientWidth),
              bottomNav: navRect ? { top: navRect.top, bottom: navRect.bottom, height: navRect.height } : null,
              viewportHeight: window.innerHeight,
              sectionCount: document.querySelectorAll('.hvm2-main > section').length,
              moduleCount: document.querySelectorAll('[data-command-module]').length,
            }
          })

          expect(geometry.horizontalOverflow).toBeLessThanOrEqual(1)
          expect(geometry.sectionCount).toBe(MOBILE_SECTION_IDS.length)
          expect(geometry.moduleCount).toBe(32)
          expect(geometry.bottomNav).not.toBeNull()
          report.geometry = geometry
          report.shell = 'mobile-v2'
        } else {
          const desktopRoot = page.locator('.hv-cc-root:visible')
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
              await expect(page.locator('.hv-cc-root:visible')).toBeVisible()
              expect(new URL(page.url()).searchParams.get('page')).toBe(commandPage)
              verifiedPages.push(commandPage)
            }
            report.verifiedDesktopPages = verifiedPages
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
          report.shell = 'desktop-command-centre'
        }

        if (pageErrors.length || consoleErrors.length || unexpectedFailedResponses.length) {
          throw new Error(
            `Browser defects detected: ${pageErrors.length} page errors; ${consoleErrors.length} console errors; ${unexpectedFailedResponses.length} unexpected failed responses`,
          )
        }
        report.result = 'pass'
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
        await writeWidthEvidence(page, width, report)
        aggregate.push(report)
        await context.close().catch(() => {})
      }
    }

    const sourceSha = process.env.MOBILE_COMMAND_SOURCE_SHA || process.env.GITHUB_SHA || null
    const sourceToken = safeFileToken(sourceSha ?? undefined)
    await fs.writeFile(
      path.join(evidenceRoot, `mobile-command-v2-summary-${sourceToken}.json`),
      `${JSON.stringify({
        generatedAt: new Date().toISOString(),
        sourceSha,
        failures,
        reports: aggregate,
      }, null, 2)}\n`,
    )

    expect(failures, failures.join('\n')).toEqual([])
  })
})
