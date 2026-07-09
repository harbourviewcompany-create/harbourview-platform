// app/api/signals/search/route.ts
// Hybrid semantic + keyword search over ia_signals.
// Uses Google text-embedding-004 to vectorise the query, then calls
// ia_search_signals() RPC (cosine similarity over HNSW index).
// Falls back to keyword-only if embedding fails.
//
// Auth: authenticated users with intel or operator tier only.
// Rate: inherits Supabase RLS — ia_signals_intel_tier_read policy.
//
// POST { query, market?, type?, stage?, limit? }
// → { ok, results: SignalSearchResult[], mode: 'semantic' | 'keyword', count }

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { embedText, toVectorLiteral } from '@/lib/ai/embeddings'

export const dynamic = 'force-dynamic'

const DEFAULT_LIMIT = 20
const MAX_LIMIT     = 50

interface SearchBody {
  query?:  unknown
  market?: unknown
  type?:   unknown
  stage?:  unknown
  limit?:  unknown
}

// ── Auth ──────────────────────────────────────────────────────────────────────
async function getAuthedUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    },
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

// ── Keyword fallback ──────────────────────────────────────────────────────────
async function keywordSearch(
  supabase: ReturnType<typeof serviceClient>,
  query: string,
  market: string | null,
  type: string | null,
  stage: string | null,
  limit: number,
) {
  let q = supabase
    .from('ia_signals')
    .select('id, title, type, stage, market, category, confidence, commercial_impact, summary, detected_at')
    .or(`title.ilike.%${query}%,summary.ilike.%${query}%`)
    .order('detected_at', { ascending: false })
    .limit(limit)

  if (market) q = q.eq('market', market)
  if (type)   q = q.eq('type', type)
  if (stage)  q = q.eq('stage', stage)

  const { data, error } = await q
  return { data, error }
}

// ── POST handler ──────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  const user = await getAuthedUser()
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Tier check
  const svc = serviceClient()
  const { data: profile } = await svc
    .from('user_profiles')
    .select('tier')
    .eq('id', user.id)
    .single()

  if (!profile || !['intel', 'operator'].includes(profile.tier ?? '')) {
    return NextResponse.json(
      { error: 'Signal search requires an Intel or Operator plan.', upgrade: true },
      { status: 403 },
    )
  }

  let body: SearchBody
  try {
    body = await request.json() as SearchBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const query = typeof body.query === 'string' ? body.query.trim() : ''
  if (!query || query.length < 2)
    return NextResponse.json({ error: 'query must be at least 2 characters' }, { status: 400 })

  const market = typeof body.market === 'string' ? body.market : null
  const type   = typeof body.type   === 'string' ? body.type   : null
  const stage  = typeof body.stage  === 'string' ? body.stage  : null
  const limit  = typeof body.limit  === 'number'
    ? Math.min(Math.max(1, body.limit), MAX_LIMIT)
    : DEFAULT_LIMIT

  // ── Try semantic search first ─────────────────────────────────────────────
  try {
    const embedding = await embedText(query)
    const vectorLiteral = toVectorLiteral(embedding)

    const { data: semanticResults, error: rpcErr } = await svc.rpc('ia_search_signals', {
      p_query_embedding:  vectorLiteral,
      p_match_count:      limit,
      p_market:           market,
      p_type:             type,
      p_stage:            stage,
    })

    if (!rpcErr && semanticResults && semanticResults.length > 0) {
      return NextResponse.json({
        ok:      true,
        mode:    'semantic',
        count:   semanticResults.length,
        results: semanticResults,
      })
    }

    // RPC returned 0 results (no embeddings yet) — fall through to keyword
  } catch (embedErr) {
    // Embedding failed (API key missing, quota, etc.) — fall through
    console.warn('signals/search: embedding failed, falling back to keyword:', embedErr instanceof Error ? embedErr.message : embedErr)
  }

  // ── Keyword fallback ──────────────────────────────────────────────────────
  const { data: kwResults, error: kwErr } = await keywordSearch(svc, query, market, type, stage, limit)

  if (kwErr)
    return NextResponse.json({ error: kwErr.message }, { status: 500 })

  return NextResponse.json({
    ok:      true,
    mode:    'keyword',
    count:   (kwResults ?? []).length,
    results: kwResults ?? [],
  })
}
