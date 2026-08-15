import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  clinicalEvidenceStateMessage,
  deriveClinicalEvidenceState,
  synthesizeClinicalEvidence,
  type ClinicalEvidenceRecordDTO,
} from '@/lib/clinical/evidence'

const migration = fs.readFileSync(
  path.join(process.cwd(), 'supabase/migrations/20260814143500_clinical_evidence_v1_production_foundation.sql'),
  'utf8',
)

const baseRecord: ClinicalEvidenceRecordDTO = {
  id: '11111111-1111-1111-1111-111111111111',
  slug: 'fixture',
  title: 'Fixture',
  summary: 'Source metadata only.',
  condition: 'Dravet syndrome',
  conditionAliases: ['DS'],
  population: null,
  intervention: 'Cannabidiol',
  formulation: 'Oral solution',
  cannabinoid: ['CBD'],
  interventionClass: 'regulated-cannabinoid-drug',
  comparator: null,
  outcome: null,
  evidenceType: 'product-monograph',
  evidenceStrength: 'ungraded',
  evidenceStrengthMethod: 'Harbourview Clinical Evidence V1',
  uncertainty: 'No independent efficacy conclusion.',
  conflictStatus: 'none',
  jurisdiction: ['Canada'],
  professionRelevance: [],
  primarySource: { title: 'Source', publisher: 'Publisher', url: 'https://example.test/source' },
  publicationDate: null,
  effectiveDate: null,
  verifiedAt: '2026-08-14T13:54:00Z',
  supersessionState: 'current',
  supersededById: null,
  reviewStatus: 'published',
  freshnessStatus: 'current',
}

describe('Clinical Evidence V1 production foundation', () => {
  it('binds qualified review and grading to verified reviewer credentials', () => {
    for (const token of [
      'clinical_reviewer_credentials',
      'clinical_reviewer_credential_is_valid',
      'credential-bound reviewer identity',
      'clinical_evidence_grade_assessments',
      'clinical_require_grade_review_binding',
    ]) expect(migration).toContain(token)
  })

  it('defines immutable snapshots and verified extraction immutability', () => {
    expect(migration).toContain('clinical_evidence_source_snapshots')
    expect(migration).toContain("hash_scope in ('source-bytes','normalized-reviewed-extract')")
    expect(migration).toContain('Clinical evidence snapshots are immutable')
    expect(migration).toContain('verified Clinical extraction is immutable')
  })

  it('adds outcome-level graph, contradiction resolution and audit publication versions', () => {
    expect(migration).toContain('clinical_evidence_outcome_links')
    expect(migration).toContain('clinical_require_conflict_resolution_review')
    expect(migration).toContain('clinical_evidence_publication_versions')
    expect(migration).toContain('clinical_capture_publication_version')
  })

  it('captures the current SATIVEX monograph without inventing an efficacy grade', () => {
    expect(migration).toContain('https://pdf.hres.ca/dpd_pm/00078089.PDF')
    expect(migration).toContain("'291740'")
    expect(migration).toContain('fe36495ec4adf482f95e0a72fa22a651e19599bc8414d34b22cc848248e731ae')
    expect(migration).toContain("'authorized-indication'")
    expect(migration).toContain("'not-assessed'")
    expect(migration).toContain('does not grade efficacy')
  })

  it('supports explicit stale, degraded-source and permission states', () => {
    expect(deriveClinicalEvidenceState({ query: 'x', records: [], permission: true })).toBe('permission')
    expect(deriveClinicalEvidenceState({ query: 'x', records: [baseRecord], degraded: true })).toBe('degraded-source')
    expect(deriveClinicalEvidenceState({ query: 'x', records: [{ ...baseRecord, freshnessStatus: 'review-required' }] })).toBe('stale')
    expect(clinicalEvidenceStateMessage('degraded-source')).toContain('degraded')
  })

  it('keeps deterministic synthesis descriptive only', () => {
    const synthesis = synthesizeClinicalEvidence([baseRecord])
    expect(synthesis.recordCount).toBe(1)
    expect(synthesis.gradedRecordCount).toBe(0)
    expect(synthesis.hasDegradedSource).toBe(false)
    expect(synthesis.summary).toContain('does not infer efficacy or comparative superiority')
  })
})
