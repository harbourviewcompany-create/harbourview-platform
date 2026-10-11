import { NextResponse } from 'next/server'
import { probePlatformHealth } from '@/lib/ops/platformHealth'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

function serviceSummary(name: string, result: { ok: boolean; status?: number; error?: string }) {
  if (result.ok) return `${name}: healthy`
  const detail = result.status ? `HTTP ${result.status}` : result.error ?? 'unavailable'
  return `${name}: ${detail}`
}

async function sendAlert(summary: string[]) {
  const recipient =
    process.env.HARBOURVIEW_PIPELINE_REVIEW_NOTIFY_EMAIL?.trim() ||
    process.env.HARBOURVIEW_TO_EMAIL?.trim()
  const resendKey = process.env.RESEND_API_KEY?.trim()

  if (!recipient || !resendKey) {
    return { sent: false, reason: 'missing_email_config' as const }
  }

  const fromAddress = process.env.HARBOURVIEW_FROM_EMAIL?.trim() ?? 'signals@harbourview.co'
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [recipient],
      subject: '[CRITICAL] Harbourview platform health — Supabase unavailable',
      html: [
        '<h2>Harbourview production health check failed</h2>',
        '<p>The application is reachable, but one or more Supabase data-plane services are unavailable.</p>',
        '<ul>',
        ...summary.map((line) => `<li>${line}</li>`),
        '</ul>',
        '<p>Check Supabase database disk/compute health before changing credentials or application auth code.</p>',
      ].join(''),
    }),
  })

  if (!response.ok) {
    await response.body?.cancel().catch(() => {})
    return { sent: false, reason: 'email_delivery_failed' as const }
  }

  await response.body?.cancel().catch(() => {})
  return { sent: true as const }
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ ok: false, error: 'cron_not_configured' }, { status: 503 })
  }
  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const publicKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (!supabaseUrl || !publicKey) {
    return NextResponse.json({ ok: false, error: 'supabase_public_config_missing' }, { status: 503 })
  }

  const health = await probePlatformHealth({ supabaseUrl, publicKey })
  if (health.ok) {
    return NextResponse.json({ ok: true, checkedAt: health.checkedAt, services: health.services })
  }

  const summary = [
    serviceSummary('Supabase Auth', health.services.auth),
    serviceSummary('Supabase database/PostgREST', health.services.database),
  ]
  const notification = await sendAlert(summary).catch(() => ({
    sent: false,
    reason: 'email_delivery_failed' as const,
  }))

  console.error('[platform-health] Supabase health check failed', {
    checkedAt: health.checkedAt,
    services: health.services,
    notification,
  })

  return NextResponse.json(
    {
      ok: false,
      checkedAt: health.checkedAt,
      services: health.services,
      notified: notification.sent,
    },
    { status: 503 },
  )
}
