import 'server-only';

import { assertServerOnly } from './serverOnly';

export type HfLogLevel = 'info' | 'warn' | 'error';

export interface HfLogEntry {
  level: HfLogLevel;
  module: string;
  message: string;
  meta?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Structured server-only logger for HF operations.
 * NEVER logs token values, raw source text, reviewer notes,
 * evidence quotes, private notes, or confidence scores.
 */
export function hfLog(
  level: HfLogLevel,
  module: string,
  message: string,
  meta?: Record<string, unknown>,
): void {
  assertServerOnly();

  // Strip any accidental token/secret fields from meta
  const safeMeta = meta ? sanitizeMeta(meta) : undefined;

  const entry: HfLogEntry = {
    level,
    module: `hf:${module}`,
    message,
    ...(safeMeta ? { meta: safeMeta } : {}),
    timestamp: new Date().toISOString(),
  };

  // Use structured console output — replace with your logging provider as needed
  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  fn(JSON.stringify(entry));
}

const REDACTED_KEYS = new Set([
  'token',
  'hf_token',
  'HF_TOKEN_SERVER',
  'authorization',
  'Authorization',
  'password',
  'secret',
  'private_notes',
  'reviewer_id',
  'raw_text',
  'clean_text',
  'evidence_quote',
  'confidence',
]);

function sanitizeMeta(meta: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (REDACTED_KEYS.has(k) || k.toLowerCase().includes('token') || k.toLowerCase().includes('secret')) {
      out[k] = '[REDACTED]';
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = sanitizeMeta(v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out;
}
