import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateAdminRequest } from '@/lib/marketplace/auth'
import { adminNoteSchema } from '@/lib/marketplace/validation'
import type { InternalAdminNoteInsert } from '@/lib/supabase/types'

export async function GET(req: NextRequest) {
  const authError = validateAdminRequest(req)
  if (authError) return authError

  const { searchParams } = new URL(req.url)
  const entityType = searchParams.get('entity_type')
  const entityId = searchParams.get('entity_id')

  if (!entityType || !entityId) {
    return NextResponse.json({ error: 'entity_type and entity_id are required' }, { status: 400 })
  }

  try {
    const db = createAdminClient()
    const { data, error } = await db
      .from('internal_admin_notes')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
    return NextResponse.json({ notes: data ?? [] })
  } catch (err) {
    console.error('[Admin Notes GET]', err)
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

  const parsed = adminNoteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.flatten() }, { status: 422 })
  }

  const insert: InternalAdminNoteInsert = {
    entity_type: parsed.data.entity_type,
    entity_id: parsed.data.entity_id,
    note: parsed.data.note,
    created_by: parsed.data.created_by,
  }

  try {
    const db = createAdminClient()
    const { data: row, error } = await db.from('internal_admin_notes').insert(insert).select('id').single()
    if (error || !row) return NextResponse.json({ error: 'Insert failed' }, { status: 500 })
    return NextResponse.json({ ok: true, id: row.id }, { status: 201 })
  } catch (err) {
    console.error('[Admin Notes POST]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
