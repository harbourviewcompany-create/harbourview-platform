const EXPECTED_SUPABASE_PROJECT_REF = 'zvxdgdkukjrrwamdpqrg'
const EXPECTED_SUPABASE_HOST = `${EXPECTED_SUPABASE_PROJECT_REF}.supabase.co`
const LOCKED_SUPABASE_URL = `https://${EXPECTED_SUPABASE_HOST}`
const LOCAL_SUPABASE_HOSTS = new Set(['127.0.0.1', 'localhost', '::1'])

// PostgREST on this project only exposes the `api` schema (Settings → Data API
// → Exposed schemas). It does NOT expose `public`, even though every table
// physically lives in `public`. supabase-js defaults to `public` schema if not
// told otherwise, which produces PGRST106 "Invalid schema" 406 errors on every
// REST call. Every Supabase client in this codebase — browser, server, and
// service-role — must pass `db: { schema: SUPABASE_DB_SCHEMA }`.
export const SUPABASE_DB_SCHEMA = 'api' as const

function readEnv(name: string) {
  switch (name) {
    case 'NEXT_PUBLIC_SUPABASE_URL':
      return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || ''
    case 'NEXT_PUBLIC_SUPABASE_ANON_KEY':
      return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || ''
    case 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY':
      return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || ''
    default:
      return ''
  }
}

function requireEnv(name: string) {
  const value = readEnv(name)

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function normalizeUrl(url: string) {
  return url.trim().replace(/\/$/, '')
}

function parseUrlSafely(url: string): URL | null {
  try {
    return new URL(url)
  } catch {
    return null
  }
}

function isExpectedSupabaseUrl(url: string) {
  return parseUrlSafely(url)?.hostname === EXPECTED_SUPABASE_HOST
}

function isExplicitlyAllowedLocalSupabaseUrl(url: string) {
  if (process.env.HARBOURVIEW_ALLOW_LOCAL_SUPABASE !== '1') return false
  const parsed = parseUrlSafely(url)
  return Boolean(parsed && parsed.protocol === 'http:' && LOCAL_SUPABASE_HOSTS.has(parsed.hostname))
}

function assertAllowedSupabaseUrl(url: string) {
  const parsed = parseUrlSafely(url)
  if (!parsed) throw new Error('Invalid Supabase URL. Expected a valid project URL.')

  if (parsed.hostname !== EXPECTED_SUPABASE_HOST && !isExplicitlyAllowedLocalSupabaseUrl(url)) {
    throw new Error(
      `Supabase project mismatch: URL must point to ${EXPECTED_SUPABASE_PROJECT_REF}. Current value points elsewhere.`
    )
  }

  return url
}

function parseHostnameSafely(url: string) {
  return parseUrlSafely(url)?.hostname ?? null
}

function decodeJwtPayload(value: string): Record<string, unknown> | null {
  const parts = value.split('.')
  if (parts.length < 2) return null

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    return JSON.parse(globalThis.atob(padded)) as Record<string, unknown>
  } catch {
    return null
  }
}

export function isSupabaseSecretKey(value: string) {
  const key = value.trim()
  if (!key) return false
  if (key.startsWith('sb_secret_')) return true

  const payload = decodeJwtPayload(key)
  return payload?.role === 'service_role'
}

export function assertBrowserSafeSupabaseKey(value: string, sourceName: string) {
  const key = value.trim()

  if (!key) {
    throw new Error(`Missing browser-safe Supabase public key: ${sourceName}`)
  }

  if (isSupabaseSecretKey(key)) {
    throw new Error(
      `Forbidden Supabase secret/service-role key in browser/public client configuration: ${sourceName}. Use a Supabase publishable key or anon key, never a secret or service-role key.`
    )
  }

  return key
}

export function getExpectedSupabaseProjectRef() {
  return EXPECTED_SUPABASE_PROJECT_REF
}

export function getExpectedSupabaseHost() {
  return EXPECTED_SUPABASE_HOST
}

export function getLockedSupabaseUrl() {
  return LOCKED_SUPABASE_URL
}

export function resolveLockedSupabaseUrl(rawUrl = readEnv('NEXT_PUBLIC_SUPABASE_URL')) {
  const normalizedUrl = normalizeUrl(rawUrl)
  if (normalizedUrl && (isExpectedSupabaseUrl(normalizedUrl) || isExplicitlyAllowedLocalSupabaseUrl(normalizedUrl))) {
    return normalizedUrl
  }
  return LOCKED_SUPABASE_URL
}

export function getSupabaseUrl() {
  return assertAllowedSupabaseUrl(resolveLockedSupabaseUrl(requireEnv('NEXT_PUBLIC_SUPABASE_URL')))
}

export function getSupabaseAnonKey() {
  return assertBrowserSafeSupabaseKey(requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'), 'NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export function getSupabasePublishableKey() {
  return readEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') || readEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export function requireSupabasePublishableKey() {
  const value = getSupabasePublishableKey()
  if (!value) {
    throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  return assertBrowserSafeSupabaseKey(value, readEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') ? 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY' : 'NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export function getSupabasePublicClientKey() {
  return requireSupabasePublishableKey()
}

export function getSupabaseEnvStatus() {
  const url = readEnv('NEXT_PUBLIC_SUPABASE_URL')
  const anonKey = readEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  const publishableKey = readEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
  const publicClientKey = publishableKey || anonKey
  const hasAnonKey = Boolean(anonKey)
  const hasPublishableKey = Boolean(publishableKey)
  const invalidPublicClientKey = Boolean(publicClientKey && isSupabaseSecretKey(publicClientKey))
  const normalizedUrl = url ? normalizeUrl(url) : ''
  const resolvedUrl = resolveLockedSupabaseUrl(url)
  let rawHost: string | null = null

  if (normalizedUrl) {
    rawHost = parseHostnameSafely(normalizedUrl)
  }
  const resolvedHost = new URL(resolvedUrl).hostname
  const urlUsesExpectedProject = Boolean(rawHost && rawHost === EXPECTED_SUPABASE_HOST)
  const usesExplicitLocalVerification = Boolean(normalizedUrl && isExplicitlyAllowedLocalSupabaseUrl(normalizedUrl))
  const missing = [
    !hasAnonKey && !hasPublishableKey
      ? 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY'
      : '',
    invalidPublicClientKey
      ? 'Supabase browser key is secret/service-role; use NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or a real anon key'
      : '',
  ].filter(Boolean)

  if (normalizedUrl && rawHost && rawHost !== EXPECTED_SUPABASE_HOST && !usesExplicitLocalVerification) {
    console.warn('harbourview_supabase_host_mismatch', {
      expectedHost: EXPECTED_SUPABASE_HOST,
      providedHost: rawHost,
      resolvedHost,
    })
  }

  if (url) {
    assertAllowedSupabaseUrl(resolveLockedSupabaseUrl(url))
  }

  return {
    configured: missing.length === 0,
    missing,
    projectRef: EXPECTED_SUPABASE_PROJECT_REF,
    host: rawHost,
    resolvedHost,
    urlUsesExpectedProject,
    usesExplicitLocalVerification,
    hasUrl: Boolean(url),
    hasAnonKey,
    hasPublishableKey,
    publicClientKeySource: hasPublishableKey ? 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY' : hasAnonKey ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY' : null,
    invalidPublicClientKey,
  }
}
