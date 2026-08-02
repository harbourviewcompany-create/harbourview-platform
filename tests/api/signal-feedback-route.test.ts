import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  rpc: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mocks.getUser },
    rpc: mocks.rpc,
  })),
}))

import { POST } from '@/app/api/signals/feedback/route'

function request(body: unknown) {
  return new Request('http://localhost/api/signals/feedback', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/signals/feedback', () => {
  beforeEach(() => {
    mocks.getUser.mockReset()
    mocks.rpc.mockReset()
  })

  it('requires an authenticated user', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } })
    const response = await POST(request({ signalId: 'signal-a', verdict: 'helpful' }))
    expect(response.status).toBe(401)
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it('writes through the controlled api-schema RPC and returns its row id', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mocks.rpc.mockResolvedValue({
      data: '11111111-1111-1111-1111-111111111111',
      error: null,
    })

    const response = await POST(request({
      signalId: ' signal-a ',
      verdict: 'wrong_country',
      note: '  mismatched jurisdiction  ',
      surface: 'signals',
    }))

    expect(response.status).toBe(200)
    expect(mocks.rpc).toHaveBeenCalledWith('submit_signal_relevance_feedback', {
      p_signal_id: 'signal-a',
      p_verdict: 'wrong_country',
      p_note: 'mismatched jurisdiction',
      p_surface: 'signals',
    })
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      feedbackId: '11111111-1111-1111-1111-111111111111',
    })
  })

  it('does not leak database error details', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mocks.rpc.mockResolvedValue({ data: null, error: { code: 'PGRST202', message: 'internal detail' } })

    const response = await POST(request({ signalId: 'signal-a', verdict: 'helpful' }))
    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: 'Unable to record feedback' })
  })
})
