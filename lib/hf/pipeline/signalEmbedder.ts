// lib/hf/pipeline/signalEmbedder.ts
//
// Batch-embeds the curated `public.signals` table (816 rows) using BGE-M3
// via the already-landed `embedBGEM3` from lib/hf/embeddings.ts.
//
// Mirrors the pattern from app/api/cron/intelligence-embed/route.ts
// (which covers ia_signals) but targets the main signals corpus.
//
// SERVER-ONLY. Called from app/api/cron/embed-signals/route.ts.

import 'server-only'

import { SupabaseClient } from '@supabase/supabase-js'
import { embedBGEM3, toVectorLiteral } from '@/lib/hf/embeddings'

const DEFAULT_BATCH = 20   // signals per cron run — matches intelligence-embed

interface SignalRow {
  id:       string
  headline: string | null
  summary:  string | null
  country:  string | null
  cat:      string | null
}

/** Build the text embedded for a signal. */
function buildEmbedInput(s: SignalRow): string {
  return [
    s.headline ?? '',
    s.country  ? `Country: ${s.country}` : '',
    s.cat      ? `Category: ${s.cat}` : '',
    s.summary  ?? '',
  ].filter(Boolean).join('\n')
}

export interface EmbedSignalsResult {
  total:    number
  embedded: number
  skipped:  number
  failed:   number
}

/**
 * Embed un-processed signals into `signals.embedding_1024`.
 * Idempotent — rows already having `embedding_1024 IS NOT NULL` are skipped.
 *
 * @param supabase  Service-role client.
 * @param limit     Max signals to process. Default 20.
 */
export async function embedUnprocessedSignals(
  supabase: SupabaseClient,
  { limit = DEFAULT_BATCH }: { limit?: number } = {},
): Promise<EmbedSignalsResult> {
  // ── 1. Fetch un-embedded signals ────────────────────────────────────────────
  // Over-fetch 3× then slice, matching the intelligence-embed pattern.
  const { data: candidates, error: fetchErr } = await supabase
    .from('signals')
    .select('id, headline, summary, country, cat')
    .is('embedding_1024', null)
    .not('headline', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit * 3)

  if (fetchErr) {
    throw new Error(`[signalEmbedder] fetch failed: ${fetchErr.message}`)
  }

  const rows = ((candidates as SignalRow[] | null) ?? []).slice(0, limit)

  if (rows.length === 0) {
    console.info('[signalEmbedder] No un-embedded signals — nothing to do')
    return { total: 0, embedded: 0, skipped: 0, failed: 0 }
  }

  console.info(`[signalEmbedder] ${rows.length} signals to embed`)

  let embedded = 0, skipped = 0, failed = 0

  // ── 2. Embed + write back in parallel batches of 4 ──────────────────────────
  // Reduces worst-case wall time by ~75% vs serial, within the 300s cron budget.
  const PARALLEL = 4
  for (let i = 0; i < rows.length; i += PARALLEL) {
    const chunk = rows.slice(i, i + PARALLEL)
    await Promise.all(chunk.map(async (signal) => {
      const inputText = buildEmbedInput(signal).trim()
      if (inputText.length < 8) { skipped++; return }

      try {
        const vector = await embedBGEM3(inputText)

        const { error: updateErr } = await supabase
          .from('signals')
          .update({
            embedding_1024:  toVectorLiteral(vector),
            embedding_model: 'bge-m3',
            embedded_at:     new Date().toISOString(),
          })
          .eq('id', signal.id)

        if (updateErr) {
          console.error(`[signalEmbedder] write failed (id=${signal.id}):`, updateErr.message)
          failed++
        } else {
          embedded++
        }
      } catch (err) {
        console.error(`[signalEmbedder] embed failed (id=${signal.id}):`, err)
        failed++
      }
    }))  // end Promise.all chunk
  }  // end batch loop

  const summary = { total: rows.length, embedded, skipped, failed }
  console.info('[signalEmbedder] run complete', summary)
  return summary
}
