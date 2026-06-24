import { describe, expect, it } from 'vitest'
import { parseRetryAfterSeconds } from '@/lib/intelligence-engine/adapters/http-helpers'

function responseWithRetryAfter(value: string | null) {
  const headers = new Headers()
  if (value !== null) headers.set('Retry-After', value)
  return new Response(null, { status: 429, headers })
}

describe('parseRetryAfterSeconds', () => {
  it('returns undefined when the header is absent', () => {
    expect(parseRetryAfterSeconds(responseWithRetryAfter(null))).toBeUndefined()
  })

  it('parses a delay-seconds value', () => {
    expect(parseRetryAfterSeconds(responseWithRetryAfter('120'))).toBe(120)
  })

  it('parses 0 as a valid delay', () => {
    expect(parseRetryAfterSeconds(responseWithRetryAfter('0'))).toBe(0)
  })

  it('parses an HTTP-date in the future as a positive second count', () => {
    const future = new Date(Date.now() + 60_000).toUTCString()
    const seconds = parseRetryAfterSeconds(responseWithRetryAfter(future))
    expect(seconds).toBeGreaterThan(0)
    expect(seconds).toBeLessThanOrEqual(61)
  })

  it('clamps a past HTTP-date to 0 rather than returning a negative number', () => {
    const past = new Date(Date.now() - 60_000).toUTCString()
    expect(parseRetryAfterSeconds(responseWithRetryAfter(past))).toBe(0)
  })

  it('returns undefined for an unparseable value', () => {
    expect(parseRetryAfterSeconds(responseWithRetryAfter('not-a-date-or-number'))).toBeUndefined()
  })
})
