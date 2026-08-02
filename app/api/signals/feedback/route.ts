// POST /api/signals/feedback
// Authenticated operators mark a signal helpful / not_helpful / stale / wrong_country.
// Writes through a narrow api-schema RPC; public.signal_relevance_feedback remains unexposed.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const VERDICTS = new Set(['helpful', 'not_helpful', 'stale', 'wrong_country'])
const SURFACES = new Set(['digest', 'signals', 'search', 'email'])

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  let body: {
    signalId?: unknown
    verdict?: unknown
    note?: unknown
    surface?: unknown
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const signalId = typeof body.signalId === 'string' ? body.signalId.trim() : ''
  const verdict = typeof body.verdict === 'string' ? body.verdict.trim() : ''
  const surface =
    typeof body.surface === 'string' && SURFACES.has(body.surface) ? body.surface : 'digest'
  const note =
    typeof body.note === 'string' && body.note.trim()
      ? body.note.trim().slice(0, 500)
      : null

  if (!signalId || signalId.length > 120) {
    return NextResponse.json({ error: 'signalId required' }, { status: 400 })
  }
  if (!VERDICTS.has(verdict)) {
    return NextResponse.json(
      { error: 'verdict must be helpful | not_helpful | stale | wrong_country' },
      { status: 400 },
    )
  }

  const { data: feedbackId, error } = await supabase.rpc('submit_signal_relevance_feedback', {
    p_signal_id: signalId,
    p_verdict: verdict,
    p_note: note,
    p_surface: surface,
  })

  if (error) {
    console.error('signals/feedback RPC failed', { code: error.code })
    return NextResponse.json({ error: 'Unable to record feedback' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    feedbackId: typeof feedbackId === 'string' ? feedbackId : null,
    message:
      verdict === 'helpful'
        ? 'Thanks — this helps the daily brief learn what matters.'
        : 'Recorded. We’ll use this to improve ranking and coverage.',
  })
}
