/**
 * lib/hf/embeddings.ts — Ticket 7
 *
 * BGE-M3 embedding via HuggingFace Serverless Inference API (free tier).
 * No endpoint to provision. No billing. Just a free HF token.
 *
 * SERVER-ONLY. Set these env vars in Vercel:
 *   HF_TOKEN_SERVER              = hf_xxxxxxxxxxxxxxxxxxxx  (free HF token)
 *   HF_ENDPOINT_EMBED_BGE_M3     = https://router.huggingface.co/hf-inference/models/BAAI/bge-m3/v1/feature-extraction
 *
 * Free-tier notes:
 *   - ~1,000 requests/day (we use ~26/run for 816 signals — well within limit)
 *   - First call of the day may 503 "model is loading" — one retry after 30s
 *   - No cold-start cost beyond waiting
 */

import 'server-only';

import { assertServerOnly } from './serverOnly';
import { getHfEnv } from './env';
import { getHfClient } from './client';
import { hfLog } from './logging';
import { HfError } from './errors';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const BGE_M3_DIM      = 1024 as const;
export const BGE_M3_MODEL_ID = 'BAAI/bge-m3' as const;

/** Max texts per POST — conservative for free shared servers. */
const MAX_BATCH_SIZE  = 32;
const TRUNCATE_CHARS  = 30_000; // ~8k tokens with headroom

/**
 * Free HF Serverless API returns HTTP 503 with { estimated_time: N }
 * while the model cold-starts. We retry once, waiting up to this many seconds.
 */
const LOADING_RETRY_MAX_WAIT_S = 60;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BgeM3Response = number[][];

export interface EmbedResult {
  embedding:  number[];
  dimensions: typeof BGE_M3_DIM;
  model:      typeof BGE_M3_MODEL_ID;
  truncated:  boolean;
}

export interface EmbedBatchResult {
  embeddings: number[][];
  dimensions: typeof BGE_M3_DIM;
  model:      typeof BGE_M3_MODEL_ID;
  count:      number;
}

export interface EmbedProbeResult {
  configured: boolean;
  reachable:  boolean;
  latencyMs?: number;
  error?:     string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function getEndpointUrl(): string {
  const env = getHfEnv();
  if (!env.HF_ENDPOINT_EMBED_BGE_M3) {
    throw new HfError(
      'HF_ENV_MISSING',
      '[hf/embeddings] HF_ENDPOINT_EMBED_BGE_M3 is not set. ' +
        'Add it to Vercel env vars: ' +
        'https://router.huggingface.co/hf-inference/models/BAAI/bge-m3/v1/feature-extraction',
    );
  }
  return env.HF_ENDPOINT_EMBED_BGE_M3;
}

function maybeTruncate(text: string, truncate: boolean): { text: string; truncated: boolean } {
  if (!truncate || text.length <= TRUNCATE_CHARS) return { text, truncated: false };
  return { text: text.slice(0, TRUNCATE_CHARS), truncated: true };
}

function validateVector(vec: unknown, context: string): number[] {
  if (!Array.isArray(vec) || vec.length !== BGE_M3_DIM) {
    throw new HfError(
      'HF_OUTPUT_INVALID',
      `[hf/embeddings] ${context}: expected ${BGE_M3_DIM}-dim vector, ` +
        `got ${Array.isArray(vec) ? vec.length : typeof vec}`,
    );
  }
  return vec as number[];
}

/**
 * HF Serverless API returns 503 + { estimated_time: N } when the model
 * is cold-starting. Pause for `estimated_time` (capped) then retry once.
 */
async function inferenceWithLoadingRetry<T>(
  url: string,
  inputs: unknown,
): Promise<T> {
  const client = getHfClient();

  try {
    return await client.inferencePost<T>(url, inputs);
  } catch (err) {
    // HfError with status 503 = model is loading
    if (
      err instanceof HfError &&
      err.status === 503 &&
      err.detail &&
      typeof (err.detail as Record<string, unknown>).estimated_time === 'number'
    ) {
      const waitSecs = Math.min(
        (err.detail as Record<string, unknown>).estimated_time as number,
        LOADING_RETRY_MAX_WAIT_S,
      );
      hfLog('warn', 'embeddings', `Model loading — waiting ${waitSecs}s then retrying`);
      await new Promise((r) => setTimeout(r, waitSecs * 1000));
      return await client.inferencePost<T>(url, inputs);
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Embed a single text using BGE-M3 (free HF Serverless API).
 */
export async function embedText(
  text: string,
  { truncate = true }: { truncate?: boolean } = {},
): Promise<EmbedResult> {
  assertServerOnly();

  const url = getEndpointUrl();
  const { text: input, truncated } = maybeTruncate(text, truncate);

  const response = await inferenceWithLoadingRetry<BgeM3Response>(url, input);

  // Single-text response: [[...1024 floats...]]
  const raw = Array.isArray(response[0]) ? response[0] : (response as unknown as number[]);
  const embedding = validateVector(raw, 'single text');

  return { embedding, dimensions: BGE_M3_DIM, model: BGE_M3_MODEL_ID, truncated };
}

/**
 * Embed a batch of texts using BGE-M3.
 * Chunks into MAX_BATCH_SIZE (32) requests for the free serverless API.
 */
export async function embedBatch(
  texts: string[],
  { truncate = true }: { truncate?: boolean } = {},
): Promise<EmbedBatchResult> {
  assertServerOnly();

  if (texts.length === 0) {
    return { embeddings: [], dimensions: BGE_M3_DIM, model: BGE_M3_MODEL_ID, count: 0 };
  }

  const url = getEndpointUrl();
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += MAX_BATCH_SIZE) {
    const chunk = texts
      .slice(i, i + MAX_BATCH_SIZE)
      .map((t) => maybeTruncate(t, truncate).text);

    hfLog(
      'info',
      'embeddings',
      `Batch ${Math.floor(i / MAX_BATCH_SIZE) + 1} of ${Math.ceil(texts.length / MAX_BATCH_SIZE)}`,
      { size: chunk.length },
    );

    const response = await inferenceWithLoadingRetry<BgeM3Response>(url, chunk);

    if (!Array.isArray(response) || !Array.isArray(response[0])) {
      throw new HfError(
        'HF_OUTPUT_INVALID',
        `[hf/embeddings] Unexpected batch response shape — expected number[][], got ${typeof response}`,
      );
    }

    for (let j = 0; j < response.length; j++) {
      allEmbeddings.push(validateVector(response[j], `batch item ${i + j}`));
    }
  }

  return {
    embeddings: allEmbeddings,
    dimensions: BGE_M3_DIM,
    model: BGE_M3_MODEL_ID,
    count: allEmbeddings.length,
  };
}

/**
 * Probe the BGE-M3 endpoint without throwing.
 * Use in admin health checks only.
 */
export async function probeEmbedEndpoint(): Promise<EmbedProbeResult> {
  assertServerOnly();

  const env = getHfEnv();
  if (!env.HF_ENDPOINT_EMBED_BGE_M3) {
    return { configured: false, reachable: false, error: 'HF_ENDPOINT_EMBED_BGE_M3 not set' };
  }

  const start = Date.now();
  try {
    await embedText('probe', { truncate: false });
    return { configured: true, reachable: true, latencyMs: Date.now() - start };
  } catch (err) {
    return {
      configured: true,
      reachable: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
