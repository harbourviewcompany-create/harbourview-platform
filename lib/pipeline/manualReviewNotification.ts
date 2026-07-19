// lib/pipeline/manualReviewNotification.ts
// Resend email builder for pipeline_manual_review_queue.
// Follows the Harbourview design system used in lib/signals/notification.ts
// and lib/marketplace/notification.ts.
//
// Server-only — never import from client components.

import 'server-only'

export interface ManualReviewRow {
  id: string
  pipeline: string
  reference_date: string
  reason: string
  detail: Record<string, unknown> | null
  created_at: string
}

export type ManualReviewNotificationResult =
  | { status: 'sent'; to: string; count: number }
  | { status: 'skipped'; reason: 'no_rows' | 'missing_recipient' | 'missing_api_key' | 'send_failed'; error?: string }

const PIPELINE_LABEL: Record<string, string> = {
  daily_digest: 'Daily Digest (trade signals)',
  editorial_digest: 'Daily Digest (editorial)',
  signal_extraction: 'Signal Extraction',
}

function escHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function rowHtml(row: ManualReviewRow): string {
  const label = PIPELINE_LABEL[row.pipeline] ?? row.pipeline
  const detail = row.detail && Object.keys(row.detail).length > 0
    ? `<pre style="margin:8px 0 0;padding:8px;background:#f3f4f6;border-radius:4px;font-size:11px;color:#374151;white-space:pre-wrap">${escHtml(JSON.stringify(row.detail))}</pre>`
    : ''

  return `
<div style="margin-bottom:16px;padding:16px;background:#f9fafb;border-radius:6px;border:1px solid #e5e7eb">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;flex-wrap:wrap;gap:6px">
    <span style="font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#dc2626">${escHtml(label)}</span>
    <span style="font-size:11px;color:#6b7280">${escHtml(row.reference_date)}</span>
  </div>
  <p style="margin:0;font-size:13px;color:#374151;line-height:1.5">All configured LLM providers (Anthropic, OpenAI, Gemini) were circuit-broken for this pipeline/date — no content was auto-generated. Reason: <code>${escHtml(row.reason)}</code></p>
  ${detail}
</div>`
}

export function buildManualReviewDigestHtml(rows: ManualReviewRow[]): string {
  const today = new Date().toLocaleDateString('en-CA')
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:24px">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;border:1px solid #e5e7eb;padding:32px">
    <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#C6A55A">Harbourview Pipeline</p>
    <h1 style="margin:0 0 4px;font-size:20px;font-weight:600;color:#111827">Manual review needed</h1>
    <p style="margin:0 0 24px;font-size:13px;color:#6b7280">${rows.length} item${rows.length !== 1 ? 's' : ''} landed in the manual-review bucket in the last 24h · ${today}</p>
    ${rows.map(rowHtml).join('')}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
    <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.6">
      Sent because every configured LLM provider was degraded for at least one pipeline in the last 24 hours. Check provider balances/status.
    </p>
  </div>
</body>
</html>`
}

export async function sendManualReviewDigest(rows: ManualReviewRow[]): Promise<ManualReviewNotificationResult> {
  if (rows.length === 0) return { status: 'skipped', reason: 'no_rows' }

  const recipient = process.env.HARBOURVIEW_PIPELINE_REVIEW_NOTIFY_EMAIL?.trim()
    || process.env.HARBOURVIEW_TO_EMAIL?.trim()
  if (!recipient) return { status: 'skipped', reason: 'missing_recipient' }

  const resendKey = process.env.RESEND_API_KEY?.trim()
  if (!resendKey) return { status: 'skipped', reason: 'missing_api_key' }

  const fromAddress = process.env.HARBOURVIEW_FROM_EMAIL?.trim() ?? 'signals@harbourview.co'
  const count = rows.length
  const subject = `${count} pipeline item${count !== 1 ? 's' : ''} need manual review — Harbourview`
  const html = buildManualReviewDigestHtml(rows)

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
        html,
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return { status: 'skipped', reason: 'send_failed', error: text.slice(0, 300) }
    }

    return { status: 'sent', to: recipient, count }
  } catch (err) {
    return {
      status: 'skipped',
      reason: 'send_failed',
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
