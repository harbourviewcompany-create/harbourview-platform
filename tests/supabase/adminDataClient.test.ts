import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))


describe('fetchAdminSupabaseJson', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env.HARBOURVIEW_ADMIN_REVIEW_ENABLED = 'true'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://zvxdgdkukjrrwamdpqrg.supabase.co'
    vi.restoreAllMocks()
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.unstubAllGlobals()
  })

  it('returns parsed JSON data for successful responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: vi.fn().mockResolvedValue('{"hello":"world"}'),
    }))

    const { fetchAdminSupabaseJson } = await import('@/lib/supabase/adminDataClient')
    const result = await fetchAdminSupabaseJson<{ hello: string }>('/rest/v1/example')

    expect(result).toEqual({ ok: true, data: { hello: 'world' } })
  })

  it('returns null payload for successful empty-body responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      statusText: 'No Content',
      text: vi.fn().mockResolvedValue(''),
    }))

    const { fetchAdminSupabaseJson } = await import('@/lib/supabase/adminDataClient')
    const result = await fetchAdminSupabaseJson<null>('/rest/v1/example')

    expect(result).toEqual({ ok: true, data: null })
  })

  it('returns request_failed when a successful response body is invalid JSON', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const invalidBody = 'x'.repeat(300)

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: vi.fn().mockResolvedValue(invalidBody),
    }))

    const { fetchAdminSupabaseJson } = await import('@/lib/supabase/adminDataClient')
    const result = await fetchAdminSupabaseJson('/rest/v1/example')

    expect(result).toEqual({
      ok: false,
      error: {
        code: 'request_failed',
        message: 'Admin inquiry review received invalid JSON from Supabase upstream.',
      },
    })

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'harbourview_admin_data_request_failed',
      expect.objectContaining({
        status: 200,
        statusText: 'OK',
        path: '/rest/v1/example',
        body: invalidBody.slice(0, 240),
        parseError: 'invalid_json',
      })
    )
  })
})
