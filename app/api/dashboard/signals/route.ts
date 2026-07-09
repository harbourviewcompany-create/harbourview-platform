/**
 * GET /api/dashboard/signals
 *
 * Live paginated signals endpoint for the CommandCentre SignalsPage.
 * Queries the `signals` table (803 rows) with DTO-safe columns only.
 * Supports country filtering, lane filtering, and pagination.
 *
 * Query params:
 *   country  — country name (e.g. "Germany"). Optional. Omit or "all" for global.
 *   lane     — "all" | "regulatory" | "economic" | "trade". Default: "all".
 *   limit    — max results, capped at 100. Default: 25.
 *   offset   — pagination offset. Default: 0.
 *
 * Returns:
 *   { signals: DashboardSignal[], total: number, source: "live" | "error" }
 *
 * Security:
 *   - Auth-gated: requires an authenticated Supabase session (401 if not signed in).
 *   - DTO: only safe public columns — never exposes summary, source_url,
 *     analyst_notes, in_network, company, query_pack, or action.
 *   - Filters to reviewed=true rows only (public-safe subset of the table).
 *   - Cache-Control: private, max-age=60 (browser-only, not CDN cached).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'

// ── DTO: exact columns returned — nothing else ─────────────────────────────────
const SAFE_SELECT = 'id, headline, cat, top_lane, pri, score, country, date, created_at'

// ── Lane → top_lane DB values ─────────────────────────────────────────────────
const LANE_TOP_LANES: Record<string, string[]> = {
  regulatory: ['regulatory', 'REGULATORY', 'GAZETTE', 'PARLIAMENTARY', 'PRESS_RELEASE'],
  economic:   ['market', 'financial', 'intelligence', 'MARKET', 'FINANCIAL', 'MDB_PROJECT'],
  trade:      ['trade', 'supply', 'SOURCE_ENGINE', 'TRADE', 'SUPPLY', 'LICENSING'],
}

// ── Signal tag display map (mirrors dashboardServerData.ts) ───────────────────
const SIGNAL_TAG_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
  regulatory_change:    { label: 'REGULATION',   color: '#D9A441', bg: 'rgba(217,164,65,0.15)',  border: 'rgba(217,164,65,0.35)'  },
  importer_activity:    { label: 'MARKET',       color: '#6FCF7D', bg: 'rgba(111,207,125,0.12)', border: 'rgba(111,207,125,0.30)' },
  buyer_demand:         { label: 'MARKET',       color: '#6FCF7D', bg: 'rgba(111,207,125,0.12)', border: 'rgba(111,207,125,0.30)' },
  new_product_category: { label: 'TRADE',        color: '#B07ED4', bg: 'rgba(139,95,168,0.15)',  border: 'rgba(139,95,168,0.30)'  },
  distressed_asset:     { label: 'SUPPLY CHAIN', color: '#D49560', bg: 'rgba(184,115,51,0.15)',  border: 'rgba(184,115,51,0.30)'  },
  facility_expansion:   { label: 'INVESTMENT',   color: '#8AAFE8', bg: 'rgba(100,149,237,0.12)', border: 'rgba(100,149,237,0.25)' },
}

const LANE_TO_TAG: Record<string, string> = {
  regulatory: 'regulatory_change',
  gazette:    'regulatory_change',
  parliamentary: 'regulatory_change',
  press_release: 'regulatory_change',
  market:     'importer_activity',
  intelligence: 'importer_activity',
  mdb_project: 'importer_activity',
  financial:  'facility_expansion',
  trade:      'new_product_category',
  supply:     'distressed_asset',
  source_engine: 'regulatory_change',
  licensing:  'importer_activity',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function stripHtml(raw: string): string {
  return raw
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 200)
}

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Recently'
  try {
    const diff = Date.now() - new Date(dateStr).getTime()
    const h = Math.floor(diff / 3_600_000)
    if (h < 1)  return 'Just now'
    if (h < 24) return `${h}h ago`
    const d = Math.floor(h / 24)
    if (d < 7)  return `${d}d ago`
    return `${Math.floor(d / 7)}w ago`
  } catch {
    return 'Recently'
  }
}

type SignalRow = {
  id: string
  headline: string
  cat: string | null
  top_lane: string | null
  pri: string | null
  score: number | null
  country: string | null
  date: string | null
  created_at: string
}

function rowToSignal(s: SignalRow): DashboardSignal {
  const laneKey = (s.top_lane ?? s.cat ?? '').toLowerCase()
  const tagKey  = LANE_TO_TAG[laneKey] ?? 'regulatory_change'
  const tag     = SIGNAL_TAG_MAP[tagKey] ?? SIGNAL_TAG_MAP.regulatory_change
  const market  = s.country ?? ''
  const pri     = (s.pri ?? '').toLowerCase()
  const urgency = pri === 'urgent' ? 'Urgent'
                : pri === 'high'   ? 'High-priority'
                : pri === 'medium' ? 'Medium-priority'
                : 'Monitoring-level'

  return {
    id:              s.id,
    slug:            undefined,
    title:           stripHtml(s.headline),
    type:            tagKey,
    market,
    tag,
    timeAgo:         timeAgo(s.date ?? s.created_at),
    confidence:      typeof s.score === 'number' ? s.score : 50,
    commercialImpact:`${urgency} ${laneKey || 'regulatory'} signal${market ? ` · ${market}` : ''}.`,
    sourceLabel:     'Harbourview Regulatory Watch',
    flag:            '🌐',
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const countryParam = (searchParams.get('country') ?? '').trim().replace(/[,()]/g, '')
  const lane         = (searchParams.get('lane') ?? 'all').toLowerCase()
  const limit        = Math.min(Math.max(parseInt(searchParams.get('limit')  ?? '25', 10), 1), 100)
  const offset       = Math.max(parseInt(searchParams.get('offset') ?? '0', 10), 0)

  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // When a country is requested, fetch country-specific signals first.
    // If they don't fill the requested limit, supplement with Global signals
    // so every country always has intelligence to display.
    const isCountryFiltered = Boolean(countryParam && countryParam !== 'all')

    let query = supabase
      .from('signals_quality')
      .select(SAFE_SELECT, { count: 'exact' })
      .eq('reviewed', true)
      .order('score',        { ascending: false })
      .order('date',         { ascending: false })

    if (isCountryFiltered) {
      // Include country-specific AND global signals; sort country-specific first in app code
      query = query.or(`country.ilike.%${countryParam}%,country.eq.Global`)
    }

    // Lane filter — maps dashboard lane → DB top_lane values
    if (lane !== 'all' && LANE_TOP_LANES[lane]) {
      query = query.in('top_lane', LANE_TOP_LANES[lane])
    }

    // Fetch enough rows to fill limit after country-priority sorting
    const fetchLimit = isCountryFiltered ? Math.min(limit * 4, 400) : limit
    query = query.range(offset, offset + fetchLimit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('[/api/dashboard/signals] supabase error:', error.message)
      return NextResponse.json(
        { signals: [], total: 0, source: 'error', error: error.message },
        { status: 500 },
      )
    }

    let rows = (data ?? []) as SignalRow[]

    // Country-priority sort: exact/partial country match first, Global second
    if (isCountryFiltered) {
      const needle = countryParam.toLowerCase()
      const countrySpecific = rows.filter(r => r.country?.toLowerCase().includes(needle))
      const global          = rows.filter(r => !r.country?.toLowerCase().includes(needle))
      rows = [...countrySpecific, ...global].slice(0, limit)
    }

    const signals = rows.map(r => rowToSignal(r))

    return NextResponse.json(
      { signals, total: count ?? signals.length, source: 'live' },
      {
        headers: {
          // Private cache: served to the browser only (not CDN)
          // 60s is appropriate for a signals feed
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=30',
        },
      },
    )
  } catch (err) {
    console.error('[/api/dashboard/signals] unexpected error:', err)
    return NextResponse.json(
      { signals: [], total: 0, source: 'error' },
      { status: 500 },
    )
  }
}
