// app/api/cron/intelligence-embed/route.ts
// Vercel Cron — generates BGE-M3 1024-dim embeddings for ia_signals
// that do not yet have a row in ia_signal_embeddings.
//
// Pipeline: intelligence-extract (04:00 UTC) → intelligence-embed (06:00 UTC)
//           scrape cron moved to 08:00 UTC
//
// Processes up to BATCH_SIZE signals per run.
// Upserts on conflict so re-runs are idempotent.
//
// Required env vars:
//   CRON_SECRET
//   HF_TOKEN_SERVER
//   HF_ENDPOINT_EMBED_BGE_M3
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { embedBGEM3, toVectorLiteral } from '@/lib/hf/embeddings'
import { parseHfEnv } from '@/lib/hf/env'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const BATCH_SIZE = 20

interface SignalRow {
  id: string
  title: string
  summary: string
  market: string | null
  type: string | null
}

/** Build the text that gets embedded for a signal. */
function buildEmbedInput(s: SignalRow): string {
  return [
    s.title,
    s.market ? `Market: ${s.market}` : '',
    s.type   ? `Type: ${s.type}` : '',
    s.summary,
  ].filter(Boolean).join('\n')
}

export async function GET(request: Request) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret)
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 })
  if (authHeader !== `Bearer ${cronSecret}`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // ── Gate on HF endpoint ─────────────────────────────────────────────────────
  const hfParse = parseHfEnv()
  if (!hfParse.success || !hfParse.data.HF_ENDPOINT_EMBED_BGE_M3) {
    console.warn('intelligence_embed_cron: HF_ENDPOINT_EMBED_BGE_M3 not configured')
    return NextResponse.json({
      ok:     false,
      reason: 'HF_ENDPOINT_EMBED_BGE_M3 not configured',
      embedded: 0,
    })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  // ── Fetch candidate signals (overselect, then filter in-memory) ─────────────
  // Pull 3× BATCH_SIZE newest signals, then subtract those already embedded.
  // This avoids a NOT EXISTS subquery which the Supabase JS client handles poorly.
  const { data: candidates, error: candidateErr } = await supabase
    .from('ia_signals')
    .select('id, title, summary, market, type')
    .order('created_at', { ascending: false })
    .limit(BATCH_SIZE * 3)

  if (candidateErr) {
    console.error('intelligence_embed_cron: candidate fetch error', candidateErr.message)
    return NextResponse.json({ ok: false, error: candidateErr.message }, { status: 500 })
  }

  const allCandidates = (candidates as SignalRow[] | null) ?? []
  if (allCandidates.length === 0)
    return NextResponse.json({ ok: true, embedded: 0, failed: 0, skipped: 0 })

  // Check which of these already have embeddings
  const candidateIds = allCandidates.map(r => r.id)
  const { data: existing } = await supabase
    .from('ia_signal_embeddings')
    .select('signal_id')
    .in('signal_id', candidateIds)

  const alreadyEmbedded = new Set((existing ?? []).map((r: { signal_id: string }) => r.signal_id))
  const toProcess = allCandidates.filter(r => !alreadyEmbedded.has(r.id)).slice(0, BATCH_SIZE)

  console.info(`intelligence_embed_cron: ${toProcess.length} signals to embed (${alreadyEmbedded.size} already done)`)

  if (toProcess.length === 0)
    return NextResponse.json({ ok: true, embedded: 0, failed: 0, skipped: allCandidates.length })

  // ── Embed each signal ───────────────────────────────────────────────────────
  let embedded = 0, failed = 0

  // Process in parallel batches of 4 — reduces worst-case wall time by ~75%
  // within the 300s maxDuration budget while respecting HF rate limits.
  const PARALLEL = 4
  for (let i = 0; i < toProcess.length; i += PARALLEL) {
    const chunk = toProcess.slice(i, i + PARALLEL)
    await Promise.all(chunk.map(async (signal) => {
      const inputText = buildEmbedInput(signal)

      try {
        const embeddingVector = await embedBGEM3(inputText)

        const { error: upsertErr } = await supabase
          .from('ia_signal_embeddings')
          .upsert(
            {
              signal_id:  signal.id,
              embedding:  toVectorLiteral(embeddingVector),
              model:      'bge-m3',
            },
            { onConflict: 'signal_id' },
          )

        if (upsertErr) {
          console.error(`intelligence_embed_cron: upsert failed (id=${signal.id}):`, upsertErr.message)
          failed++
          return
        }

        embedded++
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`intelligence_embed_cron: embed failed (id=${signal.id}):`, msg)
        failed++
      }
    }))  // end Promise.all chunk
  }  // end batch loop

  const summary = { ok: true, total: toProcess.length, embedded, failed }
  console.info('intelligence_embed_cron: run complete', summary)
  return NextResponse.json(summary)
}
