import { describe, expect, it } from 'vitest'

import { config } from '../../middleware'

function matchesPath(pathname: string, pattern: string): boolean {
  if (!pattern.includes('/:path*')) {
    return pathname === pattern
  }

  const prefix = pattern.slice(0, -'/:path*'.length)
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

describe('middleware signals matcher coverage', () => {
  const matcher = config.matcher as string[]

  it('includes dedicated signals root and subtree patterns', () => {
    expect(matcher).toContain('/signals')
    expect(matcher).toContain('/signals/:path*')
  })

  it('matches nested signals routes used by app/signals pages', () => {
    const nestedSignalsRoutes = ['/signals/some-slug', '/signals/types/imaging', '/signals/countries']

    nestedSignalsRoutes.forEach((route) => {
      expect(matcher.some((pattern) => matchesPath(route, pattern))).toBe(true)
    })
  })

  it('does not expand coverage to unrelated sibling route trees', () => {
    const unrelatedRoutes = ['/signals-extra', '/signal', '/services/signals']

    unrelatedRoutes.forEach((route) => {
      expect(matcher.some((pattern) => matchesPath(route, pattern))).toBe(false)
    })
  })
})
