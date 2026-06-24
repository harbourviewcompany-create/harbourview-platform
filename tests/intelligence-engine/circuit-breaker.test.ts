import { describe, expect, it, vi, beforeEach } from 'vitest'
import { CircuitBreaker } from '@/lib/intelligence-engine/queue/circuit-breaker'

/**
 * Minimal fake Supabase client covering exactly the chain shapes
 * circuit-breaker.ts calls: .from(table).select(...).gt(...) for refresh(),
 * .from(table).select(...).eq(...).maybeSingle() for the failure-count
 * lookup, and .from(table).upsert(...) for both recordFailure/recordSuccess.
 */
function makeFakeSupabase(opts: { existingFailures?: Record<string, number>; lockedDomains?: string[] } = {}) {
  const existingFailures = opts.existingFailures ?? {}
  const lockedDomains = opts.lockedDomains ?? []
  const upserts: Array<Record<string, unknown>> = []

  const supabase = {
    from: (_table: string) => ({
      select: (_cols: string) => ({
        gt: async (_col: string, _val: string) => ({
          data: lockedDomains.map((domain) => ({ domain })),
          error: null,
        }),
        eq: (_col: string, domain: string) => ({
          maybeSingle: async () => ({
            data: domain in existingFailures ? { consecutive_failures: existingFailures[domain] } : null,
            error: null,
          }),
        }),
      }),
      upsert: async (row: Record<string, unknown>) => {
        upserts.push(row)
        return { error: null }
      },
    }),
    __upserts: upserts,
  }

  return supabase as any
}

describe('CircuitBreaker (distributed, Supabase-backed)', () => {
  it('is not locked for a domain with no recorded failures', async () => {
    const supabase = makeFakeSupabase()
    const breaker = new CircuitBreaker(supabase)
    await breaker.refresh()
    expect(breaker.isLocked('example.com')).toBe(false)
  })

  it('reflects a domain already locked in the shared table after refresh()', async () => {
    const supabase = makeFakeSupabase({ lockedDomains: ['blocked.example.com'] })
    const breaker = new CircuitBreaker(supabase)
    await breaker.refresh()
    expect(breaker.isLocked('blocked.example.com')).toBe(true)
    expect(breaker.isLocked('other.example.com')).toBe(false)
  })

  it('locks a domain (in the in-memory snapshot) once recordFailure reaches the threshold', async () => {
    const supabase = makeFakeSupabase({ existingFailures: { 'flaky.example.com': 2 } })
    const breaker = new CircuitBreaker(supabase)
    await breaker.refresh()
    expect(breaker.isLocked('flaky.example.com')).toBe(false)

    // 3rd consecutive failure crosses MAX_FAILURES (3) -> should lock.
    await breaker.recordFailure('flaky.example.com')
    expect(breaker.isLocked('flaky.example.com')).toBe(true)

    const lastUpsert = supabase.__upserts[supabase.__upserts.length - 1]
    expect(lastUpsert.consecutive_failures).toBe(3)
    expect(lastUpsert.locked_until).not.toBeNull()
  })

  it('does not lock a domain below the failure threshold', async () => {
    const supabase = makeFakeSupabase({ existingFailures: { 'mostly-fine.example.com': 0 } })
    const breaker = new CircuitBreaker(supabase)
    await breaker.refresh()
    await breaker.recordFailure('mostly-fine.example.com')
    expect(breaker.isLocked('mostly-fine.example.com')).toBe(false)
  })

  it('recordSuccess clears an in-memory lockout', async () => {
    const supabase = makeFakeSupabase({ lockedDomains: ['recovering.example.com'] })
    const breaker = new CircuitBreaker(supabase)
    await breaker.refresh()
    expect(breaker.isLocked('recovering.example.com')).toBe(true)

    await breaker.recordSuccess('recovering.example.com')
    expect(breaker.isLocked('recovering.example.com')).toBe(false)

    const lastUpsert = supabase.__upserts[supabase.__upserts.length - 1]
    expect(lastUpsert.consecutive_failures).toBe(0)
    expect(lastUpsert.locked_until).toBeNull()
  })
})
