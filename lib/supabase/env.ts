const EXPECTED_SUPABASE_PROJECT_REF = 'zvxdgdkukjrrwamdpqrg'
const EXPECTED_SUPABASE_HOST = `${EXPECTED_SUPABASE_PROJECT_REF}.supabase.co`

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

export function getExpectedSupabaseProjectRef() {
  return EXPECTED_SUPABASE_PROJECT_REF
}

export function getExpectedSupabaseHost() {
  return EXPECTED_SUPABASE_HOST
}

export function getSupabaseUrl() {
  return assertLockedSupabaseUrl(requireEnv('NEXT_PUBLIC_SUPABASE_URL'))
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
  const missing = [
    !url ? 'NEXT_PUBLIC_SUPABASE_URL' : '',
    !hasAnonKey && !hasPublishableKey
      ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'
      : '',
  ].filter(Boolean)

  if (url) {
    assertLockedSupabaseUrl(url)
  }

  return {
    configured: missing.length === 0,
    missing,
    projectRef: EXPECTED_SUPABASE_PROJECT_REF,
    host: url ? new URL(url).hostname : null,
    hasUrl: Boolean(url),
    hasAnonKey,
    hasPublishableKey,
  }
}
