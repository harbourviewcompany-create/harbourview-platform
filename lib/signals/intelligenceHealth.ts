/**
 * Product-outcome health for the intelligence system (Stage G).
 * Answers: "Is the product fresh and useful?" — not "Did cron return 200?"
 */

import 'server-only'

export type IntelligenceOutcomeStatus = 'healthy' | 'warning' | 'critical'

export type IntelligenceAlert = {
  code: string
  severity: 'critical' | 'warning' | 'info'
  message: string
}

export type IntelligenceOutcome = {
  ok: boolean
  status: IntelligenceOutcomeStatus
  checked_at: string
  metrics: {
    newest_promoted_at: string | null
    feed_age_hours: number | null
    last_digest_date: string | null
    digest_age_days: number | null
    unclassified_14d: number
    reviewed_7d: number
    negative_feedback_7d: number
  }
  alerts: IntelligenceAlert[]
}

/** Plain-language summary for email / admin UI. */
export function summarizeOutcome(outcome: IntelligenceOutcome): string {
  const m = outcome.metrics
  const lines = [
    `Status: ${outcome.status.toUpperCase()}`,
    `Feed age: ${m.feed_age_hours == null ? 'unknown' : `${Math.round(m.feed_age_hours)}h`} since last promotion`,
    `Digest: last published ${m.last_digest_date ?? 'never'} (${m.digest_age_days ?? '?'}d ago)`,
    `Reviewed last 7d: ${m.reviewed_7d}`,
    `Unclassified (14d window): ${m.unclassified_14d}`,
    `Negative operator feedback (7d): ${m.negative_feedback_7d}`,
  ]
  if (outcome.alerts.length) {
    lines.push('', 'Alerts:')
    for (const a of outcome.alerts) {
      lines.push(`  [${a.severity}] ${a.code}: ${a.message}`)
    }
  }
  return lines.join('\n')
}

export function buildOutcomeAlertHtml(outcome: IntelligenceOutcome): string {
  const rows = outcome.alerts
    .map(
      (a) =>
        `<li style="margin:0 0 8px"><strong style="color:${
          a.severity === 'critical' ? '#dc2626' : a.severity === 'warning' ? '#d97706' : '#6b7280'
        }">[${a.severity}]</strong> ${escapeHtml(a.message)}</li>`,
    )
    .join('')

  return `<!DOCTYPE html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:28px">
    <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#C6A55A">Harbourview Intelligence</p>
    <h1 style="margin:0 0 12px;font-size:18px;color:#111827">Outcome health: ${escapeHtml(outcome.status)}</h1>
    <pre style="margin:0 0 16px;padding:12px;background:#f3f4f6;border-radius:6px;font-size:12px;color:#374151;white-space:pre-wrap">${escapeHtml(summarizeOutcome(outcome))}</pre>
    ${rows ? `<ul style="margin:0;padding-left:18px;font-size:13px;color:#374151">${rows}</ul>` : '<p style="color:#6b7280;font-size:13px">No alerts.</p>'}
  </div>
</body></html>`
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"')
}
