import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getSupabasePublicClientKey, getSupabaseUrl } from '@/lib/supabase/env'

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

// ── Subscription tier type ───────────────────────────────────────────────────
// Canonical tier names — matches user_profiles.tier CHECK constraint
// and app_metadata.subscription_tier written by the Stripe webhook.
// Previous names ('starter', 'professional', 'enterprise') are retired.
type SubscriptionTier = 'free' | 'intel' | 'operator'

const TIER_ORDER: SubscriptionTier[] = ['free', 'intel', 'operator']

// Routes that require a minimum subscription tier beyond free.
const TIER_GATED_PREFIXES: Record<string, SubscriptionTier> = {
  '/signals':       'intel',
  '/intelligence':  'intel',
  '/genetics':      'operator',
  '/network':       'intel',
  '/vault':         'intel',
  '/opportunities': 'intel',
}

function tierMeetsMinimum(
  actual: SubscriptionTier | string | undefined,
  required: SubscriptionTier,
): boolean {
  if (!actual) return false
  // Normalise any legacy tier names that may still be in existing JWTs
  const normalised = normaliseTier(actual)
  return TIER_ORDER.indexOf(normalised) >= TIER_ORDER.indexOf(required)
}

// Map legacy Stripe tier names → current names so old JWTs still work
// during the transition period (tokens expire within 1h).
function normaliseTier(raw: string): SubscriptionTier {
  switch (raw) {
    case 'intel':        return 'intel'
    case 'operator':     return 'operator'
    case 'professional': return 'operator'   // legacy
    case 'enterprise':   return 'operator'   // legacy
    case 'starter':      return 'intel'      // legacy
    default:             return 'free'
  }
}

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

  const normalizedPathname =
    pathname !== '/' && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname

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

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => normalizedPathname === prefix || normalizedPathname.startsWith(prefix + '/'),
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
            response.cookies.set(name, value, options),
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

    // ── Subscription tier gate ───────────────────────────────────────────────
    // Reads subscription_tier from JWT app_metadata — set by Stripe webhook via
    // supabase.auth.admin.updateUserById(). Zero DB round-trip.
    // Falls back to 'free' if not present (new signups before first purchase).
    const rawTier = user.app_metadata?.subscription_tier as string | undefined
    const tier    = normaliseTier(rawTier ?? 'free')

    const matchedTierPrefix = Object.keys(TIER_GATED_PREFIXES).find(
      (prefix) => normalizedPathname === prefix || normalizedPathname.startsWith(prefix + '/'),
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

    return applyNoStoreHeaders(response)
  }

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
    '/signals',
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
    '/marketplace/submit-listing',
    '/marketplace/wanted-requests',
    '/commercial-intelligence',
  ],
}
