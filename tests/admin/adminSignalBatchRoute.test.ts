import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const requireAdminApiAuth = vi.fn()
const getAdminAuth = vi.fn()
const approveEngineSignal = vi.fn()
const rejectEngineSignal = vi.fn()
const transitionRegulatorySignalStatus = vi.fn()
const auditMutation = vi.fn()

vi.mock('@/lib/auth/adminApiAuth', () => ({ requireAdminApiAuth }))
vi.mock('@/lib/auth/adminGuard', () => ({ getAdminAuth }))
vi.mock('@/lib/signals-engine/admin', () => ({ approveEngineSignal, rejectEngineSignal }))
vi.mock('@/lib/regulatory-signals/admin', () => ({ transitionRegulatorySignalStatus }))
vi.mock('@/lib/supabase/adminDataClient', () => ({ fetchAdminSupabaseJsonMutation: auditMutation }))

describe('POST /api/admin/signals/bulk', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    requireAdminApiAuth.mockResolvedValue(null)
    getAdminAuth.mockResolvedValue({ user: { id: '00000000-0000-4000-8000-000000000001' }, roles: ['admin'] })
    auditMutation.mockResolvedValue({ ok: true, data: null })
  })

  it('returns per-record success and failure instead of optimistic batch success', async () => {
    approveEngineSignal
      .mockResolvedValueOnce({ ok: true, data: true })
      .mockResolvedValueOnce({ ok: false, error: { code: 'request_failed', message: 'database failure' } })

    const { POST } = await import('@/app/api/admin/signals/bulk/route')
    const request = new NextRequest('https://harbourview.local/api/admin/signals/bulk', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        kind: 'engine',
        action: 'approve',
        ids: ['00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000102'],
        idempotencyKey: 'engine-approve-route-test',
      }),
    })

    const response = await POST(request)
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body).toMatchObject({ requested: 2, succeeded: 1, failed: 1, skipped: 0 })
    expect(body.results).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: '00000000-0000-4000-8000-000000000101', ok: true, resultingState: 'approved' }),
      expect.objectContaining({ id: '00000000-0000-4000-8000-000000000102', ok: false, errorCode: 'mutation_failed' }),
    ]))
    expect(auditMutation).toHaveBeenCalledTimes(1)
  })

  it('does not bypass the curated regulatory publication gate with bulk approve', async () => {
    const { POST } = await import('@/app/api/admin/signals/bulk/route')
    const request = new NextRequest('https://harbourview.local/api/admin/signals/bulk', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        kind: 'regulatory',
        action: 'approve',
        ids: ['00000000-0000-4000-8000-000000000201'],
        idempotencyKey: 'regulatory-approve-test',
      }),
    })

    const response = await POST(request)
    const body = await response.json()
    expect(body).toMatchObject({ requested: 1, succeeded: 0, failed: 0, skipped: 1 })
    expect(body.results[0]).toMatchObject({ ok: false, errorCode: 'unsupported_action' })
    expect(transitionRegulatorySignalStatus).not.toHaveBeenCalled()
  })

  it('keeps authorization server-side', async () => {
    const unauthorized = new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } })
    requireAdminApiAuth.mockResolvedValue(unauthorized)
    const { POST } = await import('@/app/api/admin/signals/bulk/route')
    const response = await POST(new NextRequest('https://harbourview.local/api/admin/signals/bulk', { method: 'POST', body: '{}' }))
    expect(response.status).toBe(401)
    expect(approveEngineSignal).not.toHaveBeenCalled()
  })
})
