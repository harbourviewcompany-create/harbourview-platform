import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/server/supabaseRestClient'

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function POST(req: NextRequest) {
  const client = getClient()
  if (!client) return NextResponse.json({ error: 'no_client' }, { status: 500 })

  const body = await req.json()

  const { recordId, assignedOperator, internalNotes, nextActionDueAt, followUpReminderAt } = body

  await client
    .from('genetics_routing_records')
    .update({
      assigned_operator: assignedOperator,
      internal_notes: internalNotes,
      next_action_due_at: nextActionDueAt,
      follow_up_reminder_at: followUpReminderAt,
    })
    .eq('id', recordId)

  await client.from('genetics_routing_events').insert({
    routing_record_id: recordId,
    event_type: 'operations_update',
    event_summary: 'Deal operations updated',
    communication_channel: 'internal',
    direction: 'internal',
  })

  return NextResponse.json({ success: true })
}
