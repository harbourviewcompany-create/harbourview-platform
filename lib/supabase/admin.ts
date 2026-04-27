import { createClient } from '@supabase/supabase-js'

/**
 * Service-role client — bypasses RLS.
 * Only for use in admin API routes verified by ADMIN_SECRET.
 * Never expose to the browser.
 *
 * Uses untyped client intentionally: replace with supabase gen types once DB is live.
 * Run: npx supabase gen types typescript --project-id <id> > lib/supabase/types.ts
 * Then: createClient<Database>(url, key, ...)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createAdminClient(): ReturnType<typeof createClient<any>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Supabase admin credentials are not configured.')
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
