import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabasePublicClientKey, getSupabaseUrl } from '@/lib/supabase/env'
import { createClient as createRawClient } from '@supabase/supabase-js'

// ── Session-aware server client (cookie-passing, respects RLS) ────────────────
// Use this for all server components, route handlers, and server actions that
// operate on behalf of an authenticated user. Queries run under the user's JWT
// so RLS policies apply correctly.
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
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
            )
          } catch {
            // Called from a Server Component — safe to ignore since middleware
            // handles session refresh.
          }
        },
      },
    }
  )
}

/** Alias for createClient — used by passport and org routes */
export const createSupabaseServerClient = createClient

// ── Service-role client (bypasses RLS — server-only, privileged operations) ──
// Use only where RLS must be bypassed (admin queues, cron jobs, seeding).
// Always gate call sites with an explicit auth check (requireAdminAuth, CRON_SECRET, etc.)
// before calling this client — it has full database access.
export async function createSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('[harbourview] SUPABASE_SERVICE_ROLE_KEY not configured')
  return createRawClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

/** Returns the authenticated user or null — short-circuits auth boilerplate in route handlers */
export async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}
