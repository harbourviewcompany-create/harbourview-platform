import { describe, expect, it, vi } from 'vitest'

const serviceClientMock = vi.hoisted(() => vi.fn(async () => {
  throw new Error('service role unavailable in unit test')
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServiceClient: serviceClientMock,
}))

import {
  FEEDBACK_VERDICT_WEIGHTS,
  loadFeedbackScores,
} from '@/lib/signals/feedbackScores'

function makeClient(rows: unknown[], error: unknown = null) {
  const rpc = vi.fn(async () => ({ data: rows, error }))
  return {
    client: { rpc } as unknown as Parameters<typeof loadFeedbackScores>[0],
    rpc,
  }
}

describe('loadFeedbackScores', () => {
  it('uses the persisted verdict contract and preserves signed effects', async () => {
    const { client, rpc } = makeClient([
      { signal_id: 'signal-a', verdict: 'helpful' },
      { signal_id: 'signal-a', verdict: 'not_helpful' },
      { signal_id: 'signal-a', verdict: 'stale' },
      { signal_id: 'signal-a', verdict: 'wrong_country' },
      { signal_id: 'signal-a', verdict: 'unknown' },
      { signal_id: '', verdict: 'helpful' },
    ])

    const scores = await loadFeedbackScores(client, ['signal-a', 'signal-a'])

    expect(rpc).toHaveBeenCalledWith('signal_relevance_feedback_for_ranking', {
      p_signal_ids: ['signal-a'],
      p_since: expect.any(String),
    })
    expect(scores.get('signal-a')).toBe(
      FEEDBACK_VERDICT_WEIGHTS.helpful
        + FEEDBACK_VERDICT_WEIGHTS.not_helpful
        + FEEDBACK_VERDICT_WEIGHTS.stale
        + FEEDBACK_VERDICT_WEIGHTS.wrong_country,
    )
    expect(scores.get('signal-a')).toBe(-20)
  })

  it('fails open when the controlled ranking RPC is unavailable', async () => {
    const { client } = makeClient([], { code: '42501' })
    await expect(loadFeedbackScores(client, ['signal-a'])).resolves.toEqual(new Map())
  })
})
