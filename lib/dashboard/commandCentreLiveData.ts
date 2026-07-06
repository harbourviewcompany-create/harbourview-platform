/**
 * lib/dashboard/commandCentreLiveData.ts
 *
 * Single source of truth for CommandCentre live data.
 * All queries run server-side via the Supabase service role client.
 * Replace any mock/hardcoded values in CommandCentre.tsx with these exports.
 */

import { createClient } from '@/lib/supabase/server'

// ─── Types ────────────────────────────────────────────────────────────────────

export type SignalPriority = 'URGENT' | 'HIGH' | 'high' | 'MONITOR' | 'LOW' | 'medium'

export interface CommandCentreSignal {
  id: string
  date: string
  cat: string
  pri: SignalPriority
  score: number
  headline: string
  country: string | null
  verification: string | null
  tier: string | null
  reviewed: boolean
  top_lane: string | null
}

export interface CommandCentreAgentTask {
  id: string
  queue: string
  title: string
  object_type: string
  object_label: string | null
  priority: string
  suggested_action: string | null
  status: string
  agent_label: string | null
  next_action: string | null
  created_at: string
}

export interface CommandCentreMarketplaceCandidate {
  id: string
  title_public_draft: string | null
  marketplace_category: string | null
  country: string | null
  confidence: string | null
  discovered_at: string
}

export interface CommandCentreStats {
  // Signals
  total_signals: number
  urgent_signals: number
  high_signals: number
  monitor_signals: number
  signal_countries: number

  // Listings
  approved_listings: number
  listing_categories: number
  listing_countries: number

  // Sources
  active_sources: number
  inactive_sources: number
  checked_last_24h: number
  stale_sources: number

  // Marketplace
  candidates_needs_review: number

  // Admin dashboard counts (from admin_dashboard_counts view)
  pending_listings: number
  pending_buyer_requests: number
  new_inquiries: number
  pending_matches: number
  pending_disclosures: number
}

export interface CommandCentreData {
  stats: CommandCentreStats
  topSignals: CommandCentreSignal[]
  agentTasks: CommandCentreAgentTask[]
  marketplaceCandidates: CommandCentreMarketplaceCandidate[]
}

// ─── Main Fetcher ─────────────────────────────────────────────────────────────

export async function fetchCommandCentreData(): Promise<CommandCentreData> {
  const supabase = await createClient()

  const [
    statsRpcResult,
    signalsResult,
    agentTasksResult,
    candidatesResult,
  ] = await Promise.all([
    // Signal + listing aggregate stats — single round trip via the
    // get_command_centre_stats() RPC (see migration
    // 20260704160603_get_command_centre_stats). Falls back to
    // fetchStatsInline() below if the RPC errors for any reason —
    // that fallback must stay behaviorally identical to the RPC.
    Promise.resolve(supabase.rpc('get_command_centre_stats').maybeSingle()).catch(
      (err) => ({ data: null, error: err instanceof Error ? err : new Error(String(err)) })
    ),

    // Top high-priority signals
    supabase
      .from('signals_quality')
      .select('id, date, cat, pri, score, headline, country, verification, tier, reviewed, top_lane')
      .in('pri', ['URGENT', 'HIGH', 'high'])
      .order('date', { ascending: false })
      .limit(8),

    // Pending IA agent tasks
    supabase
      .from('ia_agent_tasks')
      .select('id, queue, title, object_type, object_label, priority, suggested_action, status, agent_label, next_action, created_at')
      .neq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(10),

    // Marketplace candidates needing review
    supabase
      .from('marketplace_candidates')
      .select('id, title_public_draft, marketplace_category, country, confidence, discovered_at')
      .eq('status', 'needs_review')
      .order('discovered_at', { ascending: false })
      .limit(8),
  ])

  const stats: CommandCentreStats =
    !statsRpcResult.error && statsRpcResult.data
      ? (statsRpcResult.data as CommandCentreStats)
      : await fetchStatsInline(supabase)

  return {
    stats,
    topSignals: (signalsResult.data ?? []) as CommandCentreSignal[],
    agentTasks: (agentTasksResult.data ?? []) as CommandCentreAgentTask[],
    marketplaceCandidates: (candidatesResult.data ?? []) as CommandCentreMarketplaceCandidate[],
  }
}

// ─── Stats fallback (only runs if get_command_centre_stats() errors) ──────────
//
// Recomputes the same fields via individual round-trip queries. This is
// the original inline implementation, extracted verbatim so a transient
// RPC failure degrades to "more round trips" instead of a broken
// dashboard, rather than being deleted outright.

