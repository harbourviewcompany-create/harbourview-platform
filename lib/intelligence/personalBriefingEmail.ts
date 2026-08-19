import 'server-only'

export type PersonalBriefingEmailPayload = {
  recipientEmail: string
  narrative: string
  markets: string[]
  source: 'llm' | 'fallback'
  frequency: 'daily' | 'weekly'
  siteUrl: string
  unsubscribeUrl: string
}

export type PersonalBriefingEmailResult =
  | { status: 'sent'; to: string }
  | { status: 'skipped'; reason: 'missing_api_key' | 'send_failed' | 'no_email'; error?: string }

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function buildPersonalBriefingHtml(payload: PersonalBriefingEmailPayload): string {
  const today = new Date().toLocaleDateString('en-CA')
  const markets =
    payload.markets.length > 0
      ? payload.markets.map((m) => escHtml(m)).join(' · ')
      : 'your watched markets'
  const sourceLabel = payload.source === 'llm' ? 'LLM synthesis' : 'Assembled summary'

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:24px">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;border:1px solid #e5e7eb;padding:32px">
    <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#C6A55A">Harbourview Intelligence</p>
    <h1 style="margin:0 0 4px;font-size:20px;font-weight:600;color:#111827">Your personal briefing</h1>
    <p style="margin:0 0 24px;font-size:13px;color:#6b7280">${escHtml(payload.frequency)} · ${sourceLabel} · ${today}</p>
    <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:.08em">Markets</p>
    <p style="margin:0 0 20px;font-size:14px;color:#374151">${markets}</p>
    <p style="margin:0 0 24px;font-size:15px;color:#111827;line-height:1.65">${escHtml(payload.narrative)}</p>
    <div style="margin:24px 0">
      <a href="${payload.siteUrl}/dashboard?page=briefing"
         style="display:inline-block;padding:10px 22px;background:#C6A55A;color:#081423;border-radius:20px;text-decoration:none;font-size:13px;font-weight:600">
        Open My Briefings →
      </a>
    </div>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
    <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.6">
      Orientation-level intelligence only — not legal advice.<br>
      <a href="${payload.unsubscribeUrl}" style="color:#9ca3af">Unsubscribe</a>
    </p>
  </div>
</body>
</html>`
}

export async function sendPersonalBriefingEmail(
  payload: PersonalBriefingEmailPayload,
): Promise<PersonalBriefingEmailResult> {
  if (!payload.recipientEmail?.includes('@')) {
    return { status: 'skipped', reason: 'no_email' }
  }

  const resendKey = process.env.RESEND_API_KEY?.trim()
  if (!resendKey) return { status: 'skipped', reason: 'missing_api_key' }

  const fromAddress =
    process.env.HARBOURVIEW_FROM_EMAIL?.trim() ?? 'signals@harbourview.co'
  const subject = `Personal briefing (${payload.frequency}) — Harbourview`
  const html = buildPersonalBriefingHtml(payload)

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [payload.recipientEmail],
        subject,
        html,
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return { status: 'skipped', reason: 'send_failed', error: text.slice(0, 300) }
    }

    return { status: 'sent', to: payload.recipientEmail }
  } catch (err) {
    return {
      status: 'skipped',
      reason: 'send_failed',
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
