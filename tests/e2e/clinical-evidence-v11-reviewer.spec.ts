import { expect, test } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || process.env.HARBOURVIEW_PUBLIC_BASE_URL || 'http://127.0.0.1:3000'
const evidenceRoot = path.join(process.cwd(), 'artifacts', 'clinical-evidence-v1-1')

test('authenticated Clinical reviewer can inspect governed queues and source provenance', async ({ browser }) => {
  test.setTimeout(180_000)
  const email = process.env.E2E_TEST_USER_EMAIL
  const password = process.env.E2E_TEST_USER_PASSWORD
  if (!email || !password) throw new Error('E2E_TEST_USER_EMAIL and E2E_TEST_USER_PASSWORD are required')
  await fs.mkdir(evidenceRoot, { recursive: true })

  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } })
  const page = await context.newPage()
  await page.goto(`${BASE_URL}/login?next=%2Fclinical%2Freview`, { waitUntil: 'domcontentloaded' })
  await page.getByLabel('Email address', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.locator('form').getByRole('button', { name: 'Sign in', exact: true }).click()
  await page.waitForURL(url => url.pathname === '/clinical/review', { timeout: 45_000 })

  await expect(page.getByRole('heading', { name: 'Clinical Evidence V1.1 Workbench' })).toBeVisible()
  await expect(page.getByText('Evidence operations queue', { exact: true })).toBeVisible()
  await expect(page.getByText('Freshness queue', { exact: true })).toBeVisible()
  await expect(page.getByText(/Living Systematic Review on Cannabis and Other Plant-Based Treatments for Chronic Pain/i)).toBeVisible()
  await expect(page.getByText(/source identification never implies a clinical conclusion or grade/i)).toBeVisible()
  await expect(page.getByRole('group', { name: /Publication \/ supersession/i })).toBeVisible()
  await page.screenshot({ path: path.join(evidenceRoot, 'clinical-v1-1-reviewer-workbench-1440x1100.png'), fullPage: true })

  const sourceId = process.env.E2E_CLINICAL_SOURCE_ID
  if (!sourceId) throw new Error('E2E_CLINICAL_SOURCE_ID is required')
  await page.goto(`${BASE_URL}/clinical/review/source/${sourceId}`, { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: /Living Systematic Review on Cannabis and Other Plant-Based Treatments for Chronic Pain/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Side-by-side source inspection' })).toBeVisible()
  await expect(page.getByText('No immutable snapshot captured yet. The source remains in the snapshot-required queue.')).toBeVisible()
  await expect(page.getByText('No structured extraction exists yet. No evidence claim should progress to review from this source.')).toBeVisible()
  await page.screenshot({ path: path.join(evidenceRoot, 'clinical-v1-1-source-inspection-1440x1100.png'), fullPage: true })

  await context.close()
})
