import { beforeEach, describe, expect, it, vi } from 'vitest'

const serviceClientMock = vi.hoisted(() => vi.fn())

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
  beforeEach(() => {
    serviceClientMock.mockReset()
  })

  it('uses the service-role projection, persisted verdict contract, and signed effects', async () => {
    const caller = makeClient([])
    const service = makeClient([
      { signal_id: 'signal-a', verdict: 'helpful' },
      { signal_id: 'signal-a', verdict: 'not_helpful' },
      { signal_id: 'signal-a', verdict: 'stale' },
      { signal_id: 'signal-a', verdict: 'wrong_country' },
      { signal_id: 'signal-a', verdict: 'unknown' },
      { signal_id: '', verdict: 'helpful' },
    ])
    serviceClientMock.mockResolvedValue(service.client)

    const scores = await loadFeedbackScores(caller.client, ['signal-a', 'signal-a'])

    expect(serviceClientMock).toHaveBeenCalledOnce()
    expect(caller.rpc).not.toHaveBeenCalled()
    expect(service.rpc).toHaveBeenCalledWith('signal_relevance_feedback_for_ranking', {
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

  it('fails open when the service client and restricted projection are unavailable', async () => {
    serviceClientMock.mockRejectedValue(new Error('service role unavailable'))
    const caller = makeClient([], { code: '42501' })

    await expect(loadFeedbackScores(caller.client, ['signal-a'])).resolves.toEqual(new Map())
    expect(caller.rpc).toHaveBeenCalledWith('signal_relevance_feedback_for_ranking', {
      p_signal_ids: ['signal-a'],
      p_since: expect.any(String),
    })
  })

  it('does not create a service client when no signal IDs are supplied', async () => {
    const caller = makeClient([])
    await expect(loadFeedbackScores(caller.client, [])).resolves.toEqual(new Map())
    expect(serviceClientMock).not.toHaveBeenCalled()
    expect(caller.rpc).not.toHaveBeenCalled()
  })
})
