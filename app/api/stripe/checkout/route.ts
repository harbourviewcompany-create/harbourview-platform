import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, PRICES, getOrCreateStripeCustomer, type PriceKey } from '@/lib/stripe/server'

const TERMINAL_SUBSCRIPTION_STATUSES = new Set(['canceled', 'incomplete_expired'])

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.email) {
      return NextResponse.json({ error: 'Authenticated account has no email address.' }, { status: 400 })
    }

    const { priceKey } = await req.json() as { priceKey: PriceKey }
    const priceId = PRICES[priceKey]
    if (!priceId) {
      return NextResponse.json(
        { error: `Price not configured: ${priceKey}. Set STRIPE_PRICE_${priceKey.toUpperCase()} in environment variables.` },
        { status: 400 }
      )
    }

    // Existing subscriptions must be upgraded, downgraded, repaired or canceled
    // through Stripe Billing Portal. Creating another Checkout subscription for
    // the same Harbourview user can double-bill and make webhook entitlement
    // ordering ambiguous.
    const { data: latestSubscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('id,status')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (subscriptionError) {
      throw new Error(`Unable to verify existing subscription state: ${subscriptionError.message}`)
    }

    if (latestSubscription && !TERMINAL_SUBSCRIPTION_STATUSES.has(latestSubscription.status)) {
      return NextResponse.json(
        {
          error: 'An existing subscription is already attached to this account. Manage plan changes through billing.',
          code: 'EXISTING_SUBSCRIPTION',
        },
        { status: 409 },
      )
    }

    const customerId = await getOrCreateStripeCustomer(
      user.id,
      user.email,
      user.user_metadata?.full_name
    )

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://harbourview.vercel.app'
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?page=settings&checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard?page=settings&checkout=canceled`,
      subscription_data: {
        metadata: { supabase_user_id: user.id },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_update: { address: 'auto' },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[stripe/checkout]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
