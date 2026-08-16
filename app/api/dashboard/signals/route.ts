/**
 * GET /api/dashboard/signals
 *
 * Live paginated signals for CommandCentre. Reads `signals_with_quality` and
 * projects an explicit authenticated presentation DTO. Raw analysis/provenance
 * JSON is never returned to the client.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import { buildSafeSignalPresentation } from '@/lib/dashboard/signalPresentation'
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

const PRESENTATION_SELECT = `id, headline, summary, source, url, verification, commercial_impact, analysis, cat, top_lane, pri, country, date, created_at, reviewed, ${SIGNAL_QUALITY_SELECT}` as const
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
  new_product_category: { label: 'TRADE',        color: '#B07ED4', bg: 'rgba(139,95,168,0.15)',  border: 'rgba(139,95,168,0.30)'  },
  distressed_asset:     { label: 'SUPPLY CHAIN', color: '#D49560', bg: 'rgba(184,115,51,0.15)',  border: 'rgba(184,115,51,0.30)'  },
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

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Recently'
  try {
    const diff = Date.now() - new Date(dateStr).getTime()
    const h = Math.floor(diff / 3_600_000)
    if (h < 1) return 'Just now'
    if (h < 24) return `${h}h ago`
    const d = Math.floor(h / 24)
    if (d < 7) return `${d}d ago`
    return `${Math.floor(d / 7)}w ago`
  } catch {
    return 'Recently'
  }
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
}

type QueryError = { code?: string; message?: string }

function isPresentationSchemaGap(error: QueryError): boolean {
  if (error.code === '42703' || error.code === 'PGRST204') return true
  const message = (error.message ?? '').toLowerCase()
  return ['summary', 'source', 'url', 'verification', 'commercial_impact', 'analysis']
    .some(column => message.includes(column) && (message.includes('column') || message.includes('schema cache')))
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

  return {
    ...safe,
    id: s.id,
    slug: undefined,
    title: stripHtml(title),
    type: tagKey,
    market,
    tag,
    timeAgo: timeAgo(s.date ?? s.created_at),
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
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const countryParam = (searchParams.get('country') ?? '').trim().replace(/[,()]/g, '')
  const lane = (searchParams.get('lane') ?? 'all').toLowerCase()
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '25', 10), 1), 100)
  const offset = Math.max(parseInt(searchParams.get('offset') ?? '0', 10), 0)

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const isCountryFiltered = Boolean(countryParam && countryParam !== 'all')
    const fetchLimit = isCountryFiltered ? Math.min(limit * 4, 400) : limit

    const executeQuery = async (selectFields: string) => {
      let query = supabase
        .from('signals_with_quality')
        .select(selectFields, { count: 'exact' })
        .eq('reviewed', true)
        .or(NOT_REJECTED_OR_FILTER)
        .not('quality_label', 'in', QUALITY_LABEL_NOT_IN)
        .order('quality_confidence', { ascending: false, nullsFirst: false })
        .order('date', { ascending: false })

      if (isCountryFiltered) query = query.or(`country.ilike.%${countryParam}%,country.eq.Global`)
      if (lane !== 'all' && LANE_TOP_LANES[lane]) query = query.in('top_lane', LANE_TOP_LANES[lane])

      return query.range(offset, offset + fetchLimit - 1)
    }

    let result = await executeQuery(PRESENTATION_SELECT)
    if (result.error && isPresentationSchemaGap(result.error)) {
      // Isolated CI and staged schema transitions can legitimately expose the
      // legacy quality view before presentation columns are available. Fall
      // back to the historical allowlist rather than turning Command into a
      // 500 surface. The DTO projector receives no raw analysis in this path.
      result = await executeQuery(LEGACY_SELECT)
    }

    const { data, error, count } = result
    if (error) {
      console.error('[/api/dashboard/signals] supabase error:', error.message)
      return NextResponse.json({ signals: [], total: 0, source: 'error', error: error.message }, { status: 500 })
    }

    let rows = (data ?? []) as unknown as SignalRow[]
    const corrIndex = buildCorroborationIndex(rows)

    if (isCountryFiltered) {
      const needle = countryParam.toLowerCase()
      const countrySpecific = rows.filter(r => r.country?.toLowerCase().includes(needle))
      const global = rows.filter(r => !r.country?.toLowerCase().includes(needle))
      rows = [...countrySpecific, ...global].slice(0, limit)
    }

    const signals = rows.map(r => rowToDashboardSignal(r, corrIndex))

    return NextResponse.json(
      { signals, total: count ?? signals.length, source: 'live' },
      { headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=30' } },
    )
  } catch (err) {
    console.error('[/api/dashboard/signals] unexpected error:', err)
    return NextResponse.json({ signals: [], total: 0, source: 'error' }, { status: 500 })
  }
}
