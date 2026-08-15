import { expect, test, type Browser, type BrowserContextOptions, type Page } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'
import type { EducationCommandResponse, EducationCommandView } from '@/lib/education/command'

const BASE_URL = process.env.HARBOURVIEW_PUBLIC_BASE_URL || process.env.PLAYWRIGHT_BASE_URL
const evidenceRoot = path.join(process.cwd(), 'artifacts', 'education-command')

const REQUIRED_VIEWPORTS = [
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
] as const

const ALL_MOBILE_VIEWPORTS = [
  { width: 320, height: 700 },
  ...REQUIRED_VIEWPORTS,
] as const

const FIXTURE: EducationCommandResponse = {
  sourceState: 'loaded',
  generatedAt: '2026-08-15T22:00:00.000Z',
  context: {
    countryIso2: 'CA',
    countryLabel: 'Canada',
    roleId: 'exporter',
    roleLabel: 'Exporter / Supplier',
    allRoles: false,
  },
  impacts: [
    {
      id: 'signal:fixture-regulatory-change',
      kind: 'signal',
      title: 'Export documentation requirement changed',
      whatChanged: 'A verified regulatory source changed the documentation posture used by the market-access workflow.',
      whyItMatters: 'Exporters should review the affected route assumptions before relying on the previous documentation sequence.',
      recommendedAction: 'Review the source-backed delta and validate the affected market-access requirement.',
      occurredAt: '2026-08-15T18:30:00.000Z',
      sourceLabel: 'Verified regulator fixture',
      confidence: 94,
      moduleSlug: 'export-readiness-101',
      moduleMatchBasis: 'topic_match',
    },
  ],
  paths: [
    {
      id: 'pathway:fixture',
      title: 'Canada export access pathway',
      kind: 'operational_pathway',
      description: 'Existing market-access requirements for the selected jurisdiction and role. Requirement states are organization evidence states, not learner qualifications.',
      goal: 'market_access',
      modules: [],
      steps: [
        {
          id: 'step-1',
          order: 1,
          title: 'Authorization and route evidence',
          description: 'Validate the evidence required to advance the route.',
          state: 'in_review',
          requirements: [
            { id: 'req-1', title: 'Export authorization evidence', description: null, evidenceType: 'licence', required: true, state: 'in_review' },
            { id: 'req-2', title: 'Destination import authorization', description: null, evidenceType: 'permit', required: true, state: 'pending' },
          ],
        },
      ],
    },
    {
      id: 'track:export',
      title: 'Export Readiness',
      kind: 'education_track',
      description: '2 published modules in this track for the current role context.',
      goal: 'market_access',
      modules: ['export-readiness-101', 'gmp-compliance-essentials'],
      steps: [],
    },
  ],
  modules: [
    {
      id: 'module-export',
      slug: 'export-readiness-101',
      title: 'Export Readiness 101',
      description: 'Published orientation covering export documentation, permit frameworks and regulated distribution dependencies.',
      trackId: 'export',
      trackLabel: 'Export Readiness',
      audience: ['exporter', 'general'],
      sensitivity: 'standard',
      updatedAt: '2026-08-14T12:00:00.000Z',
      goal: 'market_access',
      roleMatch: true,
      generalAudience: true,
      jurisdictionMatch: true,
      evidenceState: 'current',
      reviewStatus: 'verified_primary_source',
      lastReviewedAt: '2026-08-14T12:00:00.000Z',
      nextReviewDueAt: '2026-09-14T12:00:00.000Z',
      publicationConfidence: 'high',
      controlledTopic: false,
      overlayTopics: ['export permits', 'market access'],
      overlayActionLabel: 'Validate route',
      sections: [
        { heading: 'Export route overview', body: 'Review the source-backed requirements before progressing a shipment or commercial route.', blockType: 'body' },
        { heading: 'Border rejection scenario', body: 'A shipment cannot advance because destination authorization evidence is incomplete. Identify the unresolved dependency before proceeding.', blockType: 'scenario' },
      ],
    },
    {
      id: 'module-gmp',
      slug: 'gmp-compliance-essentials',
      title: 'GMP Compliance Essentials',
      description: 'Published GMP and quality-system orientation used by regulated operators.',
      trackId: 'quality',
      trackLabel: 'Compliance & Quality',
      audience: ['exporter', 'gmp_quality'],
      sensitivity: 'controlled',
      updatedAt: '2026-07-01T12:00:00.000Z',
      goal: 'quality',
      roleMatch: true,
      generalAudience: false,
      jurisdictionMatch: false,
      evidenceState: 'review_required',
      reviewStatus: 'review_pending',
      lastReviewedAt: '2026-07-01T12:00:00.000Z',
      nextReviewDueAt: '2026-08-01T12:00:00.000Z',
      publicationConfidence: null,
      controlledTopic: true,
      overlayTopics: [],
      overlayActionLabel: null,
      sections: [
        { heading: 'Quality-system overview', body: 'Use the applicable quality-system source set for the actual market and activity.', blockType: 'body' },
      ],
    },
  ],
  practice: [
    {
      id: 'practice-border-rejection',
      moduleSlug: 'export-readiness-101',
      moduleTitle: 'Export Readiness 101',
      heading: 'Border rejection scenario',
      body: 'A shipment cannot advance because destination authorization evidence is incomplete. Identify the unresolved dependency before proceeding.',
      kind: 'scenario',
    },
  ],
  capabilities: {
    learnerProgress: false,
    assessmentAttempts: false,
    qualificationRecords: false,
    credentialRecords: false,
    scenarioEngine: true,
    teamQualificationMatrix: false,
    organizationPathwayProgress: true,
    explanation: 'Organization pathway evidence states are available. They are shown separately from learner competency because the repository does not currently connect them.',
  },
  limitations: [
    'No learner qualification or credential contract is connected to this Education Command fixture.',
    'Regulatory-change-to-module links are contextual topic matches, not assertions that retraining is mandated.',
  ],
}

