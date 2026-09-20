import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${new URL(request.url).origin}/auth/callback?next=${encodeURIComponent(next)}`,
        data: { signup_source: 'harbourview_web' },
      },
    })

    if (error) {
      console.error('[auth/signup] signUp failed', {
        name: error.name,
        code: error.code,
        status: error.status,
        message: error.message,
      })

      const authError = error.message.toLowerCase()
      let message = 'We could not create the account. Please try again.'
      let status = 400

      if (authError.includes('email address not authorized') || authError.includes('email_address_not_authorized')) {
        message = 'Email confirmation is not configured for public signups yet. Please try again later.'
        status = 503
      } else if (authError.includes('rate limit') || authError.includes('over_email_send_rate_limit')) {
        message = 'Email confirmation is temporarily rate-limited. Please wait a moment and try again.'
        status = 429
      } else if (authError.includes('already registered') || authError.includes('already exists')) {
        message = 'An account already exists for this email. Try signing in instead.'
      } else if (authError.includes('password')) {
        message = 'That password does not meet the account security requirements.'
      } else if (authError.includes('invalid email') || authError.includes('email_address_invalid')) {
        message = 'Enter a valid email address.'
      }

      return NextResponse.json({ error: message }, { status })
    }

    return NextResponse.json({ ok: true, needsConfirmation: !data.session, next })
  } catch (error) {
    console.error('[auth/signup] unexpected error', {
      name: error instanceof Error ? error.name : 'unknown',
      message: error instanceof Error ? error.message : 'unknown',
    })
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
