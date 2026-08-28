import { expect, test } from '@playwright/test'

const viewports = [
  { name: 'mobile-360', width: 360, height: 780 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-430', width: 430, height: 932 },
  { name: 'tablet-768', width: 768, height: 1024 },
]

test.describe('Candidate B market selection screen', () => {
  for (const viewport of viewports) {
    test(`renders locked Candidate B structure at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/market-selection')

      await expect(page.getByTestId('candidate-b-market-selection')).toBeVisible()
      await expect(page.getByText('HARBOURVIEW')).toBeVisible()
      await expect(page.getByPlaceholder('Search countries')).toBeVisible()
      await expect(page.getByRole('button', { name: 'I’m not sure yet' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'This is multi-market' })).toBeVisible()
      await expect(page.getByText('Germany selected')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible()

      const pageText = await page.locator('body').innerText()
      expect(pageText.toLowerCase()).not.toContain('lighthouse')
      expect(pageText.toLowerCase()).not.toContain('monogram')

      await page.screenshot({
        path: `test-results/market-selection-candidate-b-${viewport.name}.png`,
        fullPage: true,
      })
    })
  }

  test('shows and settles the temporary Germany label on baseline mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/market-selection')

    await page.screenshot({
      path: 'test-results/market-selection-candidate-b-390-initial.png',
      fullPage: true,
    })

    await page.waitForTimeout(3000)
    await expect(page.getByTestId('candidate-b-country-label')).toBeHidden()
    await page.screenshot({
      path: 'test-results/market-selection-candidate-b-390-settled.png',
      fullPage: true,
    })
  })
})