function sharedContextOptions(): BrowserContextOptions {
  if (!BASE_URL) throw new Error('HARBOURVIEW_PUBLIC_BASE_URL or PLAYWRIGHT_BASE_URL is required')
  return { baseURL: BASE_URL }
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
    await page.goto('/login?next=%2Fdashboard', { waitUntil: 'domcontentloaded' })
    await page.getByLabel('Email address', { exact: true }).fill(email)
    await page.getByLabel('Password', { exact: true }).fill(password)
    await page.locator('form').getByRole('button', { name: 'Sign in', exact: true }).click()
    await page.waitForURL(url => url.pathname.startsWith('/dashboard'), { timeout: 45_000 })
    return context.storageState()
  } finally {
    await context.close()
  }
}

async function mockEducationCommand(page: Page) {
  await page.route('**/api/dashboard/education-command?**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(FIXTURE),
  }))
}

async function gotoEducation(page: Page) {
  const response = await page.goto('/dashboard?country=CA&role=exporter&section=education&page=education', {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  })
  expect(response?.status()).toBeLessThan(400)
  await expect(page.locator('[data-testid="education-command"]')).toBeVisible({ timeout: 30_000 })
  await expect(page.locator('[data-testid="education-now"]')).toBeVisible({ timeout: 30_000 })
}

async function assertNoDocumentOverflow(page: Page) {
  const geometry = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))
  expect(geometry.scrollWidth, `document overflowed: ${geometry.scrollWidth}px > ${geometry.clientWidth}px`).toBeLessThanOrEqual(geometry.clientWidth)
}

async function captureView(page: Page, view: EducationCommandView, width: number, height: number) {
  if (view !== 'now') {
    await page.getByRole('button', { name: view === 'qualifications' ? 'Qualifications' : view[0].toUpperCase() + view.slice(1), exact: true }).click()
    await expect(page.locator(`[data-testid="education-${view}"]`)).toBeVisible()
  }
  await assertNoDocumentOverflow(page)
  await page.screenshot({
    path: path.join(evidenceRoot, `education-command-${view}-${width}x${height}.png`),
    fullPage: true,
  })
}

test.describe('Education Command mobile evidence', () => {
  test('captures Now at every mobile viewport and all five views at the canonical viewport', async ({ browser }) => {
    test.setTimeout(300_000)
    await fs.mkdir(evidenceRoot, { recursive: true })
    const storageState = await authenticate(browser)

    for (const viewport of ALL_MOBILE_VIEWPORTS) {
      const context = await browser.newContext({
        ...sharedContextOptions(),
        viewport,
        storageState,
        isMobile: true,
        hasTouch: true,
      })
      try {
        const page = await context.newPage()
        await mockEducationCommand(page)
        await gotoEducation(page)
        await captureView(page, 'now', viewport.width, viewport.height)
        await expect(page.getByRole('button', { name: 'Now', exact: true })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Paths', exact: true })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Qualifications', exact: true })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Practice', exact: true })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Library', exact: true })).toBeVisible()

        if (viewport.width === 390 && viewport.height === 844) {
          for (const view of ['paths', 'qualifications', 'practice', 'library'] as const) {
            await captureView(page, view, viewport.width, viewport.height)
          }
        }
      } finally {
        await context.close()
      }
    }

    for (const viewport of REQUIRED_VIEWPORTS) {
      await expect.poll(async () => fs.stat(path.join(evidenceRoot, `education-command-now-${viewport.width}x${viewport.height}.png`)).then(() => true).catch(() => false)).toBe(true)
    }
  })
})
