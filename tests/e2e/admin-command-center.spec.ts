import { expect, test, type Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const email = process.env.E2E_TEST_USER_EMAIL
const password = process.env.E2E_TEST_USER_PASSWORD

const viewports = [
  { width: 320, height: 568 },
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
]

async function signIn(page: Page) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !anonKey) throw new Error('Supabase E2E environment is not configured')

  const client = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await client.auth.signInWithPassword({ email: email!, password: password! })
  if (error || !data.session?.access_token) throw error || new Error('Admin E2E session was not created')

  await page.context().addCookies([{
    name: 'hv-admin-session',
    value: encodeURIComponent(JSON.stringify({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      token_type: data.session.token_type || 'bearer',
      expires_at: data.session.expires_at,
    })),
    url: 'http://127.0.0.1:3000',
    httpOnly: true,
    secure: false,
    sameSite: 'Lax',
  }])
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    body: document.body.scrollWidth - document.body.clientWidth,
  }))
  expect(overflow.document).toBeLessThanOrEqual(1)
  expect(overflow.body).toBeLessThanOrEqual(1)
}

test.describe('Admin Command Center responsive evidence', () => {
  test.skip(!email || !password, 'Authenticated admin fixture credentials are required.')

  test('captures Command Center and Signal Review at every required viewport', async ({ page }) => {
    await signIn(page)
    const evidenceDir = path.join(process.cwd(), 'test-results', 'admin-command-center')
    fs.mkdirSync(evidenceDir, { recursive: true })

    for (const viewport of viewports) {
      await page.setViewportSize(viewport)

      await page.goto('/admin')
      await expect(page.getByRole('heading', { name: 'Admin Command Center' })).toBeVisible()
      await expectNoHorizontalOverflow(page)
      if (viewport.width < 1024) {
        await expect(page.getByRole('button', { name: 'Open admin navigation' })).toBeVisible()
      }
      await page.screenshot({
        path: path.join(evidenceDir, `command-${viewport.width}x${viewport.height}.png`),
        fullPage: true,
      })

      await page.goto('/admin/signals')
      await expect(page.getByRole('heading', { name: 'Signal Review' })).toBeVisible()
      await expectNoHorizontalOverflow(page)
      await page.screenshot({
        path: path.join(evidenceDir, `signals-${viewport.width}x${viewport.height}.png`),
        fullPage: true,
      })
    }
  })
})
