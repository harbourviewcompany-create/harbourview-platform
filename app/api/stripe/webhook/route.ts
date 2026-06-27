import { NextRequest, NextResponse } from 'next/server'
import { stripe, tierFromPriceId } from '@/lib/stripe/server'
import { createHarbourviewServiceRoleSupabaseClient } from '@/lib/harbourview/supabase/service-role'
import type Stripe from 'stripe'

function unixToIso(seconds: number | null | undefined): string | null {
  return typeof seconds === 'number' && Number.isFinite(seconds)
    ? new Date(seconds * 1000).toISOString()
    : null
}

async function upsertSubscription(sub: Stripe.Subscription) {
  const item = sub.items.data[0]
  const priceId = item?.price.id ?? ''
  const tier = tierFromPriceId(priceId) ?? 'intel'
  const userId = sub.metadata?.supabase_user_id

  if (!userId) {
    console.warn('[stripe/webhook] subscription missing supabase_user_id metadata', sub.id)
    return
  }

  // In the current Stripe API the billing period lives on the subscription
  // item, not the subscription itself.
  const supabase = createHarbourviewServiceRoleSupabaseClient()
  const { error } = await supabase.from('subscriptions').upsert({
    id:                   sub.id,
    user_id:              userId,
    stripe_customer_id:   typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
    status:               sub.status,
    tier,
    price_id:             priceId,
    current_period_start: unixToIso(item?.current_period_start),
    current_period_end:   unixToIso(item?.current_period_end),
    cancel_at_period_end: sub.cancel_at_period_end,
    canceled_at:          unixToIso(sub.canceled_at),
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

  // Idempotency: record the event id before processing. A duplicate key means
  // Stripe replayed an event we already handled, so acknowledge and skip.
  const supabase = createHarbourviewServiceRoleSupabaseClient()
  const { error: dedupeError } = await supabase
    .from('stripe_webhook_events')
    .insert({ id: event.id, type: event.type })

  if (dedupeError) {
    if (dedupeError.code === '23505') {
      return NextResponse.json({ received: true, duplicate: true })
    }
    console.error('[stripe/webhook] dedupe insert error:', dedupeError)
    // Fall through and still process: a logging failure should not drop events.
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
