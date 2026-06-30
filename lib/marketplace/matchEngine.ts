/**
 * lib/marketplace/matchEngine.ts
 *
 * Core matching logic: given an approved listing, find compatible buyer_requests
 * (and vice versa) and create match rows in the matches table.
 *
 * Matching criteria (all must pass):
 *   1. category must match (listings.category === buyer_requests.category)
 *   2. region must match OR either side is 'global'
 *   3. Neither side is archived/closed
 *   4. No existing match between these two rows
 */

import { createClient } from '@supabase/supabase-js'
import { SUPABASE_DB_SCHEMA } from '@/lib/supabase/env'

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase env not configured')
  return createClient(url, key, { auth: { persistSession: false }, db: { schema: SUPABASE_DB_SCHEMA } })
}

interface ListingRow {
  id: string
  category: string
  region: string
  status: string
  title: string
}

interface BuyerRequestRow {
  id: string
  category: string
  region: string
  status: string
  title: string
}

function regionsCompatible(a: string, b: string): boolean {
  if (!a || !b) return true
  if (a === 'global' || b === 'global') return true
  return a === b
}

/**
 * Find all buyer_requests that match a given listing and create match rows.
 * Returns the number of new matches created.
 */
export async function matchListingToBuyerRequests(
  listingId: string,
): Promise<number> {
  const db = getClient()

  // Fetch the listing
  const { data: listing, error: lErr } = await db
    .from('listings')
    .select('id, category, region, status, title')
    .eq('id', listingId)
    .single()

  if (lErr || !listing) {
    console.error('matchEngine: listing not found', listingId, lErr?.message)
    return 0
  }

  if (listing.status !== 'approved') return 0

  // Find compatible buyer_requests
  const { data: buyers, error: bErr } = await db
    .from('buyer_requests')
    .select('id, category, region, status, title')
    .eq('category', listing.category)
    .not('status', 'in', '("closed","archived")')

  if (bErr || !buyers?.length) return 0

  const compatible = (buyers as BuyerRequestRow[]).filter(b =>
    regionsCompatible(listing.region, b.region)
  )
  if (!compatible.length) return 0

  // Exclude already-matched pairs
  const buyerIds = compatible.map(b => b.id)
  const { data: existing } = await db
    .from('matches')
    .select('buyer_request_id')
    .eq('listing_id', listingId)
    .in('buyer_request_id', buyerIds)

  const alreadyMatched = new Set((existing ?? []).map((r: { buyer_request_id: string }) => r.buyer_request_id))

  const toInsert = compatible
    .filter(b => !alreadyMatched.has(b.id))
    .map(b => ({
      listing_id: listingId,
      buyer_request_id: b.id,
      status: 'proposed',
      internal_notes: `Auto-matched: listing "${listing.title}" ↔ buyer request "${b.title}" (category=${listing.category}, listing_region=${listing.region}, buyer_region=${b.region})`,
    }))

  if (!toInsert.length) return 0

  const { error: iErr } = await db.from('matches').insert(toInsert)
  if (iErr) {
    console.error('matchEngine: insert failed', iErr.message)
    return 0
  }

  console.info(`matchEngine: created ${toInsert.length} match(es) for listing ${listingId}`)
  return toInsert.length
}

/**
 * Find all approved listings that match a given buyer_request and create match rows.
 * Returns the number of new matches created.
 */
export async function matchBuyerRequestToListings(
  buyerRequestId: string,
): Promise<number> {
  const db = getClient()

  const { data: buyer, error: bErr } = await db
    .from('buyer_requests')
    .select('id, category, region, status, title')
    .eq('id', buyerRequestId)
    .single()

  if (bErr || !buyer) return 0

  const { data: listings, error: lErr } = await db
    .from('listings')
    .select('id, category, region, status, title')
    .eq('category', buyer.category)
    .eq('status', 'approved')

  if (lErr || !listings?.length) return 0

  const compatible = (listings as ListingRow[]).filter(l =>
    regionsCompatible(buyer.region, l.region)
  )
  if (!compatible.length) return 0

  const listingIds = compatible.map(l => l.id)
  const { data: existing } = await db
    .from('matches')
    .select('listing_id')
    .eq('buyer_request_id', buyerRequestId)
    .in('listing_id', listingIds)

  const alreadyMatched = new Set((existing ?? []).map((r: { listing_id: string }) => r.listing_id))

  const toInsert = compatible
    .filter(l => !alreadyMatched.has(l.id))
    .map(l => ({
      listing_id: l.id,
      buyer_request_id: buyerRequestId,
      status: 'proposed',
      internal_notes: `Auto-matched: listing "${l.title}" ↔ buyer request "${buyer.title}" (category=${buyer.category}, listing_region=${l.region}, buyer_region=${buyer.region})`,
    }))

  if (!toInsert.length) return 0

  const { error: iErr } = await db.from('matches').insert(toInsert)
  if (iErr) {
    console.error('matchEngine: buyer insert failed', iErr.message)
    return 0
  }

  console.info(`matchEngine: created ${toInsert.length} match(es) for buyer_request ${buyerRequestId}`)
  return toInsert.length
}

/**
 * Run full marketplace matching across all approved listings and active buyer requests.
 * Used by the /api/cron/marketplace-match cron.
 * Returns totals.
 */
export async function runFullMarketplaceMatch(): Promise<{ listingsProcessed: number; matchesCreated: number }> {
  const db = getClient()

  const { data: listings } = await db
    .from('listings')
    .select('id')
    .eq('status', 'approved')

  let matchesCreated = 0
  for (const l of listings ?? []) {
    matchesCreated += await matchListingToBuyerRequests(l.id)
  }

  return { listingsProcessed: (listings ?? []).length, matchesCreated }
}
