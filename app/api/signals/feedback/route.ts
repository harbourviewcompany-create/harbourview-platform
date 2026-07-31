// POST /api/signals/feedback
// Authenticated operators mark a signal helpful / not_helpful / stale / wrong_country.
// Feeds public.signal_relevance_feedback → ranking soft boost + health metrics.

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

  const { error } = await supabase.from('signal_relevance_feedback').insert({
    signal_id: signalId,
    user_id: user.id,
    verdict,
    note,
    surface,
  })

  if (error) {
    console.error('signals/feedback insert failed', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    message:
      verdict === 'helpful'
        ? 'Thanks — this helps the daily brief learn what matters.'
        : 'Recorded. We’ll use this to improve ranking and coverage.',
  })
}
