import { expect, test, type Browser, type BrowserContextOptions, type Page } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'

const WIDTHS = [320, 375, 390, 430, 768] as const
const BASE_URL = process.env.HARBOURVIEW_PUBLIC_BASE_URL || process.env.PLAYWRIGHT_BASE_URL
const BYPASS_TOKEN = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
const IS_ISOLATED_LOCAL_RUN = process.env.HARBOURVIEW_ALLOW_LOCAL_SUPABASE === '1' && Boolean(BASE_URL?.includes('127.0.0.1'))
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
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(/(access[_-]?token|refresh[_-]?token|authorization|cookie|password)(\s*[:=]\s*)([^\s,;]+)/gi, '$1$2[redacted]')
    .replace(/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/g, '[redacted-jwt]')
    .slice(0, 600)
}

function isExpectedLocalDegradation(response: FailedResponse) {
  if (!IS_ISOLATED_LOCAL_RUN) return false

  return (
    (response.method === 'POST' && response.pathname === '/api/ai/briefing' && response.status === 503) ||
    (response.method === 'GET' && response.pathname === '/api/country-intel' && response.status === 404) ||
    (response.method === 'GET' && response.pathname === '/api/dashboard/signals' && response.status === 500)
  )
}

function isGenericResourceConsoleError(value: string) {
  return value.startsWith('Failed to load resource: the server responded with a status of')
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
    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await page.getByPlaceholder('you@example.com').fill(email)
    await page.locator('input[type="password"]').fill(password)
    const submit = page.locator('form').getByRole('button', { name: 'Sign in', exact: true })
    await expect(submit).toBeEnabled()
    await submit.click()
    await page.waitForURL(url => url.pathname.startsWith('/dashboard'), { timeout: 30_000 })
    return await context.storageState()
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

  test('renders the rebuilt mobile command at four mobile widths and preserves desktop at 768', async ({ browser }) => {
    test.setTimeout(240_000)
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
            search: url.search,
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
        await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {})

        report.finalUrl = page.url()
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

          const wantedHref = await page.getByRole('link', { name: 'Post wanted demand' }).getAttribute('href')
          expect(wantedHref).toContain('country=CA')
          expect(wantedHref).toContain('role=exporter')

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
          await expect(page.getByRole('heading', { name: 'Briefing Room', exact: true })).toBeVisible()
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
