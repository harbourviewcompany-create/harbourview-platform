import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'

const baseURL = process.env.HARBOURVIEW_PUBLIC_BASE_URL || process.env.PLAYWRIGHT_BASE_URL
const email = process.env.PLAYWRIGHT_TEST_EMAIL
const password = process.env.PLAYWRIGHT_TEST_PASSWORD
const storageStatePath = process.env.PLAYWRIGHT_STORAGE_STATE || '.playwright/command-centre-auth.json'

if (!baseURL) throw new Error('HARBOURVIEW_PUBLIC_BASE_URL or PLAYWRIGHT_BASE_URL is required')
if (!email) throw new Error('PLAYWRIGHT_TEST_EMAIL is required')
if (!password) throw new Error('PLAYWRIGHT_TEST_PASSWORD is required')

fs.mkdirSync(path.dirname(storageStatePath), { recursive: true })

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext()
const page = await context.newPage()

try {
  await page.goto(`${baseURL.replace(/\/$/, '')}/login?next=/dashboard`, { waitUntil: 'domcontentloaded' })
  await page.getByLabel('Email address').fill(email)
  await page.getByLabel('Password').fill(password)
  await Promise.all([
    page.waitForURL(url => url.pathname.startsWith('/dashboard'), { timeout: 45_000 }),
    page.getByRole('button', { name: /^Sign in$/ }).click(),
  ])
  await page.waitForLoadState('networkidle').catch(() => undefined)
  await context.storageState({ path: storageStatePath })
  console.log(`Authenticated Playwright storage state written to ${storageStatePath}`)
} finally {
  await browser.close()
}
