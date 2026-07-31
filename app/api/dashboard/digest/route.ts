/**
 * GET /api/dashboard/digest
 *
 * Daily digest for CommandCentre DigestPage.
 * Curated edition first; else Pipeline B quality window ranked by
 * digestRank (confidence, impact, content type, corroboration,
 * operator feedback, max 3 per country).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import { flagForMarket } from '@/lib/utils/flagEmoji'
import {
  SIGNAL_QUALITY_SELECT,
  QUALITY_LABEL_NOT_IN,
  resolveConfidence,
  resolveContentType,
  displayHeadline,
  buildCorroborationIndex,
  corroborationCount,
  isTranslated,
  originalLanguageLabel,
  type SignalQualityRow,
} from '@/lib/signals/quality'
import { rankDigestCandidates, type DigestCandidate } from '@/lib/signals/digestRank'
import { loadFeedbackScores } from '@/lib/signals/feedbackScores'
import { buildDigestConfidenceMap } from '@/lib/signals/digestPresentation'
import { cleanPlainText } from '@/lib/utils/htmlEntities'

const SAFE_SELECT = `id, headline, cat, top_lane, pri, country, date, created_at, reviewed, ${SIGNAL_QUALITY_SELECT}` as const

const SIGNAL_TAG_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
  regulatory_change:    { label: 'REGULATION',   color: '#D9A441', bg: 'rgba(217,164,65,0.15)',  border: 'rgba(217,164,65,0.35)'  },
  importer_activity:    { label: 'MARKET',       color: '#6FCF7D', bg: 'rgba(111,207,125,0.12)', border: 'rgba(111,207,125,0.30)' },
  buyer_demand:         { label: 'MARKET',       color: '#6FCF7D', bg: 'rgba(111,207,125,0.12)', border: 'rgba(111,207,125,0.30)' },
  new_product_category: { label: 'TRADE',        color: '#B07ED4', bg: 'rgba(139,95,168,0.15)',  border: 'rgba(139,95,168,0.30)'  },
  distressed_asset:     { label: 'SUPPLY CHAIN', color: '#D49560', bg: 'rgba(184,115,51,0.15)',  border: 'rgba(184,115,51,0.30)'  },
  facility_expansion:   { label: 'INVESTMENT',   color: '#8AAFE8', bg: 'rgba(100,149,237,0.12)', border: 'rgba(100,149,237,0.25)' },
  story:                { label: 'STORY',        color: '#E8C87A', bg: 'rgba(232,200,122,0.12)', border: 'rgba(232,200,122,0.30)' },
  research:             { label: 'RESEARCH',     color: '#8AAFE8', bg: 'rgba(100,149,237,0.12)', border: 'rgba(100,149,237,0.25)' },
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
  story:         'story',
  research:      'research',
}

const WINDOWS = [
  { key: '24h' as const, hours: 24 },
  { key: '7d'  as const, hours: 24 * 7 },
  { key: '30d' as const, hours: 24 * 30 },
]

function stripHtml(raw: string): string {
  return cleanPlainText(raw, 200)
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

type SignalRow = SignalQualityRow & {
  id: string
  headline: string
  cat: string | null
  top_lane: string | null
  pri: string | null
  country: string | null
  date: string | null
  created_at: string
}

function rowToSignal(s: SignalRow, corrIndex: Map<string, number>): DashboardSignal {
  const contentType = typeof s.content_type === 'string' ? s.content_type.toLowerCase() : ''
  const laneKey = (contentType || s.top_lane || s.cat || '').toLowerCase()
  const tagKey  = LANE_TO_TAG[laneKey] ?? 'regulatory_change'
  const tag     = SIGNAL_TAG_MAP[tagKey] ?? SIGNAL_TAG_MAP.regulatory_change
  const market  = s.country ?? ''
  const pri     = (s.pri ?? '').toLowerCase()
  const urgency = pri === 'urgent' ? 'Urgent'
                : pri === 'high'   ? 'High-priority'
                : pri === 'medium' ? 'Medium-priority'
                : 'Monitoring-level'
  const corr = corroborationCount(s, corrIndex)
  const corrNote = corr > 1 ? ` · ${corr} sources reporting` : ''
  const title = displayHeadline(s) ?? s.headline

  return {
    id:               s.id,
    slug:             undefined,
    title:            stripHtml(title),
    type:             tagKey,
    market,
    tag,
    timeAgo:          timeAgo(s.date ?? s.created_at),
    confidence:       resolveConfidence(s) ?? 50,
    commercialImpact: `${urgency} ${laneKey || 'regulatory'} signal${market ? ` · ${market}` : ''}${corrNote}.`,
    sourceLabel:      'Harbourview Intelligence',
    flag:             flagForMarket(market),
    contentType:      'signal',
    corroborationCount: corr,
    translated: isTranslated(s),
    originalLanguageLabel: originalLanguageLabel(s),
    signalContentType: resolveContentType(s),
  }
}

function isWithin(row: SignalRow, hours: number): boolean {
  const ref = row.date ?? row.created_at
  if (!ref) return false
  const diff = Date.now() - new Date(ref).getTime()
  return diff <= hours * 3_600_000 && diff >= 0
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const countryParam = (searchParams.get('country') ?? '').trim().replace(/[,()]/g, '')
  const parsedLimit  = parseInt(searchParams.get('limit') ?? '20', 10)
  const limit        = Math.min(Math.max(Number.isFinite(parsedLimit) ? parsedLimit : 20, 1), 40)
  const isCountryFiltered = Boolean(countryParam && countryParam !== 'all')

  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { data: edition, error: editionError } = await supabase
      .from('daily_digest')
      .select('digest_date, headlines, editorial_headlines, generated_at')
      .eq('status', 'published')
      .order('digest_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (editionError) {
      console.error('[/api/dashboard/digest] daily_digest edition query failed:', editionError.message)
    }

    type EditorialHeadline = { headline?: string; why_it_matters?: string; market?: string; signal_id?: string }
    type NewsHeadline = { headline?: string; why_it_matters?: string; market?: string; item_id?: string; published_at?: string; source_url?: string; outlet_name?: string }

    const hasSignalEdition    = edition && Array.isArray(edition.headlines) && edition.headlines.length > 0
    const hasEditorialEdition = edition && Array.isArray(edition.editorial_headlines) && edition.editorial_headlines.length > 0

    if (hasSignalEdition || hasEditorialEdition) {
      let signalItems = (hasSignalEdition ? edition!.headlines as EditorialHeadline[] : [])
        .filter(h => typeof h?.headline === 'string' && h.headline.length > 0)
      let newsItems = (hasEditorialEdition ? edition!.editorial_headlines as NewsHeadline[] : [])
        .filter(h => typeof h?.headline === 'string' && h.headline.length > 0)

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

      const sourceSignalIds = [...new Set(
        signalItems
          .map((item) => typeof item.signal_id === 'string' ? item.signal_id : '')
          .filter(Boolean),
      )]
      let confidenceBySignalId = new Map<string, number>()
      if (sourceSignalIds.length > 0) {
        const { data: sourceConfidenceRows, error: sourceConfidenceError } = await supabase
          .from('signals_quality')
          .select('id, quality_confidence')
          .in('id', sourceSignalIds)

        if (sourceConfidenceError) {
          console.error(
            '[/api/dashboard/digest] source confidence query failed:',
            sourceConfidenceError.message,
          )
        } else {
          confidenceBySignalId = buildDigestConfidenceMap(sourceConfidenceRows)
        }
      }

      const todayUtc  = new Date().toISOString().slice(0, 10)
      const windowKey = edition!.digest_date === todayUtc ? '24h' as const : 'recent' as const
      const tag       = SIGNAL_TAG_MAP.regulatory_change
      const editorialTag = { label: 'NEWS', color: '#B8AF9E', bg: 'rgba(184,175,158,0.10)', border: 'rgba(184,175,158,0.25)' }

      const signalSignals: DashboardSignal[] = signalItems.slice(0, limit).map((h, i) => ({
        id:               h.signal_id ?? `digest-${edition!.digest_date}-${i}`,
        slug:             undefined,
        title:            stripHtml(h.headline!),
        type:             'regulatory_change',
        market:           h.market ?? 'Global',
        tag,
        timeAgo:          timeAgo(edition!.generated_at),
        confidence:       h.signal_id ? (confidenceBySignalId.get(h.signal_id) ?? 80) : 80,
        commercialImpact: stripHtml(h.why_it_matters ?? ''),
        sourceLabel:      'Harbourview Daily',
        flag:             flagForMarket(h.market ?? 'Global'),
        contentType:      'signal',
      }))

      const newsSignals: DashboardSignal[] = newsItems.map((h, i) => ({
        id:               h.item_id ?? `editorial-${edition!.digest_date}-${i}`,
        slug:             undefined,
        title:            stripHtml(h.headline!),
        type:             'editorial',
        market:           h.market ?? 'Global',
        tag:              editorialTag,
        timeAgo:          publishedLabel(h.published_at),
        confidence:       0,
        commercialImpact: stripHtml(h.why_it_matters ?? ''),
        sourceLabel:      h.outlet_name ?? 'Global Cannabis News',
        sourceUrl:        h.source_url,
        flag:             flagForMarket(h.market ?? 'Global'),
        contentType:      'editorial',
      }))

      const signals = [...signalSignals, ...newsSignals].slice(0, limit)
      const total = signalItems.length + newsItems.length

      return NextResponse.json(
        { signals, window: windowKey, total, source: 'live', mode: 'curated-edition' },
        { headers: { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=60' } },
      )
    }

    let query = supabase
      .from('signals_quality')
      .select(SAFE_SELECT, { count: 'exact' })
      .eq('reviewed', true)
      .order('created_at', { ascending: false })
      .not('quality_label', 'in', QUALITY_LABEL_NOT_IN)
      .order('quality_confidence', { ascending: false, nullsFirst: false })

    if (isCountryFiltered) {
      query = query.or(`country.ilike.%${countryParam}%,country.eq.Global`)
    }

    const { data, error, count } = await query.range(0, 199)

    if (error) {
      console.error('[/api/dashboard/digest] supabase error:', error.message)
      return NextResponse.json(
        { signals: [], window: 'recent', total: 0, source: 'error', error: error.message },
        { status: 500 },
      )
    }

    let rows = (data ?? []) as SignalRow[]
    const corrIndex = buildCorroborationIndex(rows)
    const feedbackMap = await loadFeedbackScores(supabase, rows.map((r) => r.id))

    if (isCountryFiltered) {
      const needle = countryParam.toLowerCase()
      const countrySpecific = rows.filter(r => r.country?.toLowerCase().includes(needle))
      const global          = rows.filter(r => !r.country?.toLowerCase().includes(needle))
      rows = [...countrySpecific, ...global]
    }

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
    if (windowed.length === 0) {
      windowKey = 'recent'
      windowed = rows
    }

    const candidates: DigestCandidate[] = windowed.map((r) => ({
      ...r,
      corroboration_count: corroborationCount(r, corrIndex),
      feedback_score: feedbackMap.get(r.id) ?? 0,
    }))

    const ranked = rankDigestCandidates(candidates, {
      maxPerCountry: isCountryFiltered ? 40 : 3,
      limit: Math.max(limit * 2, 24),
    })

    const byId = new Map(windowed.map((r) => [r.id, r]))
    const ordered = ranked
      .map((item) => byId.get(item.id))
      .filter((r): r is SignalRow => Boolean(r))

    const finalRows = ordered.length > 0 ? ordered : windowed
    const signals = finalRows.slice(0, limit).map((r) => rowToSignal(r, corrIndex))

    return NextResponse.json(
      {
        signals,
        window: windowKey,
        total: finalRows.length,
        totalReviewed: count ?? finalRows.length,
        source: 'live',
        mode: 'elite-ranked-fallback',
        feedbackApplied: feedbackMap.size > 0,
      },
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
