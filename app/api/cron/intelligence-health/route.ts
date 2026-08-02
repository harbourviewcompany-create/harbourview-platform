// app/api/cron/intelligence-health/route.ts
// Stage G: product-outcome alerting (feed freshness, digest currency).
// Runs independently of the quality pipeline so it cannot be taken down by
// the same failure mode it detects.
//
// Required env: CRON_SECRET, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL
// Optional: RESEND_API_KEY, HARBOURVIEW_PIPELINE_REVIEW_NOTIFY_EMAIL

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  buildOutcomeAlertHtml,
  type IntelligenceOutcome,
} from '@/lib/signals/intelligenceHealth'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 })
  }
  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  const { data, error } = await supabase.rpc('hv_intelligence_outcome_check')
  if (error) {
    console.error('intelligence-health: rpc failed', error.message)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  const outcome = data as IntelligenceOutcome
  const needsAlert = outcome.status === 'critical' || outcome.status === 'warning'

  if (!needsAlert || outcome.alerts.length === 0) {
    return NextResponse.json({
      ok: true,
      status: outcome.status,
      notified: false,
      metrics: outcome.metrics,
    })
  }

  const recipient =
    process.env.HARBOURVIEW_PIPELINE_REVIEW_NOTIFY_EMAIL?.trim() ||
    process.env.HARBOURVIEW_TO_EMAIL?.trim()
  const resendKey = process.env.RESEND_API_KEY?.trim()

  if (!recipient || !resendKey) {
    console.warn('intelligence-health: alert ready but missing email config', {
      status: outcome.status,
      alerts: outcome.alerts.map((a) => a.code),
    })
    return NextResponse.json({
      ok: true,
      status: outcome.status,
      notified: false,
      reason: 'missing_email_config',
      metrics: outcome.metrics,
      alerts: outcome.alerts,
    })
  }

  const fromAddress = process.env.HARBOURVIEW_FROM_EMAIL?.trim() ?? 'signals@harbourview.co'
  const subject = `[${outcome.status.toUpperCase()}] Harbourview intel outcome — ${outcome.alerts[0]?.code ?? 'check'}`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [recipient],
        subject,
        html: buildOutcomeAlertHtml(outcome),
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return NextResponse.json({
        ok: false,
        status: outcome.status,
        notified: false,
        error: text.slice(0, 300),
      }, { status: 502 })
    }

    return NextResponse.json({
      ok: true,
      status: outcome.status,
      notified: true,
      to: recipient,
      alertCount: outcome.alerts.length,
      metrics: outcome.metrics,
    })
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }, { status: 500 })
  }
}
