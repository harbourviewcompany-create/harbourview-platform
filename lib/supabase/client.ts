import { createBrowserClient } from '@supabase/ssr'
import { getSupabasePublicClientKey, getSupabaseUrl } from '@/lib/supabase/env'

export function createClient() {
  return createBrowserClient(
    getSupabaseUrl(),
    getSupabasePublicClientKey()
  )
}
