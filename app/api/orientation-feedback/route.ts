import { NextRequest, NextResponse } from 'next/server'
import { postMarketplaceInquiry } from '@/lib/marketplace/inquirySubmission'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const SURFACES = new Set([
  'corridor_plan',
  'corridor_coverage',
  'landed_cost',
  'logistics_simulator',
  'briefing',
  'other',
])
const VERDICTS = new Set(['helpful', 'incomplete', 'wrong'])

/**
 * Anonymous-capable orientation feedback.
 * Uses marketplace_inquiries with inquiry_type=general (widely accepted by capture policies).
 * Surface + verdict are encoded in the message body for admin triage.
 */
export async function POST(req: NextRequest) {
  let body: { surface?: unknown; verdict?: unknown; context?: unknown; email?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const surface = typeof body.surface === 'string' ? body.surface.trim() : ''
  const verdict = typeof body.verdict === 'string' ? body.verdict.trim() : ''
  const context =
    typeof body.context === 'string' ? body.context.trim().slice(0, 300) : null
  const email =
    typeof body.email === 'string' && body.email.includes('@') && body.email.includes('.')
      ? body.email.trim().toLowerCase().slice(0, 200)
      : 'feedback@harbourview.co'

  if (!SURFACES.has(surface) || !VERDICTS.has(verdict)) {
    return NextResponse.json({ error: 'Invalid surface or verdict' }, { status: 400 })
  }

  const result = await postMarketplaceInquiry({
    listing_id: null,
    buyer_request_id: null,
    contact_name: 'Orientation feedback',
    contact_email: email,
    contact_company: 'Harbourview orientation',
    contact_phone: null,
    // Use general — some environments constrain inquiry_type values; message carries taxonomy.
    inquiry_type: 'general',
    message: [
      '--- Orientation feedback ---',
      `Surface: ${surface}`,
      `Verdict: ${verdict}`,
      context ? `Context: ${context}` : null,
    ]
      .filter(Boolean)
      .join('\n'),
    status: 'received',
  })

  if (!result.ok) {
    return NextResponse.json({ error: 'Unable to record feedback' }, { status: 503 })
  }

  return NextResponse.json({ ok: true })
}
