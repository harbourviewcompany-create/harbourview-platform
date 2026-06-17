/**
 * lib/hf — HarbourView Hugging Face server-only module
 *
 * EVERY export from this barrel is server-only.
 * Do not import this module in client components, pages without 'use server',
 * any file that may be bundled for the browser, or public API routes.
 *
 * Ticket 3: skeleton — env, client, repos, logging ✅
 * Ticket 5: leakage auditor ✅
 * Ticket 7: embeddings (BGE-M3 1024-dim) ✅
 * Tickets 8–12: reranking, extraction, eval, Spaces — not yet implemented
 */

export { HfError, type HfErrorCode } from './errors'
export { assertServerOnly } from './serverOnly'
export { getHfEnv, parseHfEnv, getHfEnvHealth, type HfEnv } from './env'
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
} from './repos'
export { HfClient, getHfClient, _resetHfClientForTest } from './client'
export { hfLog, type HfLogLevel, type HfLogEntry } from './logging'
export {
  auditPublicPayload,
  assertAuditPass,
  getSafePublicPayload,
  type LeakageAuditResult,
  type LeakageAuditStatus,
  type UnsupportedClaim,
} from './leakageAudit'

// Ticket 7 — BGE-M3 1024-dim embeddings ✅
export { embedBGEM3, embedBGEM3Batch, toVectorLiteral } from './embeddings'

// Not yet exported (not yet implemented):
// - reranker.ts  (Ticket 8)
// - extraction.ts (Ticket 10)
// - evalRunner.ts (Ticket 11)
// - schemas.ts
// - validators.ts
