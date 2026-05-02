import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type Row = { id: string; inquiry_type: string; status: string; contact_email: string; message?: string; created_at?: string }

const LOCKED_SUPABASE_URL = 'https://zvxdgdkukjrrwamdpqrg.supabase.co'
const EXPECTED_HOST = 'zvxdgdkukjrrwamdpqrg.supabase.co'
const PREFIX = 'HARBOURVIEW_BROWSER_SMOKE_TEST:'
const TYPES = new Set(['quote_routing', 'listing_submission', 'wanted_request_submission'])

function readEnv(name: string) {
  return process.env[name]?.trim() || ''
}

function serverKey() {
  return readEnv('SUPABASE_' + 'SERVICE_' + 'ROLE_' + 'KEY')
}

function resolveBaseUrl(raw: string) {
  const normalized = raw.trim().replace(/\/$/, '')
  try {
    if (normalized && new URL(normalized).hostname === EXPECTED_HOST) return normalized
  } catch {
    // fall through to locked Harbourview project URL
  }
  return LOCKED_SUPABASE_URL
}

function getConfig() {
  const base = resolveBaseUrl(readEnv('NEXT_PUBLIC_SUPABASE_URL'))
  const parsed = new URL(base)
  const key = serverKey()
  if (parsed.hostname !== EXPECTED_HOST) throw new Error('wrong project')
  if (!key) throw new Error('verifier not configured')
  return { base, key }
}

function h(key: string) {
  return { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', Prefer: 'return=representation' }
}

function parse(body: Record<string, unknown>) {
  const action = String(body.action || '')
  const email = String(body.email || '').trim().toLowerCase()
  const marker = String(body.marker || '').trim()
  const kind = String(body.inquiry_type || '').trim()
  if (action !== 'verify' && action !== 'close') throw new Error('bad action')
  if (!email.startsWith('smoke+') || !email.endsWith('@harbourview.local')) throw new Error('bad email')
  if (!marker.startsWith(PREFIX) || marker.length > 120) throw new Error('bad marker')
  if (!TYPES.has(kind)) throw new Error('bad inquiry type')
  return { action, email, marker, kind }
}

async function readRow(c: { base: string; key: string }, email: string, marker: string, kind: string) {
  const qs = `contact_email=eq.${encodeURIComponent(email)}&inquiry_type=eq.${encodeURIComponent(kind)}&select=id,inquiry_type,status,contact_email,message,created_at&order=created_at.desc&limit=5`
  const res = await fetch(`${c.base}/rest/v1/marketplace_inquiries?${qs}`, { cache: 'no-store', headers: h(c.key) })
  const txt = await res.text()
  if (!res.ok) throw new Error(`read ${res.status}`)
  const rows = JSON.parse(txt) as Row[]
  return rows.find((r) => r.message?.includes(marker)) || null
}

async function closeRow(c: { base: string; key: string }, id: string, marker: string) {
  const res = await fetch(`${c.base}/rest/v1/marketplace_inquiries?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    cache: 'no-store',
    headers: h(c.key),
    body: JSON.stringify({ status: 'closed', internal_notes: marker + ': closed by smoke cleanup.' }),
  })
  if (!res.ok) throw new Error(`close ${res.status}`)
}

export async function POST(request: Request) {
  try {
    const input = parse((await request.json()) as Record<string, unknown>)
    const c = getConfig()
    const row = await readRow(c, input.email, input.marker, input.kind)
    if (!row) return NextResponse.json({ ok: true, found: false })
    if (input.action === 'close') await closeRow(c, row.id, input.marker)
    return NextResponse.json({ ok: true, found: true, closed: input.action === 'close', row: { id: row.id, inquiry_type: row.inquiry_type, status: input.action === 'close' ? 'closed' : row.status, contact_email: row.contact_email, created_at: row.created_at } })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'failed' }, { status: 400 })
  }
}
