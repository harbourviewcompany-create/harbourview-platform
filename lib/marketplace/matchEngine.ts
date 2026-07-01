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
 *
 * AI rationale generation is intentionally decoupled from match creation.
 * matchListingToBuyerRequests() and matchBuyerRequestToListings() are both
 * called synchronously from admin request paths (e.g. the listing publish
 * route) where a human is waiting on the HTTP response — they only ever do
 * fast DB reads/writes. backfillMatchRationales() enriches already-created
 * matches with an AI rationale out of band and is intended to be called from
 * a cron (see app/api/cron/marketplace-match/route.ts), decoupled from any
 * user-facing request.
 */

import { createClient } from '@supabase/supabase-js'
import { SUPABASE_DB_SCHEMA } from '@/lib/supabase/env'
import { generateMatchRationale } from '@/lib/marketplace/matchRationale'

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase env not configured')
  return createClient(url, key, { auth: { persistSession: false }, db: { schema: SUPABASE_DB_SCHEMA } })
}

// Cap AI rationale generation per backfill run so one cron invocation can't
// blow the function's time budget or run away on cost. Any matches beyond
// the cap are picked up on the next cron run — match_rationale stays NULL
// in the meantime, which the admin UI treats as "pending", not an error.
const MAX_RATIONALE_PER_BACKFILL_RUN = 20

interface ListingRow {
  id: string
  category: string
  region: string
  status: string
  title: string
  description: string | null
  high_level_specs?: unknown
}

interface BuyerRequestRow {
  id: string
  category: string
  region: string
  status: string
  title: string
  description: string | null
  requirements?: unknown
}

function regionsCompatible(a: string, b: string): boolean {
  if (!a || !b) return true
  if (a === 'global' || b === 'global') return true
  return a === b
}

type PendingMatchRow = {
  listing_id: string
  buyer_request_id: string
  status: string
  internal_notes: string
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
    .select('id, category, region, status, title, description, high_level_specs')
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
    .select('id, category, region, status, title, description, requirements')
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

  const toInsert: PendingMatchRow[] = compatible
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
    .select('id, category, region, status, title, description, requirements')
    .eq('id', buyerRequestId)
    .single()

  if (bErr || !buyer) return 0

  const { data: listings, error: lErr } = await db
    .from('listings')
    .select('id, category, region, status, title, description, high_level_specs')
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

  const toInsert: PendingMatchRow[] = compatible
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

/**
 * Finds matches with no AI rationale yet (match_rationale IS NULL) and
 * enriches up to MAX_RATIONALE_PER_BACKFILL_RUN of them, oldest first.
 * Intended to be called from a cron, decoupled from any user-facing request
 * — see the module doc comment above. Never throws; per-match failures are
 * logged and simply leave that row's rationale NULL for the next run.
 *
 * Returns the number of matches successfully enriched.
 */
export async function backfillMatchRationales(): Promise<number> {
  const db = getClient()

  const { data: pending, error: pErr } = await db
    .from('matches')
    .select('id, listing_id, buyer_request_id')
    .is('match_rationale', null)
    .order('created_at', { ascending: true })
    .limit(MAX_RATIONALE_PER_BACKFILL_RUN)

  if (pErr) {
    console.error('matchEngine: backfill fetch failed', pErr.message)
    return 0
  }
  if (!pending?.length) return 0

  const listingIds = [...new Set(pending.map(m => m.listing_id))]
  const buyerIds = [...new Set(pending.map(m => m.buyer_request_id))]

  const [{ data: listings }, { data: buyers }] = await Promise.all([
    db.from('listings').select('id, category, region, status, title, description, high_level_specs').in('id', listingIds),
    db.from('buyer_requests').select('id, category, region, status, title, description, requirements').in('id', buyerIds),
  ])

  const listingsById = new Map((listings ?? []).map((l: ListingRow) => [l.id, l]))
  const buyersById = new Map((buyers ?? []).map((b: BuyerRequestRow) => [b.id, b]))

  let enriched = 0

  await Promise.all(
    pending.map(async (match) => {
      const listing = listingsById.get(match.listing_id)
      const buyer = buyersById.get(match.buyer_request_id)
      if (!listing || !buyer) return

      const result = await generateMatchRationale({
        listing: {
          title: listing.title,
          description: listing.description,
          category: listing.category,
          region: listing.region,
          high_level_specs: listing.high_level_specs,
        },
        buyerRequest: {
          title: buyer.title,
          description: buyer.description,
          category: buyer.category,
          region: buyer.region,
          requirements: buyer.requirements,
        },
      })
      if (!result) return

      const { error: uErr } = await db
        .from('matches')
        .update({
          match_rationale: result.rationale,
          match_rationale_model: result.model,
          match_rationale_generated_at: new Date().toISOString(),
        })
        .eq('id', match.id)

      if (uErr) {
        console.error('matchEngine: backfill update failed', match.id, uErr.message)
        return
      }
      enriched += 1
    }),
  )

  console.info(`matchEngine: backfilled rationale for ${enriched}/${pending.length} match(es)`)
  return enriched
}
