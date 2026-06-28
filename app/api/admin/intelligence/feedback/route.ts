import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { logIaFeedbackEvent } from '@/lib/intelligence-automation/db'

const VALID_IMPACTS = ['positive', 'negative', 'neutral'] as const

export async function POST(request: NextRequest) {
  try {
    const auth = (await requireAdminAuth())!

    const body = await request.json()
    const {
      outcomeType,
      counterpartyName,
      market,
      category,
      scoreImpact,
      routingImpact,
      notes,
    } = body

    if (!outcomeType || typeof outcomeType !== 'string') {
      return NextResponse.json({ error: 'outcomeType is required' }, { status: 400 })
    }
    if (!market || typeof market !== 'string') {
      return NextResponse.json({ error: 'market is required' }, { status: 400 })
    }
    if (!category || typeof category !== 'string') {
      return NextResponse.json({ error: 'category is required' }, { status: 400 })
    }
    if (!scoreImpact || !VALID_IMPACTS.includes(scoreImpact)) {
      return NextResponse.json(
        { error: `scoreImpact must be one of: ${VALID_IMPACTS.join(', ')}` },
        { status: 400 },
      )
    }
    if (!routingImpact || typeof routingImpact !== 'string') {
      return NextResponse.json({ error: 'routingImpact is required' }, { status: 400 })
    }

    const result = await logIaFeedbackEvent({
      outcomeType,
      counterpartyName: counterpartyName ?? undefined,
      market,
      category,
      scoreImpact,
      routingImpact,
      notes: notes ?? undefined,
      loggedBy: auth.user.id,
    })

    if (!result.ok) {
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
