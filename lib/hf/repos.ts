import 'server-only';

import { assertServerOnly } from './serverOnly';
import { HfError } from './errors';

// ---------------------------------------------------------------------------
// Approved private repo identifiers
// ALL repos are under the Harbourview org. ALL are private.
// ANY name not in this list is not an authorized HarbourView HF repo.
// ---------------------------------------------------------------------------

export const HF_ORG = 'Harbourview' as const;

export const HF_DATASET_REPOS = {
  sourceCorpus: 'Harbourview/hv-source-corpus-private',
  entityCandidates: 'Harbourview/hv-entity-candidates-private',
  reviewedFacts: 'Harbourview/hv-reviewed-facts-private',
  releaseCandidates: 'Harbourview/hv-release-candidates-private',
  marketplaceEnrichment: 'Harbourview/hv-marketplace-enrichment-private',
  educationCorpus: 'Harbourview/hv-education-corpus-private',
  evalSets: 'Harbourview/hv-eval-sets-private',
  rejectedSignals: 'Harbourview/hv-rejected-signals-private',
} as const;

export const HF_MODEL_REPOS = {
  extractionPrompts: 'Harbourview/hv-extraction-prompts',
  classifiers: 'Harbourview/hv-classifiers',
  rerankerEvals: 'Harbourview/hv-reranker-evals',
  embeddingEvals: 'Harbourview/hv-embedding-evals',
} as const;

export const HF_ENDPOINT_NAMES = {
  embedBgeM3: 'hv-embed-bge-m3',
  rerankBgeV2M3: 'hv-rerank-bge-v2-m3',
  extractQwen3_4b: 'hv-extract-qwen3-4b',
  extractQwen3_30b: 'hv-extract-qwen3-30b',
  // docLayoutExtract: HOLD — commercial license not cleared
} as const;

export type HfDatasetRepoId = (typeof HF_DATASET_REPOS)[keyof typeof HF_DATASET_REPOS];
export type HfModelRepoId = (typeof HF_MODEL_REPOS)[keyof typeof HF_MODEL_REPOS];

export const ALL_APPROVED_REPOS: readonly string[] = [
  ...Object.values(HF_DATASET_REPOS),
  ...Object.values(HF_MODEL_REPOS),
];

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

/**
 * Throws if the given repo ID is not in the approved list.
 * Call before any HF API operation that takes a repo name as input.
 */
export function assertApprovedRepo(repoId: string): void {
  assertServerOnly();
  if (!ALL_APPROVED_REPOS.includes(repoId)) {
    throw new HfError(
      'HF_FORBIDDEN',
      `[hf] Repo "${repoId}" is not in the approved HarbourView repo list.`,
    );
  }
}

/**
 * Throws if the repo ID does not follow the Harbourview/ org prefix convention.
 */
export function assertHarbourviewOrg(repoId: string): void {
  assertServerOnly();
  if (!repoId.startsWith(`${HF_ORG}/`)) {
    throw new HfError(
      'HF_FORBIDDEN',
      `[hf] Repo "${repoId}" does not belong to the ${HF_ORG} org.`,
    );
  }
}

// ---------------------------------------------------------------------------
// Verification helper (calls HF API — use in admin diagnostics only)
// ---------------------------------------------------------------------------

export interface RepoVerificationResult {
  repoId: string;
  exists: boolean;
  isPrivate: boolean;
  ok: boolean;
  error?: string;
}

/**
 * Verifies that a repo exists and is private via the HF Hub API.
 * Server-only. Never call from a route handler or client component.
 * Intended for admin diagnostics and CI verification scripts.
 */
export async function verifyRepoIsPrivate(
  repoId: string,
  token: string,
  repoType: 'dataset' | 'model' = 'dataset',
): Promise<RepoVerificationResult> {
  assertServerOnly();
  assertApprovedRepo(repoId);

  const typePrefix = repoType === 'dataset' ? 'datasets' : 'models';
  const url = `https://huggingface.co/api/${typePrefix}/${repoId}`;

  let resp: Response;
  try {
    resp = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
  } catch (err) {
    return {
      repoId,
      exists: false,
      isPrivate: false,
      ok: false,
      error: `Network error: ${String(err)}`,
    };
  }

  if (resp.status === 404) {
    return { repoId, exists: false, isPrivate: false, ok: false, error: 'Repo not found' };
  }
  if (resp.status === 401 || resp.status === 403) {
    // 401/403 on a private repo means the token is wrong or the repo is inaccessible
    return {
      repoId,
      exists: true,
      isPrivate: true, // assume private if auth-gated
      ok: false,
      error: `Auth error ${resp.status} — check HF_TOKEN_SERVER has read access`,
    };
  }
  if (!resp.ok) {
    return {
      repoId,
      exists: false,
      isPrivate: false,
      ok: false,
      error: `Unexpected status ${resp.status}`,
    };
  }

  let body: { private?: boolean };
  try {
    body = await resp.json();
  } catch {
    return { repoId, exists: true, isPrivate: false, ok: false, error: 'Unparseable response' };
  }

  const isPrivate = body.private === true;
  return {
    repoId,
    exists: true,
    isPrivate,
    ok: isPrivate,
    error: isPrivate ? undefined : 'REPO IS PUBLIC — IMMEDIATE ACTION REQUIRED',
  };
}

/**
 * Verifies all approved repos. Returns a summary.
 * Use in admin health-check endpoints (protected admin route only).
 */
export async function verifyAllRepos(token: string): Promise<{
  allOk: boolean;
  results: RepoVerificationResult[];
}> {
  assertServerOnly();

  const datasetChecks = Object.values(HF_DATASET_REPOS).map((id) =>
    verifyRepoIsPrivate(id, token, 'dataset'),
  );
  const modelChecks = Object.values(HF_MODEL_REPOS).map((id) =>
    verifyRepoIsPrivate(id, token, 'model'),
  );

  const results = await Promise.all([...datasetChecks, ...modelChecks]);
  const allOk = results.every((r) => r.ok);
  return { allOk, results };
}
