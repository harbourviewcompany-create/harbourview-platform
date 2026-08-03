import { describe, it, expect } from 'vitest'
import { config } from '@/middleware'

describe('middleware admin matcher coverage', () => {
  it('includes exact and nested admin matchers', () => {
    expect(config.matcher).toContain('/admin')
    expect(config.matcher).toContain('/admin/:path*')
  })

  it('covers representative nested admin route intent', () => {
    const nestedAdminUrl = '/admin/settings'
    const hasNestedCoverage = config.matcher.includes('/admin/:path*')
      && nestedAdminUrl.startsWith('/admin/')

    expect(hasNestedCoverage).toBe(true)
  })
})
