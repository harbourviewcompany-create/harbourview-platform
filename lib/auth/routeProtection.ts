/**
 * Single source of truth for auth + tier gating used by proxy.ts.
 *
 * Matcher entries and runtime checks are derived from PROTECTED_ROUTES so the
 * two cannot drift (see tests/harbourview/middleware-route-protection.test.ts).
 */

export type SubscriptionTier = 'free' | 'intel' | 'operator'

export type ProtectedRouteSpec = {
  /** Canonical path prefix (no trailing slash). */
  prefix: string
  /** Minimum subscription tier after auth. null = any authenticated user. */
  minTier: SubscriptionTier | null
  /**
   * Sub-paths that skip auth entirely (public tools under an otherwise
   * protected tree). Compared with exact match or startsWith(prefix + '/').
   */
  publicExceptions?: readonly string[]
}

/**
 * Single source of truth for auth + tier gating.
 * Matcher and runtime checks are derived from this list.
 */
export const PROTECTED_ROUTES: readonly ProtectedRouteSpec[] = [
  { prefix: '/admin', minTier: null },
  { prefix: '/dashboard', minTier: null },
  { prefix: '/account', minTier: null },
  { prefix: '/vault', minTier: 'intel' },
  { prefix: '/intake', minTier: null },
  { prefix: '/signals', minTier: 'intel' },
  {
    prefix: '/intelligence',
    minTier: 'intel',
    publicExceptions: [
      '/intelligence/watchlists',
      '/intelligence/corridor-plan',
      '/intelligence/corridor-coverage',
      '/intelligence/landed-cost',
      '/intelligence/logistics-simulator',
      '/intelligence/logistics-trade-routes',
    ],
  },
  // Genetics catalog is intentionally public (Phase 2 public genetics + passport).
  // Do not re-protect the whole tree here. If private genetics tools appear later,
  // add a narrower child prefix (e.g. /genetics/private) instead.
  { prefix: '/network', minTier: 'intel' },
  { prefix: '/opportunities', minTier: 'intel' },
  { prefix: '/reviewed-connections', minTier: null },
  { prefix: '/professionals', minTier: null },
  { prefix: '/assessments', minTier: null },
  { prefix: '/compliance', minTier: null },
  {
    prefix: '/education',
    minTier: null,
    publicExceptions: ['/education/cpd'],
  },
  { prefix: '/marketplace/sell', minTier: null },
  { prefix: '/marketplace/my-listings', minTier: null },
  // Was listed in the old PROTECTED_PREFIXES but missing from config.matcher —
  // requests never entered proxy() and auth was bypassed.
  { prefix: '/marketplace/intake', minTier: null },
] as const

export const LEGACY_REDIRECTS: Readonly<Record<string, string>> = {
  '/marketplace/submit-listing': '/marketplace/sell',
  '/marketplace/wanted-requests': '/marketplace/wanted',
  '/commercial-intelligence': '/intelligence',
}

/**
 * Build Next.js middleware matcher entries: exact + nested for every protected
 * prefix, plus every legacy redirect source path.
 */
export function buildMatcher(): string[] {
  const patterns = new Set<string>()

  for (const route of PROTECTED_ROUTES) {
    patterns.add(route.prefix)
    patterns.add(`${route.prefix}/:path*`)
  }

  for (const from of Object.keys(LEGACY_REDIRECTS)) {
    patterns.add(from)
  }

  return [...patterns].sort()
}

export function isPublicException(pathname: string): boolean {
  for (const route of PROTECTED_ROUTES) {
    for (const ex of route.publicExceptions ?? []) {
      if (pathname === ex || pathname.startsWith(ex + '/')) return true
    }
  }
  return false
}

/** Longest-prefix match so /marketplace/sell wins over a hypothetical /marketplace. */
export function findProtectedRoute(pathname: string): ProtectedRouteSpec | null {
  const matches = PROTECTED_ROUTES.filter(
    (r) => pathname === r.prefix || pathname.startsWith(r.prefix + '/'),
  )
  if (!matches.length) return null
  return matches.reduce((a, b) => (a.prefix.length >= b.prefix.length ? a : b))
}
