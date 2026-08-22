import { beforeEach, describe, expect, it, vi } from 'vitest'

const saveTalentJob = vi.fn()
const unsaveTalentJob = vi.fn()
const createTalentAlert = vi.fn()
const listTalentOpportunities = vi.fn()
const getTalentOpportunity = vi.fn()
const incrementTalentViewCount = vi.fn(() => Promise.resolve())
const createClient = vi.fn()

const TALENT_AUTH_ERROR_MESSAGE = 'Authentication required'
function isTalentAuthError(err: unknown): boolean {
  return err instanceof Error && err.message === TALENT_AUTH_ERROR_MESSAGE
}

vi.mock('@/lib/server/talentOperations', () => ({
  saveTalentJob: (...args: unknown[]) => saveTalentJob(...args),
  unsaveTalentJob: (...args: unknown[]) => unsaveTalentJob(...args),
  createTalentAlert: (...args: unknown[]) => createTalentAlert(...args),
  isTalentAuthError,
  TALENT_AUTH_ERROR_MESSAGE,
}))

vi.mock('@/lib/server/talentQuery', () => ({
  listTalentOpportunities: (...args: unknown[]) => listTalentOpportunities(...args),
  getTalentOpportunity: (...args: unknown[]) => getTalentOpportunity(...args),
  incrementTalentViewCount: (...args: unknown[]) => incrementTalentViewCount(...args),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: (...args: unknown[]) => createClient(...args),
}))

vi.mock('@/lib/network/rateLimit', () => ({
  enforceRateLimit: vi.fn(async () => ({ allowed: true })),
  getClientIp: vi.fn(() => '127.0.0.1'),
}))

const THROWN = {
  error: new Error('connection to db-primary.internal:5432 refused'),
  thrownString: 'PGRST301: schema "api" does not expose table "talent_opportunities"',
  object: { code: 'PGRST301', hint: 'internal routing detail' },
  nullish: null,
}

