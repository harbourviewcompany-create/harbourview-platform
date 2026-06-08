import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/server/supabaseRestClient'
import { createGeneticsRoutingRecord } from '@/lib/introduction-routing/geneticsExecution'
import {
  persistGeneticsRoutingRecord,
  persistGeneticsRoutingEvent,
  type SupabaseLike,
} from '@/lib/introduction-routing/geneticsStorage'

function getServiceClient(): SupabaseLike | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key) as unknown as SupabaseLike
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const record = createGeneticsRoutingRecord(body)
    const client = getServiceClient()

    if (client) {
      const recordResult = await persistGeneticsRoutingRecord({ client, record })
      if (recordResult.error) {
        return NextResponse.json({ success: false, error: 'request_persist_failed' }, { status: 500 })
      }

      const eventResult = await persistGeneticsRoutingEvent({
        client,
        routingRecordId: record.id,
        eventType: 'request_created',
        eventSummary: 'Genetics access request created and scored',
      })
      if (eventResult.error) {
        return NextResponse.json({ success: false, error: 'request_event_failed' }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      requestId: record.id,
      status: record.status,
      message: 'Genetics access request received. Harbourview will review qualification before any controlled introduction.',
    })
  } catch {
    return NextResponse.json({ success: false, error: 'invalid_request' }, { status: 400 })
  }
}
