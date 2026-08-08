/**
 * Entitlement helper — single source of truth for feature access.
 * Used in server components that need subscription-aware feature checks.
 *
 * Canonical paid tier names are `intel` and `operator`, matching:
 * - public.user_profiles.tier
 * - app_metadata.subscription_tier
 * - lib/stripe/tier.ts
 * - proxy.ts subscription gating
 */
import 'server-only'

export type SubscriptionTier = 'free' | 'intel' | 'operator'

export interface FeatureAccess {
  granted: boolean
  requiredTier: SubscriptionTier
  currentTier: SubscriptionTier
}

const TIER_ORDER: SubscriptionTier[] = ['free', 'intel', 'operator']

// Feature → minimum paid tier required.
// Administrative authorization is role-based elsewhere and intentionally is
// not represented as a purchasable subscription entitlement here.
export const FEATURE_TIER_MAP: Record<string, SubscriptionTier> = {
  signals: 'intel',
  intelligence: 'intel',
  network: 'intel',
  vault: 'intel',
  opportunities: 'intel',
  'reviewed-connections': 'intel',
  watchlist: 'intel',
  professionals: 'intel',
  assessments: 'intel',
  compliance: 'intel',
  education: 'intel',
  genetics: 'operator',
  'cultivar-passport': 'operator',
  'institutional-partnerships': 'operator',
} as const

export function normalizeSubscriptionTier(tier: unknown): SubscriptionTier {
  switch (tier) {
    case 'intel':
    case 'starter':
      return 'intel'
    case 'operator':
    case 'professional':
    case 'enterprise':
      return 'operator'
    default:
      return 'free'
  }
}

export function getTierLevel(tier: SubscriptionTier | undefined): number {
  return TIER_ORDER.indexOf(tier ?? 'free')
}

export function canAccess(
  feature: string,
  userTier: SubscriptionTier | undefined
): FeatureAccess {
  const requiredTier = FEATURE_TIER_MAP[feature] ?? 'free'
  const currentTier = userTier ?? 'free'
  const granted = getTierLevel(currentTier) >= getTierLevel(requiredTier)
  return { granted, requiredTier, currentTier }
}

export function checkFeatureAccess(
  user: { app_metadata?: Record<string, unknown> } | null,
  feature: string
): FeatureAccess {
  const tier = normalizeSubscriptionTier(user?.app_metadata?.subscription_tier)
  return canAccess(feature, tier)
}
