import { describe, expect, it } from 'vitest'
import {
  classifyClinicalFailure,
  clinicalEvidenceHttpStatus,
  clinicalFailureLabel,
  clinicalStateLabel,
  isClinicalEvidenceApiResult,
  type ClinicalEvidenceApiResult,
} from '@/lib/clinical/runtime'

function result(overrides: Partial<ClinicalEvidenceApiResult> = {}): ClinicalEvidenceApiResult {
  return {
    state: 'loaded',
    query: '',
    records: [],
    changes: [],
    message: 'ok',
    ...overrides,
  }
}

describe('Clinical evidence runtime classification', () => {
  it('distinguishes permission, migration drift, configuration, schema and upstream failures', () => {
    expect(classifyClinicalFailure({ status: 401 })).toBe('permission')
    expect(classifyClinicalFailure({ status: 403 })).toBe('permission')
    expect(classifyClinicalFailure({ status: 404, code: 'PGRST202', message: 'Could not find the function' })).toBe('migration-drift')
    expect(classifyClinicalFailure({ code: '42P01', message: 'relation clinical_evidence_records does not exist' })).toBe('migration-drift')
    expect(classifyClinicalFailure({ message: 'clinical_evidence_not_configured' })).toBe('configuration')
    expect(classifyClinicalFailure({ message: 'clinical_evidence_schema_contract validation failed' })).toBe('schema')
    expect(classifyClinicalFailure({ status: 503, message: 'upstream unavailable' })).toBe('upstream')
  })

  it('returns semantic HTTP statuses without converting empty or no-match into errors', () => {
    expect(clinicalEvidenceHttpStatus(result({ state: 'loaded' }))).toBe(200)
    expect(clinicalEvidenceHttpStatus(result({ state: 'empty' }))).toBe(200)
    expect(clinicalEvidenceHttpStatus(result({ state: 'no-match' }))).toBe(200)
    expect(clinicalEvidenceHttpStatus(result({ state: 'no-evidence' }))).toBe(200)
    expect(clinicalEvidenceHttpStatus(result({ state: 'permission' }))).toBe(403)
    expect(clinicalEvidenceHttpStatus(result({ state: 'error', diagnostic: { category: 'migration-drift', retryable: false } }))).toBe(503)
  })

  it('rejects malformed API error envelopes rather than casting them as evidence results', () => {
    expect(isClinicalEvidenceApiResult({ error: 'Invalid clinical evidence query' })).toBe(false)
    expect(isClinicalEvidenceApiResult({ state: 'loaded', query: '', records: [], changes: [], message: 'ok' })).toBe(true)
    expect(isClinicalEvidenceApiResult({ state: 'loaded', query: '', records: null, changes: [], message: 'ok' })).toBe(false)
  })

  it('uses clinician-facing state and diagnostic labels', () => {
    expect(clinicalStateLabel('degraded-source')).toBe('Partial source coverage')
    expect(clinicalStateLabel('conflicted')).toBe('Conflicting evidence')
    expect(clinicalFailureLabel('migration-drift')).toBe('Evidence schema not activated')
    expect(clinicalFailureLabel('schema')).toBe('Evidence contract mismatch')
  })
})
