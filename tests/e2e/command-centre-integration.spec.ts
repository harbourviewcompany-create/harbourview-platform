import fs from 'node:fs'
import path from 'node:path'
import { expect, test } from '@playwright/test'

const viewports = [
  { name: '320', width: 320, height: 760 },
  { name: '375', width: 375, height: 812 },
  { name: '390', width: 390, height: 844 },
  { name: '430', width: 430, height: 932 },
  { name: '768', width: 768, height: 1024 },
  { name: '1440', width: 1440, height: 1000 },
] as const

const modules = [
  { id: 'briefing', label: 'Briefing', page: 'briefing', custom: false },
  { id: 'digest', label: 'Digest', page: 'digest', custom: false },
  { id: 'personal-briefings', label: 'My Briefings', page: 'digest', custom: true, stateSelector: '.ccig-card, .ccig-empty' },
  { id: 'intel', label: 'Intel', page: 'signals', custom: false },
  { id: 'search', label: 'Search', page: 'signals', custom: true, stateSelector: 'input, form, .ccig-empty' },
  { id: 'compliance', label: 'Compliance', page: 'compliance', custom: false },
  { id: 'market', label: 'Market', page: 'local-intel', custom: true, stateSelector: '.ccig-card, .ccig-empty' },
  { id: 'marketplace', label: 'Marketplace', page: 'marketplace', custom: false },
  { id: 'supply', label: 'Supply', page: 'marketplace', custom: true, stateSelector: '.ccig-card, .ccig-empty' },
  { id: 'financing', label: 'Financing', page: 'marketplace', custom: true, stateSelector: 'form, .ccig-empty' },
  { id: 'directories', label: 'Directories', page: 'experts', custom: true, stateSelector: '.ccig-card, .ccig-empty' },
  { id: 'talent', label: 'Talent', page: 'jobs', custom: true, stateSelector: '.ccig-card, .ccig-empty' },
  { id: 'genetics', label: 'Genetics', page: 'genetics', custom: false },
  { id: 'clinical', label: 'Clinical', page: 'clinical', custom: false },
  { id: 'watchlist', label: 'Watchlist', page: 'watchlist', custom: false },
  { id: 'pathways', label: 'Pathways', page: 'access-pathway', custom: false },
] as const

const marketplaceActions = [
  { id: 'sell', label: 'Submit Listing', stateSelector: 'form' },
  { id: 'intake', label: 'Marketplace Intake', stateSelector: 'form' },
  { id: 'my-listings', label: 'My Submissions', stateSelector: '.cc-right-section' },
] as const

function moduleHref(entry: (typeof modules)[number]) {
  const params = new URLSearchParams({ country: 'CA' })
  if (entry.page !== 'briefing') params.set('page', entry.page)
  if (entry.custom) params.set('module', entry.id)
  return `/dashboard?${params.toString()}`
}

async function layoutState(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const fixedViolations: string[] = []
    for (const element of Array.from(document.querySelectorAll<HTMLElement>('body *'))) {
      const style = getComputedStyle(element)
      if (style.position !== 'fixed' || style.display === 'none' || style.visibility === 'hidden') continue
      const rect = element.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) continue
      if (rect.left < -1 || rect.right > window.innerWidth + 1 || rect.top < -1 || rect.bottom > window.innerHeight + 1) {
        fixedViolations.push(`${element.tagName.toLowerCase()}.${element.className}:${Math.round(rect.left)},${Math.round(rect.top)},${Math.round(rect.right)},${Math.round(rect.bottom)}`)
      }
    }
    return {
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      fixedViolations,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    }
  })
}

