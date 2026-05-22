const EXPECTED_SUPABASE_PROJECT_REF = 'zvxdgdkukjrrwamdpqrg'
const EXPECTED_SUPABASE_HOST = `${EXPECTED_SUPABASE_PROJECT_REF}.supabase.co`
const LOCKED_SUPABASE_URL = `https://${EXPECTED_SUPABASE_HOST}`

function readEnv(name: string) {
  return process.env[name]?.trim() || ''
}

function requireEnv(name: string) {
  const value = readEnv(name)

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function assertLockedSupabaseUrl(url: string) {
  let parsed: URL

  try {
    parsed = new URL(url)
  } catch {
    throw new Error('Invalid Supabase URL. Expected a valid project URL.')
  }

  if (parsed.hostname !== EXPECTED_SUPABASE_HOST) {
    throw new Error(
      `Supabase project mismatch: URL must point to ${EXPECTED_SUPABASE_PROJECT_REF}. Current value points elsewhere.`
    )
  }

  return url
}

function normalizeUrl(url: string) {
  return url.trim().replace(/\/$/, '')
}

function isExpectedSupabaseUrl(url: string) {
  try {
    return new URL(url).hostname === EXPECTED_SUPABASE_HOST
  } catch {
    return false
  }
}

function parseHostnameSafely(url: string) {
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
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
  return normalizedUrl && isExpectedSupabaseUrl(normalizedUrl) ? normalizedUrl : LOCKED_SUPABASE_URL
}

export function getSupabaseUrl() {
  return resolveLockedSupabaseUrl(requireEnv('NEXT_PUBLIC_SUPABASE_URL'))
}

export function getSupabaseAnonKey() {
  return requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export function getSupabasePublishableKey() {
  return readEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') || readEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
}

export function requireSupabasePublishableKey() {
  const value = getSupabasePublishableKey()
  if (!value) {
    throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
  }
  return value
}

export function getSupabaseEnvStatus() {
  const url = readEnv('NEXT_PUBLIC_SUPABASE_URL')
  const hasAnonKey = Boolean(readEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'))
  const hasPublishableKey = Boolean(readEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'))
  const normalizedUrl = url ? normalizeUrl(url) : ''
  const resolvedUrl = resolveLockedSupabaseUrl(url)
  let rawHost: string | null = null

  if (normalizedUrl) {
    rawHost = parseHostnameSafely(normalizedUrl)
  }
  const resolvedHost = new URL(resolvedUrl).hostname
  const urlUsesExpectedProject = Boolean(rawHost && rawHost === EXPECTED_SUPABASE_HOST)
  const missing = [
    !hasAnonKey && !hasPublishableKey
      ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'
      : '',
  ].filter(Boolean)


  if (normalizedUrl && rawHost && rawHost !== EXPECTED_SUPABASE_HOST) {
    console.warn('harbourview_supabase_host_mismatch', {
      expectedHost: EXPECTED_SUPABASE_HOST,
      providedHost: rawHost,
      resolvedHost,
    })
  }

  if (url) {
    assertLockedSupabaseUrl(resolveLockedSupabaseUrl(url))
  }

  return {
    configured: missing.length === 0,
    missing,
    projectRef: EXPECTED_SUPABASE_PROJECT_REF,
    host: rawHost,
    resolvedHost,
    urlUsesExpectedProject,
    hasUrl: Boolean(url),
    hasAnonKey,
    hasPublishableKey,
  }
}
