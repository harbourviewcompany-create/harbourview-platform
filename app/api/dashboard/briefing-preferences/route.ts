import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import {
  getBriefingCadence,
  upsertBriefingCadence,
  normalizeMarkets,
} from '@/lib/intelligence/briefingCadence'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cadence = await getBriefingCadence(user.id)
  return NextResponse.json({ cadence })
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const patch: {
    markets?: string[]
    frequency?: 'daily' | 'weekly'
    active?: boolean
    min_confidence?: number
  } = {}

  if ('markets' in body) patch.markets = normalizeMarkets(body.markets)
  if ('frequency' in body) {
    const f = body.frequency
    if (f !== 'daily' && f !== 'weekly') {
      return NextResponse.json({ error: 'frequency must be daily or weekly' }, { status: 400 })
    }
    patch.frequency = f
  }
  if ('active' in body) patch.active = Boolean(body.active)
  if ('min_confidence' in body && typeof body.min_confidence === 'number') {
    patch.min_confidence = body.min_confidence
  }

  try {
    const cadence = await upsertBriefingCadence(
      user.id,
      user.email ?? '',
      patch,
    )
    return NextResponse.json({ ok: true, cadence })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Save failed' },
      { status: 500 },
    )
  }
}
