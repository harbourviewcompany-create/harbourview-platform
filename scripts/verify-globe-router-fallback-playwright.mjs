#!/usr/bin/env node
import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium } = require(path.join(process.cwd(), '.tmp/globe-router-fallback/node_modules/playwright'))

const baseUrl = cleanBaseUrl(process.env.BASE_URL || process.env.HARBOURVIEW_PUBLIC_BASE_URL || 'http://127.0.0.1:3000')
const artifactDir = process.env.ARTIFACT_DIR || 'verification-results/globe-router-fallback'
const screenshotDir = path.join(artifactDir, 'screenshots')

const forbiddenLeakageStrings = [
  'View source listing',
  'sourceUrl',
  'sourceName',
  'Evidence captured',
  'provenanceSummary',
  'sourceEvidence',
  'verificationStatus',
  'availabilityStatus',
  'sellerAuthorizationStatus',
  'internalReviewNotes',
  'reviewedBy',
  'lastReviewedAt',
  'nextReviewDueAt',
]

const report = {
  verdict: 'PENDING',
  generatedAt: new Date().toISOString(),
  baseUrl,
  scenarios: [],
  leakage: [],
  failures: [],
}

await fs.mkdir(screenshotDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ locale: 'en-US' })

try {
  await assertFallbackScenario({
    label: 'germany-medical-fallback',
    viewport: { width: 1366, height: 768 },
    countrySearch: 'Germany',
    countryIso2: 'DE',
    countryLabel: 'Germany',
    roleButton: /Doctor \/ prescriber/i,
    roleParam: 'doctor_prescriber',
    roleLabel: 'Doctor / prescriber',
    intentButton: /Understand medical rules/i,
    intentParam: 'understand_medical_rules',
    intentLabel: 'Understand medical rules',
    requestedPath: '/education/medical',
    clickIntake: true,
  })

  await assertFallbackScenario({
    label: 'canada-regulatory-fallback-mobile',
    viewport: { width: 390, height: 844 },
    countrySearch: 'Canada',
    countryIso2: 'CA',
    countryLabel: 'Canada',
    roleButton: /Regulatory \/ compliance/i,
    roleParam: 'regulatory_compliance',
    roleLabel: 'Regulatory / compliance',
    intentButton: /View regulatory framework/i,
    intentParam: 'regulatory_framework',
    intentLabel: 'View regulatory framework',
    requestedPath: '/education/regulatory',
    clickIntake: false,
  })

  await assertResolvedScenario({
    label: 'germany-signals-confirmed-route',
    viewport: { width: 1366, height: 768 },
    countrySearch: 'Germany',
    countryIso2: 'DE',
    roleButton: /Importer/i,
    roleParam: 'importer',
    intentButton: /View market signals/i,
    intentParam: 'view_market_signals',
    expectedPath: '/signals',
  })

  report.verdict = report.failures.length ? 'FAIL' : 'PASS'
} finally {
  await browser.close()
}

await fs.writeFile(path.join(artifactDir, 'report.json'), JSON.stringify(report, null, 2))