async function fetchStatsInline(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<CommandCentreStats> {
  const [adminCountsResult, sourceHealthResult] = await Promise.all([
    // Admin dashboard counts view
    supabase
      .from('admin_dashboard_counts')
      .select('pending_listings, pending_buyer_requests, new_inquiries, pending_matches, pending_disclosures')
      .maybeSingle(),

    // Source health
    supabase
      .from('source_registry')
      .select('is_active, last_checked_at', { count: 'exact', head: false }),
  ])

  // ── Signal counts
  const { data: signalCounts } = await supabase
    .from('signals_quality')
    .select('pri', { count: 'exact', head: false })

  const priCounts = (signalCounts ?? []).reduce<Record<string, number>>((acc, row) => {
    const key = (row.pri as string)?.toUpperCase() ?? 'UNKNOWN'
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})

  const { count: totalSignals } = await supabase
    .from('signals_quality')
    .select('*', { count: 'exact', head: true })

  const { count: signalCountries } = await supabase
    .from('signals_quality')
    .select('country', { count: 'exact', head: true })
    .not('country', 'is', null)

  // ── Listing counts
  const { count: approvedListings } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved')

  const { data: listingCategories } = await supabase
    .from('listings')
    .select('category')

  const { data: listingCountries } = await supabase
    .from('listings')
    .select('location_country')
    .not('location_country', 'is', null)

  const uniqueCategories = new Set((listingCategories ?? []).map((r) => r.category)).size
  const uniqueListingCountries = new Set((listingCountries ?? []).map((r) => r.location_country)).size

  // ── Source health
  type SourceRow = { is_active: boolean | null; last_checked_at: string | null }
  const sources = (sourceHealthResult.data ?? []) as SourceRow[]
  const now = Date.now()
  const activeSources = sources.filter((s) => s.is_active).length
  const inactiveSources = sources.filter((s) => !s.is_active).length
  const checkedLast24h = sources.filter((s) => {
    if (!s.last_checked_at) return false
    return now - new Date(s.last_checked_at).getTime() < 86_400_000
  }).length
  const staleSources = sources.filter((s) => {
    if (!s.last_checked_at) return true
    return now - new Date(s.last_checked_at).getTime() > 7 * 86_400_000
  }).length

  // ── Marketplace candidate count
  const { count: candidatesCount } = await supabase
    .from('marketplace_candidates')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'needs_review')

  // ── Admin counts
  const adminCounts = adminCountsResult.data ?? {
    pending_listings: 0,
    pending_buyer_requests: 0,
    new_inquiries: 0,
    pending_matches: 0,
    pending_disclosures: 0,
  }

  return {
    total_signals: totalSignals ?? 0,
    urgent_signals: priCounts['URGENT'] ?? 0,
    high_signals: (priCounts['HIGH'] ?? 0) + (priCounts['high'] ?? 0),
    monitor_signals: priCounts['MONITOR'] ?? 0,
    signal_countries: signalCountries ?? 0,

    approved_listings: approvedListings ?? 0,
    listing_categories: uniqueCategories,
    listing_countries: uniqueListingCountries,

    active_sources: activeSources,
    inactive_sources: inactiveSources,
    checked_last_24h: checkedLast24h,
    stale_sources: staleSources,

    candidates_needs_review: candidatesCount ?? 0,

    pending_listings: adminCounts.pending_listings ?? 0,
    pending_buyer_requests: adminCounts.pending_buyer_requests ?? 0,
    new_inquiries: adminCounts.new_inquiries ?? 0,
    pending_matches: adminCounts.pending_matches ?? 0,
    pending_disclosures: adminCounts.pending_disclosures ?? 0,
  }
}

// ─── Individual fetchers (for partial refreshes / suspense boundaries) ────────

export async function fetchTopSignals(limit = 8): Promise<CommandCentreSignal[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('signals_quality')
    .select('id, date, cat, pri, score, headline, country, verification, tier, reviewed, top_lane')
    .in('pri', ['URGENT', 'HIGH', 'high'])
    .order('date', { ascending: false })
    .limit(limit)
  return (data ?? []) as CommandCentreSignal[]
}

export async function fetchAgentTasks(limit = 10): Promise<CommandCentreAgentTask[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('ia_agent_tasks')
    .select('id, queue, title, object_type, object_label, priority, suggested_action, status, agent_label, next_action, created_at')
    .neq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data ?? []) as CommandCentreAgentTask[]
}

export async function fetchMarketplaceCandidates(limit = 8): Promise<CommandCentreMarketplaceCandidate[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('marketplace_candidates')
    .select('id, title_public_draft, marketplace_category, country, confidence, discovered_at')
    .eq('status', 'needs_review')
    .order('discovered_at', { ascending: false })
    .limit(limit)
  return (data ?? []) as CommandCentreMarketplaceCandidate[]
}

export async function fetchCommandCentreStats(): Promise<CommandCentreStats> {
  const { stats } = await fetchCommandCentreData()
  return stats
}
