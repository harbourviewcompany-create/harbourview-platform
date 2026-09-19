import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { enforceRateLimit, getClientIp } from '@/lib/network/rateLimit'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://harbourview.vercel.app'
const FROM_EMAIL = process.env.HARBOURVIEW_FROM_EMAIL?.trim() || 'signals@harbourview.co'

function safeNext(value: unknown) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return '/dashboard'
  return value
}

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function buildConfirmationEmail(email: string, confirmationUrl: string) {
  const safeEmail = escapeHtml(email)
  return `<!doctype html>
<html>
  <body style="margin:0;background:#07111F;color:#F5F1E8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
    <div style="max-width:560px;margin:0 auto;padding:40px 24px">
      <div style="font-size:18px;letter-spacing:.28em;color:#C6A55A;font-weight:700">HARBOURVIEW</div>
      <div style="margin-top:32px;padding:32px;border:1px solid rgba(255,255,255,.1);border-radius:18px;background:#0B1A2F">
        <h1 style="margin:0 0 12px;font-size:24px;color:#F5F1E8">Confirm your email</h1>
        <p style="margin:0 0 24px;color:rgba(245,241,232,.68);line-height:1.7">
          Confirm <strong style="color:#F5F1E8">${safeEmail}</strong> to activate your Harbourview account.
        </p>
        <a href="${confirmationUrl}" style="display:inline-block;padding:13px 22px;border-radius:12px;background:#C6A55A;color:#07111F;text-decoration:none;font-weight:700">
          Confirm email
        </a>
        <p style="margin:24px 0 0;color:rgba(245,241,232,.42);font-size:12px;line-height:1.6">
          This link can only be used once. If you did not create this account, you can ignore this email.
        </p>
      </div>
      <p style="margin:18px 0 0;color:rgba(245,241,232,.3);font-size:11px">Harbourview Platform</p>
    </div>
  </body>
</html>`
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

    const apiKey = process.env.RESEND_API_KEY?.trim()
    if (!apiKey) {
      console.error('[auth/signup] RESEND_API_KEY is not configured')
      return NextResponse.json({ error: 'Signup email service is temporarily unavailable.' }, { status: 503 })
    }

    const supabase = await createSupabaseServiceClient()
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
      options: {
        redirectTo: `${SITE_URL}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })

    if (error || !data?.properties?.hashed_token) {
      console.error('[auth/signup] generateLink failed', { message: error?.message })
      const message = error?.message?.toLowerCase() ?? ''
      if (message.includes('already registered') || message.includes('already exists')) {
        return NextResponse.json(
          { error: 'An account already exists for this email. Sign in instead or use Forgot password.' },
          { status: 409 },
        )
      }
      return NextResponse.json({ error: 'We could not create the account. Please try again.' }, { status: 500 })
    }

    const confirmationUrl =
      `${SITE_URL}/auth/callback?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=email&next=${encodeURIComponent(next)}`

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject: 'Confirm your Harbourview account',
        html: buildConfirmationEmail(email, confirmationUrl),
      }),
    })

    if (!response.ok) {
      const providerError = await response.text().catch(() => '')
      console.error('[auth/signup] Resend failed', {
        status: response.status,
        body: providerError.slice(0, 300),
      })
      return NextResponse.json({ error: 'Account created, but the confirmation email could not be sent. Please try again.' }, { status: 502 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[auth/signup] unexpected error', {
      name: error instanceof Error ? error.name : 'unknown',
      message: error instanceof Error ? error.message : 'unknown',
    })
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
