import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/server/supabaseRestClient'
import { nextDealStatus } from '@/lib/introduction-routing/geneticsDealflow'
import { buildIntroEmail } from '@/lib/introduction-routing/geneticsEmailTemplates'

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function POST(req: NextRequest) {
  const client = getClient()
  if (!client) return NextResponse.json({ error: 'no_client' }, { status: 500 })

  const { recordId, action } = await req.json()

  const { data } = await client.from('genetics_routing_records').select('*').eq('id', recordId).single()

  if (!data || typeof data !== 'object') {
    return NextResponse.json({ error: 'record_not_found' }, { status: 404 })
  }

  const record = data as Record<string, unknown>
  const currentDealStatus = typeof record.deal_status === 'string' ? record.deal_status : 'not_started'
  const newStatus = nextDealStatus(currentDealStatus, action)

  const email = buildIntroEmail(record)

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
