/**
 * Stripe webhook handler for Harbourview subscription entitlements.
 *
 * Handles the canonical four-event contract and persists successful event IDs
 * only after all required Harbourview side effects have completed.
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
type HarbourviewTier = 'free' | 'intel' | 'operator'

async function alreadyProcessed(supabase: Admin, eventId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('stripe_webhook_events')
    .select('id')
    .eq('id', eventId)
    .maybeSingle()
  if (error) throw new Error(`Webhook idempotency lookup failed: ${error.message}`)
  return Boolean(data)
}

async function markProcessed(supabase: Admin, event: Stripe.Event) {
  const { error } = await supabase.from('stripe_webhook_events').insert({
    id: event.id,
    type: event.type,
    processed_at: new Date().toISOString(),
  })
  if (error) throw new Error(`Webhook idempotency insert failed: ${error.message}`)
}

async function findUserIdByCustomer(supabase: Admin, customerId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()
  if (error) throw new Error(`Customer mapping lookup failed: ${error.message}`)
  return data?.id ?? null
}

async function repairCustomerMappingFromMetadata(
  supabase: Admin,
  subscription: Stripe.Subscription,
  customerId: string,
): Promise<string | null> {
  const metadataUserId = subscription.metadata?.supabase_user_id
  if (!metadataUserId) return null

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('id,stripe_customer_id')
    .eq('id', metadataUserId)
    .maybeSingle()
  if (profileError) throw new Error(`Subscription metadata profile lookup failed: ${profileError.message}`)
  if (!profile) return null

  if (profile.stripe_customer_id && profile.stripe_customer_id !== customerId) {
    throw new Error('Subscription metadata user is already mapped to a different Stripe customer.')
  }

  if (!profile.stripe_customer_id) {
    const { error: mappingError } = await supabase
      .from('user_profiles')
      .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
      .eq('id', metadataUserId)
    if (mappingError) throw new Error(`Customer mapping repair failed: ${mappingError.message}`)
  }

  return metadataUserId
}

async function syncAppMetadataTier(
  supabase: Admin,
  userId: string,
  tier: HarbourviewTier,
): Promise<void> {
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    app_metadata: { subscription_tier: tier },
  })
  if (error) throw new Error(`app_metadata tier sync failed: ${error.message}`)
}

async function recomputeUserEntitlement(supabase: Admin, userId: string): Promise<HarbourviewTier> {
  const { data: subscriptions, error: subscriptionsError } = await supabase
    .from('subscriptions')
    .select('tier,status')
    .eq('user_id', userId)

  if (subscriptionsError) {
    throw new Error(`Subscription entitlement query failed: ${subscriptionsError.message}`)
  }

  let effectiveTier: HarbourviewTier = 'free'
  for (const subscription of subscriptions ?? []) {
    if (subscription.status !== 'active' && subscription.status !== 'trialing') continue
    if (subscription.tier === 'operator') {
      effectiveTier = 'operator'
      break
    }
    if (subscription.tier === 'intel') effectiveTier = 'intel'
  }

  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({ tier: effectiveTier, updated_at: new Date().toISOString() })
    .eq('id', userId)
  if (profileError) throw new Error(`user_profiles tier update failed: ${profileError.message}`)

  await syncAppMetadataTier(supabase, userId, effectiveTier)
  return effectiveTier
}

async function syncSubscription(supabase: Admin, subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id
  const item = subscription.items.data[0]
  const priceId = item?.price?.id ?? null
  const derivedTier = priceId ? tierFromPriceId(priceId) : null

  // The Stripe account may contain other products (including Wurx). Unknown
  // prices must never modify Harbourview entitlement state.
  if (!derivedTier) {
    console.info('[harbourview:webhook] ignoring subscription with non-Harbourview price', {
      subscriptionId: subscription.id,
      priceId,
    })
    return
  }

  let userId = await findUserIdByCustomer(supabase, customerId)
  if (!userId) {
    userId = await repairCustomerMappingFromMetadata(supabase, subscription, customerId)
  }
  if (!userId) {
    console.info('[harbourview:webhook] ignoring Harbourview-priced subscription without a mapped Harbourview user', {
      subscriptionId: subscription.id,
      customerId,
    })
    return
  }

  const periodStart = item?.current_period_start
    ? new Date(item.current_period_start * 1000).toISOString()
    : null
  const periodEnd = item?.current_period_end
    ? new Date(item.current_period_end * 1000).toISOString()
    : null

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
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  )
  if (subError) throw new Error(`subscriptions upsert failed: ${subError.message}`)

  await recomputeUserEntitlement(supabase, userId)
}

async function handleCancellation(supabase: Admin, subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id

  let userId = await findUserIdByCustomer(supabase, customerId)
  if (!userId) {
    const { data: storedSubscription, error: storedError } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('id', subscription.id)
      .maybeSingle()
    if (storedError) throw new Error(`Canceled subscription lookup failed: ${storedError.message}`)
    userId = storedSubscription?.user_id ?? null
  }

  if (!userId) {
    console.info('[harbourview:webhook] ignoring cancellation without a Harbourview user mapping', {
      subscriptionId: subscription.id,
      customerId,
    })
    return
  }

  const { error: cancellationError } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscription.id)
  if (cancellationError) throw new Error(`Subscription cancellation persistence failed: ${cancellationError.message}`)

  // Recompute across all remaining subscriptions. Canceling one subscription
  // must not revoke a second still-active Harbourview subscription.
  await recomputeUserEntitlement(supabase, userId)
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

  try {
    if (await alreadyProcessed(supabase, event.id)) {
      return NextResponse.json({ received: true, deduped: true })
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.subscription) {
          const subscriptionId = typeof session.subscription === 'string'
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
