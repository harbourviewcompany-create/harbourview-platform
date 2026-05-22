const playwright = require('@playwright/test')
const defineConfig = playwright.defineConfig
const devices = playwright.devices

const baseURL = process.env.HARBOURVIEW_PUBLIC_BASE_URL || 'https://harbourview.vercel.app'

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 45000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile-390', use: { ...devices['Pixel 5'], viewport: { width: 390, height: 844 } } },
    { name: 'mobile-430', use: { ...devices['Pixel 7'], viewport: { width: 430, height: 932 } } }
  ]
})
