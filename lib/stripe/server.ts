import 'server-only'
import Stripe from 'stripe'
export { TIER_DISPLAY } from './tierDisplay'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set — add it in Vercel project settings.')
    _stripe = new Stripe(key, { apiVersion: '2026-07-29.dahlia' })
  }
  return _stripe
}

export const stripe = new Proxy({} as Stripe, {
  get(_t, prop) { return getStripe()[prop as keyof Stripe] },
})

export const PRICES = {
  intel_monthly:    process.env.STRIPE_PRICE_INTEL_MONTHLY    ?? '',
  intel_annual:     process.env.STRIPE_PRICE_INTEL_ANNUAL     ?? '',
  operator_monthly: process.env.STRIPE_PRICE_OPERATOR_MONTHLY ?? '',
  operator_annual:  process.env.STRIPE_PRICE_OPERATOR_ANNUAL  ?? '',
} as const

export type PriceKey = keyof typeof PRICES

export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name?: string,
): Promise<string> {
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .maybeSingle()

  if (profileError) {
    throw new Error(`Unable to read billing profile: ${profileError.message}`)
  }
  if (profile?.stripe_customer_id) return profile.stripe_customer_id

  // Stripe idempotency prevents concurrent checkout requests for one Harbourview
  // user from creating duplicate Customer records before Supabase is updated.
  const customer = await getStripe().customers.create(
    {
      email,
      name: name ?? undefined,
      metadata: { supabase_user_id: userId },
    },
    { idempotencyKey: `harbourview-customer-${userId}` },
  )

  const { error: persistError } = await supabase
    .from('user_profiles')
    .upsert({ id: userId, email, stripe_customer_id: customer.id })

  if (persistError) {
    throw new Error(`Unable to persist Stripe customer mapping: ${persistError.message}`)
  }

  return customer.id
}

export function tierFromPriceId(priceId: string): 'intel' | 'operator' | null {
  if (priceId === PRICES.intel_monthly || priceId === PRICES.intel_annual) return 'intel'
  if (priceId === PRICES.operator_monthly || priceId === PRICES.operator_annual) return 'operator'
  return null
}
