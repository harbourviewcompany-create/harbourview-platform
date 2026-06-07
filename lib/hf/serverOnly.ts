import 'server-only';

import { HfError } from './errors';

/**
 * Throws if called in a browser context.
 * Every lib/hf module must import 'server-only' at the top AND call this
 * at the start of any function that touches HF tokens, endpoints, or private data.
 *
 * The 'server-only' import is the compile-time guard.
 * assertServerOnly() is the runtime guard for dynamic import paths.
 */
export function assertServerOnly(): void {
  if (typeof window !== 'undefined') {
    throw new HfError(
      'HF_SERVER_ONLY_VIOLATION',
      '[hf] HarbourView HF access is server-only. This module must never execute in a browser context.',
    );
  }
}
