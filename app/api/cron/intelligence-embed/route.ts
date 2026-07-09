// app/api/cron/intelligence-embed/route.ts
// Generates Google text-embedding-004 (768-dim) embeddings for ia_signals.
// Free — uses GOOGLE_API_KEY already set in Vercel.
//
// Pipeline: intelligence-extract (04:00) → intelligence-embed (06:00 UTC)

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { embedText, toVectorLiteral } from '@/lib/ai/embeddings'

export const dynamic   = 'force-dynamic'
export const maxDuration = 300

const BATCH_SIZE = 20

interface SignalRow {
  id: string
  title: string
  summary: string
  market: string | null
  type: string | null
}

function buildEmbedInput(s: SignalRow): string {
  return [
    s.title,
    s.market ? `Market: ${s.market}` : '',
    s.type   ? `Type: ${s.type}` : '',
    s.summary,
  ].filter(Boolean).join('\n')
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret)
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 })
  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.GOOGLE_API_KEY && !process.env.GEMINI_API_KEY) {
    console.warn('intelligence_embed_cron: GOOGLE_API_KEY not set — skipping')
    return NextResponse.json({ ok: false, reason: 'GOOGLE_API_KEY not configured' })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  // Pull newest signals, subtract already-embedded
  const { data: candidates, error: fetchErr } = await supabase
    .from('ia_signals')
    .select('id, title, summary, market, type')
    .order('created_at', { ascending: false })
    .limit(BATCH_SIZE * 3)

  if (fetchErr)
    return NextResponse.json({ ok: false, error: fetchErr.message }, { status: 500 })

  const allCandidates = (candidates as SignalRow[] | null) ?? []
  if (allCandidates.length === 0)
    return NextResponse.json({ ok: true, embedded: 0, failed: 0 })

  const { data: existing } = await supabase
    .from('ia_signal_embeddings')
    .select('signal_id')
    .in('signal_id', allCandidates.map(r => r.id))

  const done = new Set((existing ?? []).map((r: { signal_id: string }) => r.signal_id))
  const toProcess = allCandidates.filter(r => !done.has(r.id)).slice(0, BATCH_SIZE)

  if (toProcess.length === 0)
    return NextResponse.json({ ok: true, embedded: 0, failed: 0, skipped: allCandidates.length })

  let embedded = 0, failed = 0

  for (const signal of toProcess) {
    try {
      const vec = await embedText(buildEmbedInput(signal))

      const { error } = await supabase
        .from('ia_signal_embeddings')
        .upsert(
          { signal_id: signal.id, embedding: toVectorLiteral(vec), model: 'text-embedding-004' },
          { onConflict: 'signal_id' },
        )

      if (error) { failed++; continue }
      embedded++
    } catch (err) {
      console.error(`embed cron: failed for ${signal.id}:`, err instanceof Error ? err.message : err)
      failed++
    }
  }

  const summary = { ok: true, embedded, failed, skipped: done.size }
  console.info('intelligence_embed_cron:', summary)
  return NextResponse.json(summary)
}
