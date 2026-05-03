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
const PRODUCTION_HOSTS = new Set(['harbourview-platform.vercel.app'])

function readEnv(name: string) {
  return process.env[name]?.trim() || ''
}

function envEnabled(name: string) {
  return readEnv(name) === '1'
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

function isProductionSmokeTarget() {
  const siteUrl = readEnv('HARBOURVIEW_SMOKE_BASE_URL') || readEnv('NEXT_PUBLIC_SITE_URL') || readEnv('VERCEL_PROJECT_PRODUCTION_URL')
  try {
    return PRODUCTION_HOSTS.has(new URL(siteUrl).hostname) || readEnv('VERCEL_ENV') === 'production'
  } catch {
    return readEnv('VERCEL_ENV') === 'production'
  }
}

function getConfig() {
  if (!envEnabled('HARBOURVIEW_SMOKE_WRITE')) throw new Error('smoke writes disabled')
  if (!envEnabled('HARBOURVIEW_SMOKE_CLEANUP')) throw new Error('smoke cleanup disabled')
  if (isProductionSmokeTarget() && !envEnabled('HARBOURVIEW_ALLOW_PRODUCTION_SMOKE_WRITES')) {
    throw new Error('production smoke writes disabled')
  }

  const serviceRoleKey = readEnv('SUPABASE_SERVICE_ROLE_KEY')
  if (!serviceRoleKey) throw new Error('smoke verifier service role not configured')

  const base = resolveBaseUrl(readEnv('NEXT_PUBLIC_SUPABASE_URL'))
  const parsed = new URL(base)
  if (parsed.hostname !== EXPECTED_HOST) throw new Error('wrong project')
  return { base, serviceRoleKey }
}

function h(serviceRoleKey: string) {
  return {
    apikey: serviceRoleKey,
    Authorization: 'Bearer ' + serviceRoleKey,
    'Content-Type': 'application/json',
  }
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

async function callRpc(c: { base: string; serviceRoleKey: string }, fn: string, input: ReturnType<typeof parse>) {
  const res = await fetch(`${c.base}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    cache: 'no-store',
    headers: h(c.serviceRoleKey),
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
