import { NextRequest, NextResponse } from 'next/server'
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

export async function POST(req: NextRequest) {
  const client = getClient()
  if (!client) return NextResponse.json({ error: 'no_client' }, { status: 500 })

  const { recordId, action } = await req.json()

  if (typeof recordId !== 'string' || typeof action !== 'string') {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 })
  }

  const { data } = await client
    .from<DealflowRecord>('genetics_routing_records')
    .select('*')
    .eq('id', recordId)
    .single()

  if (!data || typeof data !== 'object') {
    return NextResponse.json({ error: 'record_not_found' }, { status: 404 })
  }

  const currentDealStatus = toDealStatus(data.deal_status)
  const newStatus = nextDealStatus(currentDealStatus, action)

  const email = buildIntroEmail({
    intent: toText(data.intent, 'controlled genetics'),
    targetMarket: toText(data.target_market, 'the requested market'),
  })

  await client
    .from('genetics_routing_records')
    .update({
      deal_status: newStatus,
      intro_email_subject: email.subject,
      intro_email_body: email.body,
      last_deal_event_at: new Date().toISOString(),
    })
    .eq('id', recordId)

  await client.from('genetics_routing_events').insert({
    routing_record_id: recordId,
    event_type: action,
    event_summary: `Dealflow update: ${newStatus}`,
  })

  return NextResponse.json({ success: true, dealStatus: newStatus })
}
