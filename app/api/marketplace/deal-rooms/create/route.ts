import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, createSupabaseServiceClient } from '@/lib/supabase/server'
import { assertPartiesKybVerified } from '@/lib/marketplace/kybDealRoomGate'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Same idempotent create-or-return logic as the former
// app/marketplace/deals/new/page.tsx (server-redirect flow), exposed as JSON
// so it can be called from inside Command Centre without navigating away.
// KYB: initiator (and listing owner when resolvable) must have verified evidence
// unless this is returning an already-open room.
export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const listingId = typeof body.listingId === 'string' ? body.listingId : null
  const listingTitle = typeof body.listingTitle === 'string' ? body.listingTitle : ''
  const kyb_override = Boolean(body.kyb_override)
  const kyb_override_reason = typeof body.kyb_override_reason === 'string' ? body.kyb_override_reason.trim() : ''

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

  let listingOwnerId: string | null = null
  if (listingId) {
    const { data: listing } = await svc
      .from('listings')
      .select('user_id')
      .eq('id', listingId)
      .maybeSingle()
    listingOwnerId = listing?.user_id ?? null
  }

  if (!kyb_override) {
    const gate = await assertPartiesKybVerified(svc, [
      { userId: user.id, role: 'buyer' },
      { userId: listingOwnerId, role: 'listing_owner' },
    ])
    if (!gate.ok) {
      return NextResponse.json(
        { error: gate.message, code: gate.code, missing: gate.missing },
        { status: 403 },
      )
    }
  } else if (!kyb_override_reason || kyb_override_reason.length < 8) {
    return NextResponse.json(
      { error: 'kyb_override requires kyb_override_reason (min 8 chars)' },
      { status: 400 },
    )
  } else {
    console.info('harbourview_deal_room_kyb_override', {
      userId: user.id,
      listingId,
      reason: kyb_override_reason.slice(0, 200),
    })
  }

  const roomTitle = listingTitle ? `Re: ${listingTitle.slice(0, 120)}` : 'New Deal Room'

  const { data: newRoom, error } = await svc
    .from('deal_rooms')
    .insert({
      title: roomTitle,
      listing_ref: listingId,
      initiator_id: user.id,
      counterparty_id: listingOwnerId,
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
