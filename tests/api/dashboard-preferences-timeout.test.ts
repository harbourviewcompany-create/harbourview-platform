import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mocks.getUser },
    from: mocks.from,
  })),
}))

import { PATCH } from '@/app/api/dashboard/preferences/route'

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.resetAllMocks()
})

describe('dashboard preferences upstream timeouts', () => {
  it('bounds PATCH authentication before reading preference data', async () => {
    vi.useFakeTimers()
    mocks.getUser.mockImplementation(() => new Promise(() => {}))

    const request = new NextRequest('http://localhost/api/dashboard/preferences', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ country_iso2: 'DE' }),
    })

    let settled = false
    const pending = PATCH(request).then(response => {
      settled = true
      return response
    })

    await vi.advanceTimersByTimeAsync(7_999)
    expect(settled).toBe(false)

    await vi.advanceTimersByTimeAsync(1)
    expect(settled).toBe(true)

    const response = await pending
    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ ok: false })
    expect(mocks.from).not.toHaveBeenCalled()
  })
})
