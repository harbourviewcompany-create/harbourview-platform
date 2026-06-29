import 'server-only';

import { z } from 'zod';
import { HfError } from './errors';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const requiredStr = z.string().trim().min(1);
const optionalStr = z
  .string()
  .trim()
  .optional()
  .transform((v) => v || undefined);
const optionalUrl = optionalStr.pipe(z.string().url().optional());

/**
 * All HF_ environment variables are server-only.
 * Browser-exposed ("NEXT_PUBLIC_" prefixed) HF variables are NEVER authorized.
 *
 * Canonical token variable: HF_TOKEN_SERVER
 * The legacy alias HF_TOKEN is no longer silently accepted here. Every module
 * that previously read process.env.HF_TOKEN directly has been updated to read
 * HF_TOKEN_SERVER. If you see HF_ENV_INVALID failures referencing HF_TOKEN_SERVER,
 * set HF_TOKEN_SERVER in your environment — do not add HF_TOKEN back.
 */
const schema = z.object({
  HF_ORG: requiredStr.default('Harbourview'),
  HF_TOKEN_SERVER: requiredStr,

  // Inference endpoint URLs — set once endpoints are provisioned (paid tier).
  // Until provisioned, embed-artifacts uses the free serverless inference API
  // (sentence-transformers/all-MiniLM-L6-v2, 384-dim) — no cost, no endpoint
  // required. See docs/OPERATING_AUTHORITY.md for provisioning status.
  HF_ENDPOINT_EMBED_BGE_M3: optionalUrl,
  HF_ENDPOINT_RERANK_BGE_V2_M3: optionalUrl,
  HF_ENDPOINT_EXTRACT_QWEN3_4B: optionalUrl,
  HF_ENDPOINT_EXTRACT_QWEN3_30B: optionalUrl,

  // Dataset repo identifiers — default to approved Harbourview/ names
  HF_DATASET_SOURCE_CORPUS: optionalStr.default('Harbourview/hv-source-corpus-private'),
  HF_DATASET_EVALS: optionalStr.default('Harbourview/hv-eval-sets-private'),
  HF_DATASET_REVIEWED_FACTS: optionalStr.default('Harbourview/hv-reviewed-facts-private'),
  HF_DATASET_RELEASE_CANDIDATES: optionalStr.default('Harbourview/hv-release-candidates-private'),
});

export type HfEnv = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

const FREE_API_DEFAULTS: Partial<Record<string, string>> = {
  HF_ENDPOINT_EMBED_BGE_M3: 'https://api-inference.huggingface.co/models/BAAI/bge-m3',
};

export function parseHfEnv(raw: NodeJS.ProcessEnv = process.env) {
  const merged = {
    ...FREE_API_DEFAULTS,
    ...raw,
    // HF_TOKEN_SERVER is the only authorized token variable.
    // We do NOT fall back to HF_TOKEN here — the fallback was silently masking
    // misconfigured deployments. If HF_TOKEN_SERVER is absent, validation will
    // fail with a clear error. See scripts/check-critical-env.mjs for the CI
    // sanity check that catches this before it reaches production.
  };
  return schema.safeParse(merged);
}

/**
 * Returns validated HF env or throws HfError.
 * Call once at module init — not on every request.
 */
export function getHfEnv(raw: NodeJS.ProcessEnv = process.env): HfEnv {
  const result = parseHfEnv(raw);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    throw new HfError(
      'HF_ENV_INVALID',
      `HarbourView HF env validation failed: ${issues}`,
    );
  }
  return result.data;
}

/**
 * Returns a health summary without exposing token values.
 * Safe to include in admin diagnostics.
 */
export function getHfEnvHealth(raw: NodeJS.ProcessEnv = process.env) {
  const result = parseHfEnv(raw);
  const issues = result.success
    ? []
    : result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
  const env = result.success ? result.data : undefined;

  return {
    ok: issues.length === 0,
    org: env?.HF_ORG ?? raw.HF_ORG ?? null,
    configured: {
      tokenServer: Boolean(raw.HF_TOKEN_SERVER?.trim()),
      embedEndpoint: Boolean(raw.HF_ENDPOINT_EMBED_BGE_M3?.trim()),
      rerankEndpoint: Boolean(raw.HF_ENDPOINT_RERANK_BGE_V2_M3?.trim()),
      extractQwen4bEndpoint: Boolean(raw.HF_ENDPOINT_EXTRACT_QWEN3_4B?.trim()),
      extractQwen30bEndpoint: Boolean(raw.HF_ENDPOINT_EXTRACT_QWEN3_30B?.trim()),
    },
    issues,
  };
}
