import { describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/supabase/env', () => ({
  getSupabaseUrl: () => { throw new Error('Missing test configuration') },
  getSupabasePublicClientKey: () => { throw new Error('Missing test configuration') },
}))

import { proxy } from '@/proxy'

describe('protected route sign-in context', () => {
  it('keeps the selected market and dashboard section through sign-in', async () => {
    const response = await proxy(new NextRequest('https://example.com/dashboard?country=DE&page=briefing&section=regulatory'))
    const destination = new URL(response.headers.get('location')!)

    expect(destination.pathname).toBe('/login')
    expect(destination.searchParams.get('next')).toBe('/dashboard?country=DE&page=briefing&section=regulatory')
  })

  it('keeps encoded query values inside the local return path', async () => {
    const response = await proxy(new NextRequest('https://example.com/dashboard?country=CA&search=landed%20cost'))
    const destination = new URL(response.headers.get('location')!)

    expect(destination.searchParams.get('next')).toBe('/dashboard?country=CA&search=landed%20cost')
  })
})
