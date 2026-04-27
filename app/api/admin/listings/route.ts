import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateAdminRequest } from '@/lib/marketplace/auth'
import { listingStatusUpdateSchema } from '@/lib/marketplace/validation'
import { writeAuditEvent, writeStatusHistory } from '@/lib/marketplace/audit'

// GET /api/admin/listings — pending review queue
export async function GET(req: NextRequest) {
  const authError = validateAdminRequest(req)
  if (authError) return authError

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? 'pending_review'
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200)
  const offset = parseInt(searchParams.get('offset') ?? '0')

  try {
    const db = createAdminClient()
    const { data, error, count } = await db
      .from('listings')
      .select('*', { count: 'exact' })
      .eq('status', status)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('[Admin Listings GET]', error)
      return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 })
    }

    return NextResponse.json({ listings: data ?? [], total: count ?? 0 })
  } catch (err) {
    console.error('[Admin Listings GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
