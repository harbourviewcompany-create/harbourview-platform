/**
 * Server component auth helper.
 * Call at the top of every protected page.tsx server component.
 *
 * Usage:
 *   import { requireAuth } from '@/lib/auth/require-auth'
 *   const { user, tier } = await requireAuth('signals')  // feature name, optional
 *
 * Throws unauthorized() if no session.
 * Throws forbidden() if session exists but tier is insufficient for the feature.
 */
import 'server-only'
import { unauthorized, forbidden } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabasePublicClientKey, getSupabaseUrl } from '@/lib/supabase/env'
import { checkFeatureAccess, type SubscriptionTier } from '@/lib/billing/entitlements'

export async function requireAuth(feature?: string) {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabasePublicClientKey(),
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value, options }) => {
            try { cookieStore.set(name, value, options) } catch { /* read-only in RSC */ }
          })
        },
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    unauthorized()
  }

  const tier = (user!.app_metadata?.subscription_tier ?? 'free') as SubscriptionTier

  if (feature) {
    const access = checkFeatureAccess(user, feature)
    if (!access.granted) {
      forbidden()
    }
  }

  return { user: user!, tier, supabase }
}
