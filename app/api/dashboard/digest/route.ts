/**
 * GET /api/dashboard/digest
 *
 * Daily digest endpoint for the CommandCentre DigestPage.
 *
 * Two content types are merged into one feed, distinguished by `contentType`:
 *   - 'signal'    — trade/regulatory intelligence, curated by run_daily_digest()
 *                   from ia_signals. Rendered with a confidence score + category chip.
 *   - 'editorial' — mainstream-media cannabis news, curated by run_editorial_digest()
 *                   from editorial_items (sources tagged source_type='mainstream_media'
 *                   in source_registry). No confidence score, no commercial framing —
 *                   rendered as a plain headline + why-it-matters card.
 *
 * When today's `daily_digest` row has neither headlines nor editorial_headlines
 * populated yet (e.g. early in the day, or on a quiet news day), this endpoint
 * falls back to a ROLLING WINDOW over the raw `signals_quality` view: it tries
 * the last 24h first, then widens to 7d, then 30d, then falls back to the N
 * most-recent reviewed rows regardless of age. That fallback path only ever
 * produces 'signal' content type — there is no raw-editorial equivalent, since
 * editorial_items should always be curated through run_editorial_digest() before
 * reaching the UI. The window that actually produced the returned rows is
 * reported back so the UI can label it honestly ("New in the last 24h" vs
 * "Most recent — nothing new in 24h").
 *
 * Query params:
 *   country — country name (e.g. "Germany"). Optional. Omit or "all" for global.
 *   limit   — max results, capped at 40. Default: 20.
 *
 * Returns:
 *   {
 *     signals:   DashboardSignal[],
 *     window:    "24h" | "7d" | "30d" | "recent",
 *     total:     number,   // total reviewed rows matching the country filter
 *     source:    "live" | "error"
 *   }
 *
 * Security:
 *   - DTO: only the same safe public columns the signals route exposes —
 *     never summary, source_url/url, analyst_notes, in_network, company,
 *     query_pack, or action.
 *   - Reads through the `signals_quality` view (reviewed-gated for
 *     SOURCE_ENGINE) and additionally filters reviewed=true, matching the
 *     rest of the dashboard's public signal surface.
 *   - Cache-Control: private, short TTL — browser only, not CDN cached.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import { flagForMarket } from '@/lib/utils/flagEmoji'

// ── DTO: exact columns returned — nothing else ────────────────────────────────
const SAFE_SELECT = 'id, headline, cat, top_lane, pri, score, country, date, created_at'

// ── Signal tag display map (mirrors /api/dashboard/signals) ───────────────────
const SIGNAL_TAG_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
  regulatory_change:    { label: 'REGULATION',   color: '#D9A441', bg: 'rgba(217,164,65,0.15)',  border: 'rgba(217,164,65,0.35)'  },
  importer_activity:    { label: 'MARKET',       color: '#6FCF7D', bg: 'rgba(111,207,125,0.12)', border: 'rgba(111,207,125,0.30)' },
  buyer_demand:         { label: 'MARKET',       color: '#6FCF7D', bg: 'rgba(111,207,125,0.12)', border: 'rgba(111,207,125,0.30)' },
  new_product_category: { label: 'TRADE',        color: '#B07ED4', bg: 'rgba(139,95,168,0.15)',  border: 'rgba(139,95,168,0.30)'  },
  distressed_asset:     { label: 'SUPPLY CHAIN', color: '#D49560', bg: 'rgba(184,115,51,0.15)',  border: 'rgba(184,115,51,0.30)'  },
  facility_expansion:   { label: 'INVESTMENT',   color: '#8AAFE8', bg: 'rgba(100,149,237,0.12)', border: 'rgba(100,149,237,0.25)' },
}

const LANE_TO_TAG: Record<string, string> = {
  regulatory:    'regulatory_change',
  gazette:       'regulatory_change',
  parliamentary: 'regulatory_change',
  press_release: 'regulatory_change',
  market:        'importer_activity',
  intelligence:  'importer_activity',
  mdb_project:   'importer_activity',
  financial:     'facility_expansion',
  trade:         'new_product_category',
  supply:        'distressed_asset',
  source_engine: 'regulatory_change',
  licensing:     'importer_activity',
}

// ── Rolling windows, in priority order ────────────────────────────────────────
const WINDOWS = [
  { key: '24h' as const, hours: 24 },
  { key: '7d'  as const, hours: 24 * 7 },
  { key: '30d' as const, hours: 24 * 30 },
]

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

// Editorial content spans a wide age range (breaking-today alongside
// notable-but-older stories), unlike same-day trade signals. Showing "3w
// ago" or worse "104w ago" for a two-year-old piece is both misleading (it
// wasn't curated today's digest because it's fresh) and ugly. Past ~5 weeks,
// fall back to an absolute "Mon YYYY" so the card is honest about its age
// without pretending to be a relative-time app.
function publishedLabel(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Recently'
  try {
    const d = new Date(dateStr)
    const diffDays = Math.floor((Date.now() - d.getTime()) / 86_400_000)
    if (diffDays < 35) return timeAgo(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
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
    id:               s.id,
    slug:             undefined,
    title:            stripHtml(s.headline),
    type:             tagKey,
    market,
    tag,
    timeAgo:          timeAgo(s.date ?? s.created_at),
    confidence:       typeof s.score === 'number' ? s.score : 50,
    commercialImpact: `${urgency} ${laneKey || 'regulatory'} signal${market ? ` · ${market}` : ''}.`,
    sourceLabel:      'Harbourview Regulatory Watch',
    flag:             flagForMarket(market),
    contentType:      'signal',
  }
}

// The date field that determines "freshness". `date` is the editorial/signal
// date; `created_at` is ingestion time. We sort by the greater-of via COALESCE
// on the DB side is not available across the view uniformly, so we sort by
// created_at (always present) descending and treat that as recency.
function isWithin(row: SignalRow, hours: number): boolean {
  const ref = row.date ?? row.created_at
  if (!ref) return false
  const diff = Date.now() - new Date(ref).getTime()
  return diff <= hours * 3_600_000 && diff >= 0
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  // Strip PostgREST filter delimiters ( , ( ) ) before this value is
  // interpolated into a .or() / .ilike() clause below, to prevent a crafted
  // ?country= value from breaking out of its filter and injecting conditions.
  const countryParam = (searchParams.get('country') ?? '').trim().replace(/[,()]/g, '')
  const parsedLimit  = parseInt(searchParams.get('limit') ?? '20', 10)
  const limit        = Math.min(Math.max(Number.isFinite(parsedLimit) ? parsedLimit : 20, 1), 40)
  const isCountryFiltered = Boolean(countryParam && countryParam !== 'all')

  try {
    const supabase = await createClient()

    // ── 0. Editorial edition first ────────────────────────────────────────────
    // The published daily_digest (same content as the public /daily page):
    // curated headlines with an editorial "why it matters" line, generated by
    // the run_daily_digest() pipeline. When an edition exists it IS the digest;
    // the signals_quality rolling window below remains as fallback only.
    const { data: edition } = await supabase
      .from('daily_digest')
      .select('digest_date, headlines, editorial_headlines, generated_at')
      .eq('status', 'published')
      .order('digest_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    type EditorialHeadline = { headline?: string; why_it_matters?: string; market?: string; signal_id?: string }
    type NewsHeadline = { headline?: string; why_it_matters?: string; market?: string; item_id?: string; published_at?: string; source_url?: string; outlet_name?: string }

    const hasSignalEdition    = edition && Array.isArray(edition.headlines) && edition.headlines.length > 0
    const hasEditorialEdition = edition && Array.isArray(edition.editorial_headlines) && edition.editorial_headlines.length > 0

    if (hasSignalEdition || hasEditorialEdition) {
      let signalItems = (hasSignalEdition ? edition!.headlines as EditorialHeadline[] : [])
        .filter(h => typeof h?.headline === 'string' && h.headline.length > 0)
      let newsItems = (hasEditorialEdition ? edition!.editorial_headlines as NewsHeadline[] : [])
        .filter(h => typeof h?.headline === 'string' && h.headline.length > 0)

      // Country-priority: matching market first, everything else after —
      // same spirit as the signals feed (never blank on a country filter).
      if (isCountryFiltered) {
        const needle = countryParam.toLowerCase()
        const prioritize = <T extends { market?: string }>(items: T[]) => {
          const match = items.filter(h => (h.market ?? '').toLowerCase().includes(needle))
          const rest  = items.filter(h => !(h.market ?? '').toLowerCase().includes(needle))
          return [...match, ...rest]
        }
        signalItems = prioritize(signalItems)
        newsItems   = prioritize(newsItems)
      }

      const todayUtc  = new Date().toISOString().slice(0, 10)
      const windowKey = edition!.digest_date === todayUtc ? '24h' as const : 'recent' as const
      const tag       = SIGNAL_TAG_MAP.regulatory_change
      const editorialTag = { label: 'NEWS', color: '#B8AF9E', bg: 'rgba(184,175,158,0.10)', border: 'rgba(184,175,158,0.25)' }

      const signalSignals: DashboardSignal[] = signalItems.slice(0, limit).map((h, i) => ({
        id:               h.signal_id ?? `digest-${edition!.digest_date}-${i}`,
        slug:             undefined,
        title:            h.headline!,
        type:             'regulatory_change',
        market:           h.market ?? 'Global',
        tag,
        timeAgo:          timeAgo(edition!.generated_at),
        confidence:       80,
        commercialImpact: h.why_it_matters ?? '',
        sourceLabel:      'Harbourview Daily',
        flag:             flagForMarket(h.market ?? 'Global'),
        contentType:      'signal',
      }))

      // Editorial items are interleaved after signal items (or lead, if no
      // signal edition exists yet) — no confidence score, distinct tag.
      const newsSignals: DashboardSignal[] = newsItems.map((h, i) => ({
        id:               h.item_id ?? `editorial-${edition!.digest_date}-${i}`,
        slug:             undefined,
        title:            h.headline!,
        type:             'editorial',
        market:           h.market ?? 'Global',
        tag:              editorialTag,
        timeAgo:          publishedLabel(h.published_at),
        confidence:       0,
        commercialImpact: h.why_it_matters ?? '',
        sourceLabel:      h.outlet_name ?? 'Global Cannabis News',
        sourceUrl:        h.source_url,
        flag:             flagForMarket(h.market ?? 'Global'),
        contentType:      'editorial',
      }))

      const signals = [...signalSignals, ...newsSignals].slice(0, limit)
      const total = signalItems.length + newsItems.length

      return NextResponse.json(
        { signals, window: windowKey, total, source: 'live' },
        { headers: { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=60' } },
      )
    }

    let query = supabase
      .from('signals_quality')
      .select(SAFE_SELECT, { count: 'exact' })
      .eq('reviewed', true)
      .order('created_at', { ascending: false })
      .order('score', { ascending: false })

    if (isCountryFiltered) {
      query = query.or(`country.ilike.%${countryParam}%,country.eq.Global`)
    }

    // Pull a generous recent slice once, then window client-side. This avoids
    // 3 round-trips for the 24h/7d/30d fallback ladder.
    const { data, error, count } = await query.range(0, 199)

    if (error) {
      console.error('[/api/dashboard/digest] supabase error:', error.message)
      return NextResponse.json(
        { signals: [], window: 'recent', total: 0, source: 'error', error: error.message },
        { status: 500 },
      )
    }

    let rows = (data ?? []) as SignalRow[]

    // Country-priority sort: country-specific first, Global second.
    if (isCountryFiltered) {
      const needle = countryParam.toLowerCase()
      const countrySpecific = rows.filter(r => r.country?.toLowerCase().includes(needle))
      const global          = rows.filter(r => !r.country?.toLowerCase().includes(needle))
      rows = [...countrySpecific, ...global]
    }

    // Rolling-window ladder: first window that yields any rows wins.
    let windowKey: '24h' | '7d' | '30d' | 'recent' = 'recent'
    let windowed: SignalRow[] = []
    for (const w of WINDOWS) {
      const inWindow = rows.filter(r => isWithin(r, w.hours))
      if (inWindow.length > 0) {
        windowKey = w.key
        windowed = inWindow
        break
      }
    }
    // Nothing in any dated window → fall back to most-recent overall.
    if (windowed.length === 0) {
      windowKey = 'recent'
      windowed = rows
    }

    const signals = windowed.slice(0, limit).map(rowToSignal)

    return NextResponse.json(
      { signals, window: windowKey, total: count ?? signals.length, source: 'live' },
      {
        headers: {
          'Cache-Control': 'private, max-age=300, stale-while-revalidate=60',
        },
      },
    )
  } catch (err) {
    console.error('[/api/dashboard/digest] unexpected error:', err)
    return NextResponse.json(
      { signals: [], window: 'recent', total: 0, source: 'error' },
      { status: 500 },
    )
  }
}
