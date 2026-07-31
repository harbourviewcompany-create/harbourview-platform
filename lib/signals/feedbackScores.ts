/**
 * Load soft ranking boosts from signal_relevance_feedback.
 * Uses service role so aggregates include all operators — user-scoped
 * RLS only returns the caller's own rows and would under-weight the loop.
 * Fails open (empty map) so a missing table never breaks the digest.
 */

import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

type AnySchemaSupabaseClient = SupabaseClient<any, any, any, any, any>

export async function loadFeedbackScores(
  userClient: unknown,
  signalIds: string[],
): Promise<Map<string, number>> {
  const out = new Map<string, number>()
  if (signalIds.length === 0) return out

  const unique = [...new Set(signalIds)].slice(0, 400)
  const since = new Date(Date.now() - 90 * 86_400_000).toISOString()

  try {
    let client = userClient as AnySchemaSupabaseClient
    try {
      const { createSupabaseServiceClient } = await import('@/lib/supabase/server')
      client = (await createSupabaseServiceClient()) as unknown as AnySchemaSupabaseClient
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
      const t = tallies.get(id) ?? { helpful: 0, not_helpful: 0, stale: 0, wrong_country: 0 }
      const v = row.verdict
      if (v === 'helpful') t.helpful++
      else if (v === 'not_helpful') t.not_helpful++
      else if (v === 'stale') t.stale++
      else if (v === 'wrong_country') t.wrong_country++
      tallies.set(id, t)
    }

    for (const [id, t] of tallies) {
      const score = t.helpful * 8 - t.not_helpful * 12 - t.stale * 6 - t.wrong_country * 10
      out.set(id, score)
    }
  } catch {
    return out
  }

  return out
}
