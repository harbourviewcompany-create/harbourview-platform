import { NextRequest, NextResponse } from 'next/server'

import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_TTL_SECONDS, createAdminSessionToken } from '@/lib/marketplace/auth'

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

  if (!secret || secret !== ADMIN_SECRET) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const sessionToken = await createAdminSessionToken()
  if (!sessionToken) {
    return NextResponse.json({ error: 'Admin not configured' }, { status: 503 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: ADMIN_SESSION_TTL_SECONDS,
    path: '/',
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(ADMIN_SESSION_COOKIE)
  return res
}
