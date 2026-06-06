import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe, tierFromPriceId } from '@/lib/stripe/server'
import type Stripe from 'stripe'

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function upsertSubscription(sub: Stripe.Subscription) {
  const priceId = sub.items.data[0]?.price.id ?? ''
  const tier = tierFromPriceId(priceId) ?? 'intel'
  const userId = sub.metadata?.supabase_user_id

  if (!userId) {
    console.warn('[stripe/webhook] subscription missing supabase_user_id metadata', sub.id)
    return
  }

  // billing period is on the first item in the new API
  const itemPeriod = sub.items.data[0]?.billing_thresholds ?? null
  const anchor = sub.billing_cycle_anchor

  const supabase = adminSupabase()
  const { error } = await supabase.from('subscriptions').upsert({
    id:                   sub.id,
    user_id:              userId,
    stripe_customer_id:   typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
    status:               sub.status,
    tier,
    price_id:             priceId,
    current_period_start: new Date(anchor * 1000).toISOString(),
    current_period_end:   sub.cancel_at
      ? new Date(sub.cancel_at * 1000).toISOString()
      : null,
    cancel_at_period_end: sub.cancel_at_period_end,
    canceled_at:          sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
    updated_at:           new Date().toISOString(),
  })

  if (error) console.error('[stripe/webhook] upsert subscription error', error)
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature') ?? ''
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Invalid signature'
    console.error('[stripe/webhook] signature error:', msg)
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode === 'subscription' && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string)
          if (!sub.metadata?.supabase_user_id && session.metadata?.supabase_user_id) {
            await stripe.subscriptions.update(sub.id, {
              metadata: { supabase_user_id: session.metadata.supabase_user_id },
            })
            sub.metadata.supabase_user_id = session.metadata.supabase_user_id
          }
          await upsertSubscription(sub)
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await upsertSubscription(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subId = invoice.parent?.type === 'subscription_details'
          ? (invoice.parent.subscription_details?.subscription as string | undefined)
          : undefined
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId)
          await upsertSubscription(sub)
        }
        break
      }
    }
  } catch (err) {
    console.error('[stripe/webhook] handler error:', err)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
