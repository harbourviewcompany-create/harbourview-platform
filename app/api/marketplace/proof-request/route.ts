import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { enforceRateLimit, getClientIp } from '@/lib/network/rateLimit'

const ROUTE_ID = '/api/marketplace/proof-request'

/**
 * POST /api/marketplace/proof-request
 * Creates a marketplace inquiry record for a proof or COA request.
 * Safe for unauthenticated callers — listing_id may be null.
 * No private intelligence, pricing, or counterparty fields are written.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const ipLimit = await enforceRateLimit({ route: ROUTE_ID, ip, limit: 20, windowMs: 60_000 })
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again shortly.' },
        { status: 429, headers: { 'Retry-After': String(ipLimit.retryAfterSeconds) } },
      )
    }

    const body = await request.json()
    const {
      listing_id,
      listing_title,
      request_type,   // 'proof' | 'coa'
      country_iso2,
      role_id,
      message,
    } = body

    if (!listing_title && !listing_id) {
      return NextResponse.json({ error: 'listing_title or listing_id required' }, { status: 400 })
    }
    if (!['proof', 'coa'].includes(request_type)) {
      return NextResponse.json({ error: 'request_type must be proof or coa' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('marketplace_inquiries')
      .insert({
        listing_id:       listing_id ?? null,
        inquiry_type:     request_type === 'coa' ? 'coa_request' : 'proof_request',
        message:          message
          ?? `${request_type === 'coa' ? 'COA' : 'Proof'} request for: ${listing_title ?? listing_id}. Country context: ${country_iso2 ?? 'unspecified'}. Operator role: ${role_id ?? 'unspecified'}.`,
        review_status:    'received',
        priority:         'medium',
        internal_notes:   `Auto-created via CommandCentre dashboard. country=${country_iso2} role=${role_id} type=${request_type}`,
      })
      .select('id, review_status, created_at')
      .single()

    if (error) {
      console.error('[proof-request] insert error:', error.message)
      return NextResponse.json({ error: 'Failed to create request' }, { status: 500 })
    }

    return NextResponse.json({ id: data.id, status: data.review_status, created_at: data.created_at })
  } catch (err) {
    console.error('[proof-request] unexpected error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
