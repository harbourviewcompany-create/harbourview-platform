import { createClient as createRestClient } from '@/lib/server/supabaseRestClient'

export function createClient() {
  return createRestClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
