import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApiAuth } from '@/lib/auth/adminApiAuth'
import { createClient } from '@/lib/server/supabaseRestClient'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const allowedActions = new Set(['approve', 'trigger_intro', 'reset_qualification'])

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

async function readJson(req: NextRequest) {
  try {
    return await req.json()
  } catch {
    return null
  }
}

function nextStatus(action: string) {
  if (action === 'approve') return 'ready_for_intro'
  if (action === 'trigger_intro') return 'introduced'
  return 'needs_qualification'
}

export async function POST(req: NextRequest) {
  const authFailure = await requireAdminApiAuth()
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

  const status = nextStatus(action)
  const { data: updatedRows, error: updateError } = await client
    .from('genetics_routing_records')
    .update({ status })
    .eq('id', recordId)

  if (updateError) {
    return NextResponse.json({ error: 'routing_record_update_failed' }, { status: 500 })
  }

  if (Array.isArray(updatedRows) && updatedRows.length === 0) {
    return NextResponse.json({ error: 'record_not_found' }, { status: 404 })
  }

  const { error: eventError } = await client.from('genetics_routing_events').insert({
    routing_record_id: recordId,
    event_type: action,
    event_summary: `Admin action: ${action}`,
    communication_channel: 'internal',
    direction: 'internal',
  })

  if (eventError) {
    return NextResponse.json({ error: 'routing_event_insert_failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true, status })
}
