import { createClient } from '@supabase/supabase-js'
import { getSupabaseUrl } from './env'

/**
 * Service-role client. Bypasses RLS.
 * Only for use in admin API routes verified by ADMIN_SECRET.
 * Never expose to the browser.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createAdminClient(): ReturnType<typeof createClient<any>> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!key) {
    throw new Error('Supabase admin credentials are not configured.')
  }

  return createClient(getSupabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
