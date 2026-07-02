// app/admin/marketplace/matches/page.tsx
//
// Read-only admin view of marketplace matches: listing <-> buyer_request
// pairs created by the matching engine (lib/marketplace/matchEngine.ts),
// including the AI-generated rationale where one has been backfilled.
//
// Rationale is populated asynchronously by the /api/cron/marketplace-match
// cron (backfillMatchRationales), decoupled from match creation — so a
// freshly-created match will show "Pending" until the next cron run.

import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { getAdminDataClient } from '@/lib/supabase/adminDataClient'
import MatchesClient, { type MatchRow } from './MatchesClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getMatches(): Promise<{ matches: MatchRow[]; error: string | null }> {
  const client = getAdminDataClient()
  if (!client.ok) return { matches: [], error: client.error.message }

  const { url, serviceRoleKey } = client.data
  const headers = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    Accept: 'application/json',
  }

  const select = [
    'id', 'status', 'internal_notes', 'created_at',
    'match_rationale', 'match_rationale_model', 'match_rationale_generated_at',
    'listing:listing_id(id,title,category,region)',
    'buyer_request:buyer_request_id(id,title,category,region)',
  ].join(',')

  const res = await fetch(
    `${url}/rest/v1/matches?select=${encodeURIComponent(select)}&order=created_at.desc&limit=200`,
    { headers, cache: 'no-store' },
  )

  if (!res.ok) {
    return { matches: [], error: `Fetch failed: ${res.status} ${res.statusText}` }
  }

  const matches = (await res.json()) as MatchRow[]
  return { matches, error: null }
}

export default async function AdminMarketplaceMatchesPage() {
  await requireAdminAuth()
  const { matches, error } = await getMatches()

  return <MatchesClient matches={matches} configError={error} />
}
