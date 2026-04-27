import { NextRequest, NextResponse } from 'next/server'

const ADMIN_SECRET = process.env.ADMIN_SECRET
const ADMIN_LOGIN_PATH = '/admin/login'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Only guard /admin/* routes, excluding the login page itself
  if (!pathname.startsWith('/admin') || pathname === ADMIN_LOGIN_PATH) {
    return NextResponse.next()
  }

  // No secret configured — block admin entirely
  if (!ADMIN_SECRET) {
    return new NextResponse('Admin access is not configured.', { status: 503 })
  }

  // Check session cookie
  const session = req.cookies.get('hv_admin_session')
  if (session?.value === ADMIN_SECRET) {
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
