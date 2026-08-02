/**
 * Load signed ranking effects from persisted signal relevance verdicts.
 *
 * The project exposes only the `api` schema through PostgREST, while the source
 * table lives in `public`. A narrow service-role-only RPC returns only
 * `signal_id` and `verdict`; the table itself remains unexposed.
 *
 * Fails open (empty map) so an unavailable feedback subsystem never breaks the
 * Digest response.
 */

import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

// Supabase schema generics are invariant and callers use multiple exposed schemas.
// This boundary erases compile-time schema parameters only; runtime behavior is unchanged.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySchemaSupabaseClient = SupabaseClient<any, any, any, any, any>

export const FEEDBACK_VERDICT_WEIGHTS = {
  helpful: 8,
  not_helpful: -12,
  stale: -6,
  wrong_country: -10,
} as const

export type FeedbackVerdict = keyof typeof FEEDBACK_VERDICT_WEIGHTS

function isFeedbackVerdict(value: unknown): value is FeedbackVerdict {
  return typeof value === 'string' && value in FEEDBACK_VERDICT_WEIGHTS
}

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
      /* fall back to caller client; the RPC remains service-role-only */
    }

    const { data, error } = await client.rpc('signal_relevance_feedback_for_ranking', {
      p_signal_ids: unique,
      p_since: since,
    })

    if (error || !Array.isArray(data)) return out

    for (const row of data) {
      if (!row || typeof row !== 'object') continue
      const record = row as Record<string, unknown>
      const id = typeof record.signal_id === 'string' ? record.signal_id : ''
      const verdict = record.verdict
      if (!id || !isFeedbackVerdict(verdict)) continue
      out.set(id, (out.get(id) ?? 0) + FEEDBACK_VERDICT_WEIGHTS[verdict])
    }
  } catch {
    return out
  }

  return out
}
