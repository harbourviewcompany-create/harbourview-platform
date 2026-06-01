import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { advanceIaSignalStage } from '@/lib/intelligence-automation/db'
import type { SignalStage } from '@/lib/intelligence-automation/types'

const VALID_STAGES: SignalStage[] = [
  'new',
  'needs_review',
  'qualified',
  'converted_to_opportunity',
  'linked_to_counterparty',
  'linked_to_market_pathway',
  'archived',
]

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdminAuth()
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Signal ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const { stage } = body

    if (!stage || !VALID_STAGES.includes(stage as SignalStage)) {
      return NextResponse.json(
        { error: `Invalid stage. Must be one of: ${VALID_STAGES.join(', ')}` },
        { status: 400 },
      )
    }

    const result = await advanceIaSignalStage(id, stage as SignalStage, auth.user.id)

    if (!result.ok) {
      return NextResponse.json({ error: (result as any).error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, signalId: id, stage })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
