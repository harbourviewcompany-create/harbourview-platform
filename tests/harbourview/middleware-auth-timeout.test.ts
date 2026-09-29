import { describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const getUser = vi.hoisted(() => vi.fn())

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({ auth: { getUser } }),
}))
vi.mock('@/lib/supabase/env', () => ({
  getSupabaseUrl: () => 'https://example.supabase.co',
  getSupabasePublicClientKey: () => 'test-public-key',
}))

import { proxy } from '@/proxy'

describe('protected navigation during an auth outage', () => {
  it('leaves a stalled dashboard request for sign-in with the market context intact', async () => {
    vi.useFakeTimers()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    getUser.mockImplementation(() => new Promise(() => {}))
    try {
      const pending = proxy(new NextRequest('https://example.com/dashboard?country=DE&source=globe_router'))
      await vi.advanceTimersByTimeAsync(8_000)
      const response = await pending
      const destination = new URL(response.headers.get('location')!)

      expect(destination.pathname).toBe('/login')
      expect(destination.searchParams.get('next')).toBe('/dashboard?country=DE&source=globe_router')
      expect(destination.searchParams.get('error')).toContain('temporarily unavailable')
    } finally {
      vi.useRealTimers()
      vi.restoreAllMocks()
    }
  })
})
