import { expect, test, type Browser, type BrowserContextOptions, type Page } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'

const BASE_URL = process.env.HARBOURVIEW_PUBLIC_BASE_URL || process.env.PLAYWRIGHT_BASE_URL
const BYPASS_TOKEN = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
const DIRECT_EVENT_ID = process.env.DECISION_INTEL_EVENT_ID
const EVIDENCE_DIR = path.join(process.cwd(), 'artifacts', 'decision-intel-first-slice')
const VIEWPORTS = [
  { width: 320, height: 700 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
] as const

function contextOptions(): BrowserContextOptions {
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
  const context = await browser.newContext({ ...contextOptions(), viewport: { width: 390, height: 844 } })
  try {
    const page = await context.newPage()
    const nextPath = DIRECT_EVENT_ID
      ? `/dashboard/intel/events/${encodeURIComponent(DIRECT_EVENT_ID)}`
      : '/dashboard'
    await page.goto(`/login?next=${encodeURIComponent(nextPath)}`, { waitUntil: 'domcontentloaded' })
    await page.getByLabel('Email address', { exact: true }).fill(email)
    await page.getByLabel('Password', { exact: true }).fill(password)
    await page.locator('form').getByRole('button', { name: 'Sign in', exact: true }).click()
    await page.waitForURL(url => url.pathname.startsWith('/dashboard'), { timeout: 45_000 })
    return context.storageState()
  } finally {
    await context.close()
  }
}

async function openDossier(page: Page) {
  if (DIRECT_EVENT_ID) {
    const response = await page.goto(`/dashboard/intel/events/${encodeURIComponent(DIRECT_EVENT_ID)}`, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    })
    expect(response?.status()).toBeLessThan(400)
    return
  }

  const response = await page.goto('/dashboard?country=CA&role=exporter&section=weekly-signals&page=signals', {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  })
  expect(response?.status()).toBeLessThan(400)

  const dossierLink = page.getByRole('link', { name: /Open intelligence dossier:/ }).first()
  await expect(dossierLink).toBeVisible()
  await dossierLink.click()
  await page.waitForURL(url => url.pathname.startsWith('/dashboard/intel/events/'), { timeout: 30_000 })
}

async function capture(page: Page, name: string) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true })
  await page.screenshot({ path: path.join(EVIDENCE_DIR, name), fullPage: true })
}

test.describe('Decision Intelligence first slice', () => {
  test('mobile Intel dossiers preserve evidence and decision hierarchy at required widths', async ({ browser }) => {
    const storageState = await authenticate(browser)

    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({ ...contextOptions(), storageState, viewport, isMobile: true, hasTouch: true })
      try {
        const page = await context.newPage()
        await openDossier(page)

        await expect(page.getByText('Recommended posture', { exact: true })).toBeVisible()
        await expect(page.getByText('What happened', { exact: true })).toBeVisible()
        await expect(page.getByText('Why it matters', { exact: true })).toBeVisible()
        await expect(page.getByText('Evidence', { exact: true })).toBeVisible()
        await expect(page.getByText('Unknowns', { exact: true })).toBeVisible()
        await expect(page.getByText(/Legacy reviewed state is not treated as verified intelligence/)).toBeVisible()

        const body = await page.locator('body').innerText()
        expect(body).not.toContain('internalReviewNotes')
        expect(body).not.toContain('sourceEvidence')
        expect(body).not.toContain('SUPABASE_SERVICE_ROLE_KEY')
        expect(body).not.toContain('storage_path')
        expect(body).not.toContain('privateNotes')

        await capture(page, `${viewport.width}x${viewport.height}-dossier.png`)
      } finally {
        await context.close()
      }
    }
  })

  test('desktop dossier preserves the decision/evidence hierarchy', async ({ browser }) => {
    const storageState = await authenticate(browser)
    const context = await browser.newContext({ ...contextOptions(), storageState, viewport: { width: 1440, height: 1000 } })
    try {
      const page = await context.newPage()
      await openDossier(page)
      await expect(page.locator('h1')).toBeVisible()
      await expect(page.getByText('Commercial implications', { exact: true })).toBeVisible()
      await expect(page.getByText('Regulatory implications', { exact: true })).toBeVisible()
      await expect(page.getByText('Confidence rationale', { exact: true })).toBeVisible()
      await expect(page.getByText('Contradictions', { exact: true })).toBeVisible()
      await capture(page, '1440x1000-dossier.png')
    } finally {
      await context.close()
    }
  })
})
