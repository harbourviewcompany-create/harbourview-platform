/**
 * GET /api/dashboard/signals
 *
 * Canonical live Weekly Signals feed for the authenticated Command Centre.
 * Reads `signals_with_quality`, projects an explicit safe DTO, then applies one
 * freshness/dedup/ranking contract shared with the mobile realtime hook.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import { buildSafeSignalPresentation } from '@/lib/dashboard/signalPresentation'
import {
  canonicalizeDashboardSignals,
  formatSignalAge,
  isGlobalSignalScope,
  resolveSignalFreshness,
  WEEKLY_SIGNAL_WINDOW_DAYS,
} from '@/lib/dashboard/signalFreshness'
import { flagForMarket } from '@/lib/utils/flagEmoji'
import {
  SIGNAL_QUALITY_SELECT,
  QUALITY_LABEL_NOT_IN,
  NOT_REJECTED_OR_FILTER,
  resolveConfidence,
  resolveContentType,
  displayHeadline,
  buildCorroborationIndex,
  corroborationCount,
  isTranslated,
  originalLanguageLabel,
  type SignalQualityRow,
} from '@/lib/signals/quality'

const TIMELINE_FIELDS = 'source_published_at, event_effective_at, observed_at, ingested_at' as const
const PRESENTATION_SELECT = `id, headline, summary, source, url, verification, commercial_impact, analysis, cat, top_lane, pri, country, date, created_at, ${TIMELINE_FIELDS}, reviewed, ${SIGNAL_QUALITY_SELECT}` as const
const LEGACY_PRESENTATION_SELECT = `id, headline, summary, source, url, verification, commercial_impact, analysis, cat, top_lane, pri, country, date, created_at, reviewed, ${SIGNAL_QUALITY_SELECT}` as const
const LEGACY_SELECT = `id, headline, cat, top_lane, pri, country, date, created_at, reviewed, ${SIGNAL_QUALITY_SELECT}` as const

const LANE_TOP_LANES: Record<string, string[]> = {
  regulatory: ['regulatory', 'REGULATORY', 'GAZETTE', 'PARLIAMENTARY', 'PRESS_RELEASE'],
  economic:   ['market', 'financial', 'intelligence', 'MARKET', 'FINANCIAL', 'MDB_PROJECT'],
  trade:      ['trade', 'supply', 'SOURCE_ENGINE', 'TRADE', 'SUPPLY', 'LICENSING'],
}

const SIGNAL_TAG_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
  regulatory_change:    { label: 'REGULATION',   color: '#D9A441', bg: 'rgba(217,164,65,0.15)',  border: 'rgba(217,164,65,0.35)'  },
  importer_activity:    { label: 'MARKET',       color: '#6FCF7D', bg: 'rgba(111,207,125,0.12)', border: 'rgba(111,207,125,0.30)' },
  buyer_demand:         { label: 'MARKET',       color: '#6FCF7D', bg: 'rgba(111,207,125,0.12)', border: 'rgba(111,207,125,0.30)' },
  new_product_category: { label: 'TRADE',        color: '#B07ED4', bg: 'rgba(139,95,168,0.15)',  border: 'rgba(139,95,168,0.30)' },
  distressed_asset:     { label: 'SUPPLY CHAIN', color: '#D49560', bg: 'rgba(184,115,51,0.15)',  border: 'rgba(184,115,51,0.30)' },
  facility_expansion:   { label: 'INVESTMENT',   color: '#8AAFE8', bg: 'rgba(100,149,237,0.12)', border: 'rgba(100,149,237,0.25)' },
  story:                { label: 'STORY',        color: '#E8C87A', bg: 'rgba(232,200,122,0.12)',  border: 'rgba(232,200,122,0.30)' },
  research:             { label: 'RESEARCH',     color: '#8AAFE8', bg: 'rgba(100,149,237,0.12)', border: 'rgba(100,149,237,0.25)' },
}

const LANE_TO_TAG: Record<string, string> = {
  regulatory: 'regulatory_change',
  gazette: 'regulatory_change',
  parliamentary: 'regulatory_change',
  press_release: 'regulatory_change',
  market: 'importer_activity',
  intelligence: 'importer_activity',
  mdb_project: 'importer_activity',
  financial: 'facility_expansion',
  trade: 'new_product_category',
  supply: 'distressed_asset',
  source_engine: 'regulatory_change',
  licensing: 'importer_activity',
  story: 'story',
  research: 'research',
}

function stripHtml(raw: string): string {
  return raw
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 240)
}

type SignalRow = SignalQualityRow & {
  id: string
  headline: string
  summary?: string | null
  source?: string | null
  url?: string | null
  verification?: string | null
  commercial_impact?: string | null
  analysis?: unknown
  cat: string | null
  top_lane: string | null
  pri: string | null
  country: string | null
  date: string | null
  created_at: string
  source_published_at?: string | null
  event_effective_at?: string | null
  observed_at?: string | null
  ingested_at?: string | null
}

type QueryError = { code?: string; message?: string }

function isSchemaGap(error: QueryError, columns: string[]) {
  if (error.code === '42703' || error.code === 'PGRST204') return true
  const message = (error.message ?? '').toLowerCase()
  return columns.some(column => message.includes(column) && (message.includes('column') || message.includes('schema cache')))
}

function isTimelineSchemaGap(error: QueryError) {
  return isSchemaGap(error, ['source_published_at', 'event_effective_at', 'observed_at', 'ingested_at'])
}

function isPresentationSchemaGap(error: QueryError) {
  return isSchemaGap(error, ['summary', 'source', 'url', 'verification', 'commercial_impact', 'analysis'])
}

export function rowToDashboardSignal(s: SignalRow, corrIndex: Map<string, number>): DashboardSignal {
  const contentType = typeof s.content_type === 'string' ? s.content_type.toLowerCase() : ''
  const laneKey = (contentType || s.top_lane || s.cat || '').toLowerCase()
  const tagKey = LANE_TO_TAG[laneKey] ?? 'regulatory_change'
  const tag = SIGNAL_TAG_MAP[tagKey] ?? SIGNAL_TAG_MAP.regulatory_change
  const market = s.country ?? ''
  const pri = (s.pri ?? '').toLowerCase()
  const urgency = pri === 'urgent' ? 'Urgent'
    : pri === 'high' ? 'High-priority'
      : pri === 'medium' ? 'Medium-priority'
        : 'Monitoring-level'
  const corr = corroborationCount(s, corrIndex)
  const corrNote = corr > 1 ? ` · ${corr} sources reporting` : ''
  const title = displayHeadline(s) ?? s.headline
  const safe = buildSafeSignalPresentation(s)

  const base: DashboardSignal = {
    ...safe,
    id: s.id,
    slug: undefined,
    title: stripHtml(title),
    type: tagKey,
    market,
    tag,
    timeAgo: 'Date unknown',
    confidence: resolveConfidence(s) ?? 50,
    commercialImpact: safe.commercialImpact ?? `${urgency} ${laneKey || 'regulatory'} signal${market ? ` · ${market}` : ''}${corrNote}.`,
    sourceLabel: safe.sourceLabel ?? 'Harbourview Intelligence',
    flag: flagForMarket(market),
    contentType: 'signal',
    corroborationCount: corr,
    translated: isTranslated(s),
    originalLanguageLabel: originalLanguageLabel(s),
    signalContentType: resolveContentType(s),
  }

  const freshness = resolveSignalFreshness(base)
  return {
    ...base,
    freshnessAt: freshness.at,
    freshnessBasis: freshness.basis,
    timeAgo: formatSignalAge(freshness.at),
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const countryParam = (searchParams.get('country') ?? 'all').trim().replace(/[,()]/g, '') || 'all'
  const lane = (searchParams.get('lane') ?? 'all').toLowerCase()
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '25', 10), 1), 100)
  const offset = Math.max(parseInt(searchParams.get('offset') ?? '0', 10), 0)

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const isCountryFiltered = !isGlobalSignalScope(countryParam)
    // Fetch a candidate pool large enough for the 7-day freshness gate and
    // duplicate suppression to operate before the final limit is applied.
    const fetchLimit = Math.min(Math.max(limit * 8, 80), 400)

    const executeQuery = async (selectFields: string) => {
      let query = supabase
        .from('signals_with_quality')
        .select(selectFields, { count: 'exact' })
        .eq('reviewed', true)
        .or(NOT_REJECTED_OR_FILTER)
        .not('quality_label', 'in', QUALITY_LABEL_NOT_IN)
        // Recency is the primary candidate order. Confidence breaks ties only.
        .order('date', { ascending: false, nullsFirst: false })
        .order('quality_confidence', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })

      if (isCountryFiltered) query = query.or(`country.ilike.%${countryParam}%,country.eq.Global`)
      if (lane !== 'all' && LANE_TOP_LANES[lane]) query = query.in('top_lane', LANE_TOP_LANES[lane])

      return query.range(offset, offset + fetchLimit - 1)
    }

    let result = await executeQuery(PRESENTATION_SELECT)
    if (result.error && isTimelineSchemaGap(result.error)) {
      result = await executeQuery(LEGACY_PRESENTATION_SELECT)
    }
    if (result.error && isPresentationSchemaGap(result.error)) {
      result = await executeQuery(LEGACY_SELECT)
    }

    const { data, error, count } = result
    if (error) {
      console.error('[/api/dashboard/signals] supabase error:', error.message)
      return NextResponse.json({ signals: [], total: 0, source: 'error', error: error.message }, { status: 500 })
    }

    const rows = (data ?? []) as unknown as SignalRow[]
    const corrIndex = buildCorroborationIndex(rows)
    const scope = isCountryFiltered ? countryParam : 'all'
    const signals = canonicalizeDashboardSignals(
      rows.map(row => rowToDashboardSignal(row, corrIndex)),
      scope,
      { windowDays: WEEKLY_SIGNAL_WINDOW_DAYS, limit },
    )

    return NextResponse.json(
      {
        signals,
        total: signals.length,
        candidateTotal: count ?? rows.length,
        source: 'live',
        windowDays: WEEKLY_SIGNAL_WINDOW_DAYS,
      },
      { headers: { 'Cache-Control': 'private, no-store, max-age=0' } },
    )
  } catch (err) {
    console.error('[/api/dashboard/signals] unexpected error:', err)
    return NextResponse.json({ signals: [], total: 0, source: 'error' }, { status: 500 })
  }
}
