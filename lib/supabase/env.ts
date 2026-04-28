const EXPECTED_SUPABASE_PROJECT_REF = 'zvxdgkukjrrwamdpqrg'
const EXPECTED_SUPABASE_HOST = `${EXPECTED_SUPABASE_PROJECT_REF}.supabase.co`

export type SupabasePublicEnv = {
  url: string
  anonKey: string
  projectRef: string
}

export type SupabaseServerEnv = SupabasePublicEnv & {
  serviceRoleKey: string
}

export type SupabaseEnvStatus = {
  configured: boolean
  missing: string[]
  projectRef: string
  url?: string
}

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
    throw new Error('Invalid NEXT_PUBLIC_SUPABASE_URL. Expected a valid Supabase project URL.')
  }

  if (parsed.hostname !== EXPECTED_SUPABASE_HOST) {
    throw new Error(
      `Supabase project mismatch: NEXT_PUBLIC_SUPABASE_URL must point to ${EXPECTED_SUPABASE_PROJECT_REF}. Current value points elsewhere.`
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

export function getSupabasePublicEnv(): SupabasePublicEnv {
  return {
    url: getSupabaseUrl(),
    anonKey: getSupabaseAnonKey(),
    projectRef: EXPECTED_SUPABASE_PROJECT_REF,
  }
}

export function getSupabaseServiceRoleKey() {
  if (typeof window !== 'undefined') {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is server-only and cannot be read in the browser runtime.')
  }

  return requireEnv('SUPABASE_SERVICE_ROLE_KEY')
}

export function getSupabaseServerEnv(): SupabaseServerEnv {
  return {
    ...getSupabasePublicEnv(),
    serviceRoleKey: getSupabaseServiceRoleKey(),
  }
}

export function getSupabaseEnvStatus(): SupabaseEnvStatus {
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
