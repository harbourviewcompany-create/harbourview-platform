import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { advanceIaSignalStage, getIaSignalById, logIaFeedbackEvent } from '@/lib/intelligence-automation/db'
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

// Stage transitions that represent a real commercial outcome, not just
// intermediate triage — these get written to ia_feedback_events so the
// feedback loop reflects actual admin decisions instead of sitting empty.
const FEEDBACK_MAP: Partial<Record<SignalStage, {
  outcomeType: string
  scoreImpact: 'positive' | 'negative' | 'neutral'
  routingImpact: string
}>> = {
  qualified: {
    outcomeType: 'qualified',
    scoreImpact: 'positive',
    routingImpact: 'Signal qualified for the opportunity pipeline',
  },
  converted_to_opportunity: {
    outcomeType: 'converted_to_opportunity',
    scoreImpact: 'positive',
    routingImpact: 'Converted to a commercial opportunity',
  },
  linked_to_counterparty: {
    outcomeType: 'converted_to_opportunity',
    scoreImpact: 'positive',
    routingImpact: 'Linked to an existing counterparty',
  },
  linked_to_market_pathway: {
    outcomeType: 'converted_to_opportunity',
    scoreImpact: 'positive',
    routingImpact: 'Linked to a market pathway',
  },
  archived: {
    outcomeType: 'ignored',
    scoreImpact: 'neutral',
    routingImpact: 'Archived — not commercially relevant',
  },
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = (await requireAdminAuth())!
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
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    // Best-effort: log a real feedback event for meaningful transitions.
    // Never fails the request — this is a side effect, not the primary action.
    const feedback = FEEDBACK_MAP[stage as SignalStage]
    if (feedback) {
      try {
        const signalResult = await getIaSignalById(id)
        if (signalResult.ok && signalResult.data) {
          await logIaFeedbackEvent({
            ...feedback,
            market: signalResult.data.market,
            category: signalResult.data.category,
            loggedBy: auth.user.email ?? auth.user.id,
          })
        }
      } catch (feedbackErr) {
        console.error('[harbourview:admin] feedback logging failed (non-fatal)', feedbackErr)
      }
    }

    return NextResponse.json({ ok: true, signalId: id, stage })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
