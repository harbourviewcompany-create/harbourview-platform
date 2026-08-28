import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getSupabasePublicClientKey, getSupabaseUrl } from '@/lib/supabase/env'
import {
  findProtectedRoute,
  isPublicException,
  LEGACY_REDIRECTS,
  type SubscriptionTier,
} from '@/lib/auth/routeProtection'

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

const TIER_ORDER: SubscriptionTier[] = ['free', 'intel', 'operator']

function tierMeetsMinimum(
  actual: SubscriptionTier | string | undefined,
  required: SubscriptionTier,
): boolean {
  if (!actual) return false
  const normalised = normaliseTier(actual)
  return TIER_ORDER.indexOf(normalised) >= TIER_ORDER.indexOf(required)
}

function normaliseTier(raw: string): SubscriptionTier {
  switch (raw) {
    case 'intel':
      return 'intel'
    case 'operator':
      return 'operator'
    case 'professional':
      return 'operator'
    case 'enterprise':
      return 'operator'
    case 'starter':
      return 'intel'
    default:
      return 'free'
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const normalizedPathname =
    pathname !== '/' && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname

  const redirectTo = LEGACY_REDIRECTS[normalizedPathname]
  if (redirectTo) {
    const url = new URL(redirectTo, request.url)
    url.search = ''
    return applyNoStoreHeaders(NextResponse.redirect(url, 308))
  }

  if (isPublicException(normalizedPathname)) {
    return NextResponse.next()
  }

  const route = findProtectedRoute(normalizedPathname)
  if (!route) {
    return NextResponse.next()
  }

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
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.search = `?next=${encodeURIComponent(normalizedPathname)}`
    return applyNoStoreHeaders(NextResponse.redirect(loginUrl))
  }

  if (route.minTier) {
    const rawTier = user.app_metadata?.subscription_tier as string | undefined
    const tier = normaliseTier(rawTier ?? 'free')
    if (!tierMeetsMinimum(tier, route.minTier)) {
      const upgradeUrl = request.nextUrl.clone()
      upgradeUrl.pathname = '/account/upgrade'
      upgradeUrl.search = `?feature=${encodeURIComponent(route.prefix.slice(1))}&required=${route.minTier}&current=${tier}`
      return applyNoStoreHeaders(NextResponse.redirect(upgradeUrl))
    }
  }

  return applyNoStoreHeaders(response)
}

// Next.js statically parses matcher at build time; function calls/imported values are rejected.
// The route-protection contract test requires this literal array to equal buildMatcher(), so the
// runtime policy and compile-time matcher cannot silently drift.
export const config = {
  matcher: [
    '/account',
    '/account/:path*',
    '/admin',
    '/admin/:path*',
    '/assessments',
    '/assessments/:path*',
    '/commercial-intelligence',
    '/compliance',
    '/compliance/:path*',
    '/dashboard',
    '/dashboard/:path*',
    '/education',
    '/education/:path*',
    '/intake',
    '/intake/:path*',
    '/intelligence',
    '/intelligence/:path*',
    '/marketplace/intake',
    '/marketplace/intake/:path*',
    '/marketplace/my-listings',
    '/marketplace/my-listings/:path*',
    '/marketplace/sell',
    '/marketplace/sell/:path*',
    '/marketplace/submit-listing',
    '/marketplace/wanted-requests',
    '/network',
    '/network/:path*',
    '/opportunities',
    '/opportunities/:path*',
    '/professionals',
    '/professionals/:path*',
    '/reviewed-connections',
    '/reviewed-connections/:path*',
    '/signals',
    '/signals/:path*',
    '/vault',
    '/vault/:path*',
  ],
}
