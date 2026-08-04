#!/usr/bin/env node

const PROJECT_REF = 'zvxdgdkukjrrwamdpqrg'
const API_ROOT = 'https://api.supabase.com/v1'
const apply = process.argv.includes('--apply')
const token = process.env.SUPABASE_ACCESS_TOKEN?.trim()
const requestedRef = process.env.SUPABASE_PROJECT_REF?.trim()

if (!token) {
  console.error('Missing SUPABASE_ACCESS_TOKEN. Create a scoped Supabase management token before running this control.')
  process.exit(2)
}
if (requestedRef && requestedRef !== PROJECT_REF) {
  console.error(`Project mismatch: this control is locked to ${PROJECT_REF}.`)
  process.exit(2)
}

const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
}

async function readConfig() {
  const response = await fetch(`${API_ROOT}/projects/${PROJECT_REF}/config/auth`, { headers })
  if (!response.ok) throw new Error(`Auth config read failed: ${response.status} ${await response.text()}`)
  return response.json()
}

const before = await readConfig()
if (before.password_hibp_enabled === true) {
  console.log(JSON.stringify({ projectRef: PROJECT_REF, passwordHibpEnabled: true, changed: false }))
  process.exit(0)
}
if (!apply) {
  console.error(JSON.stringify({ projectRef: PROJECT_REF, passwordHibpEnabled: false, changed: false, action: 'rerun with --apply' }))
  process.exit(3)
}

const response = await fetch(`${API_ROOT}/projects/${PROJECT_REF}/config/auth`, {
  method: 'PATCH',
  headers,
  body: JSON.stringify({ password_hibp_enabled: true }),
})
if (!response.ok) throw new Error(`Auth config update failed: ${response.status} ${await response.text()}`)

const after = await readConfig()
if (after.password_hibp_enabled !== true) throw new Error('Leaked-password protection did not verify as enabled after update.')
console.log(JSON.stringify({ projectRef: PROJECT_REF, passwordHibpEnabled: true, changed: true }))
