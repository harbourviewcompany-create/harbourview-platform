// app/api/signals/search/route.ts
// Semantic + keyword search over public.signals -- Pipeline B, the canonical
// customer-facing feed also served by lib/regulatory-signals/public.ts.
//
// Previously queried `ia_signals`, a smaller, disconnected table (see
// docs/control/PIPELINE_DEPENDENCY_MAP.md): nothing in the app called this
// route, so the mismatch had gone unnoticed. Retargeted to the same table,
// quality filters, and display conventions (lib/signals/quality.ts) as every
// other customer-facing signal read path, so a search result looks and
// behaves like the feed it's searching.
//
// Auth/tier gating is UNCHANGED from the previous version -- that is a
// product/monetisation decision, not something this pass touches.
//
// POST { query, country?, contentType?, limit? }
// -> { ok, results: SignalSearchResult[], mode: 'semantic' | 'keyword', count }

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { embedSearchQuery1024, toVectorLiteral } from '@/lib/ai/embedSearchQuery1024'
import {
  QUALITY_LABEL_NOT_IN,
  SIGNALS_FEED_CONTENT_TYPE_NOT_IN,
  displayHeadline,
  displaySummary,
  resolveConfidence,
  resolveConfidenceBand,
  resolveContentType,
  resolveImpact,
  isTranslated,
  originalLanguageLabel,
  type SignalQualityRow,
} from '@/lib/signals/quality'

export const dynamic = 'force-dynamic'

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 50

export interface SignalSearchResult {
  id: string
  headline: string
  summary: string
  country: string | null
  content_type: string | null
  confidence: ReturnType<typeof resolveConfidenceBand>
  confidence_score: number | null
  impact_level: ReturnType<typeof resolveImpact>
  source: string | null
  url: string | null
  date: string | null
  translated: boolean
  original_language_label: string | null
  similarity: number | null
}

interface SearchBody {
  query?: unknown
  country?: unknown
  contentType?: unknown
  limit?: unknown
}

// ── Auth (unchanged) ─────────────────────────────────────────────────────────
async function getAuthedUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Default (public) schema client. PostgREST's exposed default on this
// project is `public` -- confirmed live: api.signals does NOT carry the
// Pipeline B quality columns (quality_label/title_en/etc.), while every
// currently-working read path (lib/regulatory-signals/public.ts,
// lib/dashboard/dashboardServerData.ts) queries `signals` directly with no
// schema override and gets them. Do not add `db: { schema: 'api' }` here.
function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

function toResult(row: Record<string, unknown>): SignalSearchResult | null {
  const quality = row as SignalQualityRow
  const headline = displayHeadline(quality)
  if (!headline) return null

  return {
    id: typeof row.id === 'string' ? row.id : String(row.id ?? ''),
    headline,
    summary: displaySummary(quality) ?? 'No summary available.',
    country: typeof row.country === 'string' ? row.country : null,
    content_type: resolveContentType(quality),
    confidence: resolveConfidenceBand(quality),
    confidence_score: resolveConfidence(quality),
    impact_level: resolveImpact(quality),
    source: typeof row.source === 'string' ? row.source : null,
    url: typeof row.url === 'string' ? row.url : null,
    date: typeof row.date === 'string' ? row.date.slice(0, 10) : null,
    translated: isTranslated(quality),
    original_language_label: originalLanguageLabel(quality),
    similarity: typeof row.similarity === 'number' ? row.similarity : null,
  }
}

// ── Keyword fallback, retargeted to public.signals ─────────────────────────────
async function keywordSearch(
  supabase: ReturnType<typeof serviceClient>,
  query: string,
  country: string | null,
  contentType: string | null,
  limit: number,
) {
  let q = supabase
    .from('signals')
    .select(`id,date,cat,headline,summary,country,source,url,tier,created_at,reviewed,quality_label,quality_confidence,content_type,impact,title_en,summary_en,lang_detected`)
    .eq('reviewed', true)
    .or(`headline.ilike.%${query}%,summary.ilike.%${query}%,title_en.ilike.%${query}%,summary_en.ilike.%${query}%`)
    .not('quality_label', 'in', QUALITY_LABEL_NOT_IN)
    .order('quality_confidence', { ascending: false, nullsFirst: false })
    .order('date', { ascending: false })
    .limit(limit)

  if (country) q = q.ilike('country', country)

  // Stage D, kept in step with api.search_public_signals so both search modes
  // return the same set. `noise` never surfaces anywhere; story/research are
  // digest-bound and only appear when explicitly asked for. Both filters spell
  // out the NULL case because `NULL not in (...)` is NULL, not TRUE, and would
  // silently drop every pre-Pipeline-B row.
  if (contentType) {
    q = q.eq('content_type', contentType).neq('content_type', 'noise')
  } else {
    q = q.or(`content_type.is.null,content_type.not.in.${SIGNALS_FEED_CONTENT_TYPE_NOT_IN}`)
  }

  return q
}

// ── POST handler ─────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  const user = await getAuthedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const svc = serviceClient()
  const { data: profile } = await svc.from('user_profiles').select('tier').eq('id', user.id).single()
  if (!profile || !['intel', 'operator'].includes(profile.tier ?? '')) {
    return NextResponse.json(
      { error: 'Signal search requires an Intel or Operator plan.', upgrade: true },
      { status: 403 },
    )
  }

  let body: SearchBody
  try {
    body = (await request.json()) as SearchBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const query = typeof body.query === 'string' ? body.query.trim() : ''
  if (!query || query.length < 2) {
    return NextResponse.json({ error: 'query must be at least 2 characters' }, { status: 400 })
  }

  const country = typeof body.country === 'string' && body.country ? body.country : null
  const contentType = typeof body.contentType === 'string' && body.contentType ? body.contentType : null
  const limit = typeof body.limit === 'number' ? Math.min(Math.max(1, body.limit), MAX_LIMIT) : DEFAULT_LIMIT

  // ── Semantic search first ───────────────────────────────────────────────────
  try {
    const embedding = await embedSearchQuery1024(query)
    const vectorLiteral = toVectorLiteral(embedding)

    // search_public_signals lives in the `api` schema (RPC convention for this
    // project, unlike base-table reads) -- scope this one call explicitly.
    const { data: rows, error: rpcErr } = await svc.schema('api').rpc('search_public_signals', {
      p_query_embedding: vectorLiteral,
      p_match_count: limit,
      p_country: country,
      p_content_type: contentType,
    })

    if (!rpcErr && Array.isArray(rows) && rows.length > 0) {
      const results = rows.map(toResult).filter((r): r is SignalSearchResult => r !== null)
      return NextResponse.json({ ok: true, mode: 'semantic', count: results.length, results })
    }
    // 0 rows or RPC error -- fall through to keyword.
  } catch (embedErr) {
    console.warn(
      'signals/search: embedding failed, falling back to keyword:',
      embedErr instanceof Error ? embedErr.message : embedErr,
    )
  }

  // ── Keyword fallback ─────────────────────────────────────────────────────────
  const { data: kwRows, error: kwErr } = await keywordSearch(svc, query, country, contentType, limit)
  if (kwErr) return NextResponse.json({ error: kwErr.message }, { status: 500 })

  const results = (kwRows ?? []).map(toResult).filter((r): r is SignalSearchResult => r !== null)
  return NextResponse.json({ ok: true, mode: 'keyword', count: results.length, results })
}
