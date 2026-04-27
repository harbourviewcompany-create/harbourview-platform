import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { inquirySubmitSchema } from '@/lib/marketplace/validation'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin'
import { writeAuditEvent } from '@/lib/marketplace/audit'
import { getClientIp, checkRateLimit } from '@/lib/marketplace/ratelimit'
import type { MarketplaceInquiryInsert } from '@/lib/supabase/types'

const MIN_SUBMIT_SECONDS = 3
const TO_EMAILS = (
  process.env.HARBOURVIEW_TO_EMAIL ||
  'harborviewcompany@gmail.com,tylercampbell5@outlook.com'
).split(',').map((e) => e.trim()).filter(Boolean)
const FROM_EMAIL = process.env.HARBOURVIEW_FROM_EMAIL || 'marketplace@harbourview.io'

export async function POST(req: NextRequest) {
  // Rate limit: 5 per IP per minute
  const ip = getClientIp(req)
  const rl = checkRateLimit(`inquiry:${ip}`, 5)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before submitting again.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = inquirySubmitSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const data = parsed.data

  // Honeypot + timestamp
  if (data._hp && data._hp.length > 0) return NextResponse.json({ ok: true })
  if (data._ts) {
    const elapsed = (Date.now() - data._ts) / 1000
    if (elapsed < MIN_SUBMIT_SECONDS) {
      return NextResponse.json({ error: 'Submission rejected' }, { status: 400 })
    }
  }

  const userAgent = req.headers.get('user-agent') || undefined

  // Persist to DB if configured
  let inquiryId: string | null = null
  if (isSupabaseConfigured()) {
    try {
      const db = createAdminClient()
      const insert: MarketplaceInquiryInsert = {
        listing_id: data.listing_id ?? null,
        buyer_request_id: data.buyer_request_id ?? null,
        inquirer_name: data.inquirer_name,
        inquirer_email: data.inquirer_email,
        inquirer_company: data.inquirer_company || null,
        inquirer_type: data.inquirer_type as string,
        message: data.message,
        status: 'new',
        ip_address: ip !== 'unknown' ? ip : null,
        user_agent: userAgent ?? null,
      }

      const { data: row, error } = await db
        .from('marketplace_inquiries')
        .insert(insert)
        .select('id')
        .single()

      if (!error && row) {
        inquiryId = row.id
        await writeAuditEvent({
          db,
          entityType: 'marketplace_inquiry',
          entityId: row.id,
          action: 'inquiry.submitted',
          actor: data.inquirer_email,
          metadata: {
            listing_id: data.listing_id,
            buyer_request_id: data.buyer_request_id,
            inquirer_type: data.inquirer_type as string,
          },
          ipAddress: ip,
        })
      }
    } catch (err) {
      console.error('[Inquiry POST] DB error:', err)
      // Continue — still send notification email
    }
  }

  // Email notification
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: FROM_EMAIL,
        to: TO_EMAILS,
        subject: `[HV Marketplace] New inquiry from ${data.inquirer_name} (${data.inquirer_company || data.inquirer_type})`,
        html: `
          <h2>New Marketplace Inquiry</h2>
          <p><strong>From:</strong> ${data.inquirer_name} &lt;${data.inquirer_email}&gt;</p>
          <p><strong>Company:</strong> ${data.inquirer_company || '—'}</p>
          <p><strong>Type:</strong> ${data.inquirer_type}</p>
          ${data.listing_id ? `<p><strong>Listing ID:</strong> ${data.listing_id}</p>` : ''}
          ${data.buyer_request_id ? `<p><strong>Buyer Request ID:</strong> ${data.buyer_request_id}</p>` : ''}
          ${inquiryId ? `<p><strong>Inquiry ID:</strong> ${inquiryId}</p>` : ''}
          <hr/>
          <p><strong>Message:</strong></p>
          <p>${data.message.replace(/\n/g, '<br/>')}</p>
        `,
        text: [
          'NEW MARKETPLACE INQUIRY',
          `From: ${data.inquirer_name} <${data.inquirer_email}>`,
          `Company: ${data.inquirer_company || '—'}`,
          `Type: ${data.inquirer_type}`,
          data.listing_id ? `Listing: ${data.listing_id}` : '',
          data.buyer_request_id ? `Buyer Request: ${data.buyer_request_id}` : '',
          '',
          data.message,
        ].filter(Boolean).join('\n'),
      })
    } catch (emailErr) {
      console.error('[Inquiry POST] Email error:', emailErr)
    }
  }

  return NextResponse.json({ ok: true, id: inquiryId }, { status: 201 })
}
