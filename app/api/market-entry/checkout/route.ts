import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, getOrCreateStripeCustomer } from '@/lib/stripe/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    if (!user.email) return NextResponse.json({ error: 'Authenticated account has no email address.' }, { status: 400 })

    const body = await request.json() as { missionId?: string }
    if (!body.missionId || !/^[0-9a-f-]{36}$/i.test(body.missionId)) {
      return NextResponse.json({ error: 'A valid missionId is required.' }, { status: 400 })
    }

    const { data: mission, error: missionError } = await supabase
      .from('market_entry_missions')
      .select('id,status,payment_status,report_status,plan_snapshot')
      .eq('id', body.missionId)
      .maybeSingle()
    if (missionError) throw new Error(`Mission lookup failed: ${missionError.message}`)
    if (!mission) return NextResponse.json({ error: 'Mission not found.' }, { status: 404 })
    if (!['orientation', 'ready'].includes(mission.status)) {
      return NextResponse.json({ error: 'This mission is not eligible for purchase until its readiness gates pass.' }, { status: 409 })
    }
    if (mission.payment_status === 'paid') return NextResponse.json({ error: 'This mission has already been paid.' }, { status: 409 })

    const priceId = process.env.STRIPE_PRICE_MARKET_ENTRY_REPORT
    if (!priceId) return NextResponse.json({ error: 'Market Entry report price is not configured.' }, { status: 503 })
    if (!priceId.startsWith('price_')) return NextResponse.json({ error: 'Market Entry report price configuration is invalid.' }, { status: 503 })

    const customerId = await getOrCreateStripeCustomer(user.id, user.email, user.user_metadata?.full_name)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://harbourview.vercel.app'
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/market-entry?checkout=success&session_id={CHECKOUT_SESSION_ID}&mission_id=${mission.id}`,
      cancel_url: `${appUrl}/market-entry?checkout=canceled&mission_id=${mission.id}`,
      metadata: { supabase_user_id: user.id, mission_id: mission.id, product: 'market_entry_report' },
      payment_intent_data: { metadata: { supabase_user_id: user.id, mission_id: mission.id, product: 'market_entry_report' } },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    })

    const { error: updateError } = await supabase
      .from('market_entry_missions')
      .update({ payment_status: 'checkout_created', checkout_session_id: session.id, stripe_customer_id: customerId })
      .eq('id', mission.id)
    if (updateError) throw new Error(`Mission checkout state update failed: ${updateError.message}`)

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[market-entry/checkout]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Checkout unavailable.' }, { status: 500 })
  }
}
