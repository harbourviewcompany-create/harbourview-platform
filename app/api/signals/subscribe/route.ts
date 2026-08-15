// app/api/signals/subscribe/route.ts
// POST  — create a signal subscription for the authenticated user
// DELETE — deactivate a subscription
// GET   — unsubscribe via email link (?action=unsubscribe&id=UUID)
//
// Gating: intel and operator tiers only.
// Free-tier users receive a 403 with upgrade prompt.

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_DB_SCHEMA } from '@/lib/supabase/env'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { enforceRateLimit, getClientIp } from '@/lib/network/rateLimit'

const ROUTE_ID = '/api/signals/subscribe'

// ── Helpers ────────────────────────────────────────────────────────────────────

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false }, db: { schema: SUPABASE_DB_SCHEMA } },
  )
}

async function authedUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    },
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// ── POST /api/signals/subscribe ────────────────────────────────────────────────
export async function POST(request: Request) {
  const user = await authedUser()
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Authenticated + tier-gated already, but still worth a per-user cap since
  // this writes to the DB — protects against a buggy client retry loop
  // rather than malicious abuse, which is already gated by auth+tier.
  const rateLimit = await enforceRateLimit({
    route: ROUTE_ID,
    ip: getClientIp(request),
    identity: user.id,
    limit: 30,
    windowMs: 60_000,
  })
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } },
    )
  }

  const svc = serviceClient()

  // Check tier — free users cannot subscribe
  const { data: profile } = await svc
    .from('user_profiles')
    .select('tier, email')
    .eq('id', user.id)
    .single()

  if (!profile || profile.tier === 'free') {
    return NextResponse.json(
      { error: 'Signal subscriptions require an Intel or Operator plan.', upgrade: true },
      { status: 403 },
    )
  }

  let body: {
    markets?: string[]
    types?: string[]
    min_confidence?: number
    frequency?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const markets        = Array.isArray(body.markets) ? body.markets : []
  const types          = Array.isArray(body.types)   ? body.types   : []
  const min_confidence = typeof body.min_confidence === 'number'
    ? Math.min(100, Math.max(0, body.min_confidence))
    : 50
  const frequency = body.frequency === 'weekly' ? 'weekly' : 'daily'

  // Upsert — one subscription per user for now (can expand to multi later)
  const { data, error } = await svc
    .from('signal_subscriptions')
    .upsert(
      {
        user_id:         user.id,
        email:           profile.email ?? user.email ?? '',
        markets,
        types,
        min_confidence,
        frequency,
        active:          true,
      },
      { onConflict: 'user_id' },
    )
    .select('id, markets, types, min_confidence, frequency, active')
    .single()

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, subscription: data })
}

// ── DELETE /api/signals/subscribe ─────────────────────────────────────────────
export async function DELETE() {
  const user = await authedUser()
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const svc = serviceClient()
  const { error } = await svc
    .from('signal_subscriptions')
    .update({ active: false })
    .eq('user_id', user.id)

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

// ── GET /api/signals/subscribe?action=unsubscribe&id=UUID ─────────────────────
// One-click unsubscribe from email link — no auth required, ID is the secret.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const id     = searchParams.get('id')

  if (action !== 'unsubscribe' || !id)
    return NextResponse.json({ error: 'Invalid unsubscribe link' }, { status: 400 })

  // Validate UUID format before hitting the DB
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!UUID_RE.test(id))
    return NextResponse.json({ error: 'Invalid subscription ID' }, { status: 400 })

  const svc = serviceClient()
  const { error } = await svc
    .from('signal_subscriptions')
    .update({ active: false })
    .eq('id', id)

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? 'https://harbourview.co'
  // Redirect to a confirmation page or home
  return NextResponse.redirect(`${siteUrl}/unsubscribed?type=signals`, 302)
}
