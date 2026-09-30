import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: mocks.createClient,
}))

import MarketsPage from '@/app/markets/page'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  vi.resetAllMocks()
})

describe('/markets outage fallback', () => {
  it('renders the pending briefing state instead of throwing when Supabase is unavailable', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')
    vi.stubEnv('NEXT_PHASE', '')

    const query = {
      select: mocks.select,
      eq: mocks.eq,
      order: mocks.order,
    }
    mocks.select.mockReturnValue(query)
    mocks.eq.mockReturnValue(query)
    mocks.order.mockResolvedValue({ data: null, error: { message: 'database unavailable' } })
    mocks.from.mockReturnValue(query)
    mocks.createClient.mockReturnValue({ from: mocks.from })

    vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(MarketsPage()).resolves.toBeTruthy()
    expect(mocks.from).toHaveBeenCalledWith('jurisdiction_briefings')
    expect(mocks.order).toHaveBeenCalledWith('week_ending', { ascending: false })
    expect(console.error).toHaveBeenCalledWith(
      '[markets] jurisdiction_briefings unavailable',
      { message: 'database unavailable' },
    )
  })
})
