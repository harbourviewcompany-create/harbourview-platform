import { expect, test, type Browser, type BrowserContextOptions, type Page } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'

const WIDTHS = [320, 375, 390, 430, 768] as const
const BASE_URL = process.env.HARBOURVIEW_PUBLIC_BASE_URL || process.env.PLAYWRIGHT_BASE_URL
const BYPASS_TOKEN = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
const IS_ISOLATED_LOCAL_RUN = Boolean(process.env.HARBOURVIEW_ALLOW_LOCAL_SUPABASE === '1' && BASE_URL?.includes('127.0.0.1'))
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

  const page = await context.newPage()
  page.setDefaultTimeout(15_000)
  page.setDefaultNavigationTimeout(45_000)

  try {
    await page.goto('/login?next=%2Fdashboard', { waitUntil: 'domcontentloaded', timeout: 45_000 })

    const emailInput = page.getByLabel('Email address', { exact: true })
    const passwordInput = page.getByLabel('Password', { exact: true })
    const submit = page.locator('form').getByRole('button', { name: 'Sign in', exact: true })

    await expect(emailInput).toBeVisible({ timeout: 15_000 })
    await expect(passwordInput).toBeVisible({ timeout: 15_000 })
    await emailInput.fill(email, { timeout: 15_000 })
    await passwordInput.fill(password, { timeout: 15_000 })
    await expect(submit).toBeEnabled({ timeout: 15_000 })
    await submit.click({ timeout: 15_000 })

    const outcome = await Promise.race([
      page.waitForURL(url => url.pathname.startsWith('/dashboard'), { timeout: 45_000 }).then(() => 'dashboard' as const),
      page.getByRole('alert').waitFor({ state: 'visible', timeout: 45_000 }).then(() => 'error' as const),
    ])

    if (outcome === 'error') {
      const feedback = sanitizeDiagnostic((await page.getByRole('alert').textContent())?.trim() || 'Unknown authentication error')
      throw new Error(`Authentication failed: ${feedback}`)
    }

    return await context.storageState()
  } catch (error) {
    await fs.mkdir(evidenceRoot, { recursive: true })
    await page.screenshot({ path: path.join(evidenceRoot, 'mobile-command-auth-failure.png'), fullPage: true }).catch(() => {})
    throw error
  } finally {
    await context.close().catch(() => {})
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

test.describe('Mobile Command Centre V2 authenticated visual verification', () => {
  test.describe.configure({ mode: 'serial' })

  test('renders contained mobile workflows at four widths and preserves desktop Command Centre at 768', async ({ browser }) => {
    test.setTimeout(360_000)
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
        page.setDefaultTimeout(15_000)
        page.setDefaultNavigationTimeout(60_000)
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
          await expect(page.locator('.hvm2-bottom-nav')).toBeVisible()
          await expect(page.getByText('Operator command centre', { exact: true })).toBeVisible()
          await expect(page.getByText('Market intelligence', { exact: true }).first()).toBeVisible()
          await expect(page.getByText('Supply', { exact: true }).first()).toBeVisible()
          await expect(page.getByText('Directories', { exact: true }).first()).toBeVisible()
          await expect(page.getByText('Trade financing', { exact: true }).first()).toBeVisible()
          await expect(page.getByText('⌘ Modules')).toHaveCount(0)

          for (const section of MOBILE_SECTION_IDS) {
            await expect(page.locator(`#${section}`)).toHaveCount(1)
          }

          const commandLinkPaths = await page.locator('.hvm2-root a[href]').evaluateAll((links) => links.map((link) => {
            const href = (link as HTMLAnchorElement).href
            return new URL(href).pathname
          }))
          expect(commandLinkPaths.length).toBeGreaterThan(0)
          expect(commandLinkPaths.every(pathname => pathname === '/dashboard')).toBe(true)

          if (width === 390) {
            const marketplaceActions = page.locator('#marketplace .hvm2-quick-actions')
            const wantedAction = marketplaceActions.getByRole('link', { name: /Post wanted demand/ })
            await expect(wantedAction).toHaveAttribute('href', /tool=wanted-intake/)
            await wantedAction.click({ timeout: 15_000 })
            await expect(page.locator('[data-mobile-command-tool="wanted-intake"]')).toBeVisible()
            await expect(page.getByText('Post a wanted requirement', { exact: true })).toBeVisible()
            await expect.poll(() => new URL(page!.url()).searchParams.get('page')).toBe('marketplace')
            let activeUrl = new URL(page.url())
            expect(activeUrl.pathname).toBe('/dashboard')
            expect(activeUrl.searchParams.get('section')).toBe('marketplace')
            expect(activeUrl.searchParams.get('tool')).toBe('wanted-intake')
            expect(activeUrl.searchParams.get('country')).toBe('CA')
            expect(activeUrl.searchParams.get('role')).toBe('exporter')
            await page.getByRole('button', { name: 'Close marketplace workflow' }).click()
            await expect(page.locator('[data-mobile-command-tool="wanted-intake"]')).toHaveCount(0)

            const financingAction = marketplaceActions.getByRole('link', { name: /Request financing/ })
            await expect(financingAction).toHaveAttribute('href', /tool=financing-intake/)
            await financingAction.click({ timeout: 15_000 })
            await expect(page.locator('[data-mobile-command-tool="financing-intake"]')).toBeVisible()
            await expect(page.getByText('Request financing support', { exact: true })).toBeVisible()
            await expect.poll(() => new URL(page!.url()).searchParams.get('page')).toBe('trade-calc')
            activeUrl = new URL(page.url())
            expect(activeUrl.pathname).toBe('/dashboard')
            expect(activeUrl.searchParams.get('section')).toBe('financing')
            expect(activeUrl.searchParams.get('tool')).toBe('financing-intake')
            await page.getByRole('button', { name: 'Close financing workflow' }).click()
            await expect(page.locator('[data-mobile-command-tool="financing-intake"]')).toHaveCount(0)
            report.containedWorkflows = ['wanted-intake', 'financing-intake']
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
            }
          })

          expect(geometry.horizontalOverflow).toBeLessThanOrEqual(1)
          expect(geometry.sectionCount).toBe(MOBILE_SECTION_IDS.length)
          expect(geometry.bottomNav).not.toBeNull()
          report.geometry = geometry
          report.shell = 'mobile-v2'
        } else {
          await expect(page.locator('[data-mobile-command-version="2"]')).toHaveCount(0)
          await expect(page.getByText('Briefing Room', { exact: true }).first()).toBeVisible()
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
