#!/usr/bin/env node

const PROJECT_REF = 'zvxdgdkukjrrwamdpqrg'
const API_ROOT = 'https://api.supabase.com/v1'
const TIMEOUT_MS = 15_000

const token = process.env.SUPABASE_ACCESS_TOKEN?.trim()
const smtpPassword = process.env.SUPABASE_SMTP_PASSWORD?.trim()

if (!token) {
  console.error('Missing SUPABASE_ACCESS_TOKEN')
  process.exit(2)
}
if (!smtpPassword) {
  console.error('Missing SUPABASE_SMTP_PASSWORD')
  process.exit(2)
}

const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
}

async function request(path, init = {}) {
  const response = await fetch(`${API_ROOT}${path}`, {
    ...init,
    headers: { ...headers, ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  const text = await response.text()
  let body = null
  try { body = text ? JSON.parse(text) : null } catch {}
  if (!response.ok) {
    throw new Error(`${init.method ?? 'GET'} ${path} failed: ${response.status} ${text.replace(/re_[A-Za-z0-9_-]+/g, '[REDACTED]')}`)
  }
  return body
}

const before = await request(`/projects/${PROJECT_REF}/config/auth`)

const patch = {
  external_email_enabled: true,
  mailer_autoconfirm: false,
  mailer_allow_unverified_email_sign_ins: false,
  smtp_admin_email: 'signals@harbourview.co',
  smtp_host: 'smtp.resend.com',
  smtp_port: '465',
  smtp_user: 'resend',
  smtp_pass: smtpPassword,
  smtp_sender_name: 'Harbourview',
}

await request(`/projects/${PROJECT_REF}/config/auth`, {
  method: 'PATCH',
  body: JSON.stringify(patch),
})

const after = await request(`/projects/${PROJECT_REF}/config/auth`)

const verified = {
  projectRef: PROJECT_REF,
  before: {
    externalEmailEnabled: before.external_email_enabled,
    mailerAutoconfirm: before.mailer_autoconfirm,
    smtpConfigured: Boolean(before.smtp_host && before.smtp_user),
  },
  after: {
    externalEmailEnabled: after.external_email_enabled,
    mailerAutoconfirm: after.mailer_autoconfirm,
    smtpHost: after.smtp_host,
    smtpPort: after.smtp_port,
    smtpUser: after.smtp_user,
    smtpSenderName: after.smtp_sender_name,
    smtpConfigured: Boolean(after.smtp_host && after.smtp_user && after.smtp_pass),
  },
}

if (
  after.external_email_enabled !== true ||
  after.mailer_autoconfirm !== false ||
  after.smtp_host !== 'smtp.resend.com' ||
  String(after.smtp_port) !== '465' ||
  after.smtp_user !== 'resend'
) {
  console.error(JSON.stringify({ ...verified, verified: false }))
  process.exit(1)
}

console.log(JSON.stringify({ ...verified, verified: true }))
