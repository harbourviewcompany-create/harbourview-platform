/**
 * lib/hf/pipeline/signalEmbedder.ts — Ticket 7
 *
 * Reads un-embedded rows from the `signals` table, batches them through
 * BGE-M3 (HuggingFace Serverless Inference API — free tier), and writes
 * embedding_1024 back to the row.
 *
 * SERVER-ONLY. Requires the service-role Supabase client.
 * Called by app/api/cron/embed-signals/route.ts.
 *
 * Free tier limits: ~1,000 req/day. 816 signals at 32/batch = 26 requests.
 * Well within limits. Model cold-start handled with one retry (see embedBatch).
 */

import 'server-only';

import { SupabaseClient } from '@supabase/supabase-js';

import { embedBatch, BGE_M3_MODEL_ID } from '../embeddings';
import { hfLog } from '../logging';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Signals fetched per cron invocation. */
const DEFAULT_LIMIT = 200;

/**
 * Texts per HF POST on the free Serverless API.
 * Paid endpoints handle 128 comfortably; free shared servers: keep at 32
 * to avoid timeouts and OOM on shared GPU/CPU.
 */
const EMBED_BATCH_SIZE = 32;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SignalRow {
  id: string;
  headline: string | null;
  summary: string | null;
  country: string | null;
  cat: string | null;
}

export interface EmbedSignalsResult {
  fetched: number;
  processed: number;
  skipped: number;
  failed: number;
  batchCount: number;
}

// ---------------------------------------------------------------------------
// Text builder
// ---------------------------------------------------------------------------

/**
 * Builds the text embedded for a signal.
 * headline + summary are the primary semantic content.
 * Country and category act as lightweight context tokens.
 */
function buildEmbedText(s: SignalRow): string {
  return [
    s.headline ?? '',
    s.summary ?? '',
    s.country  ? `Country: ${s.country}` : '',
    s.cat      ? `Category: ${s.cat}` : '',
  ]
    .map((p) => p.trim())
    .filter(Boolean)
    .join(' | ');
}

// ---------------------------------------------------------------------------
// Main pipeline
// ---------------------------------------------------------------------------

/**
 * Embeds all signals that have no embedding_1024 yet.
 * Idempotent — already-embedded signals are skipped.
 *
 * @param supabase - Service-role client (createHarbourviewServiceRoleSupabaseClient).
 * @param opts.limit - Max signals per call. Default 200.
 */
export async function embedUnprocessedSignals(
  supabase: SupabaseClient,
  opts: { limit?: number } = {},
): Promise<EmbedSignalsResult> {
  const limit = opts.limit ?? DEFAULT_LIMIT;
  const result: EmbedSignalsResult = {
    fetched: 0,
    processed: 0,
    skipped: 0,
    failed: 0,
    batchCount: 0,
  };

  // ── 1. Fetch un-embedded signals ─────────────────────────────────────────
  const { data: signals, error: fetchErr } = await supabase
    .from('signals')
    .select('id, headline, summary, country, cat')
    .is('embedding_1024', null)
    .not('headline', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (fetchErr) {
    throw new Error(`[signalEmbedder] Failed to fetch signals: ${fetchErr.message}`);
  }

  if (!signals || signals.length === 0) {
    hfLog('info', 'signalEmbedder', 'No un-embedded signals — nothing to do');
    return result;
  }

  result.fetched = signals.length;
  hfLog('info', 'signalEmbedder', `Embedding ${signals.length} signals`);

  // ── 2. Filter signals with meaningful text ───────────────────────────────
  const validSignals: SignalRow[] = [];
  for (const s of signals as SignalRow[]) {
    const text = buildEmbedText(s);
    if (text.length < 8) {
      hfLog('warn', 'signalEmbedder', `Skipping signal ${s.id} — embed text too short`);
      result.skipped++;
      continue;
    }
    validSignals.push(s);
  }

  if (validSignals.length === 0) return result;

  // ── 3. Embed in batches ───────────────────────────────────────────────────
  for (let i = 0; i < validSignals.length; i += EMBED_BATCH_SIZE) {
    const chunk = validSignals.slice(i, i + EMBED_BATCH_SIZE);
    const texts = chunk.map(buildEmbedText);

    let embeddings: number[][];
    try {
      const res = await embedBatch(texts, { truncate: true });
      embeddings = res.embeddings;
      result.batchCount++;
    } catch (err) {
      hfLog('error', 'signalEmbedder', `Batch failed at offset ${i}`, {
        error: String(err),
        chunkSize: chunk.length,
      });
      result.failed += chunk.length;
      continue;
    }

    // ── 4. Write back ────────────────────────────────────────────────────────
    for (let j = 0; j < chunk.length; j++) {
      const signal = chunk[j];
      const embedding = embeddings[j];

      if (!embedding || embedding.length !== 1024) {
        hfLog('warn', 'signalEmbedder', `Bad vector for signal ${signal.id}`);
        result.failed++;
        continue;
      }

      const { error: updateErr } = await supabase
        .from('signals')
        .update({
          // pgvector accepts '[f1,f2,...,f1024]' string literal
          embedding_1024: `[${embedding.join(',')}]`,
          embedding_model: BGE_M3_MODEL_ID,
          embedded_at: new Date().toISOString(),
        })
        .eq('id', signal.id);

      if (updateErr) {
        hfLog('error', 'signalEmbedder', `Write failed for ${signal.id}`, {
          code: updateErr.code,
        });
        result.failed++;
      } else {
        result.processed++;
      }
    }

    hfLog('info', 'signalEmbedder', `Batch ${result.batchCount} complete`, {
      processed: result.processed,
    });
  }

  hfLog('info', 'signalEmbedder', 'Run complete', result);
  return result;
}
