import { NextRequest, NextResponse } from 'next/server'
import { createGeneticsRoutingRecord } from '@/lib/introduction-routing/geneticsExecution'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const record = createGeneticsRoutingRecord(body)

    // V1: return computed routing record
    // TODO: persist to Supabase using service role key when configured

    return NextResponse.json({ success: true, record })
  } catch (err) {
    return NextResponse.json({ success: false, error: 'invalid_request' }, { status: 400 })
  }
}
