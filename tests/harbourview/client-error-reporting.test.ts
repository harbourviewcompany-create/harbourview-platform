import { describe, expect, it } from 'vitest'
import {
  CLIENT_ERROR_BOUNDARIES,
  isClientErrorBoundary,
} from '@/lib/errorReporting'

describe('client error reporting boundary contract', () => {
  it('accepts every durable application error boundary, including globe rendering', () => {
    expect(CLIENT_ERROR_BOUNDARIES).toEqual(['country_role', 'global', 'admin', 'globe'])

    for (const boundary of CLIENT_ERROR_BOUNDARIES) {
      expect(isClientErrorBoundary(boundary)).toBe(true)
    }
  })

  it('rejects unknown boundary names', () => {
    expect(isClientErrorBoundary('unknown')).toBe(false)
    expect(isClientErrorBoundary(null)).toBe(false)
    expect(isClientErrorBoundary(42)).toBe(false)
  })
})
