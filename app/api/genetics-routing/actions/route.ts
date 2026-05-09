import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

  let status = 'needs_qualification'

  if (action === 'approve') status = 'ready_for_intro'
  if (action === 'trigger_intro') status = 'introduced'

  await client.from('genetics_routing_records').update({ status }).eq('id', recordId)

  await client.from('genetics_routing_events').insert({
    routing_record_id: recordId,
    event_type: action,
    event_summary: `Admin action: ${action}`
  })

  return NextResponse.json({ success: true })
}
