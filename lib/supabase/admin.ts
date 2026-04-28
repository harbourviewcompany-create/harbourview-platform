import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'
import { getSupabaseServerEnv } from './env'

export function createAdminClient() {
  const { url, serviceRoleKey } = getSupabaseServerEnv()

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
