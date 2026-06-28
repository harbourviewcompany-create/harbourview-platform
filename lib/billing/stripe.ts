/**
 * Stripe singleton — import this everywhere instead of instantiating Stripe directly.
 * Throws at startup if STRIPE_SECRET_KEY is missing so misconfiguration fails fast.
 */
import 'server-only'
import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error(
    '[harbourview:billing] STRIPE_SECRET_KEY is not set. ' +
    'Add it to your Vercel environment variables.'
  )
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

// Tier mapping: Stripe Price ID → internal SubscriptionTier
// Replace with your actual Stripe Price IDs before going live.
export const STRIPE_PRICE_TIER_MAP: Record<string, string> = {
  // price_starter_monthly
  [process.env.STRIPE_PRICE_STARTER_MONTHLY  ?? '__starter_monthly']:  'starter',
  [process.env.STRIPE_PRICE_STARTER_ANNUAL   ?? '__starter_annual']:   'starter',
  // price_professional_monthly
  [process.env.STRIPE_PRICE_PRO_MONTHLY      ?? '__pro_monthly']:      'professional',
  [process.env.STRIPE_PRICE_PRO_ANNUAL       ?? '__pro_annual']:       'professional',
  // price_enterprise
  [process.env.STRIPE_PRICE_ENTERPRISE       ?? '__enterprise']:       'enterprise',
}

export function tierFromPriceId(priceId: string | null | undefined): string {
  if (!priceId) return 'free'
  return STRIPE_PRICE_TIER_MAP[priceId] ?? 'free'
}
