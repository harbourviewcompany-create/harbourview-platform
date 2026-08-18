/**
 * Stripe singleton — import `stripe` everywhere instead of instantiating Stripe
 * directly. The underlying client is created lazily on first use (getStripe), so
 * importing this module never throws at build time. `next build` collects page
 * data by importing route modules where STRIPE_SECRET_KEY is absent; eager init
 * crashed the build there. The missing-key check still fails fast — at request
 * time, when the client is first used. Mirrors lib/stripe/server.ts.
 */
import 'server-only'
import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
      throw new Error(
        '[harbourview:billing] STRIPE_SECRET_KEY is not set. ' +
        'Add it to your Vercel environment variables.'
      )
    }
    _stripe = new Stripe(key, { apiVersion: '2026-07-29.dahlia' })
  }
  return _stripe
}

// Proxy keeps the `stripe.xxx` call pattern working without eager init.
export const stripe = new Proxy({} as Stripe, {
  get(_t, prop) { return getStripe()[prop as keyof Stripe] },
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
