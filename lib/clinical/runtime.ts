import {
  CLINICAL_EVIDENCE_STATES,
  type ClinicalEvidenceSearchResult,
  type ClinicalEvidenceState,
} from '@/lib/clinical/evidence'

export const CLINICAL_FAILURE_CATEGORIES = [
  'configuration',
  'permission',
  'migration-drift',
  'schema',
  'upstream',
  'unknown',
] as const

export type ClinicalFailureCategory = typeof CLINICAL_FAILURE_CATEGORIES[number]

export type ClinicalEvidenceDiagnostic = {
  category: ClinicalFailureCategory
  retryable: boolean
  httpStatus?: number | null
}

export type ClinicalEvidenceApiResult = ClinicalEvidenceSearchResult & {
  diagnostic?: ClinicalEvidenceDiagnostic
}

export function classifyClinicalFailure(input: {
  status?: number | null
  code?: string | null
  message?: string | null
}): ClinicalFailureCategory {
  const status = input.status ?? null
  const code = (input.code ?? '').toUpperCase()
  const message = input.message ?? ''

  if (/clinical_evidence_not_configured|missing.*supabase|supabase.*not configured/i.test(message)) return 'configuration'
  if (status === 401 || status === 403) return 'permission'
  if (
    status === 404
    || ['PGRST202', 'PGRST205', '42P01', '42883'].includes(code)
    || /could not find the function|relation .* does not exist|schema cache|missing.*clinical_evidence/i.test(message)
  ) return 'migration-drift'
  if (/clinical_evidence_schema|contract validation|invalid clinical evidence row/i.test(message)) return 'schema'
  if ((status !== null && status >= 500) || /fetch failed|network|timeout|upstream/i.test(message)) return 'upstream'
  return 'unknown'
}

export function diagnosticForFailure(category: ClinicalFailureCategory, httpStatus?: number | null): ClinicalEvidenceDiagnostic {
  return {
    category,
    httpStatus: httpStatus ?? null,
    retryable: category === 'upstream' || category === 'unknown',
  }
}

export function clinicalEvidenceHttpStatus(result: ClinicalEvidenceApiResult): number {
  if (result.state === 'permission') return 403
  if (result.state !== 'error') return 200
  if (result.diagnostic?.category === 'permission') return 403
  return 503
}

export function clinicalFailureLabel(category: ClinicalFailureCategory): string {
  const labels: Record<ClinicalFailureCategory, string> = {
    configuration: 'Evidence service not configured',
    permission: 'Access restricted',
    'migration-drift': 'Evidence schema not activated',
    schema: 'Evidence contract mismatch',
    upstream: 'Evidence service unavailable',
    unknown: 'Evidence service error',
  }
  return labels[category]
}

export function clinicalStateLabel(state: ClinicalEvidenceState | 'loading'): string {
  const labels: Record<ClinicalEvidenceState | 'loading', string> = {
    loading: 'Loading',
    loaded: 'Current',
    empty: 'Ready',
    'no-evidence': 'No reviewed evidence',
    'no-match': 'No match',
    stale: 'Stale / review required',
    conflicted: 'Conflicting evidence',
    'degraded-source': 'Partial source coverage',
    permission: 'Restricted',
    error: 'Unavailable',
  }
  return labels[state]
}

export function isClinicalEvidenceApiResult(value: unknown): value is ClinicalEvidenceApiResult {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<ClinicalEvidenceApiResult>
  return typeof candidate.state === 'string'
    && (CLINICAL_EVIDENCE_STATES as readonly string[]).includes(candidate.state)
    && typeof candidate.query === 'string'
    && Array.isArray(candidate.records)
    && Array.isArray(candidate.changes)
    && typeof candidate.message === 'string'
}
