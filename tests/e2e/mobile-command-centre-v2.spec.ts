import fs from 'node:fs/promises'
import path from 'node:path'
import { expect, test, type Browser, type Page } from '@playwright/test'

const WIDTHS = [320, 360, 375, 390, 430, 768, 820, 1024, 1440]
const MOBILE_SECTION_IDS = [
  'daily-briefing',
  'market-intelligence',
  'marketplace',
  'supply',
  'opportunities',
  'signals',
  'compliance',
  'trade',
  'financial',
  'directories',
  'operations',
  'documents',
  'events',
  'education',
  'genetics',
  'clinical',
  'financing',
  'jobs',
  'account',
  'support',
]
const COMMAND_CENTRE_PAGE_IDS = [
  'briefing',
  'digest',
  'access-pathway',
  'marketplace',
  'evidence',
  'education',
  'regulatory',
  'local-intel',
  'signals',
  'watchlist',
  'settings',
  'genetics',
  'clinical',
  'compliance',
  'countries',
  'assistant',
  'documents',
  'events',
  'experts',
  'banking',
  'notifications',
  'kyb',
  'prices',
  'logistics',
  'jobs',
  'insurance',
  'licences',
  'trade-calc',
  'organization',
  'talent',
]
const evidenceRoot = path.join(process.cwd(), 'artifacts', 'mobile-command-v2')
const SAFE_LISTING_ID = '11111111-1111-4111-8111-111111111111'
const SAFE_LISTING_TITLE = 'Visual Safe Bulk Flower Lot'
const IS_ISOLATED_LOCAL_RUN = process.env.MOBILE_COMMAND_LOCAL_ISOLATED === '1'

type FailedResponse = {
  method: string
  pathname: string
  search: string
  status: number
}

function safeFileToken(value: string | undefined) {
  return (value ?? 'local').replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 100) || 'local'
}

function sanitizeSearchForEvidence(search: string) {
  if (!search) return ''
  const params = new URLSearchParams(search)
  for (const key of Array.from(params.keys())) {
    if (/token|secret|key|password|email/i.test(key)) params.set(key, '[redacted]')
  }
  const value = params.toString()
  return value ? `?${value}` : ''
}

function sanitizeUrlForEvidence(raw: string) {
  const url = new URL(raw)
  return `${url.origin}${url.pathname}${sanitizeSearchForEvidence(url.search)}`
}

function sanitizeDiagnostic(value: string) {
  return value
    .replace(/eyJ[A-Za-z0-9_-]{20,}/g, '[redacted-token]')
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [redacted]')
    .replace(/[A-Za-z0-9+/]{40,}={0,2}/g, '[redacted-secret]')
}

function contextOptions(width: number, storageState: Awaited<ReturnType<Browser['newContext']>> extends never ? never : string) {
  return {
    viewport: {
      width,
      height: width < 768 ? 900 : 960,
    },
    storageState,
    reducedMotion: 'reduce' as const,
  }
}

function isGenericResourceConsoleError(message: string) {
  return /^Failed to load resource: the server responded with a status of \d{3} \([^)]*\)$/i.test(message)
}

function isExpectedLocalDegradation(response: FailedResponse) {
  return IS_ISOLATED_LOCAL_RUN
    && response.method === 'GET'
    && response.pathname === '/api/country-intel'
    && response.status === 404
}

async function authenticate(browser: Browser) {
  const context = await browser.newContext()
  const page = await context.newPage()
  const email = process.env.MOBILE_COMMAND_TEST_EMAIL
  const password = process.env.MOBILE_COMMAND_TEST_PASSWORD
  if (!email || !password) throw new Error('MOBILE_COMMAND_TEST_EMAIL and MOBILE_COMMAND_TEST_PASSWORD are required')
  await page.goto('/login', { waitUntil: 'domcontentloaded' })
  await page.getByLabel('Email address').fill(email)
  await page.getByLabel('Password').fill(password)
  await Promise.all([
    page.waitForURL(/\/dashboard/, { timeout: 30_000 }),
    page.getByRole('button', { name: 'Sign in' }).click(),
  ])
  const storageStatePath = path.join(evidenceRoot, 'authenticated-storage-state.json')
  await fs.mkdir(evidenceRoot, { recursive: true })
  await context.storageState({ path: storageStatePath })
  await context.close()
  return storageStatePath
}

async function expectCommandState(
  page: Page,
  expected: {
    page: string
    section: string
    marketView: string
    tool: string | null
    listing: string | null
  },
) {
  await expect.poll(() => {
    const url = new URL(page.url())
    return {
      page: url.searchParams.get('page'),
      section: url.searchParams.get('section'),
      marketView: url.searchParams.get('marketView'),
      tool: url.searchParams.get('tool'),
      listing: url.searchParams.get('listing'),
    }
  }).toEqual(expected)
}

async function reloadTool(page: Page, tool: string, heading: string) {
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.locator(`[data-mobile-command-tool="${tool}"]`)).toBeVisible()
  await expect(page.getByRole('heading', { name: heading })).toBeVisible()
}

async function closeMarketplaceTool(page: Page, tool: string) {
  await page.getByRole('button', { name: 'Close workflow' }).click()
  await expect(page.locator(`[data-mobile-command-tool="${tool}"]`)).toHaveCount(0)
  await expect.poll(() => {
    const url = new URL(page.url())
    return {
      tool: url.searchParams.get('tool'),
      listing: url.searchParams.get('listing'),
    }
  }).toEqual({ tool: null, listing: null })
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
    test.setTimeout(1_800_000)
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

            // Closing a reloaded workflow restores URL state before the async
            // marketplace data boundary has necessarily repainted. Wait on the
            // seeded public fixture rather than racing the listing-card locator.
            const listingCard = page.locator('.hvm2-listing-card').filter({ hasText: SAFE_LISTING_TITLE }).first()
            await expect(listingCard).toBeVisible({ timeout: 30_000 })
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
            await expect.poll(() => new URL(page.url()).searchParams.get('tool')).toBeNull()

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