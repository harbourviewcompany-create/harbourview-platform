import { describe, expect, it } from 'vitest'
import { friendlyAuthError } from '@/lib/auth/friendlyAuthError'

describe('friendlyAuthError', () => {
  it('keeps invalid credentials distinct from infrastructure failures', () => {
    expect(friendlyAuthError({ message: 'Invalid login credentials', status: 400 }))
      .toBe('That email or password was not recognized.')
  })

  it('reports provider 5xx failures as temporary service outages', () => {
    expect(friendlyAuthError({ message: 'Internal Server Error', status: 500 }))
      .toBe('Authentication service is temporarily unavailable. Please try again shortly.')
  })

  it('reports network failures as temporary service outages', () => {
    expect(friendlyAuthError(new TypeError('Failed to fetch')))
      .toBe('Authentication service is temporarily unavailable. Please try again shortly.')
  })
})
