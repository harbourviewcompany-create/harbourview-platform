import { NextRequest, NextResponse } from 'next/server'
import { createAdminSessionToken, getAdminSessionMaxAge, isAllowedOrigin } from '@/lib/marketplace/adminSession'

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const { secret } = body as { secret?: string }
  const ADMIN_SECRET = process.env.ADMIN_SECRET

  if (!ADMIN_SECRET) {
    return NextResponse.json({ error: 'Admin not configured' }, { status: 503 })
  }

  if (!isAllowedOrigin(req.headers.get('origin'), process.env.NEXT_PUBLIC_SITE_URL)) {
    return NextResponse.json({ error: 'Forbidden origin' }, { status: 403 })
  }

  if (!secret || secret !== ADMIN_SECRET) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set('hv_admin_session', createAdminSessionToken(ADMIN_SECRET), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: getAdminSessionMaxAge(),
    path: '/',
  })
  return res
}

export async function DELETE(req: NextRequest) {
  if (!isAllowedOrigin(req.headers.get('origin'), process.env.NEXT_PUBLIC_SITE_URL)) {
    return NextResponse.json({ error: 'Forbidden origin' }, { status: 403 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.delete('hv_admin_session')
  return res
}
