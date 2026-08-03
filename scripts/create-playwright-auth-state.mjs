import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'
import { createServerClient } from '@supabase/ssr'

const baseURL = process.env.HARBOURVIEW_PUBLIC_BASE_URL || process.env.PLAYWRIGHT_BASE_URL
const supabaseURL = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const email = process.env.PLAYWRIGHT_TEST_EMAIL
const password = process.env.PLAYWRIGHT_TEST_PASSWORD
const storageStatePath = process.env.PLAYWRIGHT_STORAGE_STATE || '.playwright/command-centre-auth.json'
const diagnosticDirectory = process.env.PLAYWRIGHT_AUTH_DIAGNOSTICS || 'test-results/auth-state'

if (!baseURL) throw new Error('HARBOURVIEW_PUBLIC_BASE_URL or PLAYWRIGHT_BASE_URL is required')
if (!supabaseURL) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
if (!supabaseKey) throw new Error('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
if (!email) throw new Error('PLAYWRIGHT_TEST_EMAIL is required')
if (!password) throw new Error('PLAYWRIGHT_TEST_PASSWORD is required')

fs.mkdirSync(path.dirname(storageStatePath), { recursive: true })
fs.mkdirSync(diagnosticDirectory, { recursive: true })

/** @type {Array<{name: string, value: string, options?: Record<string, unknown>}>} */
const issuedCookies = []
const supabase = createServerClient(supabaseURL, supabaseKey, {
  db: { schema: 'api' },
  cookies: {
    getAll() {
      return []
    },
    setAll(cookiesToSet) {
      issuedCookies.splice(0, issuedCookies.length, ...cookiesToSet)
    },
  },
})

const { data, error } = await supabase.auth.signInWithPassword({ email, password })
if (error) throw error
if (!data.session || !data.user) throw new Error('Supabase did not return an authenticated session')
if (issuedCookies.length === 0) throw new Error('Supabase SSR client did not issue authentication cookies')

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext()
const page = await context.newPage()

try {
  const cookieURL = new URL(baseURL)
  await context.addCookies(issuedCookies.map(cookie => {
    const options = cookie.options || {}
    const sameSite = normalizeSameSite(options.sameSite)
    return {
      name: cookie.name,
      value: cookie.value,
      url: cookieURL.origin,
      httpOnly: Boolean(options.httpOnly),
      secure: cookieURL.protocol === 'https:' ? options.secure !== false : false,
      ...(sameSite ? { sameSite } : {}),
      ...(typeof options.maxAge === 'number' ? { expires: Math.floor(Date.now() / 1000) + options.maxAge } : {}),
    }
  }))

  await page.goto(`${baseURL.replace(/\/$/, '')}/dashboard?country=CA`, { waitUntil: 'domcontentloaded' })
  if (new URL(page.url()).pathname.startsWith('/login')) {
    throw new Error('Injected Supabase SSR session did not authenticate the dashboard route')
  }

  await page.locator('.cc-app, .hvm-app').first().waitFor({ state: 'visible', timeout: 45_000 })
  await page.waitForLoadState('networkidle').catch(() => undefined)
  await context.storageState({ path: storageStatePath })
  console.log(`Authenticated Playwright storage state written to ${storageStatePath} for user ${data.user.id}`)
} catch (error) {
  const bodyText = await page.locator('body').innerText().catch(() => '')
  const cookies = await context.cookies().catch(() => [])
  const cookieSummary = cookies.map(cookie => ({
    name: cookie.name,
    domain: cookie.domain,
    path: cookie.path,
    httpOnly: cookie.httpOnly,
    secure: cookie.secure,
    sameSite: cookie.sameSite,
    expires: cookie.expires,
  }))
  fs.writeFileSync(
    path.join(diagnosticDirectory, 'auth-failure.txt'),
    `URL: ${page.url()}\nCOOKIES: ${JSON.stringify(cookieSummary, null, 2)}\n\n${bodyText}\n`,
  )
  await page.screenshot({ path: path.join(diagnosticDirectory, 'auth-failure.png'), fullPage: true }).catch(() => undefined)
  throw error
} finally {
  await browser.close()
}

function normalizeSameSite(value) {
  if (typeof value !== 'string') return undefined
  const normalized = value.toLowerCase()
  if (normalized === 'strict') return 'Strict'
  if (normalized === 'lax') return 'Lax'
  if (normalized === 'none') return 'None'
  return undefined
}
