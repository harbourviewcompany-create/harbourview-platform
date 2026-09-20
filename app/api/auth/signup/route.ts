import { NextResponse } from 'next/server'
import { createClient, createSupabaseServiceClient } from '@/lib/supabase/server'
import { enforceRateLimit, getClientIp } from '@/lib/network/rateLimit'

function safeNext(value: unknown) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return '/dashboard'
  return value
}

function looksLikeEmailDeliveryFailure(message: string) {
  const lower = message.toLowerCase()
  return (
    lower.includes('error sending confirmation email') ||
    lower.includes('error sending email') ||
    lower.includes('smtp') ||
    lower.includes('gomail') ||
    lower.includes('email provider') ||
    lower.includes('mailer')
  )
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body?.password === 'string' ? body.password : ''
    const next = safeNext(body?.next)
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
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
    const redirectTo = `${new URL(request.url).origin}/auth/callback?next=${encodeURIComponent(next)}`
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
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

      // If Supabase Auth itself cannot hand the confirmation message to SMTP,
      // do not let a broken mail transport make public signup unavailable.
      // Create the user as already confirmed and establish the session directly.
      // This is intentionally server-only; the service-role key never reaches the browser.
      if (looksLikeEmailDeliveryFailure(error.message)) {
        try {
          const admin = await createSupabaseServiceClient()
          const { data: created, error: createError } = await admin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { signup_source: 'harbourview_web', email_delivery_fallback: true },
          })

          if (!createError && created.user) {
            const { data: signedIn, error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password,
            })
            if (!signInError && signedIn.session) {
              console.warn('[auth/signup] SMTP fallback used; account auto-confirmed', {
                userId: created.user.id,
              })
              return NextResponse.json({ ok: true, needsConfirmation: false, emailDeliveryFallback: true, next }, { headers: { 'Cache-Control': 'no-store' } })
            }
            console.error('[auth/signup] SMTP fallback created user but session sign-in failed', {
              name: signInError?.name,
              code: signInError?.code,
              status: signInError?.status,
              message: signInError?.message,
            })
          } else if (createError && !createError.message.toLowerCase().includes('already registered')) {
            console.error('[auth/signup] SMTP fallback createUser failed', {
              name: createError.name,
              code: createError.code,
              status: createError.status,
              message: createError.message,
            })
          }
        } catch (fallbackError) {
          console.error('[auth/signup] SMTP fallback unavailable', {
            name: fallbackError instanceof Error ? fallbackError.name : 'unknown',
            message: fallbackError instanceof Error ? fallbackError.message : 'unknown',
          })
        }
      }

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

    return NextResponse.json({ ok: true, needsConfirmation: !data.session, emailDeliveryFallback: false, next }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[auth/signup] unexpected error', {
      name: error instanceof Error ? error.name : 'unknown',
      message: error instanceof Error ? error.message : 'unknown',
    })
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
