import 'server-only'

type NewOrgNotification = {
  org_id: string
  legal_name: string
  trade_name?: string | null
  org_type: string
  jurisdiction_country: string
  created_at?: string | null
}

export type NotificationResult =
  | { status: 'sent'; to: string }
  | { status: 'skipped'; reason: 'missing_recipient' }
  | { status: 'skipped'; reason: 'missing_api_key' }
  | { status: 'skipped'; reason: 'send_failed'; error?: string }

function buildEmailHtml(org: NewOrgNotification, adminLink: string): string {
  const rows: [string, string][] = [
    ['Legal name', org.legal_name],
    ['Trade name', org.trade_name || 'Not provided'],
    ['Org type', org.org_type],
    ['Jurisdiction', org.jurisdiction_country],
    ['Created', org.created_at || new Date().toISOString()],
  ]

  const tableRows = rows
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:6px 12px 6px 0;color:#6b7280;font-size:13px;white-space:nowrap;vertical-align:top">${label}</td>
        <td style="padding:6px 0;font-size:13px;color:#111827">${value.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
      </tr>`,
    )
    .join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;border:1px solid #e5e7eb;padding:32px">
    <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#C6A55A">Harbourview Platform</p>
    <h1 style="margin:0 0 24px;font-size:20px;font-weight:600;color:#111827">New organization pending verification</h1>
    <table style="width:100%;border-collapse:collapse">${tableRows}</table>
    <div style="margin:24px 0 0">
      <a href="${adminLink}" style="display:inline-block;padding:10px 20px;background:#C6A55A;color:#081423;border-radius:20px;text-decoration:none;font-size:13px;font-weight:600">Review in admin</a>
    </div>
    <p style="margin:24px 0 0;font-size:11px;color:#9ca3af">This notification was sent by Harbourview Platform. Do not reply to this email.</p>
  </div>
</body>
</html>`
}

export async function notifyNewOrgCreated(org: NewOrgNotification): Promise<NotificationResult> {
  const recipient = process.env.HARBOURVIEW_ORG_NOTIFY_EMAIL?.trim() || process.env.HARBOURVIEW_TO_EMAIL?.trim()
  if (!recipient) return { status: 'skipped', reason: 'missing_recipient' }

  const resendApiKey = process.env.RESEND_API_KEY?.trim()
  if (!resendApiKey) {
    console.info('harbourview_org_notification_skipped', { reason: 'MISSING_NOTIFICATION_PROVIDER', to: recipient })
    return { status: 'skipped', reason: 'missing_api_key' }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://harbourview.vercel.app'
  const adminLink = `${siteUrl}/admin/orgs`

  const fromAddress = process.env.HARBOURVIEW_FROM_EMAIL?.trim() || 'notifications@harbourview.co'
  const subject = `New org: ${org.trade_name || org.legal_name} (${org.org_type}, ${org.jurisdiction_country})`
  const html = buildEmailHtml(org, adminLink)

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: fromAddress, to: [recipient], subject, html }),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      console.info('harbourview_org_notification_failed', { status: response.status, body: text.slice(0, 200) })
      return { status: 'skipped', reason: 'send_failed', error: text.slice(0, 200) }
    }

    console.info('harbourview_org_notification_sent', { to: recipient, orgId: org.org_id })
    return { status: 'sent', to: recipient }
  } catch (error) {
    console.info('harbourview_org_notification_exception', { errorName: error instanceof Error ? error.name : 'unknown' })
    return { status: 'skipped', reason: 'send_failed' }
  }
}
