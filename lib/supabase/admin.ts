import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'
import { getSupabaseServerEnv, getSupabaseEnvStatus } from './env'

/**
 * Service-role client: bypasses RLS.
 * Only for server-side admin routes protected by ADMIN_SECRET.
 * Never expose to the browser.
 */
export function createAdminClient() {
  const { url, serviceRoleKey } = getSupabaseServerEnv()

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseEnvStatus().configured
}
