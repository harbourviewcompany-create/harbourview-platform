import { readFileSync } from 'node:fs'
import { join } from 'node:path'
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

describe('talent production integration migration contract', () => {
  const migration = readFileSync(
    join(process.cwd(), 'supabase/migrations/20260822172000_talent_production_integration_repair.sql'),
    'utf8',
  )
  const apiSchemaMigration = readFileSync(
    join(process.cwd(), 'supabase/migrations/20260822174500_talent_api_schema_exposure.sql'),
    'utf8',
  )
  const applyRoute = readFileSync(
    join(process.cwd(), 'app/api/talent/apply/route.ts'),
    'utf8',
  )

  it('grants the required Talent Data API access without exposing application reads to anon', () => {
    expect(migration).toContain('grant select on table public.talent_opportunities to anon, authenticated;')
    expect(migration).toContain('grant insert on table public.talent_applications to anon;')
    expect(migration).toContain('grant select, insert on table public.talent_applications to authenticated;')
    expect(migration).not.toContain('grant select on table public.talent_applications to anon')
  })

  it('keeps anonymous view counts while removing anonymous application-count execution', () => {
    expect(migration).toContain('revoke execute on function public.increment_talent_view_count(uuid)\n  from public, anon, authenticated;')
    expect(migration).toContain('revoke execute on function public.increment_talent_application_count(uuid)\n  from public, anon, authenticated;')
    expect(migration).toContain('grant execute on function public.increment_talent_view_count(uuid)\n  to anon, authenticated;')
    expect(migration).toContain('grant execute on function public.increment_talent_application_count(uuid)\n  to authenticated;')
    expect(migration).not.toContain('grant execute on function public.increment_talent_application_count(uuid)\n  to anon')
  })

  it('closes self-publish and non-submitted application insert paths', () => {
    expect(migration).toContain("and status = 'draft'")
    expect(migration).toContain("status = 'submitted'")
    expect(migration).toContain('((select auth.uid()) is null and user_id is null)')
  })

  it('uses an insert trigger for application counts and keeps the trigger helper non-callable', () => {
    expect(migration).toContain('create trigger talent_applications_increment_count')
    expect(migration).toContain('after insert on public.talent_applications')
    expect(migration).toContain('revoke execute on function public.talent_application_count_after_insert()\n  from public, anon, authenticated;')
  })

  it('exposes Talent through the canonical api schema without weakening RLS or RPC boundaries', () => {
    for (const table of ['talent_opportunities', 'talent_applications', 'talent_saved_jobs', 'talent_alerts']) {
      expect(apiSchemaMigration).toContain(`create or replace view api.${table}`)
    }
    expect(apiSchemaMigration.match(/with \(security_invoker = on\)/g)?.length).toBe(4)
    expect(apiSchemaMigration).toContain('grant select on api.talent_opportunities to anon, authenticated;')
    expect(apiSchemaMigration).toContain('grant insert on api.talent_applications to anon;')
    expect(apiSchemaMigration).toContain('grant select, insert on api.talent_applications to authenticated;')
    expect(apiSchemaMigration).not.toContain('grant select on api.talent_applications to anon')
    expect(apiSchemaMigration).toContain('security invoker\nset search_path = pg_catalog, public')
    expect(apiSchemaMigration).toContain('grant execute on function api.increment_talent_view_count(uuid)\n  to anon, authenticated;')
    expect(apiSchemaMigration).toContain('grant execute on function api.increment_talent_application_count(uuid)\n  to authenticated;')
    expect(apiSchemaMigration).not.toContain('grant execute on function api.increment_talent_application_count(uuid)\n  to anon')
  })

  it('allows guest apply without selecting the inserted private application row', () => {
    expect(applyRoute).toContain("import { randomUUID } from 'node:crypto'")
    expect(applyRoute).toContain('const applicationId = randomUUID()')
    expect(applyRoute).toContain('id: applicationId,')
    expect(applyRoute).toContain(".from('talent_applications')\n      .insert(insertPayload)")
    expect(applyRoute).not.toContain(".from('talent_applications')\n      .insert(insertPayload)\n      .select('id')")
    expect(applyRoute).not.toContain('increment_talent_application_count')
  })
})
