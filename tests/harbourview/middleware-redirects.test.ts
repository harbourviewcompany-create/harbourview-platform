import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'

import { middleware } from '@/middleware'

describe('middleware legacy redirects', () => {
  it('redirects /commercial-intelligence', async () => {
    const response = await middleware(new NextRequest('https://example.com/commercial-intelligence'))
    expect(response.status).toBe(308)
    expect(new URL(response.headers.get('location')!).pathname).toBe('/intelligence')
  })

  it('preserves the trailing slash for /commercial-intelligence/', async () => {
    const response = await middleware(new NextRequest('https://example.com/commercial-intelligence/'))
    expect(response.status).toBe(308)
    expect(new URL(response.headers.get('location')!).pathname).toBe('/intelligence/')
  })

  it('preserves the trailing slash for /marketplace/submit-listing/', async () => {
    const response = await middleware(new NextRequest('https://example.com/marketplace/submit-listing/'))
    expect(response.status).toBe(308)
    expect(new URL(response.headers.get('location')!).pathname).toBe('/marketplace/sell/')
  })
})
