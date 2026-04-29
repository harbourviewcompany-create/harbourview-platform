import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'
import { getSupabaseAnonKey, getSupabaseUrl } from './env'

export function createClient() {
  return createBrowserClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey()
  )
}
