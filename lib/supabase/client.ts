import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseUrl, getSupabasePublicClientKey } from '@/lib/supabase/env'

export function createClient() {
  return createBrowserClient(
    getSupabaseUrl(),
    getSupabasePublicClientKey()
  )
}
