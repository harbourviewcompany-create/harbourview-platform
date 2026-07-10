import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

// These three routes were previously callable without authentication:
//   - /api/stripe/setup    (POST) — creates Stripe products, writes prod env vars
//   - /api/compliance-brief (POST) — invokes the paid Anthropic API
//   - /api/ai-gateway/health (GET) — leaks gateway config/limits/issues
// Each now calls requireAdminApiAuth() and must short-circuit with its failure
// response before doing any work. We mock the auth wrapper so we can assert the
// guard is wired without standing up a full admin session (see the parallel
// pattern in used-surplus-preview-route.test.ts).
const mockAuth = vi.fn<(request?: NextRequest) => Promise<NextResponse | null>>()
vi.mock('@/lib/auth/adminApiAuth', () => ({
  requireAdminApiAuth: (request?: NextRequest) => mockAuth(request),
}))

import { POST as stripeSetupPOST } from '../../app/api/stripe/setup/route'
import { POST as complianceBriefPOST } from '../../app/api/compliance-brief/route'
import { GET as aiGatewayHealthGET } from '../../app/api/ai-gateway/health/route'

const UNAUTHORIZED = () => NextResponse.json({ error: 'unauthorized' }, { status: 401 })

beforeEach(() => {
  mockAuth.mockReset()
})

describe('admin-guarded API routes reject unauthenticated callers', () => {
  it('POST /api/stripe/setup returns the auth failure and does not parse the body', async () => {
    mockAuth.mockResolvedValueOnce(UNAUTHORIZED())
    // A body that would otherwise be processed — the guard must fire first.
    const req = new NextRequest('http://localhost/api/stripe/setup', {
      method: 'POST',
      body: JSON.stringify({ stripeKey: 'sk_live_should_never_be_used', vercelToken: 'tok' }),
    })
    const res = await stripeSetupPOST(req)
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'unauthorized' })
  })

  it('POST /api/compliance-brief returns the auth failure before any API work', async () => {
    mockAuth.mockResolvedValueOnce(UNAUTHORIZED())
    const req = new Request('http://localhost/api/compliance-brief', {
      method: 'POST',
      body: JSON.stringify({ country: 'DE' }),
    })
    const res = await complianceBriefPOST(req)
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'unauthorized' })
  })

  it('GET /api/ai-gateway/health returns the auth failure and leaks no config', async () => {
    mockAuth.mockResolvedValueOnce(UNAUTHORIZED())
    const res = await aiGatewayHealthGET()
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body).toEqual({ error: 'unauthorized' })
    // None of the sensitive health fields should be present on a rejected call.
    expect(body.limits).toBeUndefined()
    expect(body.configured).toBeUndefined()
    expect(body.issues).toBeUndefined()
  })

  it('allows the request through when authorized (guard returns null)', async () => {
    // Sanity check that the guard is a gate, not a hard block: when auth passes,
    // the handler proceeds (ai-gateway/health is safe to fully execute here).
    mockAuth.mockResolvedValue(null)
    const res = await aiGatewayHealthGET()
    // 200 (ok) or 503 (hold) are both valid "authorized and executed" outcomes;
    // the point is it did NOT short-circuit with 401.
    expect(res.status).not.toBe(401)
    const body = await res.json()
    expect(body.service).toBe('unified-ai-gateway')
  })
})
