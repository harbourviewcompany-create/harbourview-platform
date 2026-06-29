import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getSupabasePublicClientKey, getSupabaseUrl } from '@/lib/supabase/env'

// Only apply no-store headers to routes that serve authenticated or
// personalised content. Public informational routes must remain CDN-cacheable.
function applyNoStoreHeaders(response: NextResponse) {
  const NO_STORE = 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0'
  response.headers.set('Cache-Control', NO_STORE)
  response.headers.set('CDN-Cache-Control', 'no-store')
  response.headers.set('Vercel-CDN-Cache-Control', 'no-store')
  response.headers.set('Surrogate-Control', 'no-store')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  return response
}

// ── Subscription tier type ─────────────────────────────────────────────────────
type SubscriptionTier = 'free' | 'starter' | 'professional' | 'enterprise'

// Routes that require a minimum subscription tier beyond free.
// Key: route prefix, Value: minimum tier required.
const TIER_GATED_PREFIXES: Record<string, SubscriptionTier> = {
  '/signals':      'starter',
  '/intelligence': 'starter',
  '/genetics':     'professional',
  '/network':      'starter',
  '/vault':        'starter',
  '/opportunities':'starter',
}

const TIER_ORDER: SubscriptionTier[] = ['free', 'starter', 'professional', 'enterprise']

function tierMeetsMinimum(actual: SubscriptionTier | undefined, required: SubscriptionTier): boolean {
  if (!actual) return false
  return TIER_ORDER.indexOf(actual) >= TIER_ORDER.indexOf(required)
}

// Routes that require authentication — middleware actively checks session.
const PROTECTED_PREFIXES = [
  '/account',
  '/vault',
  '/admin',
  '/dashboard',
  '/intake',
  '/marketplace/sell',
  '/marketplace/my-listings',
  '/signals',
  '/intelligence',
  '/genetics',
  '/network',
  '/opportunities',
  '/reviewed-connections',
  '/professionals',
  '/assessments',
  '/compliance',
  '/education',
  '/marketplace/intake',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Normalize trailing slash
  const normalizedPathname =
    pathname !== '/' && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname

  // Legacy redirects — stamp no-store because redirects shouldn't be cached
  const legacyRedirects: Record<string, string> = {
    '/marketplace/submit-listing': '/marketplace/sell',
    '/marketplace/wanted-requests': '/marketplace/wanted',
    '/commercial-intelligence':     '/intelligence',
  }
  const redirectTo = legacyRedirects[normalizedPathname]
  if (redirectTo) {
    const url = request.nextUrl.clone()
    url.pathname = redirectTo
    url.search = ''
    return applyNoStoreHeaders(NextResponse.redirect(url, 308))
  }

  // Auth guard for protected routes
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => normalizedPathname === prefix || normalizedPathname.startsWith(prefix + '/')
  )

  if (isProtected) {
    let supabaseUrl = ''
    let supabasePublicKey = ''

    try {
      supabaseUrl = getSupabaseUrl()
      supabasePublicKey = getSupabasePublicClientKey()
    } catch (error) {
      console.error('[harbourview:auth] Supabase public auth configuration rejected', {
        message: error instanceof Error ? error.message : 'Unknown Supabase configuration error',
      })
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      loginUrl.search = `?next=${encodeURIComponent(normalizedPathname)}&error=${encodeURIComponent('Auth configuration is missing a browser-safe Supabase public key.')}`
      return applyNoStoreHeaders(NextResponse.redirect(loginUrl))
    }

    let response = NextResponse.next({ request })

    const supabase = createServerClient(supabaseUrl, supabasePublicKey, {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    })

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      loginUrl.search = `?next=${encodeURIComponent(normalizedPathname)}`
      return applyNoStoreHeaders(NextResponse.redirect(loginUrl))
    }

    // ── Subscription tier gate ─────────────────────────────────────────────────
    // Read tier from JWT app_metadata — zero extra DB round-trip.
    const tier = (user.app_metadata?.subscription_tier ?? 'free') as SubscriptionTier

    const matchedTierPrefix = Object.keys(TIER_GATED_PREFIXES).find(
      (prefix) => normalizedPathname === prefix || normalizedPathname.startsWith(prefix + '/')
    )

    if (matchedTierPrefix) {
      const required = TIER_GATED_PREFIXES[matchedTierPrefix]
      if (!tierMeetsMinimum(tier, required)) {
        const upgradeUrl = request.nextUrl.clone()
        upgradeUrl.pathname = '/account/upgrade'
        upgradeUrl.search = `?feature=${encodeURIComponent(matchedTierPrefix.slice(1))}&required=${required}&current=${tier}`
        return applyNoStoreHeaders(NextResponse.redirect(upgradeUrl))
      }
    }

    // Protected and authenticated — prevent caching of personalised responses
    return applyNoStoreHeaders(response)
  }

  // Public route — do NOT stamp no-store. Let Next.js ISR / Vercel CDN cache
  // these responses normally.
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/dashboard/:path*',
    '/account/:path*',
    '/vault/:path*',
    '/intake/:path*',
    '/signals/:path*',
    '/intelligence/:path*',
    '/genetics/:path*',
    '/network/:path*',
    '/opportunities/:path*',
    '/reviewed-connections/:path*',
    '/professionals/:path*',
    '/assessments/:path*',
    '/compliance/:path*',
    '/education/:path*',
    '/marketplace/sell/:path*',
    '/marketplace/my-listings/:path*',
    // Legacy redirect paths
    '/marketplace/submit-listing',
    '/marketplace/wanted-requests',
    '/commercial-intelligence',
  ],
}

