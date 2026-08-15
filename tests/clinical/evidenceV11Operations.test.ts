import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const foundation = fs.readFileSync(path.join(root, 'supabase/migrations/20260814143500_clinical_evidence_v1_production_foundation.sql'), 'utf8')
const migration = fs.readFileSync(path.join(root, 'supabase/migrations/20260814150000_clinical_evidence_v1_1_operations.sql'), 'utf8')
const actions = fs.readFileSync(path.join(root, 'app/clinical/review/actions.ts'), 'utf8')
const workbench = fs.readFileSync(path.join(root, 'app/clinical/review/page.tsx'), 'utf8')
const inspection = fs.readFileSync(path.join(root, 'app/clinical/review/source/[sourceId]/page.tsx'), 'utf8')
const guard = fs.readFileSync(path.join(root, 'lib/auth/clinicalReviewGuard.ts'), 'utf8')
const loader = fs.readFileSync(path.join(root, 'lib/server/clinicalEvidenceOperations.ts'), 'utf8')

describe('Clinical Evidence V1.1 governed operations', () => {
  it('creates private intake and append-only operations audit contracts', () => {
    expect(migration).toContain('create table if not exists public.clinical_evidence_intake_queue')
    expect(migration).toContain('create table if not exists public.clinical_evidence_operation_events')
    expect(migration).toContain('Clinical operation events are append-only')
    expect(migration).toContain('alter table public.clinical_evidence_intake_queue enable row level security')
    expect(migration).toContain('alter table public.clinical_evidence_operation_events enable row level security')
    expect(migration).toContain('revoke all on api.clinical_evidence_review_queue from public, anon')
    expect(migration).toContain('revoke all on api.clinical_evidence_freshness_queue from public, anon')
    expect(migration).not.toContain('grant select on public.clinical_evidence_intake_queue to anon')
    expect(migration).not.toContain('grant select on public.clinical_evidence_operation_events to anon')
  })

  it('supports both exact source-byte hashes and explicitly scoped normalized-extract hashes', () => {
    expect(actions).toContain("hashScope === 'normalized-reviewed-extract'")
    expect(actions).toContain("createHash('sha256').update(normalizedExtract, 'utf8').digest('hex')")
    expect(actions).toContain("throw new Error('source_byte_hash_and_size_required')")
    expect(actions).toContain('storage_path: optional(form, \'storage_path\')')
    expect(foundation).toContain("hash_scope text not null check (hash_scope in ('source-bytes','normalized-reviewed-extract'))")
    expect(foundation).toContain("constraint clinical_snapshot_bytes_require_size check (hash_scope <> 'source-bytes' or byte_size is not null)")
  })

  it('keeps newly identified synthesis sources private and ungraded', () => {
    for (const sourceKey of ['pubmed-40238954', 'pubmed-39953210', 'pubmed-38478773', 'pubmed-38171632']) {
      expect(migration).toContain(sourceKey)
    }
    expect(migration).toContain("'source-identified'")
    expect(migration).toContain("'snapshot-required'")
    expect(migration).not.toMatch(/insert into public\.clinical_evidence_records[\s\S]*pubmed-40238954/)
    expect(actions).toContain("evidence_strength: 'ungraded'")
    expect(actions).toContain("review_status: 'under-review'")
    expect(actions).toContain('No clinical conclusion is approved until governed review is complete.')
  })

  it('binds qualified review to the authenticated reviewer current credential', () => {
    expect(guard).toContain("new Set(['admin', 'operator', 'analyst'])")
    expect(guard).toContain(".eq('user_id', user.id)")
    expect(guard).toContain(".eq('verification_status', 'verified')")
    expect(actions).toContain('qualified_review_requires_current_owned_credential')
    expect(actions).toContain('auth.qualifiedCredentialIds.includes(credentialId)')
    expect(actions).toContain("reviewer_user_id: auth.user.id")
    expect(actions).toContain('reviewer_credential_id: credentialId')
    expect(actions).toContain("credential_verification_requires_admin_or_operator")
    expect(actions).toContain("publication_requires_admin_or_operator")
  })

  it('exposes the complete governed workflow without changing the public Clinical UI', () => {
    for (const label of [
      'Intake source',
      'Capture immutable snapshot',
      'Create ungraded evidence draft',
      'Structured extraction',
      'Provenance / qualified review',
      'Reproducible grading assessment',
      'Contradiction / partial supersession resolution',
      'Verify reviewer credential',
      'Publication / supersession',
    ]) expect(workbench).toContain(label)
    expect(workbench).toContain('Evidence operations queue')
    expect(workbench).toContain('Freshness queue')
    expect(loader).toContain('clinical_evidence_review_queue')
    expect(loader).toContain('clinical_evidence_freshness_queue')
  })

  it('provides side-by-side source, extraction, reviews, conflicts and publication history inspection', () => {
    expect(inspection).toContain('Side-by-side source inspection')
    expect(inspection).toContain('Captured source snapshot')
    expect(inspection).toContain('Structured extraction')
    expect(inspection).toContain('intervention_or_exposure')
    expect(inspection).toContain('effect_estimates')
    expect(inspection).toContain('Contradictions / supersession')
    expect(inspection).toContain('Publication history')
    expect(loader).toContain('clinical_evidence_publication_versions')
    expect(loader).toContain('clinical_evidence_conflicts')
  })

  it('relies on database publication, grading and conflict gates instead of bypassing them', () => {
    expect(actions).toContain("from('clinical_evidence_reviews').insert")
    expect(actions).toContain("from('clinical_evidence_grade_assessments').insert")
    expect(actions).toContain("from('clinical_evidence_conflicts').update")
    expect(actions).toContain("from('clinical_evidence_records').update(patch)")
    expect(actions).not.toContain('disable trigger')
    expect(actions).not.toContain('set session_replication_role')
  })
})
