// app/api/cron/intelligence-notify/route.ts
// Vercel Cron — sends daily signal digest emails to active subscribers.
//
// Pipeline: intelligence-embed (06:00) → intelligence-notify (07:00 UTC)
//
// Per subscriber:
//   1. Find ia_signals from last 24h matching subscription filters
//      that haven't been sent before (not in signal_digest_log)
//   2. Send digest email via Resend
//   3. Write sent signal IDs to signal_digest_log
//   4. Update subscription.last_sent_at
//
// Idempotent — signal_digest_log UNIQUE(subscription_id, signal_id)
// prevents double-sending even if the cron fires twice.
//
// Required env vars:
//   CRON_SECRET
//   RESEND_API_KEY
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   HARBOURVIEW_FROM_EMAIL      (optional, defaults to signals@harbourview.co)
//   NEXT_PUBLIC_SITE_URL        (optional, defaults to https://harbourview.co)

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendSignalDigest, type DigestSignal } from '@/lib/signals/notification'

export const dynamic   = 'force-dynamic'
export const maxDuration = 300

// Look back 48h so signals from slow extraction runs aren't missed
const LOOKBACK_HOURS  = 48
const MAX_PER_EMAIL   = 10 // cap signals per digest

interface Subscription {
  id: string
  user_id: string
  email: string
  markets: string[]
  types: string[]
  min_confidence: number
  frequency: string
  last_sent_at: string | null
}

interface RawSignal {
  id: string
  title: string
  type: string
  market: string
  category: string
  confidence: number
  commercial_impact: string
  summary: string
  detected_at: string
}

export async function GET(request: Request) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret)
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 })
  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.RESEND_API_KEY) {
    console.warn('intelligence_notify_cron: RESEND_API_KEY not set — skipping')
    return NextResponse.json({ ok: false, reason: 'RESEND_API_KEY not configured' })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? 'https://harbourview.co'

  // ── Fetch active subscriptions ──────────────────────────────────────────────
  const { data: subs, error: subsErr } = await supabase
    .from('signal_subscriptions')
    .select('id, user_id, email, markets, types, min_confidence, frequency, last_sent_at')
    .eq('active', true)
    .eq('frequency', 'daily')

  if (subsErr) {
    console.error('intelligence_notify_cron: subscription fetch error', subsErr.message)
    return NextResponse.json({ ok: false, error: subsErr.message }, { status: 500 })
  }

  const subscriptions = (subs as Subscription[] | null) ?? []
  console.info(`intelligence_notify_cron: ${subscriptions.length} active daily subscriptions`)

  if (subscriptions.length === 0)
    return NextResponse.json({ ok: true, processed: 0, sent: 0, skipped: 0 })

  // ── Fetch candidate signals from last LOOKBACK_HOURS ───────────────────────
  const lookbackISO = new Date(Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000).toISOString()

  const { data: allSignals, error: sigErr } = await supabase
    .from('ia_signals')
    .select('id, title, type, market, category, confidence, commercial_impact, summary, detected_at')
    .gte('detected_at', lookbackISO.slice(0, 10)) // date comparison
    .eq('stage', 'new')                            // only fresh signals
    .order('detected_at', { ascending: false })
    .limit(500)

  if (sigErr) {
    console.error('intelligence_notify_cron: signals fetch error', sigErr.message)
    return NextResponse.json({ ok: false, error: sigErr.message }, { status: 500 })
  }

  const signals = (allSignals as RawSignal[] | null) ?? []
  console.info(`intelligence_notify_cron: ${signals.length} candidate signals in window`)

  // ── Process each subscription ───────────────────────────────────────────────
  let sent = 0, skipped = 0

  for (const sub of subscriptions) {
    try {
      // Fetch already-sent signal IDs for this subscription
      const { data: sentRows } = await supabase
        .from('signal_digest_log')
        .select('signal_id')
        .eq('subscription_id', sub.id)

      const sentIds = new Set((sentRows ?? []).map((r: { signal_id: string }) => r.signal_id))

      // Filter signals to this subscription's preferences
      const filtered = signals.filter(s => {
        if (sentIds.has(s.id)) return false
        if (s.confidence < sub.min_confidence) return false
        if (sub.markets.length > 0 && !sub.markets.includes(s.market)) return false
        if (sub.types.length > 0   && !sub.types.includes(s.type))     return false
        return true
      }).slice(0, MAX_PER_EMAIL)

      if (filtered.length === 0) {
        skipped++
        continue
      }

      const unsubscribeUrl = `${siteUrl}/api/signals/subscribe?action=unsubscribe&id=${sub.id}`

      const result = await sendSignalDigest({
        recipientEmail:  sub.email,
        signals:         filtered as DigestSignal[],
        subscriptionId:  sub.id,
        unsubscribeUrl,
        siteUrl,
      })

      if (result.status !== 'sent') {
        console.warn(`intelligence_notify_cron: send skipped for ${sub.email}:`, result)
        skipped++
        continue
      }

      // Log sent signals (UNIQUE constraint makes this idempotent)
      const logRows = filtered.map(s => ({
        subscription_id: sub.id,
        signal_id:       s.id,
      }))

      const { error: logErr } = await supabase
        .from('signal_digest_log')
        .upsert(logRows, { onConflict: 'subscription_id,signal_id', ignoreDuplicates: true })

      if (logErr)
        console.warn(`intelligence_notify_cron: digest_log insert partial error:`, logErr.message)

      // Update last_sent_at
      await supabase
        .from('signal_subscriptions')
        .update({ last_sent_at: new Date().toISOString() })
        .eq('id', sub.id)

      console.info(`intelligence_notify_cron: sent ${filtered.length} signals to ${sub.email}`)
      sent++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`intelligence_notify_cron: error for subscription ${sub.id}:`, msg)
      skipped++
    }
  }

  const summary = { ok: true, subscriptions: subscriptions.length, sent, skipped }
  console.info('intelligence_notify_cron: complete', summary)
  return NextResponse.json(summary)
}

