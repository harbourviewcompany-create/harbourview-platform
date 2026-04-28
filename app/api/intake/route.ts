import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { intakeSchema } from '@/lib/validation'
import { buildIntakeEmailHtml } from '@/lib/email'

const FROM_EMAIL = process.env.HARBOURVIEW_FROM_EMAIL || 'intake@harbourview.io'
const MIN_SUBMIT_SECONDS = 3

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    console.error('[Intake API] RESEND_API_KEY is not configured')
    return NextResponse.json(
      { error: 'Email service is not configured.' },
      { status: 503 }
    )
  }

  if (!process.env.HARBOURVIEW_TO_EMAIL) {
    console.error('[Intake API] HARBOURVIEW_TO_EMAIL is not configured')
    return NextResponse.json(
      { error: 'Email service is not configured.' },
      { status: 503 }
    )
  }

  const TO_EMAILS = process.env.HARBOURVIEW_TO_EMAIL.split(',').map((e) => e.trim()).filter(Boolean)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Server-side validation
  const parsed = intakeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const data = parsed.data

  // Honeypot check
  if (data._hp && data._hp.length > 0) {
    return NextResponse.json({ ok: true }) // Silently accept spam
  }

  // Timestamp check
  if (data._ts) {
    const elapsed = (Date.now() - data._ts) / 1000
    if (elapsed < MIN_SUBMIT_SECONDS) {
      return NextResponse.json({ error: 'Submission rejected' }, { status: 400 })
    }
  }

  const userAgent = req.headers.get('user-agent') || undefined
  const referer = req.headers.get('referer') || '/intake'

  const { subject, html, text } = buildIntakeEmailHtml(data, {
    sourceUrl: referer,
    userAgent,
  })

  const resend = new Resend(process.env.RESEND_API_KEY)

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAILS,
      subject,
      html,
      text,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[Intake API] Resend error:', err)
    return NextResponse.json(
      { error: 'Failed to send email. Please try again.' },
      { status: 500 }
    )
  }
}
