import { NextResponse } from 'next/server'
import { getAuthenticatedUser, createSupabaseServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Tenant-safe: only rooms where the caller is initiator or counterparty.
 * Defense-in-depth matches lib/marketplace/orgScope canAccessDealRoom.
 */
export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const svc = await createSupabaseServiceClient()
  const { data, error } = await svc
    .from('deal_rooms')
    .select('id, title, listing_ref, status, updated_at, initiator_id, counterparty_id')
    .or(`initiator_id.eq.${user.id},counterparty_id.eq.${user.id}`)
    .order('updated_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('[my-deal-rooms] query error', error)
    return NextResponse.json({ error: 'Failed to load deal rooms' }, { status: 500 })
  }

  return NextResponse.json({ rooms: data ?? [] })
}
