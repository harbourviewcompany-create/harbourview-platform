import { expect, test, type Browser, type Page } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'

const BASE_URL = process.env.HARBOURVIEW_PUBLIC_BASE_URL || process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000'
const AUTH_AVAILABLE = Boolean(process.env.E2E_TEST_USER_EMAIL && process.env.E2E_TEST_USER_PASSWORD)
const INVITE_TOKEN = process.env.E2E_ORG_INVITE_TOKEN ?? ''
const evidenceRoot = path.join(process.cwd(), 'artifacts', 'p0-identity-org-context')
const COMMAND_RETURN = '/dashboard?country=MX&role=doctor_prescriber&page=briefing&section=overview'

const VIEWPORTS = [
  { width: 375, height: 812, file: '375x812-organization-create.png' },
  { width: 390, height: 844, file: '390x844-organization-create.png' },
  { width: 430, height: 932, file: '430x932-organization-create.png' },
] as const

async function authenticate(browser: Browser) {
  const email = process.env.E2E_TEST_USER_EMAIL
  const password = process.env.E2E_TEST_USER_PASSWORD
  if (!email || !password) throw new Error('Authenticated organization E2E credentials are required')

  const context = await browser.newContext({
    baseURL: BASE_URL,
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
  })
  try {
    const page = await context.newPage()
    await page.goto(`/login?next=${encodeURIComponent(COMMAND_RETURN)}`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await page.getByLabel('Email address', { exact: true }).fill(email)
    await page.getByLabel('Password', { exact: true }).fill(password)
    await page.locator('form').getByRole('button', { name: 'Sign in', exact: true }).click()
    await page.waitForURL(url => url.pathname === '/dashboard', { timeout: 45_000 })
    return await context.storageState()
  } finally {
    await context.close()
  }
}

async function assertNoMarketingShell(page: Page) {
  await expect(page.getByRole('button', { name: 'Toggle menu' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Supply Catalog', exact: true })).toHaveCount(0)
}

async function readOrgContext(page: Page) {
  return await page.evaluate(async () => {
    const response = await fetch('/api/org/me', { cache: 'no-store' })
    return { status: response.status, payload: await response.json() }
  }) as {
    status: number
    payload: {
      data?: {
        active_workspace_id: string | null
        memberships: Array<{ workspace_id: string; role: string; status: string; workspace: { name?: string | null; status?: string | null } | null }>
      }
    }
  }
}

test.beforeAll(async () => {
  await fs.mkdir(evidenceRoot, { recursive: true })
})

for (const viewport of VIEWPORTS) {
  test(`Market Routing exposes production identity entry at ${viewport.width}x${viewport.height}`, async ({ browser }) => {
    const context = await browser.newContext({
      baseURL: BASE_URL,
      viewport: { width: viewport.width, height: viewport.height },
      isMobile: true,
      hasTouch: true,
      reducedMotion: 'reduce',
    })
    const page = await context.newPage()
    try {
      const response = await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 })
      expect(response?.status()).toBeLessThan(400)

      const routing = page.getByText('Market Routing', { exact: true })
      await expect(routing).toBeVisible()
      await expect(page.getByRole('link', { name: 'Sign in', exact: true })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Create account', exact: true })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Create organization', exact: true })).toBeVisible()
      await expect(page.getByPlaceholder('Country, U.S. state, or province')).toBeVisible()

      const metrics = await page.evaluate(() => ({
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        scrollWidth: document.documentElement.scrollWidth,
      }))
      expect(metrics.innerWidth).toBe(viewport.width)
      expect(metrics.innerHeight).toBe(viewport.height)
      expect(metrics.scrollWidth).toBeLessThanOrEqual(viewport.width)
    } finally {
      await context.close()
    }
  })
}

test('selected market keeps account and organization onboarding return context', async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: BASE_URL,
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 })
    const search = page.getByPlaceholder('Country, U.S. state, or province')
    await search.fill('Canada')
    await page.getByRole('option', { name: /Canada/ }).click()

    await expect(page.getByRole('button', { name: /Enter Canada Market/i })).toBeVisible({ timeout: 30_000 })
    const createAccount = page.getByRole('link', { name: 'Create account', exact: true }).last()
    const createOrganization = page.getByRole('link', { name: 'Create organization', exact: true }).last()
    await expect(createAccount).toBeVisible()
    await expect(createOrganization).toBeVisible()

    const accountHref = await createAccount.getAttribute('href')
    const organizationHref = await createOrganization.getAttribute('href')
    expect(accountHref).toContain('next=')
    expect(decodeURIComponent(accountHref ?? '')).toContain('/dashboard?country=CA')
    expect(organizationHref).toContain('returnTo=')
    expect(decodeURIComponent(organizationHref ?? '')).toContain('/dashboard?country=CA')
  } finally {
    await context.close()
  }
})