if (report.failures.length) {
  console.error('FAIL globe router fallback Playwright verification')
  for (const failure of report.failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('PASS globe router fallback Playwright verification')
for (const scenario of report.scenarios) {
  console.log(`- ${scenario.label}: ${scenario.status}`)
}
console.log(`Artifacts: ${artifactDir}`)

async function assertFallbackScenario(options) {
  const page = await context.newPage()
  await page.setViewportSize(options.viewport)
  const scenario = { label: options.label, status: 'PENDING', url: null, screenshots: [] }
  report.scenarios.push(scenario)

  try {
    await completeRouterSelection(page, options)
    await page.getByTestId('globe-fallback-message').waitFor({ state: 'visible', timeout: 10000 })

    const contextText = await page.getByTestId('globe-fallback-context').innerText()
    assertIncludes(contextText, options.countryLabel, `${options.label} context country`)
    assertIncludes(contextText, options.roleLabel, `${options.label} context role`)
    assertIncludes(contextText, options.intentLabel, `${options.label} context intent`)
    assertIncludes(contextText, options.requestedPath, `${options.label} context requested path`)

    const fallbackText = await page.getByTestId('globe-fallback-message').innerText()
    assertIncludes(fallbackText, 'No public page is live for this selection yet', `${options.label} visible fallback copy`)

    await assertNoLeakage(page, options.label)

    const screenshotPath = path.join(screenshotDir, `${options.label}.png`)
    await page.screenshot({ path: screenshotPath, fullPage: true })
    scenario.screenshots.push(screenshotPath)

    const linkHref = await page.getByTestId('globe-fallback-intake-link').getAttribute('href')
    assertQueryParams(linkHref, {
      source: 'globe_router',
      mode: 'single_market',
      country: options.countryIso2,
      countries: options.countryIso2,
      role: options.roleParam,
      intent: options.intentParam,
      requestedPath: options.requestedPath,
    }, options.label)

    await page.getByTestId('globe-fallback-start-over').click()
    await page.getByPlaceholder('Search countries').waitFor({ state: 'visible', timeout: 5000 })
    await expectHidden(page, '[data-testid="globe-fallback-message"]', `${options.label} start-over clears fallback`)

    if (options.clickIntake) {
      await completeRouterSelection(page, options)
      await page.getByTestId('globe-fallback-intake-link').click()
      await page.waitForURL(/\/intake\?/, { timeout: 10000 })
      assertQueryParams(page.url(), {
        source: 'globe_router',
        mode: 'single_market',
        country: options.countryIso2,
        countries: options.countryIso2,
        role: options.roleParam,
        intent: options.intentParam,
        requestedPath: options.requestedPath,
      }, `${options.label} intake handoff`)
    }

    scenario.url = page.url()
    scenario.status = 'PASS'
  } catch (error) {
    scenario.status = 'FAIL'
    scenario.error = error.message
    report.failures.push(`${options.label}: ${error.message}`)
  } finally {
    await page.close()
  }
}

async function assertResolvedScenario(options) {
  const page = await context.newPage()
  await page.setViewportSize(options.viewport)
  const scenario = { label: options.label, status: 'PENDING', url: null, screenshots: [] }
  report.scenarios.push(scenario)

  try {
    await completeRouterSelection(page, options)
    await page.waitForURL(new RegExp(`${escapeRegex(options.expectedPath)}\\?`), { timeout: 10000 })

    const currentUrl = new URL(page.url())
    if (currentUrl.pathname !== options.expectedPath) {
      throw new Error(`expected ${options.expectedPath}, got ${currentUrl.pathname}`)
    }
    if (currentUrl.searchParams.get('country') !== options.countryIso2) {
      throw new Error(`expected country ${options.countryIso2}, got ${currentUrl.searchParams.get('country')}`)
    }
    if (currentUrl.searchParams.get('role') !== options.roleParam) {
      throw new Error(`expected role ${options.roleParam}, got ${currentUrl.searchParams.get('role')}`)
    }
    if (currentUrl.searchParams.get('intent') !== options.intentParam) {
      throw new Error(`expected intent ${options.intentParam}, got ${currentUrl.searchParams.get('intent')}`)
    }

    await assertNoLeakage(page, options.label)

    const screenshotPath = path.join(screenshotDir, `${options.label}.png`)
    await page.screenshot({ path: screenshotPath, fullPage: true })
    scenario.screenshots.push(screenshotPath)
    scenario.url = page.url()
    scenario.status = 'PASS'
  } catch (error) {
    scenario.status = 'FAIL'
    scenario.error = error.message
    report.failures.push(`${options.label}: ${error.message}`)
  } finally {
    await page.close()
  }
}

async function completeRouterSelection(page, options) {
  await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' })
  await page.getByPlaceholder('Search countries').fill(options.countrySearch)
  await page.getByRole('button', { name: new RegExp(`${escapeRegex(options.countrySearch)}.*${options.countryIso2}`, 'i') }).click()
  await page.getByRole('button', { name: options.roleButton }).click()
  await page.getByRole('button', { name: options.intentButton }).click()
  await page.getByRole('button', { name: /^Continue$/i }).click()
}

function assertQueryParams(href, expected, label) {
  if (!href) throw new Error(`${label}: missing href`)

  const url = new URL(href, baseUrl)
  for (const [key, value] of Object.entries(expected)) {
    const actual = url.searchParams.get(key)
    if (actual !== value) {
      throw new Error(`${label}: expected ${key}=${value}, got ${actual}`)
    }
  }
}

async function assertNoLeakage(page, label) {
  const html = await page.content()
  const leaked = forbiddenLeakageStrings.filter((token) => html.includes(token))
  report.leakage.push({ label, leaked })

  if (leaked.length) {
    throw new Error(`${label}: forbidden leakage strings present: ${leaked.join(', ')}`)
  }
}

function assertIncludes(text, expected, label) {
  if (!text.includes(expected)) {
    throw new Error(`${label}: expected to include "${expected}"`)
  }
}

async function expectHidden(page, selector, label) {
  const count = await page.locator(selector).count()
  if (count > 0 && await page.locator(selector).first().isVisible()) {
    throw new Error(label)
  }
}

function cleanBaseUrl(url) {
  return url.replace(/\/+$/, '')
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
