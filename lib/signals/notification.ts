// lib/signals/notification.ts
// Resend email builder for ia_signals digest.
// Follows the Harbourview design system used in lib/scrapers/digest.ts
// and lib/marketplace/notification.ts.
//
// Server-only — never import from client components.

import 'server-only'

export interface DigestSignal {
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

export interface SignalDigestPayload {
  recipientEmail: string
  signals: DigestSignal[]
  subscriptionId: string
  unsubscribeUrl: string
  siteUrl: string
}

export type SignalNotificationResult =
  | { status: 'sent'; to: string; count: number }
  | { status: 'skipped'; reason: 'no_signals' | 'missing_api_key' | 'send_failed'; error?: string }

// ── Formatting helpers ─────────────────────────────────────────────────────────

const IMPACT_COLOUR: Record<string, string> = {
  high:   '#dc2626',
  medium: '#d97706',
  low:    '#6b7280',
}

const TYPE_LABEL: Record<string, string> = {
  regulatory_change:          'Regulatory',
  trade_signal:               'Trade',
  market_entry_opportunity:   'Market Entry',
  research_update:            'Research',
  watchlist:                  'Watchlist',
  general:                    'General',
}

function confidenceBar(score: number): string {
  const filled = Math.round(score / 10)
  return '█'.repeat(filled) + '░'.repeat(10 - filled)
}

function signalRow(s: DigestSignal, siteUrl: string): string {
  const impactColour = IMPACT_COLOUR[s.commercial_impact] ?? '#6b7280'
  const typeLabel    = TYPE_LABEL[s.type] ?? s.type
  const detectedDate = new Date(s.detected_at).toLocaleDateString('en-CA')

  return `
<div style="margin-bottom:16px;padding:16px;background:#f9fafb;border-radius:6px;border:1px solid #e5e7eb">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;flex-wrap:wrap;gap:6px">
    <span style="font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:${impactColour}">${typeLabel} · ${s.market}</span>
    <span style="font-size:11px;color:#6b7280">${detectedDate}</span>
  </div>
  <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#111827;line-height:1.4">${escHtml(s.title)}</p>
  <p style="margin:0 0 10px;font-size:13px;color:#374151;line-height:1.5">${escHtml(s.summary.slice(0, 260))}${s.summary.length > 260 ? '…' : ''}</p>
  <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
    <span style="font-size:11px;color:#6b7280;font-family:monospace">${confidenceBar(s.confidence)} ${s.confidence}%</span>
    <span style="padding:2px 8px;background:#fff;border:1px solid #e5e7eb;border-radius:999px;font-size:11px;color:#374151;text-transform:capitalize">${s.commercial_impact} impact</span>
  </div>
</div>`
}

function escHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// ── HTML builder ───────────────────────────────────────────────────────────────

export function buildSignalDigestHtml(payload: SignalDigestPayload): string {
  const { signals, siteUrl, unsubscribeUrl } = payload
  const count = signals.length
  const today = new Date().toLocaleDateString('en-CA')

  const signalRows = signals
    .slice(0, 10)  // cap at 10 signals per email
    .map(s => signalRow(s, siteUrl))
    .join('')

  const overflowNote = count > 10
    ? `<p style="margin:0 0 24px;font-size:13px;color:#6b7280;text-align:center">+ ${count - 10} more signals available in your dashboard.</p>`
    : ''

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:24px">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;border:1px solid #e5e7eb;padding:32px">

    <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#C6A55A">Harbourview Intelligence</p>
    <h1 style="margin:0 0 4px;font-size:20px;font-weight:600;color:#111827">Your signal digest</h1>
    <p style="margin:0 0 24px;font-size:13px;color:#6b7280">${count} new signal${count !== 1 ? 's' : ''} · ${today}</p>

    ${signalRows}
    ${overflowNote}

    <div style="margin:24px 0">
      <a href="${siteUrl}/dashboard/signals"
         style="display:inline-block;padding:10px 22px;background:#C6A55A;color:#081423;border-radius:20px;text-decoration:none;font-size:13px;font-weight:600">
        View all signals →
      </a>
    </div>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
    <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.6">
      You're receiving this because you subscribed to Harbourview signal alerts.<br>
      <a href="${unsubscribeUrl}" style="color:#9ca3af">Unsubscribe</a>
    </p>
  </div>
</body>
</html>`
}

// ── Send via Resend ────────────────────────────────────────────────────────────

export async function sendSignalDigest(payload: SignalDigestPayload): Promise<SignalNotificationResult> {
  if (payload.signals.length === 0)
    return { status: 'skipped', reason: 'no_signals' }

  const resendKey = process.env.RESEND_API_KEY?.trim()
  if (!resendKey)
    return { status: 'skipped', reason: 'missing_api_key' }

  const fromAddress = process.env.HARBOURVIEW_FROM_EMAIL?.trim() ?? 'signals@harbourview.co'
  const count       = payload.signals.length
  const subject     = `${count} new signal${count !== 1 ? 's' : ''} — Harbourview Intelligence`
  const html        = buildSignalDigestHtml(payload)

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:    fromAddress,
        to:      [payload.recipientEmail],
        subject,
        html,
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return { status: 'skipped', reason: 'send_failed', error: text.slice(0, 300) }
    }

    return { status: 'sent', to: payload.recipientEmail, count }
  } catch (err) {
    return {
      status: 'skipped',
      reason: 'send_failed',
      error:  err instanceof Error ? err.message : String(err),
    }
  }
}
