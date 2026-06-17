// lib/hf/embeddings.ts  — Ticket 7
// BGE-M3 1024-dim embedding generation via HF Inference Endpoint.
// Server-only. Never import from client components.

import 'server-only'
import { assertServerOnly } from './serverOnly'
import { getHfClient } from './client'
import { getHfEnv } from './env'
import { HfError } from './errors'

assertServerOnly()

// BGE-M3 supports up to 8192 tokens. ~4 chars/token → 8000 char hard limit.
const MAX_INPUT_CHARS = 8_000

/**
 * Generate a single 1024-dim BGE-M3 embedding.
 * TEI response shape: number[][] (one row per input).
 * Throws HfError if endpoint is unconfigured or returns wrong shape.
 */
export async function embedBGEM3(text: string): Promise<number[]> {
  assertServerOnly()

  const env = getHfEnv()
  if (!env.HF_ENDPOINT_EMBED_BGE_M3) {
    throw new HfError(
      'HF_ENV_INVALID',
      '[hf/embeddings] HF_ENDPOINT_EMBED_BGE_M3 is not configured',
    )
  }

  const truncated = text.trim().slice(0, MAX_INPUT_CHARS)
  if (!truncated) {
    throw new HfError('HF_OUTPUT_INVALID', '[hf/embeddings] Cannot embed empty text')
  }

  const client = getHfClient()
  // TEI (Text Embeddings Inference) format:
  //   POST { inputs: string } → number[][]
  const raw = await client.inferencePost<number[][] | number[]>(
    env.HF_ENDPOINT_EMBED_BGE_M3,
    truncated,
  )

  // Normalise both [[...]] and [...] response shapes
  const embedding: number[] = Array.isArray(raw[0]) ? (raw as number[][])[0] : (raw as number[])

  if (embedding.length !== 1024) {
    throw new HfError(
      'HF_OUTPUT_INVALID',
      `[hf/embeddings] Expected 1024-dim vector, got ${embedding.length}`,
    )
  }

  return embedding
}

/**
 * Embed multiple texts sequentially.
 * Sequential (not batched) to keep TEI latency predictable and avoid
 * hitting per-request token limits on smaller endpoint sizes.
 */
export async function embedBGEM3Batch(texts: string[]): Promise<number[][]> {
  assertServerOnly()
  const results: number[][] = []
  for (const text of texts) {
    results.push(await embedBGEM3(text))
  }
  return results
}

/**
 * Format a number[] embedding as a pgvector literal string.
 * Supabase JS client accepts this format for vector columns.
 * Example: "[0.12, -0.34, ...]"
 */
export function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(',')}]`
}
