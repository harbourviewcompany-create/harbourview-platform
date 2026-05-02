import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type Row = {
  id: string
  inquiry_type: string
  status: string
  contact_email: string
  created_at?: string
}

const LOCKED_SUPABASE_URL = 'https://zvxdgdkukjrrwamdpqrg.supabase.co'
const EXPECTED_HOST = 'zvxdgdkukjrrwamdpqrg.supabase.co'
const PREFIX = 'HARBOURVIEW_BROWSER_SMOKE_TEST:'
const TYPES = new Set(['quote_routing', 'listing_submission', 'wanted_request_submission'])

function readEnv(name: string) {
  return process.env[name]?.trim() || ''
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

function clientKey() {
  return readEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') || readEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

function getConfig() {
  const base = resolveBaseUrl(readEnv('NEXT_PUBLIC_SUPABASE_URL'))
  const parsed = new URL(base)
  const key = clientKey()
  if (parsed.hostname !== EXPECTED_HOST) throw new Error('wrong project')
  if (!key) throw new Error('verifier not configured')
  return { base, key }
}

function h(key: string) {
  return { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }
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

async function callRpc(c: { base: string; key: string }, fn: string, input: ReturnType<typeof parse>) {
  const res = await fetch(`${c.base}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    cache: 'no-store',
    headers: h(c.key),
    body: JSON.stringify({
      p_email: input.email,
      p_marker: input.marker,
      p_inquiry_type: input.kind,
    }),
  })
  const txt = await res.text()
  if (!res.ok) throw new Error(`${fn} ${res.status}: ${txt.slice(0, 240)}`)
  return JSON.parse(txt) as Row[]
}

export async function POST(request: Request) {
  try {
    const input = parse((await request.json()) as Record<string, unknown>)
    const c = getConfig()
    const fn = input.action === 'close' ? 'smoke_close_marketplace_inquiry' : 'smoke_verify_marketplace_inquiry'
    const rows = await callRpc(c, fn, input)
    const row = rows[0]
    if (!row) return NextResponse.json({ ok: true, found: false })
    return NextResponse.json({
      ok: true,
      found: true,
      closed: input.action === 'close',
      row: {
        id: row.id,
        inquiry_type: row.inquiry_type,
        status: row.status,
        contact_email: row.contact_email,
        created_at: row.created_at,
      },
    })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'failed' }, { status: 400 })
  }
}
