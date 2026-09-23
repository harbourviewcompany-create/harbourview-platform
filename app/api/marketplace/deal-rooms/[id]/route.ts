import { NextResponse } from 'next/server'
import { getAuthenticatedUser, createSupabaseServiceClient } from '@/lib/supabase/server'
import { canAccessDealRoom, dealRoomPartiesFromRow } from '@/lib/marketplace/orgScope'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Tenant-safe deal room fetch — party or workspace only.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  if (!id || id.length < 8) {
    return NextResponse.json({ error: 'Invalid room id' }, { status: 400 })
  }

  const svc = await createSupabaseServiceClient()
  const { data, error } = await svc
    .from('deal_rooms')
    .select('id, title, listing_ref, status, updated_at, initiator_id, counterparty_id, nda_required')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('[deal-rooms/id] query error', error)
    return NextResponse.json({ error: 'Failed to load deal room' }, { status: 500 })
  }
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const decision = canAccessDealRoom({
    userId: user.id,
    room: dealRoomPartiesFromRow(data),
  })
  if (!decision.allowed) {
    return NextResponse.json({ error: 'Forbidden', code: decision.reason }, { status: 403 })
  }

  return NextResponse.json({ room: data, access: decision.reason })
}
