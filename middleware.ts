import { NextRequest, NextResponse } from 'next/server'

import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/marketplace/auth'

const ADMIN_SECRET = process.env.ADMIN_SECRET
const ADMIN_LOGIN_PATH = '/admin/login'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (!pathname.startsWith('/admin') || pathname === ADMIN_LOGIN_PATH) {
    return NextResponse.next()
  }

  if (!ADMIN_SECRET) {
    return new NextResponse('Admin access is not configured.', { status: 503 })
  }

  const session = req.cookies.get(ADMIN_SESSION_COOKIE)
  if (session?.value && await verifyAdminSessionToken(session.value)) {
    return NextResponse.next()
  }

  const loginUrl = req.nextUrl.clone()
  loginUrl.pathname = ADMIN_LOGIN_PATH
  loginUrl.searchParams.set('from', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/admin/:path*'],
}
