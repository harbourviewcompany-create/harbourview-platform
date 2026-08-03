import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'

const baseURL = process.env.HARBOURVIEW_PUBLIC_BASE_URL || process.env.PLAYWRIGHT_BASE_URL
const email = process.env.PLAYWRIGHT_TEST_EMAIL
const password = process.env.PLAYWRIGHT_TEST_PASSWORD
const storageStatePath = process.env.PLAYWRIGHT_STORAGE_STATE || '.playwright/command-centre-auth.json'
const diagnosticDirectory = process.env.PLAYWRIGHT_AUTH_DIAGNOSTICS || 'test-results/auth-state'

if (!baseURL) throw new Error('HARBOURVIEW_PUBLIC_BASE_URL or PLAYWRIGHT_BASE_URL is required')
if (!email) throw new Error('PLAYWRIGHT_TEST_EMAIL is required')
if (!password) throw new Error('PLAYWRIGHT_TEST_PASSWORD is required')

fs.mkdirSync(path.dirname(storageStatePath), { recursive: true })
fs.mkdirSync(diagnosticDirectory, { recursive: true })

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext()
const page = await context.newPage()
const diagnostics = {
  console: [],
  pageErrors: [],
  failedRequests: [],
  authResponses: [],
}

page.on('console', message => diagnostics.console.push(`${message.type()}: ${message.text()}`))
page.on('pageerror', error => diagnostics.pageErrors.push(error.message))
page.on('requestfailed', request => diagnostics.failedRequests.push({
  method: request.method(),
  url: request.url(),
  failure: request.failure()?.errorText ?? 'unknown',
}))
page.on('response', response => {
  if (response.url().includes('/auth/v1/')) {
    diagnostics.authResponses.push({
      method: response.request().method(),
      url: response.url(),
      status: response.status(),
    })
  }
})

try {
  await page.goto(`${baseURL.replace(/\/$/, '')}/login?next=/dashboard`, { waitUntil: 'domcontentloaded' })

  const emailInput = page.locator('form input[type="email"]')
  const passwordInput = page.locator('form input[type="password"]')
  const submitButton = page.locator('form button[type="submit"]')

  await emailInput.waitFor({ state: 'visible', timeout: 30_000 })
  await passwordInput.waitFor({ state: 'visible', timeout: 30_000 })
  await submitButton.waitFor({ state: 'visible', timeout: 30_000 })

  await emailInput.fill(email)
  await passwordInput.fill(password)
  await waitUntilEnabled(submitButton)
  await submitButton.click()

  const outcome = await Promise.race([
    page.waitForURL(url => url.pathname.startsWith('/dashboard'), { timeout: 45_000 }).then(() => 'dashboard'),
    page.locator('form').locator('..').getByText(/not recognized|confirm your email|too many attempts|went wrong|failed/i)
      .first()
      .waitFor({ state: 'visible', timeout: 45_000 })
      .then(() => 'error'),
  ]).catch(() => 'timeout')

  if (outcome !== 'dashboard') {
    const feedback = await page.locator('form').locator('..').innerText().catch(() => '')
    throw new Error(`Harbourview login did not reach the dashboard (${outcome}). ${feedback}`)
  }

  await page.locator('.cc-app, .hvm-app').first().waitFor({ state: 'visible', timeout: 60_000 })
  await page.waitForLoadState('networkidle').catch(() => undefined)

  const cookies = await context.cookies()
  const authCookies = cookies.filter(cookie => cookie.name.startsWith('sb-'))
  if (authCookies.length === 0) throw new Error('Browser login succeeded without a persisted Supabase auth cookie')

  await context.storageState({ path: storageStatePath })
  console.log(`Authenticated Playwright storage state written to ${storageStatePath}`)
} catch (error) {
  const bodyText = await page.locator('body').innerText().catch(() => '')
  const cookies = await context.cookies().catch(() => [])
  const cookieSummary = cookies.map(cookie => ({
    name: cookie.name,
    domain: cookie.domain,
    path: cookie.path,
    httpOnly: cookie.httpOnly,
    secure: cookie.secure,
    sameSite: cookie.sameSite,
    expires: cookie.expires,
  }))
  fs.writeFileSync(
    path.join(diagnosticDirectory, 'auth-failure.txt'),
    [
      `URL: ${page.url()}`,
      `ERROR: ${error instanceof Error ? error.stack ?? error.message : String(error)}`,
      `COOKIES: ${JSON.stringify(cookieSummary, null, 2)}`,
      `DIAGNOSTICS: ${JSON.stringify(diagnostics, null, 2)}`,
      '',
      bodyText,
      '',
    ].join('\n'),
  )
  fs.writeFileSync(path.join(diagnosticDirectory, 'login-page.html'), await page.content().catch(() => ''))
  await page.screenshot({ path: path.join(diagnosticDirectory, 'auth-failure.png'), fullPage: true }).catch(() => undefined)
  throw error
} finally {
  await browser.close()
}

async function waitUntilEnabled(locator) {
  const deadline = Date.now() + 15_000
  while (Date.now() < deadline) {
    if (await locator.isEnabled()) return
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error('Login submit button did not become enabled')
}
