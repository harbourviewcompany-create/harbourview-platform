import 'server-only'
import { createHash, createHmac } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const TOKEN_SHA256 = 'ac33ee38eecc84466793e0e3120e12a7c18a68512a255c446ad9cd88d5d977e5'
const EXPECTED_ACCOUNT_ID = 'acct_1TfSk5HGqu2rN3Ie'
const OLD_URL = 'https://harbourview.vercel.app/api/webhooks/stripe'
const NEW_URL = 'https://harbourview.vercel.app/api/stripe/webhook'
const REQUIRED_EVENTS = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
]

function authorized(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') ?? ''
  return createHash('sha256').update(token).digest('hex') === TOKEN_SHA256
}

function stripeHeaders(key: string) {
  return { Authorization: `Bearer ${key}` }
}

async function stripeGet(path: string, key: string) {
  const r = await fetch(`https://api.stripe.com/v1${path}`, { headers: stripeHeaders(key), cache: 'no-store' })
  return { status: r.status, ok: r.ok, body: await r.json() }
}

async function stripePost(path: string, key: string, params: URLSearchParams) {
  const r = await fetch(`https://api.stripe.com/v1${path}`, {
    method: 'POST',
    headers: { ...stripeHeaders(key), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
    cache: 'no-store',
  })
  return { status: r.status, ok: r.ok, body: await r.json() }
}

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function inventory() {
  const key = process.env.STRIPE_SECRET_KEY ?? ''
  const account = key ? await stripeGet('/account', key) : null
  const endpoints = key ? await stripeGet('/webhook_endpoints?limit=100', key) : null
  const since = Math.floor(new Date('2026-07-26T00:00:00Z').getTime() / 1000)
  const events = key ? await stripeGet(`/events?limit=100&created[gte]=${since}`, key) : null
  const eventRows = Array.isArray(events?.body?.data) ? events.body.data : []
  const relevant = eventRows.filter((e: any) => REQUIRED_EVENTS.includes(e.type))
  const ids = relevant.map((e: any) => e.id)
  let processed = new Set<string>()
  if (ids.length) {
    const { data } = await adminClient().from('stripe_webhook_events').select('id').in('id', ids)
    processed = new Set((data ?? []).map((r: any) => r.id))
  }
  return {
    expectedAccountId: EXPECTED_ACCOUNT_ID,
    authenticatedAccountId: account?.ok ? account.body?.id ?? null : null,
    accountMatch: account?.ok && account.body?.id === EXPECTED_ACCOUNT_ID,
    webhookSecretPresent: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    endpoints: Array.isArray(endpoints?.body?.data) ? endpoints.body.data.map((e: any) => ({
      id: e.id,
      url: e.url,
      status: e.status,
      livemode: e.livemode,
      enabled_events: e.enabled_events,
      description: e.description,
    })) : [],
    relevantEventsSinceJul26: relevant.map((e: any) => ({
      id: e.id,
      type: e.type,
      created: e.created,
      livemode: e.livemode,
      objectId: e.data?.object?.id ?? null,
      processed: processed.has(e.id),
    })),
    eventListStatus: events?.status ?? null,
  }
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return new NextResponse(null, { status: 404 })
  return NextResponse.json(await inventory(), { headers: { 'Cache-Control': 'no-store, max-age=0' } })
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return new NextResponse(null, { status: 404 })
  const key = process.env.STRIPE_SECRET_KEY ?? ''
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? ''
  if (!key || !secret) return NextResponse.json({ ok: false, error: 'required Stripe env missing' }, { status: 500 })
  const action = req.nextUrl.searchParams.get('action')

  if (action === 'correct') {
    const endpoints = await stripeGet('/webhook_endpoints?limit=100', key)
    const list = Array.isArray(endpoints.body?.data) ? endpoints.body.data : []
    const target = list.find((e: any) => e.url === OLD_URL)
    const alreadyCorrect = list.find((e: any) => e.url === NEW_URL)
    if (!target && alreadyCorrect) {
      return NextResponse.json({ ok: true, changed: false, endpoint: { id: alreadyCorrect.id, url: alreadyCorrect.url, status: alreadyCorrect.status, enabled_events: alreadyCorrect.enabled_events } })
    }
    if (!target) return NextResponse.json({ ok: false, error: 'old endpoint not found' }, { status: 404 })
    const p = new URLSearchParams()
    p.set('url', NEW_URL)
    REQUIRED_EVENTS.forEach(v => p.append('enabled_events[]', v))
    p.set('disabled', 'true')
    const updated = await stripePost(`/webhook_endpoints/${target.id}`, key, p)
    return NextResponse.json({ ok: updated.ok, changed: updated.ok, endpoint: updated.ok ? { id: updated.body.id, url: updated.body.url, status: updated.body.status, enabled_events: updated.body.enabled_events } : null, stripeStatus: updated.status, error: updated.ok ? null : updated.body?.error?.message ?? 'Stripe update failed' })
  }

  if (action === 'selftest') {
    const eventId = `evt_hv_closure_${Date.now()}`
    const body = JSON.stringify({ id: eventId, object: 'event', api_version: '2026-06-24.dahlia', created: Math.floor(Date.now()/1000), data: { object: { id: 'obj_hv_closure' } }, livemode: true, pending_webhooks: 1, request: { id: null, idempotency_key: null }, type: 'harbourview.webhook.verification' })
    const t = Math.floor(Date.now()/1000)
    const sig = createHmac('sha256', secret).update(`${t}.${body}`).digest('hex')
    const signature = `t=${t},v1=${sig}`
    const send = async () => {
      const r = await fetch(NEW_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Stripe-Signature': signature }, body, cache: 'no-store' })
      return { status: r.status, text: await r.text() }
    }
    const first = await send()
    const second = await send()
    const { data } = await adminClient().from('stripe_webhook_events').select('id,type,processed_at').eq('id', eventId)
    return NextResponse.json({ ok: first.status >= 200 && first.status < 300 && second.status >= 200 && second.status < 300 && (data ?? []).length === 1, eventId, first, second, persistedRows: (data ?? []).length })
  }

  if (action === 'enable') {
    const endpoints = await stripeGet('/webhook_endpoints?limit=100', key)
    const list = Array.isArray(endpoints.body?.data) ? endpoints.body.data : []
    const target = list.find((e: any) => e.url === NEW_URL)
    if (!target) return NextResponse.json({ ok: false, error: 'correct endpoint not found' }, { status: 404 })
    const p = new URLSearchParams()
    p.set('disabled', 'false')
    REQUIRED_EVENTS.forEach(v => p.append('enabled_events[]', v))
    p.set('url', NEW_URL)
    const updated = await stripePost(`/webhook_endpoints/${target.id}`, key, p)
    return NextResponse.json({ ok: updated.ok, endpoint: updated.ok ? { id: updated.body.id, url: updated.body.url, status: updated.body.status, enabled_events: updated.body.enabled_events } : null, stripeStatus: updated.status, error: updated.ok ? null : updated.body?.error?.message ?? 'Stripe update failed' })
  }

  return NextResponse.json({ ok: false, error: 'unknown action' }, { status: 400 })
}
