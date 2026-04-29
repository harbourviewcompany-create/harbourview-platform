const EXPECTED_SUPABASE_PROJECT_REF = 'zvxdgkukjrrwamdpqrg'
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

export function getSupabaseUrl() {
  return assertLockedSupabaseUrl(requireEnv('NEXT_PUBLIC_SUPABASE_URL'))
}

export function getSupabaseAnonKey() {
  return requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export function getSupabaseEnvStatus() {
  const required = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']
  const missing = required.filter((name) => !readEnv(name))
  const url = readEnv('NEXT_PUBLIC_SUPABASE_URL')

  if (url) {
    assertLockedSupabaseUrl(url)
  }

  return {
    configured: missing.length === 0,
    missing,
    projectRef: EXPECTED_SUPABASE_PROJECT_REF,
    url: url || undefined,
  }
}
