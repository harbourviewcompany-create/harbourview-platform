import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateAdminRequest } from '@/lib/marketplace/auth'
import { disclosureRequestSchema } from '@/lib/marketplace/validation'
import { writeAuditEvent } from '@/lib/marketplace/audit'
import type { DisclosureRequestInsert } from '@/lib/supabase/types'

export async function GET(req: NextRequest) {
  const authError = validateAdminRequest(req)
  if (authError) return authError

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? 'requested'
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200)
  const offset = parseInt(searchParams.get('offset') ?? '0')

  try {
    const db = createAdminClient()
    const { data, error, count } = await db
      .from('disclosure_requests')
      .select('*', { count: 'exact' })
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
    return NextResponse.json({ disclosures: data ?? [], total: count ?? 0 })
  } catch (err) {
    console.error('[Admin Disclosures GET]', err)
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

  const parsed = disclosureRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.flatten() }, { status: 422 })
  }

  const insert: DisclosureRequestInsert = {
    match_id: parsed.data.match_id,
    requested_by: parsed.data.requested_by,
    status: 'requested',
    responded_at: null,
    notes: parsed.data.notes || null,
  }

  try {
    const db = createAdminClient()
    const { data: row, error } = await db.from('disclosure_requests').insert(insert).select('id').single()
    if (error || !row) return NextResponse.json({ error: 'Insert failed' }, { status: 500 })

    await writeAuditEvent({
      db, entityType: 'disclosure_request', entityId: row.id,
      action: 'disclosure_request.created',
      actor: parsed.data.requested_by,
      metadata: { match_id: parsed.data.match_id },
    })

    return NextResponse.json({ ok: true, id: row.id }, { status: 201 })
  } catch (err) {
    console.error('[Admin Disclosures POST]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
