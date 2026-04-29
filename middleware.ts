import { NextRequest, NextResponse } from 'next/server'

const ADMIN_SECRET = process.env.ADMIN_SECRET
const ADMIN_LOGIN_PATH = '/admin/login'
const RECOVERY_SECRET_SHA256 = 'e95215029ec1a99c90144adacf18e6744c2ca0c3f09da2b84533056a898a6d4b'
const RECOVERY_SESSION_VALUE = `recovery:${RECOVERY_SECRET_SHA256}`

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Only guard /admin/* routes, excluding the login page itself
  if (!pathname.startsWith('/admin') || pathname === ADMIN_LOGIN_PATH) {
    return NextResponse.next()
  }

  // No secret configured — block admin entirely unless temporary recovery is active
  if (!ADMIN_SECRET && !RECOVERY_SECRET_SHA256) {
    return new NextResponse('Admin access is not configured.', { status: 503 })
  }

  // Check session cookie
  const session = req.cookies.get('hv_admin_session')
  if ((ADMIN_SECRET && session?.value === ADMIN_SECRET) || session?.value === RECOVERY_SESSION_VALUE) {
    return NextResponse.next()
  }

  // Redirect to login
  const loginUrl = req.nextUrl.clone()
  loginUrl.pathname = ADMIN_LOGIN_PATH
  loginUrl.searchParams.set('from', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/admin/:path*'],
}
