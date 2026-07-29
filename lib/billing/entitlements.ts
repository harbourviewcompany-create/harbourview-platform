/**
 * Entitlement helper — single source of truth for feature access.
 * Used in both server components and middleware.
 * Reads from user.app_metadata.subscription_tier (set via Stripe webhook → Supabase).
 */
import 'server-only'

export type SubscriptionTier = 'free' | 'starter' | 'professional' | 'enterprise'

export interface FeatureAccess {
  granted: boolean
  requiredTier: SubscriptionTier
  currentTier: SubscriptionTier
}

const TIER_ORDER: SubscriptionTier[] = ['free', 'starter', 'professional', 'enterprise']

// Feature → minimum tier required
export const FEATURE_TIER_MAP: Record<string, SubscriptionTier> = {
  signals:                  'starter',
  intelligence:             'starter',
  network:                  'starter',
  vault:                    'starter',
  opportunities:            'starter',
  'reviewed-connections':   'starter',
  watchlist:                'starter',
  professionals:            'starter',
  assessments:              'starter',
  compliance:               'starter',
  education:                'starter',
  genetics:                 'professional',
  'cultivar-passport':      'professional',
  'institutional-partnerships': 'enterprise',
  admin:                    'enterprise',
  'signal-engine-admin':    'enterprise',
} as const

export function getTierLevel(tier: SubscriptionTier | undefined): number {
  return TIER_ORDER.indexOf(tier ?? 'free')
}

export function canAccess(
  feature: string,
  userTier: SubscriptionTier | undefined
): FeatureAccess {
  const requiredTier = FEATURE_TIER_MAP[feature] ?? 'free'
  const currentTier  = userTier ?? 'free'
  const granted      = getTierLevel(currentTier) >= getTierLevel(requiredTier)
  return { granted, requiredTier, currentTier }
}

/**
 * Server component helper — reads tier from Supabase user object.
 * Usage:
 *   const user = await getAuthUser()  // your existing auth helper
 *   const access = checkFeatureAccess(user, 'signals')
 *   if (!access.granted) unauthorized()
 */
export function checkFeatureAccess(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: { app_metadata?: Record<string, unknown> } | null,
  feature: string
): FeatureAccess {
  const tier = (user?.app_metadata?.subscription_tier ?? 'free') as SubscriptionTier
  return canAccess(feature, tier)
}
