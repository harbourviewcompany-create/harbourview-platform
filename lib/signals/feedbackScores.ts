/**
 * Load soft ranking boosts from signal_relevance_feedback.
 * Uses service role so aggregates include all operators — user-scoped
 * RLS only returns the caller's own rows and would under-weight the loop.
 * Accepts clients configured for either the public or exposed API schema.
 * Fails open (empty map) so a missing table never breaks the digest.
 */

import 'server-only'

type FeedbackRow = {
  signal_id: string | null
  verdict: string | null
}

type FeedbackQueryResult = {
  data: FeedbackRow[] | null
  error: unknown
}

type FeedbackDateFilter = PromiseLike<FeedbackQueryResult>

type FeedbackIdFilter = {
  gte(column: 'created_at', value: string): FeedbackDateFilter
}

type FeedbackSelect = {
  in(column: 'signal_id', values: string[]): FeedbackIdFilter
}

type FeedbackTable = {
  select(columns: 'signal_id, verdict'): FeedbackSelect
}

type FeedbackClient = {
  from(table: 'signal_relevance_feedback'): FeedbackTable
}

function asFeedbackClient(client: unknown): FeedbackClient {
  return client as FeedbackClient
}

export async function loadFeedbackScores(
  userClient: unknown,
  signalIds: string[],
): Promise<Map<string, number>> {
  const out = new Map<string, number>()
  if (signalIds.length === 0) return out

  const unique = [...new Set(signalIds)].slice(0, 400)
  const since = new Date(Date.now() - 90 * 86_400_000).toISOString()

  try {
    let client = asFeedbackClient(userClient)
    try {
      const { createSupabaseServiceClient } = await import('@/lib/supabase/server')
      client = asFeedbackClient(await createSupabaseServiceClient())
    } catch {
      /* fall back to caller client */
    }

    const { data, error } = await client
      .from('signal_relevance_feedback')
      .select('signal_id, verdict')
      .in('signal_id', unique)
      .gte('created_at', since)

    if (error || !data) return out

    const tallies = new Map<
      string,
      { helpful: number; not_helpful: number; stale: number; wrong_country: number }
    >()
    for (const row of data) {
      const id = typeof row.signal_id === 'string' ? row.signal_id : ''
      if (!id) continue
      const tally = tallies.get(id) ?? {
        helpful: 0,
        not_helpful: 0,
        stale: 0,
        wrong_country: 0,
      }
      const verdict = row.verdict
      if (verdict === 'helpful') tally.helpful++
      else if (verdict === 'not_helpful') tally.not_helpful++
      else if (verdict === 'stale') tally.stale++
      else if (verdict === 'wrong_country') tally.wrong_country++
      tallies.set(id, tally)
    }

    for (const [id, tally] of tallies) {
      const score =
        tally.helpful * 8 -
        tally.not_helpful * 12 -
        tally.stale * 6 -
        tally.wrong_country * 10
      out.set(id, score)
    }
  } catch {
    return out
  }

  return out
}
