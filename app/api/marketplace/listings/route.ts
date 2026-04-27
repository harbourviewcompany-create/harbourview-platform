import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin'
import { listingSubmitSchema } from '@/lib/marketplace/validation'
import { redactListing, assertNoPrivateFields, LISTING_PRIVATE_FIELDS } from '@/lib/marketplace/redact'
import { writeAuditEvent } from '@/lib/marketplace/audit'
import { getClientIp, checkRateLimit } from '@/lib/marketplace/ratelimit'
import type { ListingInsert } from '@/lib/supabase/types'

const MIN_SUBMIT_SECONDS = 3

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const region = searchParams.get('region')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100)
  const offset = parseInt(searchParams.get('offset') ?? '0')

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ listings: [], total: 0, configured: false })
  }

  try {
    const db = createAdminClient()
    let query = db
      .from('listings')
      .select('*', { count: 'exact' })
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (category) query = query.eq('category', category)
    if (region) query = query.eq('region', region)

    const { data, error, count } = await query

    if (error) {
      console.error('[Listings GET]', error)
      return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 })
    }

    const redacted = (data ?? []).map(redactListing)

    // Runtime guard — assert redaction worked
    if (process.env.NODE_ENV !== 'production') {
      redacted.forEach((r) =>
        assertNoPrivateFields(r as Record<string, unknown>, LISTING_PRIVATE_FIELDS)
      )
    }

    return NextResponse.json({ listings: redacted, total: count ?? 0 })
  } catch (err) {
    console.error('[Listings GET] unexpected error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  // Rate limit: 3 submissions per IP per minute
  const ip = getClientIp(req)
  const rl = checkRateLimit(`listing:${ip}`, 3)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many submissions. Please wait.' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = listingSubmitSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const data = parsed.data

  // Honeypot
  if (data._hp && data._hp.length > 0) {
    return NextResponse.json({ ok: true })
  }

  // Timestamp
  if (data._ts) {
    const elapsed = (Date.now() - data._ts) / 1000
    if (elapsed < MIN_SUBMIT_SECONDS) {
      return NextResponse.json({ error: 'Submission rejected' }, { status: 400 })
    }
  }

  if (!isSupabaseConfigured()) {
    // Graceful fallback — log and return ok (will be handled by email fallback)
    console.warn('[Listings POST] Supabase not configured — listing not persisted')
    return NextResponse.json({ ok: true, id: null, fallback: true })
  }

  const insert: ListingInsert = {
    status: 'pending_review',
    category: data.category as ListingInsert['category'],
    product_type: data.product_type,
    region: data.region as string,
    price_range: (data.price_range as string | undefined) ?? null,
    specs_summary: data.specs_summary || null,
    seller_type: data.seller_type as string,
    legal_entity_name: data.legal_entity_name,
    contact_name: data.contact_name,
    contact_email: data.contact_email,
    contact_phone: data.contact_phone || null,
    private_notes: data.private_notes || null,
    internal_score: null,
    archived_at: null,
    superseded_by: null,
  }

  try {
    const db = createAdminClient()
    const { data: row, error } = await db.from('listings').insert(insert).select('id').single()

    if (error || !row) {
      console.error('[Listings POST] insert error:', error)
      return NextResponse.json({ error: 'Failed to save listing' }, { status: 500 })
    }

    await writeAuditEvent({
      db,
      entityType: 'listing',
      entityId: row.id,
      action: 'listing.submitted',
      actor: data.contact_email,
      metadata: { category: data.category, seller_type: data.seller_type, region: data.region },
      ipAddress: ip,
    })

    return NextResponse.json({ ok: true, id: row.id }, { status: 201 })
  } catch (err) {
    console.error('[Listings POST] unexpected error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