function jsonRequest(body: unknown, method = 'POST', path = '/api/talent/save') {
  return new Request(`http://localhost${path}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function listRequest(search = '') {
  const url = new URL(`http://localhost/api/talent${search}`)
  return { nextUrl: url, url: url.toString(), method: 'GET' }
}

async function expectGenericError(response: Response, status: number, message: string, thrown: unknown) {
  expect(response.status).toBe(status)
  const body = await response.json()
  expect(body.error).toBe(message)
  expect(JSON.stringify(body)).not.toContain(String(thrown))
}

describe('talent API public error contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  it.each(Object.entries(THROWN))('GET /api/talent hides %s detail', async (_label, thrown) => {
    listTalentOpportunities.mockRejectedValue(thrown)
    const { GET } = await import('@/app/api/talent/route')
    await expectGenericError(await GET(listRequest() as never), 500, 'Internal error', thrown)
  })

  it.each(Object.entries(THROWN))('GET /api/talent/[id] hides %s detail', async (_label, thrown) => {
    getTalentOpportunity.mockRejectedValue(thrown)
    const { GET } = await import('@/app/api/talent/[id]/route')
    await expectGenericError(
      await GET(new Request('http://localhost/api/talent/abc') as never, {
        params: Promise.resolve({ id: 'abc' }),
      }),
      500,
      'Internal error',
      thrown,
    )
  })

  it.each(Object.entries(THROWN))('POST /api/talent/apply hides %s detail', async (_label, thrown) => {
    createClient.mockRejectedValue(thrown)
    const { POST } = await import('@/app/api/talent/apply/route')
    await expectGenericError(
      await POST(jsonRequest({ opportunityId: 'abc', name: 'Applicant', email: 'applicant@example.com' }, 'POST', '/api/talent/apply') as never),
      500,
      'Application failed',
      thrown,
    )
  })

  it.each(Object.entries(THROWN))('POST /api/talent/save hides %s detail', async (_label, thrown) => {
    saveTalentJob.mockRejectedValue(thrown)
    const { POST } = await import('@/app/api/talent/save/route')
    await expectGenericError(
      await POST(jsonRequest({ opportunityId: 'abc' }) as never),
      500,
      'Save failed',
      thrown,
    )
  })

  it.each(Object.entries(THROWN))('DELETE /api/talent/save hides %s detail', async (_label, thrown) => {
    unsaveTalentJob.mockRejectedValue(thrown)
    const { DELETE } = await import('@/app/api/talent/save/route')
    await expectGenericError(
      await DELETE(jsonRequest({ opportunityId: 'abc' }, 'DELETE') as never),
      500,
      'Unsave failed',
      thrown,
    )
  })

  it.each(Object.entries(THROWN))('POST /api/talent/alerts hides %s detail', async (_label, thrown) => {
    createTalentAlert.mockRejectedValue(thrown)
    const { POST } = await import('@/app/api/talent/alerts/route')
    await expectGenericError(
      await POST(jsonRequest({ roleFamily: 'cultivation' }, 'POST', '/api/talent/alerts') as never),
      500,
      'Alert creation failed',
      thrown,
    )
  })

  it('keeps thrown detail server-side for diagnostics', async () => {
    listTalentOpportunities.mockRejectedValue(THROWN.thrownString)
    const { GET } = await import('@/app/api/talent/route')
    await GET(listRequest() as never)
    const logged = (console.error as unknown as ReturnType<typeof vi.fn>).mock.calls.flat().join(' ')
    expect(logged).toContain('PGRST301')
  })

  it('maps only the exact module authentication Error to 401', async () => {
    const { POST } = await import('@/app/api/talent/save/route')

    saveTalentJob.mockRejectedValueOnce(new Error(TALENT_AUTH_ERROR_MESSAGE))
    const authResponse = await POST(jsonRequest({ opportunityId: 'abc' }) as never)
    expect(authResponse.status).toBe(401)
    expect((await authResponse.json()).error).toBe(TALENT_AUTH_ERROR_MESSAGE)

    saveTalentJob.mockRejectedValueOnce(TALENT_AUTH_ERROR_MESSAGE)
    await expectGenericError(
      await POST(jsonRequest({ opportunityId: 'abc' }) as never),
      500,
      'Save failed',
      TALENT_AUTH_ERROR_MESSAGE,
    )

    const containingError = new Error(`${TALENT_AUTH_ERROR_MESSAGE}: upstream detail`)
    saveTalentJob.mockRejectedValueOnce(containingError)
    await expectGenericError(
      await POST(jsonRequest({ opportunityId: 'abc' }) as never),
      500,
      'Save failed',
      containingError,
    )
  })

  it('uses the same exact auth contract for alerts and unsave', async () => {
    const { POST: alertsPost } = await import('@/app/api/talent/alerts/route')
    const { DELETE: saveDelete } = await import('@/app/api/talent/save/route')

    createTalentAlert.mockRejectedValue(new Error(TALENT_AUTH_ERROR_MESSAGE))
    const alertResponse = await alertsPost(jsonRequest({}, 'POST', '/api/talent/alerts') as never)
    expect(alertResponse.status).toBe(401)
    expect((await alertResponse.json()).error).toBe(TALENT_AUTH_ERROR_MESSAGE)

    unsaveTalentJob.mockRejectedValue(new Error(TALENT_AUTH_ERROR_MESSAGE))
    const deleteResponse = await saveDelete(jsonRequest({ opportunityId: 'abc' }, 'DELETE') as never)
    expect(deleteResponse.status).toBe(401)
    expect((await deleteResponse.json()).error).toBe(TALENT_AUTH_ERROR_MESSAGE)
  })

  it('auth predicate accepts only an exact Error marker', () => {
    expect(isTalentAuthError(new Error(TALENT_AUTH_ERROR_MESSAGE))).toBe(true)
    expect(isTalentAuthError(TALENT_AUTH_ERROR_MESSAGE)).toBe(false)
    expect(isTalentAuthError({ message: TALENT_AUTH_ERROR_MESSAGE })).toBe(false)
    expect(isTalentAuthError(new Error(`${TALENT_AUTH_ERROR_MESSAGE}: detail`))).toBe(false)
    expect(isTalentAuthError(new Error('something else'))).toBe(false)
    expect(isTalentAuthError(null)).toBe(false)
  })
})
