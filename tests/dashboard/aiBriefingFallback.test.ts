import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const originalApiKey = process.env.ANTHROPIC_API_KEY

describe('AI briefing route fallback', () => {
  beforeEach(() => {
    delete process.env.ANTHROPIC_API_KEY
    vi.restoreAllMocks()
  })

  afterEach(() => {
    if (originalApiKey === undefined) delete process.env.ANTHROPIC_API_KEY
    else process.env.ANTHROPIC_API_KEY = originalApiKey
  })

  it('returns a grounded 200 fallback when the enhanced provider is not configured', async () => {
    const { POST } = await import('@/app/api/ai/briefing/route')
    const response = await POST(new Request('http://localhost/api/ai/briefing', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        country: 'Canada',
        role: 'Exporter',
        intel: {
          medical_status: 'permitted',
          market_access_status: 'restricted',
          export_status: 'licensed pathways only',
          opportunity_score: 72,
        },
      }),
    }))

    expect(response.status).toBe(200)
    const body = await response.json() as Record<string, unknown>
    expect(body.degraded).toBe(true)
    expect(body.source).toBe('deterministic-records')
    expect(body.briefing).toContain('Canada records currently show')
    expect(body.briefing).toContain('licensed pathways only')
    expect(body.briefing).not.toContain('undefined')
  })

  it('returns 400 for an invalid JSON body', async () => {
    const { POST } = await import('@/app/api/ai/briefing/route')
    const response = await POST(new Request('http://localhost/api/ai/briefing', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{invalid',
    }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'Invalid JSON body' })
  })
})
