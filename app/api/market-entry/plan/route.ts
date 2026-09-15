import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildMarketEntryPlan } from '@/lib/market-entry-os'
import type { MarketEntryInput } from '@/lib/market-entry-os/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function isInput(value: unknown): value is MarketEntryInput {
  if (!value || typeof value !== 'object') return false
  const input = value as Record<string, unknown>
  return (
    typeof input.originIso2 === 'string' &&
    typeof input.destinationIso2 === 'string' &&
    typeof input.productClass === 'string'
  )
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 })
  }
  if (!isInput(body)) return NextResponse.json({ error: 'originIso2, destinationIso2, and productClass are required.' }, { status: 400 })

  const plan = await buildMarketEntryPlan(body)
  if (!plan) return NextResponse.json({ error: 'Invalid or unsupported market-entry corridor input.' }, { status: 400 })

  return NextResponse.json({ plan })
}
