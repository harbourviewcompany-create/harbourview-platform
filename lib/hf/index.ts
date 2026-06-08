/**
 * lib/hf — HarbourView Hugging Face server-only module
 *
 * EVERY export from this barrel is server-only.
 * Do not import this module in:
 *   - Client components
 *   - Pages without 'use server'
 *   - Any file that may be bundled for the browser
 *   - Public API routes
 *
 * Ticket 3 scope: skeleton only.
 * Embedding, reranking, extraction, and eval modules are not yet implemented.
 * See docs/OPERATING_AUTHORITY.md for ticket execution order.
 */

export { HfError, type HfErrorCode } from './errors';
export { assertServerOnly } from './serverOnly';
export { getHfEnv, parseHfEnv, getHfEnvHealth, type HfEnv } from './env';
export {
  HF_ORG,
  HF_DATASET_REPOS,
  HF_MODEL_REPOS,
  HF_ENDPOINT_NAMES,
  ALL_APPROVED_REPOS,
  assertApprovedRepo,
  assertHarbourviewOrg,
  verifyRepoIsPrivate,
  verifyAllRepos,
  type HfDatasetRepoId,
  type HfModelRepoId,
  type RepoVerificationResult,
} from './repos';
export { HfClient, getHfClient, _resetHfClientForTest, type HfClientConfig } from './client';
export { hfLog, type HfLogLevel, type HfLogEntry } from './logging';

// Intentionally NOT exported from skeleton (not yet implemented):
// - embeddings.ts
// - reranker.ts
// - extraction.ts
// - leakageAudit.ts
// - evalRunner.ts
// - schemas.ts
// - validators.ts
