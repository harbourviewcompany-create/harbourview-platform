import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const CACHE_BYPASS_VALUE =
  'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0'

function applyNoStoreHeaders(response: NextResponse) {
  response.headers.set('Cache-Control', CACHE_BYPASS_VALUE)
  response.headers.set('CDN-Cache-Control', 'no-store')
  response.headers.set('Vercel-CDN-Cache-Control', 'no-store')
  response.headers.set('Surrogate-Control', 'no-store')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  response.headers.set('X-Harbourview-Runtime-Cache-Bypass', 'pr75-pr76-production-route-cleanup-2026-05-06')
  return response
}

// Routes that require authentication
const PROTECTED_PREFIXES = ['/dashboard', '/account', '/vault']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Normalize trailing slash
  const normalizedPathname =
    pathname !== '/' && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname

  // Legacy redirects
  const legacyRedirects: Record<string, string> = {
    '/marketplace/submit-listing': '/marketplace/sell',
    '/marketplace/wanted-requests': '/marketplace/wanted',
    '/commercial-intelligence': '/intelligence',
  }
  const redirectTo = legacyRedirects[normalizedPathname]
  if (redirectTo) {
    const url = request.nextUrl.clone()
    url.pathname = redirectTo
    url.search = ''
    return applyNoStoreHeaders(NextResponse.redirect(url, 308))
  }

  // Auth guard for protected routes
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    normalizedPathname === prefix || normalizedPathname.startsWith(prefix + '/')
  )

  if (isProtected) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseAnonKey) {
      let response = NextResponse.next({ request })

      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
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

      return applyNoStoreHeaders(response)
    }
  }

  return applyNoStoreHeaders(NextResponse.next())
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/account/:path*',
    '/vault/:path*',
    '/marketplace/:path*',
    '/signals/:path*',
    '/intelligence/:path*',
    '/intake/:path*',
    '/contact/:path*',
    '/network/:path*',
    '/education/:path*',
    '/compliance/:path*',
    '/admin/:path*',
    '/commercial-intelligence',
  ],
}
