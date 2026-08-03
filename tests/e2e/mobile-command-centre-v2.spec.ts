import { expect, test, type Browser, type BrowserContextOptions } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'

const WIDTHS = [320, 375, 390, 430, 768] as const
const BASE_URL = process.env.HARBOURVIEW_PUBLIC_BASE_URL || process.env.PLAYWRIGHT_BASE_URL
const BYPASS_TOKEN = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
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

function safeFileToken(value: string | undefined) {
  return (value || 'local').replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 80)
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
    await page.getByLabel('Email address').fill(email)
    await page.getByLabel('Password').fill(password)
    await page.getByRole('button', { name: 'Sign in', exact: true }).click()
    await page.waitForURL(url => url.pathname.startsWith('/dashboard'), { timeout: 30_000 })
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

test.describe('Mobile Command Centre V2 authenticated visual verification', () => {
  test.describe.configure({ mode: 'serial' })

  test('renders the rebuilt mobile command at four mobile widths and preserves desktop at 768', async ({ browser }) => {
    await fs.mkdir(evidenceRoot, { recursive: true })
    const storageState = await authenticate(browser)
    const aggregate: Array<Record<string, unknown>> = []

    for (const width of WIDTHS) {
      const context = await browser.newContext(contextOptions(width, storageState))
      try {
        const page = await context.newPage()
        const pageErrors: string[] = []
        const consoleErrors: string[] = []
        page.on('pageerror', error => pageErrors.push(error.message))
        page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()) })

        const response = await page.goto('/dashboard?country=CA&role=exporter', { waitUntil: 'domcontentloaded', timeout: 60_000 })
        await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {})
        expect(response?.status()).toBeLessThan(400)

        const report: Record<string, unknown> = {
          width,
          finalUrl: page.url(),
          status: response?.status() ?? null,
          pageErrors,
          consoleErrors,
        }

        if (width < 768) {
          await expect(page.locator('[data-mobile-command-version="2"]')).toBeVisible()
          await expect(page.locator('.hvm2-bottom-nav')).toBeVisible()
          await expect(page.getByText('Operator command centre', { exact: true })).toBeVisible()
          await expect(page.getByText('Market intelligence', { exact: true }).first()).toBeVisible()
          await expect(page.getByText('Supply', { exact: true }).first()).toBeVisible()
          await expect(page.getByText('Directories', { exact: true }).first()).toBeVisible()
          await expect(page.getByText('Trade financing', { exact: true }).first()).toBeVisible()
          await expect(page.getByText('⌘ Modules')).toHaveCount(0)

          for (const section of MOBILE_SECTION_IDS) await expect(page.locator(`#${section}`)).toHaveCount(1)

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
          await expect(page.locator('.hv-cc-root')).toBeVisible()
          report.shell = 'desktop-command-centre'
        }

        expect(pageErrors).toEqual([])
        expect(consoleErrors).toEqual([])

        const screenshot = `mobile-command-v2-${width}.png`
        await page.screenshot({ path: path.join(evidenceRoot, screenshot), fullPage: true })
        report.screenshot = screenshot
        await fs.writeFile(path.join(evidenceRoot, `mobile-command-v2-${width}.json`), JSON.stringify(report, null, 2))
        aggregate.push(report)
      } finally {
        await context.close()
      }
    }

    const sourceToken = safeFileToken(process.env.GITHUB_SHA)
    await fs.writeFile(path.join(evidenceRoot, `mobile-command-v2-summary-${sourceToken}.json`), JSON.stringify({
      generatedAt: new Date().toISOString(),
      sourceSha: process.env.GITHUB_SHA ?? null,
      reports: aggregate,
    }, null, 2))
  })
})
