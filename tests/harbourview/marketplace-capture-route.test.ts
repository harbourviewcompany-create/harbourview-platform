import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const ORIGINAL_ENV = process.env

const validPayload = {
  contact_name: 'Harbourview Test Seller',
  contact_email: 'seller@example.com',
  contact_company: 'Harbourview Test Company',
  contact_phone: null,
  inquiry_type: 'listing_submission',
  message: 'Harbourview marketplace listing submission\n\nListing type: New Product\nTitle: Test listing\n\nDescription:\nSafe test description.',
  success_message: 'Listing submission received. Harbourview will review it before publication or counterparty routing.',
}

function makeRequest(payload: unknown) {
  return new Request('http://localhost/api/marketplace/capture', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-request-id': 'test-request-id' },
    body: JSON.stringify(payload),
  })
}

async function loadRoute() {
  vi.resetModules()
  return import('@/app/api/marketplace/capture/route')
}

describe('/api/marketplace/capture', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    process.env = { ...ORIGINAL_ENV }
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://zvxdgdkukjrrwamdpqrg.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
  })

  afterEach(() => {
    process.env = ORIGINAL_ENV
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('returns success for a valid seller listing submission and inserts through service-role REST headers', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('', { status: 201 }))
    vi.stubGlobal('fetch', fetchMock)

    const { POST } = await loadRoute()
    const response = await POST(makeRequest(validPayload))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.status).toBe('success')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toBe('https://zvxdgdkukjrrwamdpqrg.supabase.co/rest/v1/marketplace_inquiries')
    expect(init.headers.Authorization).toBe('Bearer test-service-role-key')
    expect(init.headers.apikey).toBe('test-service-role-key')

    const insertedPayload = JSON.parse(init.body)
    expect(insertedPayload).toMatchObject({
      listing_id: null,
      buyer_request_id: null,
      contact_name: validPayload.contact_name,
      contact_email: validPayload.contact_email,
      contact_company: validPayload.contact_company,
      contact_phone: null,
      inquiry_type: 'listing_submission',
      message: validPayload.message,
      status: 'received',
    })
    expect(typeof insertedPayload.id).toBe('string')
  })

  it('returns accessible validation errors when required fields are invalid', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const { POST } = await loadRoute()
    const response = await POST(makeRequest({ ...validPayload, contact_name: '', contact_email: 'not-an-email' }))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.status).toBe('error')
    expect(body.message).toBe('Please review the highlighted fields and try again.')
    expect(body.errors.fieldErrors.contact_name).toBeDefined()
    expect(body.errors.fieldErrors.contact_email).toBeDefined()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns a safe public error when Supabase insert fails and logs structured non-sensitive diagnostics', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ code: '23502', message: 'required column violation', details: 'schema detail', hint: 'Check required columns.' }),
        { status: 400, statusText: 'Bad Request' },
      ),
    )
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined)
    vi.stubGlobal('fetch', fetchMock)

    const { POST } = await loadRoute()
    const response = await POST(makeRequest(validPayload))
    const body = await response.json()

    expect(response.status).toBe(502)
    expect(body).toEqual({ status: 'error', message: 'Listing submission could not be saved. Please try again or contact Harbourview directly.' })

    const insertLog = infoSpy.mock.calls.find(([event, details]) => {
      return event === 'harbourview_marketplace_capture' && typeof details === 'object' && details && 'code' in details && details.code === 'CAPTURE_SUPABASE_INSERT_FAILED'
    })
    expect(insertLog).toBeDefined()
    expect(insertLog?.[1]).toMatchObject({
      requestId: 'test-request-id',
      route: '/api/marketplace/capture',
      targetTable: 'marketplace_inquiries',
      supabaseErrorCode: '23502',
      supabaseErrorMessage: 'required column violation',
      supabaseErrorDetails: 'schema detail',
      supabaseErrorHint: 'Check required columns.',
    })
    const logText = JSON.stringify(insertLog)
    expect(logText).not.toContain(validPayload.contact_name)
    expect(logText).not.toContain(validPayload.contact_email)
    expect(logText).not.toContain(validPayload.contact_company)
    expect(logText).not.toContain(validPayload.message)
  })
})
