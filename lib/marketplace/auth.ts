import { NextRequest, NextResponse } from 'next/server'

const ADMIN_SECRET = process.env.ADMIN_SECRET

/**
 * Validate admin access.
 * Checks Authorization: Bearer <ADMIN_SECRET> header.
 * Returns null if valid, NextResponse (401/503) if not.
 */
export function validateAdminRequest(req: NextRequest): NextResponse | null {
  if (!ADMIN_SECRET) {
    console.error('[Admin] ADMIN_SECRET is not configured')
    return NextResponse.json({ error: 'Admin access is not configured' }, { status: 503 })
  }

  const auth = req.headers.get('authorization')
  if (!auth || !auth.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = auth.slice(7)
  if (token !== ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null
}

/**
 * For admin page routes — check session cookie set by admin login flow.
 * Returns true if the request has a valid admin session.
 */
export function hasAdminCookie(req: NextRequest): boolean {
  const cookie = req.cookies.get('hv_admin_session')
  if (!ADMIN_SECRET || !cookie) return false
  return cookie.value === ADMIN_SECRET
}
