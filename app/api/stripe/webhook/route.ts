/**
 * Stripe webhook handler.
 *
 * FIXED 2026-07-04: aligned tier names with user_profiles CHECK constraint.
 * FIXED 2026-07-07: sync app_metadata.subscription_tier to JWT via
 *   supabase.auth.admin.updateUserById() after every tier change so that
 *   middleware can read the tier from the JWT without a DB round-trip.
 *   Without this, middleware always saw 'free' and blocked paid users from
 *   /signals, /intelligence, /vault etc. even after successful checkout.
 *
 * Handles: checkout.session.completed, customer.subscription.created,
 * customer.subscription.updated, customer.subscription.deleted.
 * Idempotent via stripe_webhook_events.
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

/**
 * Sync subscription_tier into JWT app_metadata so middleware can read it
 * from the token without a DB round-trip on every request.
 * Uses the Supabase Admin Auth API — service-role only.
 * Next user login / token refresh will carry the new value.
 */
async function syncAppMetadataTier(
  supabase: Admin,
  userId: string,
  tier: 'free' | 'intel' | 'operator',
): Promise<void> {
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    app_metadata: { subscription_tier: tier },
  })
  if (error) {
    // Non-fatal — user_profiles.tier is the source of truth for RLS.
    // Middleware will fall back to 'free' until the next token refresh.
    console.error('[harbourview:webhook] app_metadata sync failed', error.message, { userId, tier })
  }
}

async function syncSubscription(supabase: Admin, subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const priceId    = subscription.items.data[0]?.price?.id ?? null
  const derivedTier   = priceId ? tierFromPriceId(priceId) : null
  const isLive        = subscription.status === 'active' || subscription.status === 'trialing'
  const effectiveTier: 'free' | 'intel' | 'operator' =
    isLive && derivedTier ? derivedTier : 'free'

  const item        = subscription.items.data[0]
  const periodStart = item?.current_period_start
    ? new Date(item.current_period_start * 1000).toISOString() : null
  const periodEnd   = item?.current_period_end
    ? new Date(item.current_period_end * 1000).toISOString() : null

  const userId = await findUserIdByCustomer(supabase, customerId)
  if (!userId) {
    console.error('[harbourview:webhook] no user_profiles row for stripe_customer_id', customerId)
    return
  }

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
        canceled_at: subscription.canceled_at
          ? new Date(subscription.canceled_at * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )
    if (subError) console.error('[harbourview:webhook] subscriptions upsert failed', subError)
  } else {
    console.error('[harbourview:webhook] price_id did not map to a known tier', priceId)
  }

  // 1. Update user_profiles.tier — what RLS policies check
  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({ tier: effectiveTier, updated_at: new Date().toISOString() })
    .eq('id', userId)
  if (profileError) {
    console.error('[harbourview:webhook] user_profiles tier update failed', profileError)
  }

  // 2. Sync to JWT app_metadata — what middleware reads from the token
  await syncAppMetadataTier(supabase, userId, effectiveTier)
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
    const { error } = await supabase
      .from('user_profiles')
      .update({ tier: 'free', updated_at: new Date().toISOString() })
      .eq('id', userId)
    if (error) console.error('[harbourview:webhook] cancellation profile update failed', error)

    // Downgrade app_metadata so middleware blocks access immediately on next request
    await syncAppMetadataTier(supabase, userId, 'free')
  } else {
    console.error('[harbourview:webhook] cancellation: no user_profiles row for customer', customerId)
  }
}

export async function POST(req: NextRequest) {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')
  const secret    = process.env.STRIPE_WEBHOOK_SECRET

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
            typeof session.subscription === 'string'
              ? session.subscription
              : session.subscription.id
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
        break
    }

    await markProcessed(supabase, event)
  } catch (err) {
    console.error('[harbourview:webhook] handler error', err)
    return NextResponse.json({ error: 'Webhook handler failed.' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
