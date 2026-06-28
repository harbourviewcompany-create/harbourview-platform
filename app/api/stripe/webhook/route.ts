/**
 * Stripe webhook handler.
 * Handles: customer.subscription.created, updated, deleted
 * Syncs subscription state → supabase stripe_subscriptions_user_profiles
 * Updates user app_metadata.subscription_tier via Supabase Admin API
 * so the JWT carries the tier on next token refresh.
 */
import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { stripe, tierFromPriceId } from '@/lib/billing/stripe'
import { createClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('[harbourview:webhook] NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing.')
  }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function syncSubscription(
  supabase: ReturnType<typeof createClient>,
  subscription: Stripe.Subscription
) {
  const customerId  = subscription.customer as string
  const priceId     = subscription.items.data[0]?.price?.id ?? null
  const tier        = tierFromPriceId(priceId)
  const status      = subscription.status
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString()

  // 1. Find user by stripe_customer_id
  const { data: profile, error: profileError } = await supabase
    .from('stripe_subscriptions_user_profiles')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()

  if (profileError) {
    console.error('[harbourview:webhook] profile lookup failed', profileError)
    return
  }

  // 2. Upsert subscription record
  const { error: upsertError } = await supabase
    .from('stripe_subscriptions_user_profiles')
    .upsert({
      stripe_customer_id:    customerId,
      stripe_subscription_id: subscription.id,
      stripe_price_id:       priceId,
      subscription_tier:     tier,
      subscription_status:   status,
      current_period_end:    currentPeriodEnd,
      updated_at:            new Date().toISOString(),
    }, { onConflict: 'stripe_customer_id' })

  if (upsertError) {
    console.error('[harbourview:webhook] upsert failed', upsertError)
    return
  }

  // 3. Sync tier into auth.users app_metadata so JWT carries it
  const userId = profile?.user_id
  if (userId) {
    const effectiveTier = status === 'active' || status === 'trialing' ? tier : 'free'
    const { error: metaError } = await supabase.auth.admin.updateUserById(userId, {
      app_metadata: { subscription_tier: effectiveTier },
    })
    if (metaError) {
      console.error('[harbourview:webhook] app_metadata update failed', metaError)
    }
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

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await syncSubscription(supabase, event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted': {
        const sub        = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string

        await supabase
          .from('stripe_subscriptions_user_profiles')
          .update({
            subscription_status: 'canceled',
            subscription_tier:   'free',
            updated_at:          new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId)

        // Downgrade user JWT tier
        const { data: profile } = await supabase
          .from('stripe_subscriptions_user_profiles')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle()

        if (profile?.user_id) {
          await supabase.auth.admin.updateUserById(profile.user_id, {
            app_metadata: { subscription_tier: 'free' },
          })
        }
        break
      }

      default:
        // Acknowledge but ignore unhandled event types
        break
    }
  } catch (err) {
    console.error('[harbourview:webhook] handler error', err)
    return NextResponse.json({ error: 'Webhook handler failed.' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
