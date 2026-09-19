import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { enforceRateLimit, getClientIp } from '@/lib/network/rateLimit'

function safeNext(value: unknown) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return '/dashboard'
  return value
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body?.password === 'string' ? body.password : ''
    const next = safeNext(body?.next)

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }

    const rate = await enforceRateLimit({
      route: 'auth-signup-email',
      ip: getClientIp(request),
      identity: email,
      limit: 5,
      windowMs: 60 * 60 * 1000,
    })
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Too many signup attempts. Please wait before trying again.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } },
      )
    }

    const supabase = await createSupabaseServiceClient()
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { signup_source: 'harbourview_web' },
    })

    if (error || !data.user) {
      console.error('[auth/signup] createUser failed', { message: error?.message })
      const message = error?.message?.toLowerCase() ?? ''
      if (
        message.includes('already registered') ||
        message.includes('already exists') ||
        message.includes('already been registered')
      ) {
        return NextResponse.json(
          { error: 'An account already exists for this email. Sign in instead or use Forgot password.' },
          { status: 409 },
        )
      }
      return NextResponse.json({ error: 'We could not create the account. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, next })
  } catch (error) {
    console.error('[auth/signup] unexpected error', {
      name: error instanceof Error ? error.name : 'unknown',
      message: error instanceof Error ? error.message : 'unknown',
    })
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
