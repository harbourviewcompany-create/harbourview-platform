import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const getSupabaseEnvStatus = vi.fn()

vi.mock('@/lib/supabase/env', () => ({
  getSupabaseEnvStatus,
}))

describe('Command Centre readiness endpoint', () => {
  beforeEach(() => {
    getSupabaseEnvStatus.mockReset()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns a safe ready response for the locked project configuration', async () => {
    getSupabaseEnvStatus.mockReturnValue({
      configured: true,
      invalidPublicClientKey: false,
      urlUsesExpectedProject: true,
      usesExplicitLocalSupabase: false,
    })

    const { GET } = await import('@/app/api/health/command-centre/route')
    const response = await GET()
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toContain('no-store')
    expect(payload.status).toBe('ready')
    expect(payload.commandCentre.totalModules).toBe(32)
    expect(payload.dependencies.supabase).toBe('configured')
    expect(JSON.stringify(payload)).not.toMatch(/password|secret|service_role|anon_key/i)
  })

  it('fails closed when the public Supabase configuration is invalid', async () => {
    getSupabaseEnvStatus.mockReturnValue({
      configured: false,
      invalidPublicClientKey: true,
      urlUsesExpectedProject: false,
      usesExplicitLocalSupabase: false,
    })

    const { GET } = await import('@/app/api/health/command-centre/route')
    const response = await GET()
    const payload = await response.json()

    expect(response.status).toBe(503)
    expect(payload.status).toBe('degraded')
    expect(payload.dependencies.supabase).toBe('misconfigured')
  })

  it('keeps the executive briefing available when the enhanced provider is not configured', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '')
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
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.degraded).toBe(true)
    expect(payload.source).toBe('deterministic-records')
    expect(payload.briefing).toContain('Canada records currently show')
    expect(payload.briefing).toContain('licensed pathways only')
  })
})
