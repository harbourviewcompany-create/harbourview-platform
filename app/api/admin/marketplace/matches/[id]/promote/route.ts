// app/api/admin/marketplace/matches/[id]/promote/route.ts
//
// POST /api/admin/marketplace/matches/:id/promote
//
// Promotes a proposed match to a deal room. Creates the deal_room row and
// updates the match status to 'deal_room_created'.
//
// Body (JSON):
//   { nda_required?: boolean, notes?: string }
//
// Response:
//   { ok: true, deal_room_id: string }

import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { createClient } from '@supabase/supabase-js'
import crypto from 'node:crypto'

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
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

  if (match.status === 'deal_room_created') {
    return NextResponse.json({ ok: false, error: 'Deal room already exists for this match' }, { status: 409 })
  }

  const listing = Array.isArray(match.listings) ? match.listings[0] : match.listings
  const buyer   = Array.isArray(match.buyer_requests) ? match.buyer_requests[0] : match.buyer_requests

  if (!listing || !buyer) {
    return NextResponse.json({ ok: false, error: 'Match references missing listing or buyer_request' }, { status: 422 })
  }

  // Create the deal room
  const accessToken = crypto.randomBytes(24).toString('hex')

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
      access_token:     accessToken,
      notes:            notes ?? `Deal room created from match ${matchId}. Listing: "${listing.title}". Buyer request: "${buyer.title}".`,
    })
    .select('id')
    .single()

  if (drErr || !dealRoom) {
    console.error('promote match: deal_room insert failed', drErr?.message)
    return NextResponse.json({ ok: false, error: drErr?.message ?? 'Failed to create deal room' }, { status: 500 })
  }

  // Update match status
  await db
    .from('matches')
    .update({ status: 'deal_room_created' })
    .eq('id', matchId)

  return NextResponse.json({ ok: true, deal_room_id: dealRoom.id })
}
