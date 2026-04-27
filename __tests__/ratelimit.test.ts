import { describe, it, expect, beforeEach } from 'vitest'
import { checkRateLimit } from '../lib/marketplace/ratelimit'

describe('checkRateLimit', () => {
  it('allows requests within limit', () => {
    const ip = `test-${Date.now()}-1`
    const r1 = checkRateLimit(ip, 3, 60_000)
    expect(r1.allowed).toBe(true)
    expect(r1.remaining).toBe(2)
    const r2 = checkRateLimit(ip, 3, 60_000)
    expect(r2.allowed).toBe(true)
    expect(r2.remaining).toBe(1)
    const r3 = checkRateLimit(ip, 3, 60_000)
    expect(r3.allowed).toBe(true)
    expect(r3.remaining).toBe(0)
  })

  it('blocks on exceeding limit', () => {
    const ip = `test-${Date.now()}-2`
    checkRateLimit(ip, 2, 60_000)
    checkRateLimit(ip, 2, 60_000)
    const r3 = checkRateLimit(ip, 2, 60_000)
    expect(r3.allowed).toBe(false)
    expect(r3.remaining).toBe(0)
  })

  it('different IPs are isolated', () => {
    const ip1 = `test-${Date.now()}-3a`
    const ip2 = `test-${Date.now()}-3b`
    checkRateLimit(ip1, 1, 60_000)
    checkRateLimit(ip1, 1, 60_000) // blocked
    const r = checkRateLimit(ip2, 1, 60_000)
    expect(r.allowed).toBe(true)
  })

  it('returns resetAt in the future', () => {
    const ip = `test-${Date.now()}-4`
    const r = checkRateLimit(ip, 5, 60_000)
    expect(r.resetAt).toBeGreaterThan(Date.now())
  })
})
