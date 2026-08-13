import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, createSupabaseServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Same idempotent create-or-return logic as the former
// app/marketplace/deals/new/page.tsx (server-redirect flow), exposed as JSON
// so it can be called from inside Command Centre without navigating away.
export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const listingId = typeof body.listingId === 'string' ? body.listingId : null
  const listingTitle = typeof body.listingTitle === 'string' ? body.listingTitle : ''

  const svc = await createSupabaseServiceClient()

  if (listingId) {
    const { data: existing } = await svc
      .from('deal_rooms')
      .select('id')
      .eq('listing_ref', listingId)
      .eq('initiator_id', user.id)
      .in('status', ['active', 'negotiating', 'agreed'])
      .maybeSingle()
    if (existing) return NextResponse.json({ roomId: existing.id })
  }

  const roomTitle = listingTitle ? `Re: ${listingTitle.slice(0, 120)}` : 'New Deal Room'

  const { data: newRoom, error } = await svc
    .from('deal_rooms')
    .insert({
      title: roomTitle,
      listing_ref: listingId,
      initiator_id: user.id,
      status: 'active',
      nda_required: false,
    })
    .select('id')
    .single()

  if (error || !newRoom) {
    console.error('[deal-rooms/create] insert error', error)
    return NextResponse.json({ error: 'Failed to create deal room' }, { status: 500 })
  }

  return NextResponse.json({ roomId: newRoom.id })
}
