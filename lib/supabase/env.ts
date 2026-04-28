const EXPECTED_SUPABASE_PROJECT_REF = 'zvxdgdkukjrrwamdpqrg'

function requireEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export function getSupabaseUrl() {
  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL')

  if (!url.includes(EXPECTED_SUPABASE_PROJECT_REF)) {
    throw new Error(
      `Supabase project mismatch: NEXT_PUBLIC_SUPABASE_URL must point to ${EXPECTED_SUPABASE_PROJECT_REF}. Current value points elsewhere.`
    )
  }

  return url
}

export function getSupabaseAnonKey() {
  return requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export function getExpectedSupabaseProjectRef() {
  return EXPECTED_SUPABASE_PROJECT_REF
}
