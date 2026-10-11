import { afterEach, describe, expect, it, vi } from 'vitest'
import { probePlatformHealth } from '@/lib/ops/platformHealth'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('probePlatformHealth', () => {
  it('requires both Auth and PostgREST to be healthy', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(new Response('[]', { status: 200 }))

    const result = await probePlatformHealth({
      supabaseUrl: 'https://example.supabase.co/',
      publicKey: 'test-public-key',
      timeoutMs: 100,
    })

    expect(result.ok).toBe(true)
    expect(result.services.auth.ok).toBe(true)
    expect(result.services.database.ok).toBe(true)
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://example.supabase.co/rest/v1/countries?select=iso_alpha2&limit=1',
      expect.objectContaining({
        headers: expect.objectContaining({
          apikey: 'test-public-key',
          Authorization: 'Bearer test-public-key',
        }),
      }),
    )
  })

  it('fails closed when the database data plane returns 5xx', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 503 }))

    const result = await probePlatformHealth({
      supabaseUrl: 'https://example.supabase.co',
      publicKey: 'test-public-key',
      timeoutMs: 100,
    })

    expect(result.ok).toBe(false)
    expect(result.services.database).toMatchObject({ ok: false, status: 503, error: 'http' })
  })

  it('fails closed on network errors', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(new Response('[]', { status: 200 }))

    const result = await probePlatformHealth({
      supabaseUrl: 'https://example.supabase.co',
      publicKey: 'test-public-key',
      timeoutMs: 100,
    })

    expect(result.ok).toBe(false)
    expect(result.services.auth).toMatchObject({ ok: false, error: 'network' })
  })
})
