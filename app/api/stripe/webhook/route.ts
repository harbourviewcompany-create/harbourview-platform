/**
 * Stripe webhook handler.
 *
 * FIXED 2026-07-04: this previously imported from lib/billing/stripe.ts (an
 * orphaned, incompatible earlier draft — tier names starter/professional/
 * enterprise that don't exist in the user_profiles.tier CHECK constraint)
 * and wrote to `stripe_subscriptions_user_profiles`, a table that does not
 * exist in this database (confirmed via information_schema; HANDOFF.md
 * already documents it as a deleted phantom-schema migration). Every
 * webhook call was failing. Checkout, the billing portal, /account, and
 * TierGate all correctly use lib/stripe/server.ts and user_profiles.tier —
 * this brings the webhook in line with the rest of the system, so a
 * completed subscription actually results in a working `tier` on the row
 * the RLS policies (ia_signals, country_intel) actually check.
 *
 * Handles: checkout.session.completed, customer.subscription.created,
 * customer.subscription.updated, customer.subscription.deleted.
 * Idempotent via stripe_webhook_events (Stripe retries on any non-2xx, or
 * on timeout even after a successful write — this guards against double-
 * processing the same event).
 */
import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'
import { stripe, tierFromPriceId } from '@/lib/stripe/server'
import { SUPABASE_DB_SCHEMA } from '@/lib/supabase/env'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('[harbourview:webhook] NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing.')
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: SUPABASE_DB_SCHEMA },
  })
}

type Admin = ReturnType<typeof getSupabaseAdmin>

async function alreadyProcessed(supabase: Admin, eventId: string): Promise<boolean> {
  const { data } = await supabase.from('stripe_webhook_events').select('id').eq('id', eventId).maybeSingle()
  return Boolean(data)
}

async function markProcessed(supabase: Admin, event: Stripe.Event) {
  await supabase.from('stripe_webhook_events').insert({
    id: event.id,
    type: event.type,
    processed_at: new Date().toISOString(),
  })
}

async function findUserIdByCustomer(supabase: Admin, customerId: string): Promise<string | null> {
  const { data } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()
  return data?.id ?? null
}

async function syncSubscription(supabase: Admin, subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const priceId = subscription.items.data[0]?.price?.id ?? null
  const derivedTier = priceId ? tierFromPriceId(priceId) : null
  const isLive = subscription.status === 'active' || subscription.status === 'trialing'
  const effectiveTier = isLive && derivedTier ? derivedTier : 'free'

  const item = subscription.items.data[0]
  const periodStart = item?.current_period_start ? new Date(item.current_period_start * 1000).toISOString() : null
  const periodEnd = item?.current_period_end ? new Date(item.current_period_end * 1000).toISOString() : null

  const userId = await findUserIdByCustomer(supabase, customerId)
  if (!userId) {
    console.error('[harbourview:webhook] no user_profiles row for stripe_customer_id', customerId)
    return
  }

  // subscriptions.tier is CHECK-constrained to ('intel','operator') only — this
  // table represents real Stripe subscription objects, and 'free' isn't a
  // subscription state, it's the absence of one. Skip the audit-row write if
  // the price doesn't map to a known tier rather than violating the CHECK.
  if (derivedTier) {
    const { error: subError } = await supabase.from('subscriptions').upsert(
      {
        id: subscription.id,
        user_id: userId,
        stripe_customer_id: customerId,
        status: subscription.status,
        tier: derivedTier,
        price_id: priceId,
        current_period_start: periodStart,
        current_period_end: periodEnd,
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )
    if (subError) {
      console.error('[harbourview:webhook] subscriptions upsert failed', subError)
    }
  } else {
    console.error('[harbourview:webhook] price_id did not map to a known tier, skipping subscriptions row', priceId)
  }

  // The column RLS actually checks (ia_signals_intel_tier_read, country_intel_intel_tier_read)
  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({ tier: effectiveTier, updated_at: new Date().toISOString() })
    .eq('id', userId)
  if (profileError) {
    console.error('[harbourview:webhook] user_profiles tier update failed', profileError)
  }
}

async function handleCancellation(supabase: Admin, subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const userId = await findUserIdByCustomer(supabase, customerId)

  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscription.id)

  if (userId) {
    await supabase
      .from('user_profiles')
      .update({ tier: 'free', updated_at: new Date().toISOString() })
      .eq('id', userId)
  } else {
    console.error('[harbourview:webhook] cancellation: no user_profiles row for customer', customerId)
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET

  if (!signature || !secret) {
    return NextResponse.json({ error: 'Missing stripe-signature or webhook secret.' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret)
  } catch (err) {
    console.error('[harbourview:webhook] signature verification failed', err)
    return NextResponse.json({ error: 'Webhook signature invalid.' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  if (await alreadyProcessed(supabase, event.id)) {
    return NextResponse.json({ received: true, deduped: true })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.subscription) {
          const subscriptionId =
            typeof session.subscription === 'string' ? session.subscription : session.subscription.id
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          await syncSubscription(supabase, subscription)
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await syncSubscription(supabase, event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleCancellation(supabase, event.data.object as Stripe.Subscription)
        break

      default:
        // Acknowledge but ignore unhandled event types
        break
    }

    await markProcessed(supabase, event)
  } catch (err) {
    console.error('[harbourview:webhook] handler error', err)
    return NextResponse.json({ error: 'Webhook handler failed.' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
