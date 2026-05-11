import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/server/supabaseRestClient'
import { createGeneticsRoutingRecord } from '@/lib/introduction-routing/geneticsExecution'
import {
  persistGeneticsRoutingRecord,
  persistGeneticsRoutingEvent,
  type SupabaseLike,
} from '@/lib/introduction-routing/geneticsStorage'
import { createClient } from '@supabase/supabase-js'

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
      await persistGeneticsRoutingRecord({ client, record })
      await persistGeneticsRoutingEvent({
        client,
        routingRecordId: record.id,
        eventType: 'request_created',
        eventSummary: 'Genetics access request created and scored',
      })
    }

    return NextResponse.json({ success: true, record })
  } catch {
    return NextResponse.json({ success: false, error: 'invalid_request' }, { status: 400 })
  }
}
