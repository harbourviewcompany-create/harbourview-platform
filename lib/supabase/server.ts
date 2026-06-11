import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabasePublicClientKey, getSupabaseUrl } from '@/lib/supabase/env'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    getSupabaseUrl(),
    getSupabasePublicClientKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2]))
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// ── Passport MVP additions ─────────────────────────────────────────────────
// These aliases/helpers are used by the passport API routes.
// createClient remains the canonical export for all existing server components.

/** Alias for createClient — used by passport and org routes */
export const createSupabaseServerClient = createClient

/** Service-role client for privileged server operations */
export async function createSupabaseServiceClient() {
  const { createClient: createSbClient } = await import('@supabase/supabase-js')
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('[harbourview] SUPABASE_SERVICE_ROLE_KEY not configured')
  return createSbClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

/** Returns the authenticated user or null — short-circuits auth boilerplate in route handlers */
export async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}
