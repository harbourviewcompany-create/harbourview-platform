import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { createClient } from '@/lib/server/supabaseRestClient'
import {
  nextDealStatus,
  type DealStatus,
} from '@/lib/introduction-routing/geneticsDealflow'
import { buildIntroEmail } from '@/lib/introduction-routing/geneticsEmailTemplates'

type DealflowRecord = {
  deal_status?: string
  intent?: string
  target_market?: string
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const allowedActions = new Set(['mark_engaged', 'mark_negotiating', 'mark_won', 'mark_lost'])
const dealStatuses = new Set<DealStatus>([
  'not_started',
  'introduced',
  'engaged',
  'negotiating',
  'closed_won',
  'closed_lost',
  'archived',
])

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

function toDealStatus(value: unknown): DealStatus {
  return typeof value === 'string' && dealStatuses.has(value as DealStatus)
    ? (value as DealStatus)
    : 'not_started'
}

function toText(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function isNavigationInterrupt(error: unknown, digest: string) {
  return typeof error === 'object'
    && error !== null
    && 'digest' in error
    && typeof error.digest === 'string'
    && error.digest.startsWith(digest)
}

async function requireDealflowAdminAuth() {
  try {
    await requireAdminAuth()
    return null
  } catch (error) {
    if (isNavigationInterrupt(error, 'NEXT_HTTP_ERROR_FALLBACK;401')) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    if (isNavigationInterrupt(error, 'NEXT_HTTP_ERROR_FALLBACK;403')) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }
    throw error
  }
}

async function readJson(req: NextRequest) {
  try {
    return await req.json()
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const authFailure = await requireDealflowAdminAuth()
  if (authFailure) return authFailure

  const body = await readJson(req)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const { recordId, action } = body as { recordId?: unknown; action?: unknown }

  if (typeof recordId !== 'string' || !UUID_PATTERN.test(recordId)) {
    return NextResponse.json({ error: 'invalid_record_id' }, { status: 400 })
  }

  if (typeof action !== 'string' || !allowedActions.has(action)) {
    return NextResponse.json({ error: 'invalid_action' }, { status: 400 })
  }

  const client = getClient()
  if (!client) return NextResponse.json({ error: 'admin_data_client_unconfigured' }, { status: 500 })

  const { data, error: readError } = await client
    .from<DealflowRecord>('genetics_routing_records')
    .select('*')
    .eq('id', recordId)
    .single()

  if (readError) {
    return NextResponse.json({ error: 'dealflow_read_failed' }, { status: 500 })
  }

  if (!data || typeof data !== 'object') {
    return NextResponse.json({ error: 'record_not_found' }, { status: 404 })
  }

  const currentDealStatus = toDealStatus(data.deal_status)
  const newStatus = nextDealStatus(currentDealStatus, action)

  const email = buildIntroEmail({
    intent: toText(data.intent, 'controlled genetics'),
    targetMarket: toText(data.target_market, 'the requested market'),
  })

  const { error: updateError } = await client
    .from('genetics_routing_records')
    .update({
      deal_status: newStatus,
      intro_email_subject: email.subject,
      intro_email_body: email.body,
      last_deal_event_at: new Date().toISOString(),
    })
    .eq('id', recordId)

  if (updateError) {
    return NextResponse.json({ error: 'dealflow_update_failed' }, { status: 500 })
  }

  const { error: eventError } = await client.from('genetics_routing_events').insert({
    routing_record_id: recordId,
    event_type: action,
    event_summary: `Dealflow update: ${newStatus}`,
  })

  if (eventError) {
    return NextResponse.json({ error: 'dealflow_event_insert_failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true, dealStatus: newStatus })
}