for (const viewport of viewports) {
  test(`canonical Command Centre modules render at ${viewport.name}px`, async ({ page }) => {
    test.setTimeout(420_000)
    const pageErrors: string[] = []
    page.on('pageerror', error => pageErrors.push(error.message))

    const isMobile = viewport.width <= 767
    const shellSelector = isMobile ? '.hvm-app' : '.cc-app'
    const shellMainSelector = isMobile ? '.hvm-main' : '.cc-main'

    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto('/dashboard?country=CA', { waitUntil: 'domcontentloaded' })

    expect(page.url()).not.toMatch(/\/login(?:\?|$)/)
    await expect(page.locator(shellSelector)).toBeVisible()

    const launcher = page.getByRole('button', { name: /modules/i })
    await expect(launcher).toBeVisible()
    await launcher.click()
    const launcherDialog = page.getByRole('dialog', { name: 'Command Centre module launcher' })
    await expect(launcherDialog).toBeVisible()
    for (const entry of modules) {
      await expect(launcherDialog.getByRole('link', { name: entry.label, exact: true })).toBeVisible()
    }
    await launcherDialog.getByRole('button', { name: 'Close module launcher' }).click()

    const moduleResults: Array<Record<string, unknown>> = []
    const actionResults: Array<Record<string, unknown>> = []

    for (const entry of modules) {
      const errorsBefore = pageErrors.length
      await page.goto(moduleHref(entry), { waitUntil: 'domcontentloaded' })
      expect(page.url(), `${entry.label} redirected out of the authenticated shell`).not.toMatch(/\/login(?:\?|$)/)

      await expect(page.locator(shellSelector), `${entry.label} canonical shell`).toBeVisible()
      await expect(page.locator(shellMainSelector), `${entry.label} canonical shell main`).toBeVisible()

      if (entry.custom) {
        const moduleSurface = page.locator(`${shellMainSelector} > [data-command-centre-module="${entry.id}"]`)
        await expect(moduleSurface, `${entry.label} must render inside the canonical shell main`).toBeVisible()
        await expect(moduleSurface).toHaveAttribute('data-command-centre-shell', isMobile ? 'mobile' : 'desktop')
        await expect(moduleSurface.getByRole('heading', { name: entry.label, exact: true }).first()).toBeVisible()
        if ('stateSelector' in entry) {
          await expect(moduleSurface.locator(entry.stateSelector).first(), `${entry.label} must expose content, empty, loading-resolved, or error state`).toBeVisible({ timeout: 15_000 })
        }
        const loading = moduleSurface.getByText(/Loading personalized briefings|Loading open roles/i)
        await expect(loading).toBeHidden({ timeout: 15_000 })
      } else {
        await expect(page.getByRole('button', { name: /modules/i })).toBeVisible()
      }

      const layout = await layoutState(page)
      expect(layout.horizontalOverflow, `${entry.label} horizontal overflow`).toBeLessThanOrEqual(1)
      expect(layout.fixedViolations, `${entry.label} fixed or safe-area obstruction`).toEqual([])

      const newErrors = pageErrors.slice(errorsBefore)
      expect(newErrors, `${entry.label} uncaught browser errors`).toEqual([])

      const state = entry.custom
        ? await page.locator('.ccig-empty.error').first().isVisible().then(visible => visible ? 'error' : null)
          ?? await page.locator('.ccig-empty').first().isVisible().then(visible => visible ? 'empty' : null)
          ?? await page.locator('.ccig-card').first().isVisible().then(visible => visible ? 'content' : 'interactive')
        : 'legacy-shell'

      moduleResults.push({
        module: entry.id,
        label: entry.label,
        url: page.url(),
        shell: isMobile ? 'mobile-command-centre' : 'desktop-command-centre',
        state,
        ...layout,
        pageErrors: newErrors,
      })
    }

    for (const action of marketplaceActions) {
      const errorsBefore = pageErrors.length
      await page.goto(`/dashboard?country=CA&page=marketplace&action=${action.id}`, { waitUntil: 'domcontentloaded' })
      expect(page.url(), `${action.label} redirected out of the authenticated shell`).not.toMatch(/\/login(?:\?|$)/)

      await expect(page.locator(shellSelector), `${action.label} canonical shell`).toBeVisible()
      const surface = page.locator(`${shellMainSelector} > [data-command-centre-action="${action.id}"]`)
      await expect(surface, `${action.label} must render inside the canonical shell main`).toBeVisible()
      await expect(surface).toHaveAttribute('data-command-centre-module', 'marketplace')
      await expect(surface).toHaveAttribute('data-command-centre-shell', isMobile ? 'mobile' : 'desktop')
      await expect(surface.getByRole('heading', { name: action.label, exact: true }).first()).toBeVisible()
      await expect(surface.locator(action.stateSelector).first()).toBeVisible({ timeout: 15_000 })

      const layout = await layoutState(page)
      expect(layout.horizontalOverflow, `${action.label} horizontal overflow`).toBeLessThanOrEqual(1)
      expect(layout.fixedViolations, `${action.label} fixed or safe-area obstruction`).toEqual([])
      const newErrors = pageErrors.slice(errorsBefore)
      expect(newErrors, `${action.label} uncaught browser errors`).toEqual([])

      actionResults.push({
        action: action.id,
        label: action.label,
        url: page.url(),
        shell: isMobile ? 'mobile-command-centre' : 'desktop-command-centre',
        ...layout,
        pageErrors: newErrors,
      })
    }

    const evidenceDirectory = path.join(process.cwd(), 'docs/control/evidence/command-centre-integration')
    fs.mkdirSync(evidenceDirectory, { recursive: true })

    await page.goto('/dashboard?country=CA&page=marketplace&module=supply', { waitUntil: 'networkidle' })
    await expect(page.locator(`${shellMainSelector} > [data-command-centre-module="supply"]`)).toBeVisible()
    await page.screenshot({
      path: path.join(evidenceDirectory, `command-centre-${viewport.name}.png`),
      fullPage: true,
    })
    fs.writeFileSync(
      path.join(evidenceDirectory, `command-centre-${viewport.name}.json`),
      `${JSON.stringify({ viewport, modules: moduleResults, marketplaceActions: actionResults }, null, 2)}\n`,
    )
  })
}