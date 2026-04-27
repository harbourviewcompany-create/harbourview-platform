import type { IntakeFormData, ContactFormData } from './validation'

function formatTimestamp(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
}

export function buildIntakeEmailHtml(data: IntakeFormData, meta: {
  sourceUrl?: string
  userAgent?: string
  utm?: Record<string, string>
}): { subject: string; html: string; text: string } {
  const subject = `New Harbourview Intake: ${data.company} - ${data.objective}`

  const rows = [
    ['Name', data.name],
    ['Email', data.email],
    ['Company', data.company],
    ['Role', data.role],
    ['Visitor Type', data.visitorType],
    ['Objective', data.objective],
    ['Target Market / Region', data.targetMarket],
    ['Preferred Next Step', data.preferredNextStep],
    ['Phone', data.phone || '—'],
    ['Website', data.website || '—'],
    ['LinkedIn', data.linkedin || '—'],
    ['Timeline', data.timeline || '—'],
    ['Notes', data.notes || '—'],
    ['Submitted', formatTimestamp()],
    ['Source', meta.sourceUrl || '/intake'],
    ['User Agent', meta.userAgent || '—'],
    ...(meta.utm ? Object.entries(meta.utm).map(([k, v]) => [`UTM ${k}`, v]) : []),
  ]

  const tableRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px;font-weight:600;color:#C6A55A;white-space:nowrap;vertical-align:top;">${label}</td><td style="padding:6px 12px;color:#F5F1E8;">${value}</td></tr>`
    )
    .join('')

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background:#0B1A2F;font-family:Inter,system-ui,sans-serif;margin:0;padding:24px;">
  <div style="max-width:600px;margin:0 auto;background:#081423;border:1px solid rgba(198,165,90,0.22);border-radius:4px;overflow:hidden;">
    <div style="background:#0B1A2F;padding:24px 32px;border-bottom:1px solid rgba(198,165,90,0.22);">
      <p style="font-family:'Playfair Display',Georgia,serif;font-size:22px;color:#C6A55A;margin:0;letter-spacing:0.1em;">HARBOURVIEW</p>
      <p style="color:#C9C2B3;margin:4px 0 0;font-size:13px;">New Intake Submission</p>
    </div>
    <div style="padding:24px 32px;">
      <table style="width:100%;border-collapse:collapse;">
        ${tableRows}
      </table>
    </div>
    <div style="padding:16px 32px;border-top:1px solid rgba(198,165,90,0.15);background:#0B1A2F;">
      <p style="color:#C9C2B3;font-size:12px;margin:0;">This is a confidential intake submission through Harbourview.</p>
    </div>
  </div>
</body>
</html>`

  const text = rows.map(([l, v]) => `${l}: ${v}`).join('\n')

  return { subject, html, text }
}

export function buildContactEmailHtml(data: ContactFormData, meta: {
  sourceUrl?: string
  userAgent?: string
  utm?: Record<string, string>
}): { subject: string; html: string; text: string } {
  const subject = `New Harbourview Contact: ${data.company} - ${data.name}`

  const rows = [
    ['Name', data.name],
    ['Email', data.email],
    ['Company', data.company],
    ['Phone', data.phone || '—'],
    ['Message', data.message],
    ['Submitted', formatTimestamp()],
    ['Source', meta.sourceUrl || '/contact'],
    ['User Agent', meta.userAgent || '—'],
    ...(meta.utm ? Object.entries(meta.utm).map(([k, v]) => [`UTM ${k}`, v]) : []),
  ]

  const tableRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px;font-weight:600;color:#C6A55A;white-space:nowrap;vertical-align:top;">${label}</td><td style="padding:6px 12px;color:#F5F1E8;">${value}</td></tr>`
    )
    .join('')

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background:#0B1A2F;font-family:Inter,system-ui,sans-serif;margin:0;padding:24px;">
  <div style="max-width:600px;margin:0 auto;background:#081423;border:1px solid rgba(198,165,90,0.22);border-radius:4px;overflow:hidden;">
    <div style="background:#0B1A2F;padding:24px 32px;border-bottom:1px solid rgba(198,165,90,0.22);">
      <p style="font-family:'Playfair Display',Georgia,serif;font-size:22px;color:#C6A55A;margin:0;letter-spacing:0.1em;">HARBOURVIEW</p>
      <p style="color:#C9C2B3;margin:4px 0 0;font-size:13px;">New Contact Submission</p>
    </div>
    <div style="padding:24px 32px;">
      <table style="width:100%;border-collapse:collapse;">
        ${tableRows}
      </table>
    </div>
    <div style="padding:16px 32px;border-top:1px solid rgba(198,165,90,0.15);background:#0B1A2F;">
      <p style="color:#C9C2B3;font-size:12px;margin:0;">This is a contact submission through Harbourview.</p>
    </div>
  </div>
</body>
</html>`

  const text = rows.map(([l, v]) => `${l}: ${v}`).join('\n')

  return { subject, html, text }
}
