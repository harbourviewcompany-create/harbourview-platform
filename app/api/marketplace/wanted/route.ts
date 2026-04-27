import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin'
import { buyerRequestSubmitSchema } from '@/lib/marketplace/validation'
import { redactBuyerRequest, assertNoPrivateFields, BUYER_REQUEST_PRIVATE_FIELDS } from '@/lib/marketplace/redact'
import { writeAuditEvent } from '@/lib/marketplace/audit'
import { getClientIp, checkRateLimit } from '@/lib/marketplace/ratelimit'
import type { BuyerRequestInsert } from '@/lib/supabase/types'

const MIN_SUBMIT_SECONDS = 3

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100)
  const offset = parseInt(searchParams.get('offset') ?? '0')
  const region = searchParams.get('region')

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ requests: [], total: 0, configured: false })
  }

  try {
    const db = createAdminClient()
    let query = db
      .from('buyer_requests')
      .select('*', { count: 'exact' })
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (region) query = query.eq('region_interest', region)

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch wanted requests' }, { status: 500 })
    }

    const redacted = (data ?? []).map(redactBuyerRequest)

    if (process.env.NODE_ENV !== 'production') {
      redacted.forEach((r) =>
        assertNoPrivateFields(r as Record<string, unknown>, BUYER_REQUEST_PRIVATE_FIELDS)
      )
    }

    return NextResponse.json({ requests: redacted, total: count ?? 0 })
  } catch (err) {
    console.error('[Wanted GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const rl = checkRateLimit(`wanted:${ip}`, 3)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many submissions. Please wait.' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = buyerRequestSubmitSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const data = parsed.data

  if (data._hp && data._hp.length > 0) return NextResponse.json({ ok: true })
  if (data._ts) {
    const elapsed = (Date.now() - data._ts) / 1000
    if (elapsed < MIN_SUBMIT_SECONDS) {
      return NextResponse.json({ error: 'Submission rejected' }, { status: 400 })
    }
  }

  if (!isSupabaseConfigured()) {
    console.warn('[Wanted POST] Supabase not configured — request not persisted')
    return NextResponse.json({ ok: true, id: null, fallback: true })
  }

  const insert: BuyerRequestInsert = {
    status: 'pending_review',
    product_type: data.product_type,
    region_interest: data.region_interest as string,
    quantity_range: data.quantity_range || null,
    specs_requirements: data.specs_requirements || null,
    buyer_type: data.buyer_type as string,
    legal_entity_name: data.legal_entity_name,
    contact_name: data.contact_name,
    contact_email: data.contact_email,
    contact_phone: data.contact_phone || null,
    private_notes: data.private_notes || null,
    archived_at: null,
  }

  try {
    const db = createAdminClient()
    const { data: row, error } = await db.from('buyer_requests').insert(insert).select('id').single()

    if (error || !row) {
      console.error('[Wanted POST] insert error:', error)
      return NextResponse.json({ error: 'Failed to save request' }, { status: 500 })
    }

    await writeAuditEvent({
      db,
      entityType: 'buyer_request',
      entityId: row.id,
      action: 'buyer_request.submitted',
      actor: data.contact_email,
      metadata: { buyer_type: data.buyer_type, region_interest: data.region_interest },
      ipAddress: ip,
    })

    return NextResponse.json({ ok: true, id: row.id }, { status: 201 })
  } catch (err) {
    console.error('[Wanted POST]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
