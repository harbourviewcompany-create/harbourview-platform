import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateAdminRequest } from '@/lib/marketplace/auth'

export async function GET(req: NextRequest) {
  const authError = validateAdminRequest(req)
  if (authError) return authError

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? 'new'
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200)
  const offset = parseInt(searchParams.get('offset') ?? '0')

  try {
    const db = createAdminClient()
    const { data, error, count } = await db
      .from('marketplace_inquiries')
      .select('*', { count: 'exact' })
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
    return NextResponse.json({ inquiries: data ?? [], total: count ?? 0 })
  } catch (err) {
    console.error('[Admin Inquiries GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const authError = validateAdminRequest(req)
  if (authError) return authError

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Bad body' }, { status: 400 }) }

  const { id, status } = body as { id: string; status: string }
  if (!id || !['reviewed', 'actioned'].includes(status)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 422 })
  }

  try {
    const db = createAdminClient()
    const { error } = await db.from('marketplace_inquiries').update({ status }).eq('id', id)
    if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[Admin Inquiries PATCH]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
