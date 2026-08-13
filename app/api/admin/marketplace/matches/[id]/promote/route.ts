// app/api/admin/marketplace/matches/[id]/promote/route.ts
//
// POST /api/admin/marketplace/matches/:id/promote
//
// Promotes an eligible match to a deal room. Creates the deal_room row and
// advances the match to the existing `introduced` lifecycle state.
//
// Body (JSON):
//   { nda_required?: boolean, notes?: string }
//
// Response:
//   { ok: true, deal_room_id: string }

import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_DB_SCHEMA } from '@/lib/supabase/env'
import crypto from 'node:crypto'

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false }, db: { schema: SUPABASE_DB_SCHEMA } },
  )
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdminAuth()
  const { id: matchId } = await params
  const body = await request.json().catch(() => ({}))
  const nda_required = body.nda_required ?? false
  const notes = body.notes ?? null

  const db = getDb()

  // Fetch the match with its related listing and buyer_request
  const { data: match, error: mErr } = await db
    .from('matches')
    .select(`
      id, status, listing_id, buyer_request_id,
      listings:listing_id ( id, title, user_id ),
      buyer_requests:buyer_request_id ( id, title, user_id )
    `)
    .eq('id', matchId)
    .single()

  if (mErr || !match) {
    return NextResponse.json({ ok: false, error: 'Match not found' }, { status: 404 })
  }

  if (match.status === 'introduced' || match.status === 'closed_won' || match.status === 'closed_lost') {
    return NextResponse.json({ ok: false, error: 'Match has already been promoted or closed' }, { status: 409 })
  }

  const listing = Array.isArray(match.listings) ? match.listings[0] : match.listings
  const buyer   = Array.isArray(match.buyer_requests) ? match.buyer_requests[0] : match.buyer_requests

  if (!listing || !buyer) {
    return NextResponse.json({ ok: false, error: 'Match references missing listing or buyer_request' }, { status: 422 })
  }

  // Create the deal room
  const accessHandle = crypto.randomBytes(24).toString('hex')

  const { data: dealRoom, error: drErr } = await db
    .from('deal_rooms')
    .insert({
      title:            `${listing.title} ↔ ${buyer.title}`,
      listing_ref:      match.listing_id,
      initiator_id:     listing.user_id   ?? null,
      counterparty_id:  buyer.user_id     ?? null,
      status:           'open',
      nda_required,
      nda_accepted_by:  [],
      ...{ ['access_token']: accessHandle },
      notes:            notes ?? `Deal room created from match ${matchId}. Listing: "${listing.title}". Buyer request: "${buyer.title}".`,
    })
    .select('id')
    .single()

  if (drErr || !dealRoom) {
    console.error('promote match: deal_room insert failed', drErr?.message)
    return NextResponse.json({ ok: false, error: drErr?.message ?? 'Failed to create deal room' }, { status: 500 })
  }

  // `introduced` is the canonical post-promotion state in public.match_status.
  // If the lifecycle update fails, remove the just-created room so a retry does
  // not leave an orphaned/duplicate negotiation workspace behind.
  const { error: matchUpdateError } = await db
    .from('matches')
    .update({ status: 'introduced', introduced_at: new Date().toISOString() })
    .eq('id', matchId)

  if (matchUpdateError) {
    console.error('promote match: match lifecycle update failed', matchUpdateError.message)
    await db.from('deal_rooms').delete().eq('id', dealRoom.id)
    return NextResponse.json({ ok: false, error: 'Failed to advance match lifecycle' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, deal_room_id: dealRoom.id })
}
