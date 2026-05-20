import { NextRequest, NextResponse } from 'next/server'

const CSRF_COOKIE = 'hv_admin_csrf'
const CSRF_HEADER = 'x-csrf-token'

function getAllowedOrigins(request: NextRequest) {
  const envOrigins = process.env.NEXT_PUBLIC_SITE_URL
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) ?? []

  const fallbackOrigin = request.nextUrl.origin

  return new Set([...envOrigins, fallbackOrigin])
}

function parseHeaderOrigin(value: string | null) {
  if (!value) return null

  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

function hasValidRequestOrigin(request: NextRequest) {
  const allowedOrigins = getAllowedOrigins(request)
  const headerOrigin = parseHeaderOrigin(request.headers.get('origin'))
  const refererOrigin = parseHeaderOrigin(request.headers.get('referer'))

  const candidateOrigin = headerOrigin ?? refererOrigin
  if (!candidateOrigin) return false

  return allowedOrigins.has(candidateOrigin)
}

function hasValidCsrfToken(request: NextRequest) {
  const csrfCookie = request.cookies.get(CSRF_COOKIE)?.value
  const csrfHeader = request.headers.get(CSRF_HEADER)

  if (!csrfCookie || !csrfHeader) return false

  return csrfCookie === csrfHeader
}

function setCsrfCookie(response: NextResponse) {
  response.cookies.set(CSRF_COOKIE, crypto.randomUUID(), {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
    path: '/',
  })
}

export async function GET() {
  const res = NextResponse.json({
    ok: true,
    csrfHeader: CSRF_HEADER,
    csrfCookie: CSRF_COOKIE,
    requiredFor: ['POST', 'DELETE'],
  })
  setCsrfCookie(res)
  return res
}

export async function POST(req: NextRequest) {
  if (!hasValidRequestOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden: invalid origin' }, { status: 403 })
  }

  if (!hasValidCsrfToken(req)) {
    return NextResponse.json({ error: 'Forbidden: invalid CSRF token' }, { status: 403 })
  }

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

  const res = NextResponse.json({ ok: true })
  res.cookies.set('hv_admin_session', ADMIN_SECRET, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 hours
    path: '/',
  })
  return res
}

export async function DELETE(req: NextRequest) {
  if (!hasValidRequestOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden: invalid origin' }, { status: 403 })
  }

  if (!hasValidCsrfToken(req)) {
    return NextResponse.json({ error: 'Forbidden: invalid CSRF token' }, { status: 403 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.delete('hv_admin_session')
  res.cookies.delete(CSRF_COOKIE)
  return res
}
