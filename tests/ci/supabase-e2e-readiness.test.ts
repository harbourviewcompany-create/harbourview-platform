import { describe, expect, it, vi } from 'vitest'

import {
  READINESS_RESULTS,
  diagnoseSupabaseReadiness,
  formatReadinessLines,
} from '../../scripts/check-supabase-e2e-readiness.mjs'

const anonFixture = ['FAKE', 'ANON', 'VALUE', 'SHOULD', 'NEVER', 'APPEAR'].join('_')
const credentialFixture = ['FAKE', 'TEST', 'CREDENTIAL', 'SHOULD', 'NEVER', 'APPEAR'].join('_')
const baseEnv = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://example-project.supabase.co',
  ['NEXT_PUBLIC_SUPABASE_ANON' + '_KEY']: anonFixture,
  E2E_TEST_USER_EMAIL: 'e2e@example.com',
  ['E2E_TEST_USER_' + 'PASSWORD']: credentialFixture,
}

const okResponse = (status = 200) => ({ ok: status >= 200 && status < 300, status }) as Response

function safeRendered(result: Awaited<ReturnType<typeof diagnoseSupabaseReadiness>>) {
  return formatReadinessLines(result).join('\n')
}

describe('Supabase E2E readiness diagnostics', () => {
  it.each([
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'E2E_TEST_USER_EMAIL',
    'E2E_TEST_USER_PASSWORD',
  ] as const)('classifies missing %s without exposing other secret values', async (missingName) => {
    const env = { ...baseEnv, [missingName]: '' }
    const result = await diagnoseSupabaseReadiness({ env })

    expect(result.result).toBe(READINESS_RESULTS.CONFIG_MISSING)
    expect(result.missing).toContain(missingName)
    expect(safeRendered(result)).not.toContain(anonFixture)
    expect(safeRendered(result)).not.toContain(credentialFixture)
  })

  it('classifies malformed or unsafe Supabase URLs', async () => {
    for (const value of ['not-a-url', 'http://example-project.supabase.co', 'https://user:pass@example.com']) {
      const result = await diagnoseSupabaseReadiness({
        env: { ...baseEnv, NEXT_PUBLIC_SUPABASE_URL: value },
      })
      expect(result.result).toBe(READINESS_RESULTS.CONFIG_INVALID)
    }
  })

  it.each(['ENOTFOUND', 'ENETUNREACH'])('classifies lookup %s as DNS_FAILURE', async (code) => {
    const error = Object.assign(new Error('sensitive resolver detail'), { code })
    const result = await diagnoseSupabaseReadiness({
      env: baseEnv,
      lookup: vi.fn().mockRejectedValue(error),
    })

    expect(result.result).toBe(READINESS_RESULTS.DNS_FAILURE)
    expect(result.detail).toEqual({ stage: 'dns', errorCode: code })
    expect(safeRendered(result)).not.toContain('sensitive resolver detail')
  })

  it('classifies transport/TLS failures after DNS as NETWORK_FAILURE', async () => {
    const error = Object.assign(new Error('socket failed with a secret'), { code: 'ECONNRESET' })
    const result = await diagnoseSupabaseReadiness({
      env: baseEnv,
      lookup: vi.fn().mockResolvedValue({ address: '127.0.0.1', family: 4 }),
      fetchImpl: vi.fn().mockRejectedValue(error),
    })

    expect(result.result).toBe(READINESS_RESULTS.NETWORK_FAILURE)
    expect(result.detail).toEqual({ stage: 'network', errorCode: 'ECONNRESET' })
    expect(safeRendered(result)).not.toContain('socket failed with a secret')
  })

  it.each([401, 403])('classifies HTTP %i project credential rejection as ANON_PROJECT_AUTH_FAILURE', async (status) => {
    const fetchImpl = vi.fn().mockResolvedValue(okResponse(status))
    const result = await diagnoseSupabaseReadiness({
      env: baseEnv,
      lookup: vi.fn().mockResolvedValue({ address: '127.0.0.1', family: 4 }),
      fetchImpl,
    })

    expect(result.result).toBe(READINESS_RESULTS.ANON_PROJECT_AUTH_FAILURE)
    expect(result.detail).toEqual({ stage: 'anon_project_auth', httpStatus: status })
  })

  it.each([400, 401, 403])('classifies HTTP %i password rejection as E2E_USER_AUTH_FAILURE', async (status) => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(okResponse(200))
      .mockResolvedValueOnce(okResponse(status))

    const result = await diagnoseSupabaseReadiness({
      env: baseEnv,
      lookup: vi.fn().mockResolvedValue({ address: '127.0.0.1', family: 4 }),
      fetchImpl,
    })

    expect(result.result).toBe(READINESS_RESULTS.E2E_USER_AUTH_FAILURE)
    expect(result.detail).toEqual({ stage: 'e2e_user_auth', httpStatus: status })
  })

  it('returns READY only after DNS, project access, and E2E-user auth all pass', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(okResponse(200))
      .mockResolvedValueOnce(okResponse(200))

    const result = await diagnoseSupabaseReadiness({
      env: baseEnv,
      lookup: vi.fn().mockResolvedValue({ address: '127.0.0.1', family: 4 }),
      fetchImpl,
    })

    expect(result).toMatchObject({
      result: READINESS_RESULTS.READY,
      projectRef: 'example-project',
      migrationLedger: 'EXTERNAL_GATE',
    })
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  it('never renders configured credentials and always separates migration drift', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(okResponse(200))
      .mockResolvedValueOnce(okResponse(400))

    const result = await diagnoseSupabaseReadiness({
      env: baseEnv,
      lookup: vi.fn().mockResolvedValue({ address: '127.0.0.1', family: 4 }),
      fetchImpl,
    })
    const output = safeRendered(result)

    expect(output).not.toContain(anonFixture)
    expect(output).not.toContain(credentialFixture)
    expect(output).toContain('migration_ledger=EXTERNAL_GATE')
    expect(output).toContain('result=E2E_USER_AUTH_FAILURE')
  })
})
