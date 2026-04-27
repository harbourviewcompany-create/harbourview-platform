import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateAdminRequest } from '@/lib/marketplace/auth'
import { matchCreateSchema } from '@/lib/marketplace/validation'
import { writeAuditEvent } from '@/lib/marketplace/audit'
import type { MatchInsert } from '@/lib/supabase/types'

export async function GET(req: NextRequest) {
  const authError = validateAdminRequest(req)
  if (authError) return authError

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200)
  const offset = parseInt(searchParams.get('offset') ?? '0')

  try {
    const db = createAdminClient()
    let query = db
      .from('matches')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) query = query.eq('status', status)

    const { data, error, count } = await query
    if (error) return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 })
    return NextResponse.json({ matches: data ?? [], total: count ?? 0 })
  } catch (err) {
    console.error('[Admin Matches GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const authError = validateAdminRequest(req)
  if (authError) return authError

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = matchCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.flatten() }, { status: 422 })
  }

  const { listing_id, buyer_request_id, match_notes } = parsed.data
  if (!listing_id && !buyer_request_id) {
    return NextResponse.json(
      { error: 'Match requires listing_id or buyer_request_id' },
      { status: 422 }
    )
  }

  const insert: MatchInsert = {
    listing_id: listing_id ?? null,
    buyer_request_id: buyer_request_id ?? null,
    status: 'proposed',
    match_notes: match_notes || null,
    introduced_at: null,
    closed_at: null,
    closed_outcome: null,
  }

  try {
    const db = createAdminClient()
    const { data: row, error } = await db.from('matches').insert(insert).select('id').single()
    if (error || !row) return NextResponse.json({ error: 'Insert failed' }, { status: 500 })

    const actor = req.headers.get('x-admin-actor') ?? 'admin'
    await writeAuditEvent({
      db, entityType: 'match', entityId: row.id, action: 'match.created', actor,
      metadata: { listing_id, buyer_request_id },
    })

    return NextResponse.json({ ok: true, id: row.id }, { status: 201 })
  } catch (err) {
    console.error('[Admin Matches POST]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
