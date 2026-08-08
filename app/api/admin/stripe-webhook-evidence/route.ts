import 'server-only'
import { createHash, createHmac } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const TOKEN_SHA256 = 'ac33ee38eecc84466793e0e3120e12a7c18a68512a255c446ad9cd88d5d977e5'
const REQUIRED_EVENTS = ['checkout.session.completed','customer.subscription.created','customer.subscription.updated','customer.subscription.deleted']

function authorized(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') ?? ''
  return createHash('sha256').update(token).digest('hex') === TOKEN_SHA256
}

async function stripeGet(path: string, key: string) {
  const r = await fetch(`https://api.stripe.com/v1${path}`, { headers: { Authorization: `Bearer ${key}` }, cache: 'no-store' })
  return { status: r.status, ok: r.ok, body: await r.json() }
}

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function selfTest(secret: string) {
  const eventId = `evt_hv_closure_${Date.now()}`
  const body = JSON.stringify({ id: eventId, object: 'event', api_version: '2026-06-24.dahlia', created: Math.floor(Date.now()/1000), data: { object: { id: 'obj_hv_closure' } }, livemode: true, pending_webhooks: 1, request: { id: null, idempotency_key: null }, type: 'harbourview.webhook.verification' })
  const send = async () => {
    const t = Math.floor(Date.now()/1000)
    const sig = createHmac('sha256', secret).update(`${t}.${body}`).digest('hex')
    const r = await fetch('https://harbourview.vercel.app/api/stripe/webhook', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Stripe-Signature': `t=${t},v1=${sig}` }, body, cache: 'no-store' })
    return { status: r.status, text: await r.text() }
  }
  const first = await send()
  const second = await send()
  const db = adminClient()
  const { data } = await db.from('stripe_webhook_events').select('id,type,processed_at').eq('id', eventId)
  const rowsBeforeCleanup = data ?? []
  const { error: cleanupError } = await db.from('stripe_webhook_events').delete().eq('id', eventId)
  return { eventId, first, second, persistedRows: rowsBeforeCleanup.length, cleanupOk: !cleanupError, ok: first.status >= 200 && first.status < 300 && second.status >= 200 && second.status < 300 && rowsBeforeCleanup.length === 1 && !cleanupError }
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return new NextResponse(null, { status: 404 })
  const key = process.env.STRIPE_SECRET_KEY ?? ''
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? ''
  if (!key || !secret) return NextResponse.json({ ok: false, error: 'Stripe env missing' }, { status: 500 })

  const since = Math.floor(new Date('2026-07-26T00:00:00Z').getTime()/1000)
  const [events, endpoints] = await Promise.all([
    stripeGet(`/events?limit=100&created[gte]=${since}`, key),
    stripeGet('/webhook_endpoints?limit=100', key),
  ])
  const allEvents = Array.isArray(events.body?.data) ? events.body.data : []
  const db = adminClient()
  const { data: processedRows } = await db.from('stripe_webhook_events').select('id,type,processed_at').order('processed_at', { ascending: false }).limit(100)
  const processedById = new Map((processedRows ?? []).map((r: any) => [r.id, r]))
  const selftest = await selfTest(secret)

  return NextResponse.json({
    eventListStatus: events.status,
    allEventsSinceJul26: allEvents.map((e: any) => ({ id: e.id, type: e.type, created: e.created, livemode: e.livemode, objectId: e.data?.object?.id ?? null, processedByHarbourview: processedById.has(e.id) })),
    requiredEventsSinceJul26: allEvents.filter((e: any) => REQUIRED_EVENTS.includes(e.type)).map((e: any) => ({ id: e.id, type: e.type, created: e.created, objectId: e.data?.object?.id ?? null, processedByHarbourview: processedById.has(e.id) })),
    recentProcessedWebhookRows: (processedRows ?? []).map((r: any) => ({ id: r.id, type: r.type, processed_at: r.processed_at })),
    endpoints: Array.isArray(endpoints.body?.data) ? endpoints.body.data.map((e: any) => ({ id: e.id, url: e.url, status: e.status, created: e.created, enabled_events: e.enabled_events, description: e.description })) : [],
    selftest,
  }, { headers: { 'Cache-Control': 'no-store, max-age=0' } })
}
