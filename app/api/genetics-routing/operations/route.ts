import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApiAuth } from '@/lib/auth/adminApiAuth'
import { createClient } from '@/lib/server/supabaseRestClient'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const MAX_TEXT_LENGTH = 2000

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

function optionalText(value: unknown) {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (trimmed.length > MAX_TEXT_LENGTH) return undefined
  return trimmed || null
}

function optionalDate(value: unknown) {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string') return undefined
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) return undefined
  return new Date(parsed).toISOString()
}

export async function POST(req: NextRequest) {
  const authFailure = await requireAdminApiAuth()
  if (authFailure) return authFailure

  const body = await readJson(req)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const { recordId, assignedOperator, internalNotes, nextActionDueAt, followUpReminderAt } = body as Record<string, unknown>
  if (typeof recordId !== 'string' || !UUID_PATTERN.test(recordId)) {
    return NextResponse.json({ error: 'invalid_record_id' }, { status: 400 })
  }

  const parsedAssignedOperator = optionalText(assignedOperator)
  const parsedInternalNotes = optionalText(internalNotes)
  const parsedNextActionDueAt = optionalDate(nextActionDueAt)
  const parsedFollowUpReminderAt = optionalDate(followUpReminderAt)

  if (
    parsedAssignedOperator === undefined
    || parsedInternalNotes === undefined
    || parsedNextActionDueAt === undefined
    || parsedFollowUpReminderAt === undefined
  ) {
    return NextResponse.json({ error: 'invalid_operations_payload' }, { status: 400 })
  }

  const client = getClient()
  if (!client) return NextResponse.json({ error: 'admin_data_client_unconfigured' }, { status: 500 })

  const { data: updatedRows, error: updateError } = await client
    .from('genetics_routing_records')
    .update({
      assigned_operator: parsedAssignedOperator,
      internal_notes: parsedInternalNotes,
      next_action_due_at: parsedNextActionDueAt,
      follow_up_reminder_at: parsedFollowUpReminderAt,
    })
    .eq('id', recordId)

  if (updateError) {
    return NextResponse.json({ error: 'operations_update_failed' }, { status: 500 })
  }

  if (Array.isArray(updatedRows) && updatedRows.length === 0) {
    return NextResponse.json({ error: 'record_not_found' }, { status: 404 })
  }

  const { error: eventError } = await client.from('genetics_routing_events').insert({
    routing_record_id: recordId,
    event_type: 'operations_update',
    event_summary: 'Deal operations updated',
    communication_channel: 'internal',
    direction: 'internal',
  })

  if (eventError) {
    return NextResponse.json({ error: 'operations_event_insert_failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
