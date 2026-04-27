import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateAdminRequest } from '@/lib/marketplace/auth'

export async function GET(req: NextRequest) {
  const authError = validateAdminRequest(req)
  if (authError) return authError

  const { searchParams } = new URL(req.url)
  const entityType = searchParams.get('entity_type')
  const entityId = searchParams.get('entity_id')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 500)
  const offset = parseInt(searchParams.get('offset') ?? '0')

  try {
    const db = createAdminClient()
    let query = db
      .from('audit_events')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (entityType) query = query.eq('entity_type', entityType)
    if (entityId) query = query.eq('entity_id', entityId)

    const { data, error, count } = await query
    if (error) return NextResponse.json({ error: 'Failed to fetch audit events' }, { status: 500 })
    return NextResponse.json({ events: data ?? [], total: count ?? 0 })
  } catch (err) {
    console.error('[Admin Audit GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
