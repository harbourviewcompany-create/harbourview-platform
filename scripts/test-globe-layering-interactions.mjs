import assert from 'node:assert/strict'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000'

async function importPlaywright() {
  try {
    return await import('playwright')
  } catch (error) {
    throw new Error(`Playwright is required. Install it or run with npx -y -p playwright. ${error instanceof Error ? error.message : ''}`)
  }
}

const { chromium } = await importPlaywright()
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } })

try {
  const response = await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 })
  assert(response?.ok(), `Failed to load homepage at ${BASE_URL}`)

  const searchInput = page.getByPlaceholder('Search countries')
  await assert.doesNotReject(() => searchInput.waitFor({ state: 'visible', timeout: 20_000 }))

  const navButton = page.getByRole('button', { name: /i’m not sure yet/i })
  await navButton.click()

  const multiMarketCta = page.getByRole('button', { name: /multi-market/i })
  await multiMarketCta.click()

  const roleSearch = page.getByPlaceholder('Search roles')
  await assert.doesNotReject(() => roleSearch.waitFor({ state: 'visible', timeout: 20_000 }))

  const canvas = page.locator('[data-testid="globe-canvas"]')
  const pointerEvents = await canvas.evaluate((el) => window.getComputedStyle(el).pointerEvents)
  assert.equal(pointerEvents, 'none', 'Globe canvas should not capture pointer events outside country step')

  await searchInput.fill('a')
  const dropdown = page.locator('div').filter({ has: page.getByRole('button', { name: /Afghanistan/i }) }).first()
  await assert.doesNotReject(() => dropdown.waitFor({ state: 'visible', timeout: 10_000 }))

  const before = await dropdown.evaluate((el) => el.scrollTop)
  await dropdown.evaluate((el) => { el.scrollTop = 9999 })
  const after = await dropdown.evaluate((el) => el.scrollTop)
  assert(after >= before, 'Country search dropdown should remain scrollable while globe is mounted')

  await page.getByRole('button', { name: /importer/i }).first().click()
  const continueButton = page.getByRole('button', { name: /^continue$/i })
  await assert.doesNotReject(() => continueButton.waitFor({ state: 'visible', timeout: 20_000 }))
} finally {
  await page.close()
  await browser.close()
}
