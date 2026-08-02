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

try {
  await page.goto(`${baseURL.replace(/\/$/, '')}/login?next=/dashboard`, { waitUntil: 'domcontentloaded' })

  const emailInput = page.locator('form input[type="email"]')
  const passwordInput = page.locator('form input[type="password"]')
  const submitButton = page.locator('form button[type="submit"]')

  try {
    await emailInput.waitFor({ state: 'visible', timeout: 30_000 })
    await passwordInput.waitFor({ state: 'visible', timeout: 30_000 })
    await submitButton.waitFor({ state: 'visible', timeout: 30_000 })
  } catch (error) {
    const url = page.url()
    const title = await page.title().catch(() => '')
    const bodyText = await page.locator('body').innerText().catch(() => '')
    fs.writeFileSync(path.join(diagnosticDirectory, 'login-page.html'), await page.content())
    fs.writeFileSync(path.join(diagnosticDirectory, 'login-page.txt'), `URL: ${url}\nTITLE: ${title}\n\n${bodyText}\n`)
    await page.screenshot({ path: path.join(diagnosticDirectory, 'login-page.png'), fullPage: true })
    throw new Error(`Login form was not available at ${url}: ${error instanceof Error ? error.message : String(error)}`)
  }

  await emailInput.fill(email)
  await passwordInput.fill(password)
  await expectEnabled(submitButton)

  await Promise.all([
    page.waitForURL(url => url.pathname.startsWith('/dashboard'), { timeout: 45_000 }),
    submitButton.click(),
  ])

  await page.waitForLoadState('networkidle').catch(() => undefined)
  await context.storageState({ path: storageStatePath })
  console.log(`Authenticated Playwright storage state written to ${storageStatePath}`)
} catch (error) {
  const url = page.url()
  const bodyText = await page.locator('body').innerText().catch(() => '')
  fs.writeFileSync(path.join(diagnosticDirectory, 'auth-failure.txt'), `URL: ${url}\n\n${bodyText}\n`)
  await page.screenshot({ path: path.join(diagnosticDirectory, 'auth-failure.png'), fullPage: true }).catch(() => undefined)
  throw error
} finally {
  await browser.close()
}

async function expectEnabled(locator) {
  const deadline = Date.now() + 15_000
  while (Date.now() < deadline) {
    if (await locator.isEnabled()) return
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error('Login submit button did not become enabled')
}
