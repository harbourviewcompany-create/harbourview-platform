import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  deriveClinicalEvidenceState,
  synthesizeClinicalEvidence,
  type ClinicalEvidenceRecordDTO,
} from '@/lib/clinical/evidence'

const operatingMigration = fs.readFileSync(
  path.join(process.cwd(), 'supabase/migrations/20260816150000_clinical_evidence_operating_system.sql'),
  'utf8',
)
const hardeningMigration = fs.readFileSync(
  path.join(process.cwd(), 'supabase/migrations/20260816150100_clinical_evidence_operating_system_retrieval_hardening.sql'),
  'utf8',
)
const domainMigration = fs.readFileSync(
  path.join(process.cwd(), 'supabase/migrations/20260816150200_clinical_evidence_domain_separation.sql'),
  'utf8',
)

function evidence(id: string, overrides: Partial<ClinicalEvidenceRecordDTO> = {}): ClinicalEvidenceRecordDTO {
  return {
    id,
    slug: `record-${id}`,
    title: 'Reviewed evidence fixture',
    summary: 'Governed fixture summary.',
    condition: 'Dravet syndrome',
    conditionAliases: ['DS'],
    population: null,
    intervention: null,
    formulation: null,
    cannabinoid: [],
    interventionClass: 'regulated-cannabinoid-drug',
    comparator: null,
    outcome: null,
    evidenceType: 'randomized-trial',
    evidenceStrength: 'moderate',
    evidenceStrengthMethod: 'GRADE',
    uncertainty: null,
    conflictStatus: 'none',
    jurisdiction: ['Canada'],
    professionRelevance: [],
    primarySource: { title: 'Fixture', publisher: 'Fixture publisher', url: 'https://example.invalid/source' },
    publicationDate: null,
    effectiveDate: null,
    verifiedAt: '2026-08-16T14:00:00Z',
    supersessionState: 'current',
    supersededById: null,
    reviewStatus: 'published',
    freshnessStatus: 'current',
    claims: [],
    studyFamilies: [],
    ...overrides,
  }
}

describe('Clinical evidence operating system contracts', () => {
  it('defines deterministic governed concept resolution with sourced Dravet terminology', () => {
    expect(operatingMigration).toContain('create table if not exists public.clinical_concepts')
    expect(operatingMigration).toContain('create table if not exists public.clinical_concept_aliases')
    expect(operatingMigration).toContain('create or replace function public.resolve_clinical_query')
    expect(operatingMigration).toContain('ORPHA:33069')
    expect(operatingMigration).toContain("'SMEI'::text")
    expect(operatingMigration).toContain("'Severe myoclonic epilepsy of infancy'::text")
    expect(operatingMigration).not.toMatch(/recommended dose|dose recommendation|prescribe/i)
  })

  it('keeps retrieval deterministic while allowing substantive terms inside clinical questions', () => {
    expect(hardeningMigration).toContain('regexp_split_to_table')
    expect(hardeningMigration).toContain('public.resolve_clinical_query(p_query, 50)')
    expect(hardeningMigration).toContain("'evidence','clinical','reviewed'")
    expect(hardeningMigration).not.toMatch(/embedding|vector|llm|language model/i)
  })

  it('requires evidence eligibility, immutable claim anchors and reviewed publication-family metadata', () => {
    expect(operatingMigration).toContain('clinical_evidence_record_is_eligible')
    expect(operatingMigration).toContain('clinical_evidence_source_snapshots')
    expect(operatingMigration).toContain('published Clinical claim requires immutable source snapshot and source locator')
    expect(operatingMigration).toContain('clinical_study_families')
    expect(operatingMigration).toContain('counts_as_independent_study boolean not null default false')
    expect(hardeningMigration).toMatch(/security definer[\s\S]*clinical_evidence_sources/)
  })

  it('does not collapse clinical, preclinical and regulatory evidence into one domain', () => {
    expect(domainMigration).toContain("'clinical','preclinical','regulatory','mixed','other','not-assessed'")
    expect(domainMigration).toContain("evidence_type in ('regulation','regulatory-guidance','product-monograph') then 'regulatory'")
    expect(domainMigration).toContain("evidence_type in ('randomized-trial','observational-study','clinical-guideline') then 'clinical'")
    expect(domainMigration).toContain('Systematic reviews/meta-analyses remain not-assessed')
  })

  it('counts normalized independent studies once across multiple publications and preserves claim anchors', () => {
    const sharedFamily = {
      evidenceRecordId: 'a',
      familyKey: 'trial-family-1',
      familyKind: 'randomized-trial' as const,
      title: 'Trial family',
      trialRegistryId: 'NCT00000000',
      protocolId: null,
      countsAsIndependentStudy: true,
      publicationRole: 'primary-report' as const,
      isPrimaryReport: true,
      overlapNote: null,
      verifiedAt: '2026-08-16T14:00:00Z',
    }
    const first = evidence('a', {
      claims: [{
        id: 'claim-a', evidenceRecordId: 'a', claimKey: 'outcome-1', claimKind: 'efficacy',
        claimOrigin: 'source-extraction', statement: 'Fixture claim.', sourceSnapshotId: 'snapshot-a',
        sourceLocator: 'p. 4', verifiedAt: '2026-08-16T14:00:00Z',
      }],
      studyFamilies: [sharedFamily],
    })
    const second = evidence('b', {
      studyFamilies: [{ ...sharedFamily, evidenceRecordId: 'b', publicationRole: 'follow-up', isPrimaryReport: false }],
    })

    const synthesis = synthesizeClinicalEvidence([first, second])
    expect(synthesis.recordCount).toBe(2)
    expect(synthesis.studyFamilyCount).toBe(1)
    expect(synthesis.independentStudyCount).toBe(1)
    expect(synthesis.claimCount).toBe(1)
    expect(synthesis.claimAnchoredRecordCount).toBe(1)
  })

  it('does not pretend source records are independent studies before family normalization exists', () => {
    const synthesis = synthesizeClinicalEvidence([evidence('a'), evidence('b')])
    expect(synthesis.recordCount).toBe(2)
    expect(synthesis.studyFamilyCount).toBe(0)
    expect(synthesis.independentStudyCount).toBeNull()
  })

  it('distinguishes a recognized concept with no governed record from an unresolved query', () => {
    expect(deriveClinicalEvidenceState({ query: 'Dravet', records: [], knownConditionMatch: true })).toBe('no-evidence')
    expect(deriveClinicalEvidenceState({ query: 'unmapped concept', records: [], knownConditionMatch: false })).toBe('no-match')
  })
})
