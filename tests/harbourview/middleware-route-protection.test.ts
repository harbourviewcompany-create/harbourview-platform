import { describe, it, expect } from 'vitest'
import { config } from '@/proxy'
import {
  PROTECTED_ROUTES,
  buildMatcher,
  findProtectedRoute,
  isPublicException,
  LEGACY_REDIRECTS,
} from '@/lib/auth/routeProtection'

describe('route protection contract', () => {
  it('matcher equals buildMatcher()', () => {
    expect([...config.matcher].sort()).toEqual(buildMatcher())
  })

  it('every protected prefix has exact and nested matcher entries', () => {
    for (const route of PROTECTED_ROUTES) {
      expect(config.matcher).toContain(route.prefix)
      expect(config.matcher).toContain(`${route.prefix}/:path*`)
    }
  })

  it('legacy redirect sources are in the matcher', () => {
    for (const from of Object.keys(LEGACY_REDIRECTS)) {
      expect(config.matcher).toContain(from)
    }
  })

  it('marketplace intake is protected and matched (auth-bypass fix)', () => {
    expect(findProtectedRoute('/marketplace/intake')).not.toBeNull()
    expect(findProtectedRoute('/marketplace/intake/foo')).not.toBeNull()
    expect(config.matcher).toContain('/marketplace/intake')
    expect(config.matcher).toContain('/marketplace/intake/:path*')
  })

  it('genetics is not auth-gated (public catalog policy)', () => {
    expect(findProtectedRoute('/genetics')).toBeNull()
    expect(findProtectedRoute('/genetics/passport/abc')).toBeNull()
  })

  it('intelligence public tools remain exceptions', () => {
    expect(isPublicException('/intelligence/landed-cost')).toBe(true)
    expect(isPublicException('/intelligence/corridor-plan')).toBe(true)
    expect(isPublicException('/intelligence/logistics-simulator')).toBe(true)
    expect(isPublicException('/intelligence/logistics-trade-routes')).toBe(true)
    expect(isPublicException('/intelligence/watchlists')).toBe(true)
    expect(isPublicException('/intelligence/corridor-coverage')).toBe(true)
  })

  it('education/cpd is public; other education requires auth', () => {
    expect(isPublicException('/education/cpd')).toBe(true)
    expect(isPublicException('/education/cpd/certificate')).toBe(true)
    expect(findProtectedRoute('/education')).not.toBeNull()
    expect(isPublicException('/education')).toBe(false)
  })

  it('longest prefix wins for marketplace paths', () => {
    const sell = findProtectedRoute('/marketplace/sell')
    expect(sell?.prefix).toBe('/marketplace/sell')
    const intake = findProtectedRoute('/marketplace/intake')
    expect(intake?.prefix).toBe('/marketplace/intake')
  })

  it('tier gates are attached to the expected prefixes', () => {
    expect(findProtectedRoute('/signals')?.minTier).toBe('intel')
    expect(findProtectedRoute('/intelligence')?.minTier).toBe('intel')
    expect(findProtectedRoute('/vault')?.minTier).toBe('intel')
    expect(findProtectedRoute('/network')?.minTier).toBe('intel')
    expect(findProtectedRoute('/opportunities')?.minTier).toBe('intel')
    expect(findProtectedRoute('/admin')?.minTier).toBeNull()
    expect(findProtectedRoute('/dashboard')?.minTier).toBeNull()
  })
})
