/**
 * Talent API error responses must not leak thrown detail to the client.
 *
 * Written in response to review feedback on PR #1621. That PR replaced
 * `err?.message ?? '<generic>'` with `errorMessage(err, '<generic>')` across the
 * talent routes. The two differ for a thrown *string*: the old expression read
 * `.message` off it, got `undefined`, and fell back to the generic text, while
 * the helper returns the string itself. In a UI banner that is an improvement.
 * In an HTTP response body it is a server-to-client disclosure path, because a
 * thrown string can carry anything the throwing code put in it.
 *
 * These tests pin the contract at the boundary that matters: whatever is thrown,
 * the response body is one of a fixed set of strings.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest'

const saveTalentJob = vi.fn()
const unsaveTalentJob = vi.fn()
const createTalentAlert = vi.fn()
const listTalentOpportunities = vi.fn()

const TALENT_AUTH_ERROR_MESSAGE = 'Authentication required'
function isTalentAuthError(err: unknown): boolean {
  return err instanceof Error && err.message.includes(TALENT_AUTH_ERROR_MESSAGE)
}

vi.mock('@/lib/server/talentOperations', () => ({
  saveTalentJob: (...a: unknown[]) => saveTalentJob(...a),
  unsaveTalentJob: (...a: unknown[]) => unsaveTalentJob(...a),
  createTalentAlert: (...a: unknown[]) => createTalentAlert(...a),
  isTalentAuthError,
  TALENT_AUTH_ERROR_MESSAGE,
}))

vi.mock('@/lib/server/talentQuery', () => ({
  listTalentOpportunities: (...a: unknown[]) => listTalentOpportunities(...a),
  getTalentOpportunity: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({})),
}))

/**
 * The values a route can be handed. `secret` is the one the old code returned
 * verbatim and the reason this file exists.
 */
const THROWN = {
  error: new Error('connection to db-primary.internal:5432 refused'),
  secret: 'PGRST301: schema "api" does not expose table "talent_opportunities"',
  object: { code: 'PGRST301', hint: 'internal routing detail' },
  nullish: null,
}

/** Every string these routes are allowed to put in a response body. */
const ALLOWED_BODIES = new Set([
  'Internal error',
  'Application failed',
  'Alert creation failed',
  'Save failed',
  'Unsave failed',
  TALENT_AUTH_ERROR_MESSAGE,
])

function jsonRequest(body: unknown, method = 'POST') {
  return new Request('http://localhost/api/talent/save', {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

/**
 * The GET route reads `req.nextUrl.searchParams`, which a plain `Request` does
 * not have. Passing one made the route throw a TypeError *before* reaching the
 * query layer — so the generic-body assertions still passed, but for the wrong
 * reason, and the logging assertion caught it. This stub reaches the mocked
 * query layer for real.
 */
function listRequest(search = '') {
  const url = new URL(`http://localhost/api/talent${search}`)
  return { nextUrl: url, url: url.toString(), method: 'GET' }
}

describe('talent API error responses', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  describe('GET /api/talent', () => {
    it.each(Object.entries(THROWN))(
      'returns a generic 500 body when the query layer throws %s',
      async (_label, thrown) => {
        listTalentOpportunities.mockRejectedValue(thrown)
        const { GET } = await import('@/app/api/talent/route')

        const res = await GET(listRequest() as never)
        const body = await res.json()

        expect(res.status).toBe(500)
        expect(body.error).toBe('Internal error')
        expect(ALLOWED_BODIES.has(body.error)).toBe(true)
      },
    )

    it('never echoes a thrown string into the response body', async () => {
      listTalentOpportunities.mockRejectedValue(THROWN.secret)
      const { GET } = await import('@/app/api/talent/route')

      const body = await (await GET(listRequest() as never)).json()

      expect(body.error).not.toContain('PGRST301')
      expect(body.error).not.toContain('api')
      expect(JSON.stringify(body)).not.toContain(THROWN.secret)
    })

    it('still records the detail server-side for logging', async () => {
      listTalentOpportunities.mockRejectedValue(THROWN.secret)
      const { GET } = await import('@/app/api/talent/route')

      await GET(listRequest() as never)

      const logged = (console.error as unknown as ReturnType<typeof vi.fn>).mock.calls.flat().join(' ')
      expect(logged).toContain('PGRST301')
    })
  })

  describe('POST /api/talent/save', () => {
    it('maps our own authentication Error to 401', async () => {
      saveTalentJob.mockRejectedValue(new Error(TALENT_AUTH_ERROR_MESSAGE))
      const { POST } = await import('@/app/api/talent/save/route')

      const res = await POST(jsonRequest({ opportunityId: 'abc' }) as never)
      const body = await res.json()

      expect(res.status).toBe(401)
      expect(body.error).toBe(TALENT_AUTH_ERROR_MESSAGE)
    })

    it('does NOT treat a thrown string mentioning Authentication as our 401', async () => {
      // The pre-PR behaviour: `err?.message?.includes(...)` is false for a string.
      // A string is not our signal and must not be able to force a 401 or be echoed.
      saveTalentJob.mockRejectedValue('Authentication bypassed for user 42 via internal token')
      const { POST } = await import('@/app/api/talent/save/route')

      const res = await POST(jsonRequest({ opportunityId: 'abc' }) as never)
      const body = await res.json()

      expect(res.status).toBe(500)
      expect(body.error).toBe('Save failed')
      expect(JSON.stringify(body)).not.toContain('internal token')
    })

    it.each(Object.entries(THROWN))(
      'returns a generic 500 body for %s',
      async (_label, thrown) => {
        saveTalentJob.mockRejectedValue(thrown)
        const { POST } = await import('@/app/api/talent/save/route')

        const res = await POST(jsonRequest({ opportunityId: 'abc' }) as never)
        const body = await res.json()

        expect(res.status).toBe(500)
        expect(body.error).toBe('Save failed')
      },
    )
  })

  describe('POST /api/talent/alerts', () => {
    it('maps our own authentication Error to 401', async () => {
      createTalentAlert.mockRejectedValue(new Error(TALENT_AUTH_ERROR_MESSAGE))
      const { POST } = await import('@/app/api/talent/alerts/route')

      const res = await POST(jsonRequest({ roleFamily: 'cultivation' }) as never)

      expect(res.status).toBe(401)
      expect((await res.json()).error).toBe(TALENT_AUTH_ERROR_MESSAGE)
    })

    it.each(Object.entries(THROWN))(
      'returns a generic 500 body for %s',
      async (_label, thrown) => {
        createTalentAlert.mockRejectedValue(thrown)
        const { POST } = await import('@/app/api/talent/alerts/route')

        const res = await POST(jsonRequest({ roleFamily: 'cultivation' }) as never)
        const body = await res.json()

        expect(res.status).toBe(500)
        expect(body.error).toBe('Alert creation failed')
        expect(ALLOWED_BODIES.has(body.error)).toBe(true)
      },
    )
  })

  describe('isTalentAuthError', () => {
    it('is true only for a real Error carrying our message', () => {
      expect(isTalentAuthError(new Error(TALENT_AUTH_ERROR_MESSAGE))).toBe(true)
      expect(isTalentAuthError(TALENT_AUTH_ERROR_MESSAGE)).toBe(false)
      expect(isTalentAuthError({ message: TALENT_AUTH_ERROR_MESSAGE })).toBe(false)
      expect(isTalentAuthError(new Error('something else'))).toBe(false)
      expect(isTalentAuthError(null)).toBe(false)
    })
  })
})