test.describe.serial('authenticated organization onboarding', () => {
  let storageState: Awaited<ReturnType<typeof authenticate>> | undefined
  let createdWorkspaceId = ''

  test.beforeAll(async ({ browser }) => {
    if (!AUTH_AVAILABLE) return
    storageState = await authenticate(browser)
  })

  test('Command create action completes through the real API and clears the organization attention state', async ({ browser }) => {
    test.skip(!AUTH_AVAILABLE || !storageState, 'Authenticated isolated Supabase fixture is not available')

    const context = await browser.newContext({
      baseURL: BASE_URL,
      storageState,
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      reducedMotion: 'reduce',
    })
    const page = await context.newPage()
    try {
      const response = await page.goto(COMMAND_RETURN, { waitUntil: 'domcontentloaded', timeout: 60_000 })
      expect(response?.status()).toBeLessThan(400)
      await expect(page.locator('[data-mobile-command-version="2"]')).toBeVisible({ timeout: 30_000 })

      const createAction = page.getByRole('link', { name: /Create an organization profile/i })
      const joinAction = page.getByRole('link', { name: /Join an organization/i })
      await expect(createAction).toBeVisible()
      await expect(joinAction).toBeVisible()

      await createAction.click()
      await page.waitForURL(url => url.pathname === '/organization/new', { timeout: 20_000 })
      await assertNoMarketingShell(page)
      expect(new URL(page.url()).searchParams.get('country')).toBe('MX')
      expect(new URL(page.url()).searchParams.get('returnTo')).toBe(COMMAND_RETURN)

      const legalName = `Harbourview E2E ${Date.now()}`
      await page.getByText('Legal name', { exact: true }).locator('..').getByRole('textbox').fill(legalName)
      await expect(page.getByText('Country code', { exact: true }).locator('..').getByRole('textbox')).toHaveValue('MX')
      await page.getByRole('button', { name: 'Create organization', exact: true }).click()

      await page.waitForURL(url => `${url.pathname}${url.search}` === COMMAND_RETURN, { timeout: 30_000 })
      await expect(page.locator('[data-mobile-command-version="2"]')).toBeVisible({ timeout: 30_000 })

      const orgContext = await readOrgContext(page)
      expect(orgContext.status).toBe(200)
      createdWorkspaceId = orgContext.payload.data?.active_workspace_id ?? ''
      expect(createdWorkspaceId).toMatch(/^[0-9a-f-]{36}$/)
      const createdMembership = orgContext.payload.data?.memberships.find(item => item.workspace_id === createdWorkspaceId)
      expect(createdMembership?.status).toBe('active')
      expect(createdMembership?.role).toBe('admin')
      expect(createdMembership?.workspace?.status).toBe('active')

      await expect(page.getByRole('link', { name: /Create an organization profile/i })).toHaveCount(0)
      await expect(page.getByRole('link', { name: /Join an organization/i })).toHaveCount(0)
      await page.screenshot({ path: path.join(evidenceRoot, '390x844-command-active-organization.png'), fullPage: false, animations: 'disabled' })
    } finally {
      await context.close()
    }
  })

  test('Market Routing Create organization actually navigates at every required mobile viewport', async ({ browser }) => {
    test.skip(!AUTH_AVAILABLE || !storageState, 'Authenticated isolated Supabase fixture is not available')

    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({
        baseURL: BASE_URL,
        storageState,
        viewport: { width: viewport.width, height: viewport.height },
        isMobile: true,
        hasTouch: true,
        reducedMotion: 'reduce',
      })
      const page = await context.newPage()
      try {
        await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 })
        const search = page.getByPlaceholder('Country, U.S. state, or province')
        await search.fill('Canada')
        await page.getByRole('option', { name: /Canada/ }).click()
        await expect(page.getByRole('button', { name: /Enter Canada Market/i })).toBeVisible({ timeout: 30_000 })

        const createOrganization = page.getByRole('link', { name: 'Create organization', exact: true }).last()
        await expect(createOrganization).toBeVisible()
        await createOrganization.click()
        await page.waitForURL(url => url.pathname === '/organization/new', { timeout: 20_000 })

        const url = new URL(page.url())
        expect(url.searchParams.get('country')).toBe('CA')
        expect(url.searchParams.get('returnTo')).toBe('/dashboard?country=CA&page=briefing&section=overview')
        await expect(page.getByRole('heading', { name: 'Create organization', exact: true })).toBeVisible()
        await assertNoMarketingShell(page)
        await page.screenshot({ path: path.join(evidenceRoot, viewport.file), fullPage: false, animations: 'disabled' })
      } finally {
        await context.close()
      }
    }
  })

  test('Market Routing Join organization navigates with the selected market return context', async ({ browser }) => {
    test.skip(!AUTH_AVAILABLE || !storageState, 'Authenticated isolated Supabase fixture is not available')

    const context = await browser.newContext({
      baseURL: BASE_URL,
      storageState,
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      reducedMotion: 'reduce',
    })
    const page = await context.newPage()
    try {
      await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 })
      const search = page.getByPlaceholder('Country, U.S. state, or province')
      await search.fill('Mexico')
      await page.getByRole('option', { name: 'Mexico MX', exact: true }).click()
      const joinOrganization = page.getByRole('link', { name: 'Join organization', exact: true }).first()
      await expect(joinOrganization).toBeVisible()
      await joinOrganization.click()
      await page.waitForURL(url => url.pathname === '/organization/join', { timeout: 20_000 })
      expect(new URL(page.url()).searchParams.get('returnTo')).toBe('/dashboard?country=MX&page=briefing&section=overview')
      await assertNoMarketingShell(page)
    } finally {
      await context.close()
    }
  })

  test('Join organization exposes a real failure state, retries successfully, and activates the joined organization', async ({ browser }) => {
    test.skip(!AUTH_AVAILABLE || !storageState || !INVITE_TOKEN, 'Authenticated invitation fixture is not available')

    const context = await browser.newContext({
      baseURL: BASE_URL,
      storageState,
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      reducedMotion: 'reduce',
    })
    const page = await context.newPage()
    try {
      await page.goto(`/organization/join?returnTo=${encodeURIComponent(COMMAND_RETURN)}`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
      await assertNoMarketingShell(page)

      const tokenInput = page.getByPlaceholder('Paste invitation token')
      await tokenInput.fill('f'.repeat(64))
      await page.getByRole('button', { name: 'Join organization', exact: true }).click()
      await expect(page.getByRole('alert').filter({ hasText: 'could not be found' })).toContainText('could not be found')

      await tokenInput.fill(INVITE_TOKEN)
      await page.getByRole('button', { name: 'Join organization', exact: true }).click()
      await expect(page.getByRole('status')).toContainText('Invitation accepted')
      await page.waitForURL(url => `${url.pathname}${url.search}` === COMMAND_RETURN, { timeout: 30_000 })

      const orgContext = await readOrgContext(page)
      expect(orgContext.status).toBe(200)
      expect(orgContext.payload.data?.memberships.length).toBeGreaterThanOrEqual(2)
      expect(orgContext.payload.data?.active_workspace_id).not.toBe(createdWorkspaceId)
      await page.screenshot({ path: path.join(evidenceRoot, '390x844-command-after-join.png'), fullPage: false, animations: 'disabled' })
    } finally {
      await context.close()
    }
  })

  test('Personal mode and multi-organization switching remain functional in Manage organizations', async ({ browser }) => {
    test.skip(!AUTH_AVAILABLE || !storageState || !createdWorkspaceId, 'Authenticated multi-organization fixture is not available')

    const context = await browser.newContext({
      baseURL: BASE_URL,
      storageState,
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      reducedMotion: 'reduce',
    })
    const page = await context.newPage()
    try {
      await page.goto(`/organization?returnTo=${encodeURIComponent(COMMAND_RETURN)}`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
      await expect(page.getByRole('heading', { name: 'Organizations', exact: true })).toBeVisible({ timeout: 20_000 })
      await assertNoMarketingShell(page)

      const operatingSection = page.locator('section').filter({ hasText: 'Operating context' }).first()
      const operatingSelect = operatingSection.getByRole('combobox')
      await expect(operatingSelect.locator('option')).toHaveCount(3)
      await expect(operatingSection.getByRole('link', { name: 'Create', exact: true })).toBeVisible()
      await expect(operatingSection.getByRole('link', { name: 'Join', exact: true })).toBeVisible()

      await operatingSelect.selectOption('')
      await expect.poll(async () => (await readOrgContext(page)).payload.data?.active_workspace_id ?? null).toBeNull()

      await operatingSelect.selectOption(createdWorkspaceId)
      await expect.poll(async () => (await readOrgContext(page)).payload.data?.active_workspace_id ?? null).toBe(createdWorkspaceId)
    } finally {
      await context.close()
    }
  })

  test('signed-out organization creation preserves the full onboarding return path through sign-up', async ({ browser }) => {
    test.skip(!AUTH_AVAILABLE, 'Authenticated isolated Supabase fixture is not available')

    const context = await browser.newContext({
      baseURL: BASE_URL,
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      reducedMotion: 'reduce',
    })
    const page = await context.newPage()
    try {
      const createPath = `/organization/new?country=MX&returnTo=${encodeURIComponent(COMMAND_RETURN)}`
      await page.goto(createPath, { waitUntil: 'domcontentloaded', timeout: 60_000 })
      await page.waitForURL(url => url.pathname === '/login', { timeout: 20_000 })
      const loginUrl = new URL(page.url())
      expect(loginUrl.searchParams.get('mode')).toBe('signup')
      expect(loginUrl.searchParams.get('next')).toBe(createPath)
    } finally {
      await context.close()
    }
  })
})