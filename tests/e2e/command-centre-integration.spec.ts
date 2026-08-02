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

const customModules = [
  { id: 'personal-briefings', page: 'digest' },
  { id: 'search', page: 'signals' },
  { id: 'market', page: 'local-intel' },
  { id: 'supply', page: 'marketplace' },
  { id: 'financing', page: 'marketplace' },
  { id: 'directories', page: 'experts' },
  { id: 'talent', page: 'jobs' },
] as const

for (const viewport of viewports) {
  test(`canonical Command Centre modules render at ${viewport.name}px`, async ({ page }) => {
    test.setTimeout(180_000)
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto('/dashboard?country=CA')

    test.skip(
      /\/login(?:\?|$)/.test(page.url()),
      'This responsive suite requires an authenticated Playwright storage state.',
    )

    await expect(page.locator(viewport.width <= 767 ? '.hvm-app' : '.cc-app')).toBeVisible()
    await expect(page.getByRole('button', { name: /modules/i })).toBeVisible()

    for (const entry of customModules) {
      await page.goto(`/dashboard?country=CA&page=${entry.page}&module=${entry.id}`)
      await expect(page.locator(`[data-command-centre-module="${entry.id}"]`)).toBeVisible()
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(1)
    }

    const evidenceDirectory = path.join(
      process.cwd(),
      'docs/control/evidence/command-centre-integration',
    )
    fs.mkdirSync(evidenceDirectory, { recursive: true })
    await page.goto('/dashboard?country=CA&page=marketplace&module=supply')
    await expect(page.locator('[data-command-centre-module="supply"]')).toBeVisible()
    await page.screenshot({
      path: path.join(evidenceDirectory, `command-centre-${viewport.name}.png`),
      fullPage: true,
    })
  })
}
