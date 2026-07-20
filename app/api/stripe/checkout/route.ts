import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, PRICES, getOrCreateStripeCustomer, type PriceKey } from '@/lib/stripe/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { priceKey, returnPath = '/account' } = await req.json() as {
      priceKey: PriceKey
      returnPath?: string
    }

    const priceId = PRICES[priceKey]
    if (!priceId) {
      return NextResponse.json(
        { error: `Price not configured: ${priceKey}. Set STRIPE_PRICE_${priceKey.toUpperCase()} in environment variables.` },
        { status: 400 }
      )
    }

    const customerId = await getOrCreateStripeCustomer(
      user.id,
      user.email!,
      user.user_metadata?.full_name
    )

    const origin = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://harbourview.vercel.app'

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/account?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${returnPath}?checkout=canceled`,
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
