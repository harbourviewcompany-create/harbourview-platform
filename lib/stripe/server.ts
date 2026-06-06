import 'server-only'
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
})

// ── Price IDs — set these in Vercel env vars after creating products in Stripe ─
export const PRICES = {
  intel_monthly:    process.env.STRIPE_PRICE_INTEL_MONTHLY    ?? '',
  intel_annual:     process.env.STRIPE_PRICE_INTEL_ANNUAL     ?? '',
  operator_monthly: process.env.STRIPE_PRICE_OPERATOR_MONTHLY ?? '',
  operator_annual:  process.env.STRIPE_PRICE_OPERATOR_ANNUAL  ?? '',
} as const

export type PriceKey = keyof typeof PRICES

export const TIER_DISPLAY = {
  intel: {
    name: 'Intel Plus',
    monthly: { label: 'USD $149 / mo', key: 'intel_monthly' as PriceKey },
    annual:  { label: 'USD $1,490 / yr', key: 'intel_annual' as PriceKey },
    features: [
      'Source trail access on every signal',
      'Contradiction review and confidence context',
      'Counterparty movement alerts',
      'Corridor monitoring across 50+ jurisdictions',
      'Regional rule-change alerts',
      'Saved watchlists',
    ],
  },
  operator: {
    name: 'Operator',
    monthly: { label: 'USD $490 / mo', key: 'operator_monthly' as PriceKey },
    annual:  { label: 'USD $4,900 / yr', key: 'operator_annual' as PriceKey },
    features: [
      'Everything in Intel Plus',
      'Reviewed counterparty introductions',
      'Deal room access',
      'Proof review workflow',
      'Priority market queue',
      'Direct Harbourview analyst access',
    ],
  },
} as const

// ── Get or create Stripe customer for a user ──────────────────────────────────
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<string> {
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Check if customer already exists
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single()

  if (profile?.stripe_customer_id) return profile.stripe_customer_id

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name: name ?? undefined,
    metadata: { supabase_user_id: userId },
  })

  // Store on profile
  await supabase
    .from('user_profiles')
    .upsert({ id: userId, email, stripe_customer_id: customer.id })

  return customer.id
}

// ── Derive tier from Stripe price ID ─────────────────────────────────────────
export function tierFromPriceId(priceId: string): 'intel' | 'operator' | null {
  if (priceId === PRICES.intel_monthly || priceId === PRICES.intel_annual) return 'intel'
  if (priceId === PRICES.operator_monthly || priceId === PRICES.operator_annual) return 'operator'
  return null
}
