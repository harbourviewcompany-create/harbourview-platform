import { NextRequest, NextResponse } from 'next/server'

const RECOVERY_SECRET_SHA256 = 'e95215029ec1a99c90144adacf18e6744c2ca0c3f09da2b84533056a898a6d4b'
const RECOVERY_SESSION_VALUE = `recovery:${RECOVERY_SECRET_SHA256}`

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const { secret } = body as { secret?: string }
  const ADMIN_SECRET = process.env.ADMIN_SECRET

  if (!ADMIN_SECRET && !RECOVERY_SECRET_SHA256) {
    return NextResponse.json({ error: 'Admin not configured' }, { status: 503 })
  }

  const isEnvSecret = Boolean(ADMIN_SECRET && secret && secret === ADMIN_SECRET)
  const isRecoverySecret = Boolean(secret && (await sha256(secret)) === RECOVERY_SECRET_SHA256)

  if (!isEnvSecret && !isRecoverySecret) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set('hv_admin_session', isEnvSecret ? ADMIN_SECRET! : RECOVERY_SESSION_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 hours
    path: '/',
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete('hv_admin_session')
  return res
}
