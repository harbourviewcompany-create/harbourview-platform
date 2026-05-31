// lib/scrapers/digest.ts
// Sends the post-run digest email to the admin via Resend.
// Summarises what was scraped, how many candidates need review, and links to admin.

import type { ScrapeRunSummary } from './types'

export async function sendScrapeDigest(summary: ScrapeRunSummary): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY?.trim()
  const recipient = process.env.HARBOURVIEW_TO_EMAIL?.trim()
  const fromAddress = process.env.HARBOURVIEW_FROM_EMAIL?.trim() ?? 'onboarding@resend.dev'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? 'https://harbourview.vercel.app'

  if (!resendKey || !recipient) {
    console.info('scrape_digest: skipping — RESEND_API_KEY or recipient not set')
    return
  }

  const adminUrl = `${siteUrl}/admin/listings/candidates`
  const duration = Math.round(
    (new Date(summary.completedAt).getTime() - new Date(summary.startedAt).getTime()) / 1000,
  )

  const sourceRows = summary.sourceResults
    .map((r) => {
      const icon = r.status === 'ok' ? '✓' : r.status === 'rate_limited' ? '⚠' : '✗'
      return `
        <tr>
          <td style="padding:6px 12px 6px 0;font-size:12px;color:#374151">${icon} ${r.source.name}</td>
          <td style="padding:6px 0;font-size:12px;color:#374151;text-align:center">${r.candidatesFound}</td>
          <td style="padding:6px 0;font-size:12px;color:#059669;text-align:center;font-weight:600">${r.candidatesInserted}</td>
          <td style="padding:6px 0;font-size:12px;color:#6b7280;text-align:center">${r.candidatesSkipped}</td>
          <td style="padding:6px 0;font-size:12px;color:${r.status !== 'ok' ? '#dc2626' : '#6b7280'};text-align:center">${r.error ?? '—'}</td>
        </tr>`
    })
    .join('')

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:24px">
  <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:8px;border:1px solid #e5e7eb;padding:32px">
    <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#C6A55A">Harbourview Network</p>
    <h1 style="margin:0 0 6px;font-size:20px;font-weight:600;color:#111827">Scrape engine digest</h1>
    <p style="margin:0 0 24px;font-size:13px;color:#6b7280">Run completed ${new Date(summary.completedAt).toUTCString()} · ${duration}s</p>

    <div style="display:flex;gap:12px;margin-bottom:24px">
      <div style="flex:1;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:14px;text-align:center">
        <div style="font-size:26px;font-weight:600;color:#111827">${summary.totalCandidates}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:2px">Found</div>
      </div>
      <div style="flex:1;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:14px;text-align:center">
        <div style="font-size:26px;font-weight:600;color:#059669">${summary.totalInserted}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:2px">New — needs review</div>
      </div>
      <div style="flex:1;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:14px;text-align:center">
        <div style="font-size:26px;font-weight:600;color:#6b7280">${summary.totalSkipped}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:2px">Duplicates skipped</div>
      </div>
    </div>

    ${summary.totalInserted > 0 ? `
    <div style="margin-bottom:24px">
      <a href="${adminUrl}" style="display:inline-block;padding:10px 22px;background:#C6A55A;color:#081423;border-radius:20px;text-decoration:none;font-size:13px;font-weight:600">
        Review ${summary.totalInserted} new candidate${summary.totalInserted !== 1 ? 's' : ''} →
      </a>
    </div>` : '<p style="color:#6b7280;font-size:13px;margin-bottom:24px">No new candidates this run — all duplicates or no listings found.</p>'}

    <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
      <thead>
        <tr style="border-bottom:1px solid #e5e7eb">
          <th style="text-align:left;padding:6px 12px 8px 0;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#6b7280">Source</th>
          <th style="padding:6px 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;text-align:center">Found</th>
          <th style="padding:6px 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;text-align:center">New</th>
          <th style="padding:6px 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;text-align:center">Skip</th>
          <th style="padding:6px 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;text-align:center">Error</th>
        </tr>
      </thead>
      <tbody>${sourceRows}</tbody>
    </table>

    <p style="margin:0;font-size:11px;color:#9ca3af">Run ID: ${summary.runId} · Harbourview scrape engine</p>
  </div>
</body>
</html>`

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
        subject: `Scrape digest: ${summary.totalInserted} new candidate${summary.totalInserted !== 1 ? 's' : ''} — ${new Date(summary.completedAt).toLocaleDateString('en-CA')}`,
        html,
      }),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.warn('scrape_digest: Resend error', res.status, text.slice(0, 200))
    } else {
      console.info('scrape_digest: digest sent to', recipient)
    }
  } catch (err) {
    console.warn('scrape_digest: exception', err instanceof Error ? err.message : String(err))
  }
}
