/**
 * Load soft ranking boosts from signal_relevance_feedback.
 * Uses service role so aggregates include all operators — user-scoped
 * RLS only returns the caller's own rows and would under-weight the loop.
 * Fails open (empty map) so a missing table never breaks the digest.
 */

import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

// Callers may be generated against different exposed PostgREST schemas and the
// feedback table is not present in every generated Database type. Supabase's
// schema generics are invariant, so this boundary intentionally erases only the
// compile-time schema parameters while preserving the SupabaseClient runtime API.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySchemaSupabaseClient = SupabaseClient<any, any, any, any, any>

export async function loadFeedbackScores(
  _userClient: AnySchemaSupabaseClient,
  signalIds: string[],
): Promise<Map<string, number>> {
  const out = new Map<string, number>()
  if (signalIds.length === 0) return out

  const unique = [...new Set(signalIds)].slice(0, 400)
  const since = new Date(Date.now() - 90 * 86_400_000).toISOString()

  try {
    let client: AnySchemaSupabaseClient = _userClient
    try {
      const { createSupabaseServiceClient } = await import('@/lib/supabase/server')
      client = await createSupabaseServiceClient()
    } catch {
      /* fall back to caller client */
    }

    const { data, error } = await client
      .from('signal_relevance_feedback')
      .select('signal_id,relevant')
      .in('signal_id', unique)
      .gte('created_at', since)

    if (error || !Array.isArray(data)) return out

    const counts = new Map<string, { positive: number; total: number }>()
    for (const row of data) {
      const id = typeof row.signal_id === 'string' ? row.signal_id : ''
      if (!id) continue
      const current = counts.get(id) ?? { positive: 0, total: 0 }
      current.total += 1
      if (row.relevant === true) current.positive += 1
      counts.set(id, current)
    }

    for (const [id, count] of counts) {
      // Bayesian prior of 50/50 with 4 pseudo-votes prevents single-click swings.
      const score = (count.positive + 2) / (count.total + 4)
      out.set(id, score)
    }
  } catch {
    return out
  }

  return out
}
