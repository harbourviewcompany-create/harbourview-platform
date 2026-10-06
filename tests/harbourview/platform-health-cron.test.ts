import { beforeEach, describe, expect, it, vi } from 'vitest'

const probePlatformHealth = vi.hoisted(() => vi.fn())

vi.mock('@/lib/ops/platformHealth', () => ({
  probePlatformHealth,
}))

import { GET } from '@/app/api/cron/platform-health/route'

describe('platform health cron', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    probePlatformHealth.mockReset()
    process.env.CRON_SECRET = 'example-cron-secret'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-public-key'
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    process.env.RESEND_API_KEY = 'example-resend-key'
    process.env.HARBOURVIEW_TO_EMAIL = 'ops@example.com'
    process.env.HARBOURVIEW_FROM_EMAIL = 'alerts@example.com'
  })

  it('rejects unauthenticated requests', async () => {
    const response = await GET(new Request('https://harbourview.example/api/cron/platform-health'))
    expect(response.status).toBe(401)
    expect(probePlatformHealth).not.toHaveBeenCalled()
  })

  it('returns healthy without sending an email', async () => {
    const emailFetch = vi.spyOn(globalThis, 'fetch')
    probePlatformHealth.mockResolvedValue({
      ok: true,
      checkedAt: '2026-10-06T12:00:00.000Z',
      services: {
        auth: { ok: true, status: 200 },
        database: { ok: true, status: 200 },
      },
    })

    const response = await GET(new Request(
      'https://harbourview.example/api/cron/platform-health',
      { headers: { authorization: 'Bearer example-cron-secret' } },
    ))

    expect(response.status).toBe(200)
    expect(emailFetch).not.toHaveBeenCalled()
  })

  it('alerts independently of Supabase when the data plane is unavailable', async () => {
    probePlatformHealth.mockResolvedValue({
      ok: false,
      checkedAt: '2026-10-06T12:00:00.000Z',
      services: {
        auth: { ok: false, error: 'network' },
        database: { ok: false, status: 503, error: 'http' },
      },
    })
    const emailFetch = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 200 }))

    const response = await GET(new Request(
      'https://harbourview.example/api/cron/platform-health',
      { headers: { authorization: 'Bearer example-cron-secret' } },
    ))
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body).toMatchObject({ ok: false, notified: true })
    expect(emailFetch).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({ method: 'POST' }),
    )
  })
})
