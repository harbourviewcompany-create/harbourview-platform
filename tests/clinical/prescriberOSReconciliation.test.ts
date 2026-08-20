import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildAskClinicalResponse, isInspectableClinicalSource } from '@/lib/clinical/prescriber'

const root = process.cwd()
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8')

const command = read('components/dashboard/pages/ClinicalEvidenceCommandPage.tsx')
const commandCentre = read('components/dashboard/CommandCentre.tsx')
const mobile = read('components/dashboard/mobile-command/sections/ClinicalSection.tsx')
const explorer = read('components/dashboard/mobile-command/ClinicalEvidenceExplorer.tsx')
const workspace = read('components/dashboard/pages/ClinicalWorkspacePage.tsx')
const interactionQuery = read('lib/server/clinicalInteractionQuery.ts')
const workspaceQuery = read('lib/server/clinicalPrescriberWorkspaceQuery.ts')
const formularyQuery = read('lib/server/clinicalFormularyQuery.ts')
const preflightMigration = read('supabase/migrations/20260818212800_clinical_prescriber_governance_preflight.sql')
const dedupeMigration = read('supabase/migrations/20260818212900_clinical_interaction_published_uniqueness.sql')
const reconciliationMigration = read('supabase/migrations/20260818213000_clinical_prescriber_os_reconciliation.sql')
const auditMigration = read('supabase/migrations/20260818213100_clinical_provenance_remediation_audit.sql')

describe('Clinical Prescriber OS reconciliation', () => {
  it('fails closed on generic source portals and accepts inspectable records', () => {
    expect(isInspectableClinicalSource('https://pubmed.ncbi.nlm.nih.gov/')).toBe(false)
    expect(isInspectableClinicalSource('https://www.gov.br/anvisa')).toBe(false)
    expect(isInspectableClinicalSource('https://www.accessdata.fda.gov/scripts/cder/daf/')).toBe(false)
    expect(isInspectableClinicalSource('https://www.tga.gov.au/')).toBe(false)
    expect(isInspectableClinicalSource('https://pubmed.ncbi.nlm.nih.gov/36417631/')).toBe(true)
    expect(isInspectableClinicalSource('https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/medical-use-cannabis.html')).toBe(true)
  })

  it('does not assemble an evidence answer before an explicit question', () => {
    const result = buildAskClinicalResponse('', [])
    expect(result.state).toBe('empty')
    expect(result.citations).toEqual([])
    expect(command).toContain('query.trim().length < 2')
    expect(explorer).toContain('query.trim().length < 2')
    expect(explorer).not.toContain('answerRecord')
  })

  it('does not silently substitute Brazil or another jurisdiction', () => {
    expect(command).not.toMatch(/countryIso2\s*=\s*['"]BR['"]/)
    expect(command).not.toMatch(/countryIso2\s*\|\|\s*['"]BR['"]/)
    expect(command).toContain('Jurisdiction required')
    expect(mobile).toContain('Jurisdiction required')
    expect(workspace).toContain('Clinical does not infer or substitute a country')
  })

  it('embeds the complete Clinical Workspace in Command (desktop + mobile) when jurisdiction is set', () => {
    // Mobile embeds ClinicalWorkspacePage (post #1578); desktop CommandCentre matches.
    expect(mobile).toContain('ClinicalWorkspacePage')
    expect(mobile).toContain('embedded')
    expect(mobile).toContain('Jurisdiction required')
    expect(commandCentre).toContain('ClinicalWorkspacePage')
    expect(commandCentre).toMatch(/case 'clinical'/)
    expect(commandCentre).toContain('embedded')
    // Workspace still supports dedicated full-page mode via embedded prop
    expect(workspace).toContain('embedded?: boolean')
    for (const label of ['Decision', 'Evidence', 'Safety', 'Products', 'Regimen', 'Monitoring', 'Guidelines', 'Documentation', 'History']) {
      expect(workspace).toContain(`label: '${label}'`)
    }
  })

  it('keeps ClinicalEvidenceCommandPage as a dual-surface summary component', () => {
    expect(command).toContain('ClinicalEvidenceCommandPage')
    expect(commandCentre).toContain('ClinicalEvidenceCommandPage')
  })

  it('removes regex-derived Safety classification from Clinical evidence', () => {
    expect(explorer).not.toMatch(/const\s+isSafety\s*=/)
    expect(explorer).not.toMatch(/safety\|adverse\|tolerab/i)
    expect(workspace).toContain('workspace?.safety')
    expect(workspaceQuery).toContain(".from('clinical_safety_rules')")
  })

  it('does not mask production interaction failures with fixtures', () => {
    expect(interactionQuery).toContain("process.env.NODE_ENV !== 'production'")
    expect(interactionQuery).toContain("process.env.HARBOURVIEW_CLINICAL_FIXTURES === '1'")
    expect(interactionQuery).toContain("state: 'error'")
    expect(interactionQuery).toContain("state: 'empty'")
    expect(interactionQuery).toContain("state: 'review-required'")
  })

  it('uses typed Clinical DTO boundaries instead of generic object bags', () => {
    expect(mobile).not.toContain('Record<string, unknown>')
    expect(command).not.toContain('Record<string, unknown>')
    expect(workspace).not.toContain('Record<string, unknown>')
    expect(workspaceQuery).not.toContain('Record<string, unknown>')
    expect(formularyQuery).not.toContain('Record<string, unknown>')
  })

  it('fails closed before Prescriber OS DDL when the applied production governance contract is absent', () => {
    for (const required of [
      'public.clinical_evidence_reviews',
      'public.clinical_reviewer_credentials',
      'public.clinical_evidence_snapshots',
      'public.clinical_grade_assessments',
      'public.clinical_monitoring_protocols',
      'public.clinical_formulary_skus',
      'clinical_evidence_records.publication_scope',
      'clinical_evidence_records.freshness_status',
      'clinical_evidence_records.source_registry_id',
      'public.clinical_evidence_has_review_role(text[])',
    ]) {
      expect(preflightMigration).toContain(required)
    }
    expect(preflightMigration).toContain('20260819100621_clinical_evidence_spine_reconcile.sql')
    expect(preflightMigration).toContain('RAISE EXCEPTION')
    expect(preflightMigration).not.toMatch(/create table|alter table|update public\.|insert into/i)
    expect(preflightMigration).not.toContain('clinical_evidence_source_snapshots')
    expect(preflightMigration).not.toContain('clinical_evidence_grade_assessments')
    expect(preflightMigration).not.toContain('primary_source_registry_id')
  })

  it('reconciles current-main monitoring instead of creating the stale PR table shape', () => {
    expect(reconciliationMigration).toContain('alter table public.clinical_monitoring_protocols')
    expect(reconciliationMigration).not.toMatch(/create table if not exists public\.clinical_monitoring_protocols/i)
    expect(reconciliationMigration).toContain('source_locator')
    expect(reconciliationMigration).toContain('provenance_status')
  })

  it('requires exact claim-level provenance and preserves credential-bound publication review', () => {
    expect(reconciliationMigration).toContain('public.clinical_evidence_claims')
    expect(reconciliationMigration).toContain('source_locator text not null')
    expect(reconciliationMigration).toContain('public.clinical_source_is_prescriber_inspectable')
    expect(reconciliationMigration).toContain('clinical_reviewer_credential_is_valid')
    expect(reconciliationMigration).toContain('credential-bound clinician/pharmacist review')
    expect(reconciliationMigration).toContain("set review_status = 'under-review'")
  })

  it('preserves duplicate interaction history while enforcing one published normalized pair', () => {
    expect(dedupeMigration).toContain("review_status = 'under-review'")
    expect(dedupeMigration).toContain('row_number() over')
    expect(dedupeMigration).toContain("where review_status = 'published'")
    expect(dedupeMigration).toContain('uq_clinical_interaction_normalized_pair')
  })

  it('preserves patient consent, care-team and professional-authority gates', () => {
    expect(reconciliationMigration).toContain("public.clinical_has_active_consent(patient_id, 'treatment')")
    expect(reconciliationMigration).toContain("public.clinical_has_active_consent(patient_id, 'data_processing')")
    expect(reconciliationMigration).toContain('public.clinical_care_team')
    expect(reconciliationMigration).toContain('public.is_verified_clinician()')
  })

  it('provisions a private append-only remediation audit when historical V1.1 operations are absent', () => {
    expect(auditMigration).toContain('create table if not exists public.clinical_evidence_operation_events')
    expect(auditMigration).toContain('clinical_operation_event_immutable')
    expect(auditMigration).toContain('enable row level security')
    expect(auditMigration).toContain('prescriber-provenance-remediation')
    expect(auditMigration).toContain('evidence_records_withheld')
    expect(auditMigration).toContain('interaction_records_withheld')
    expect(auditMigration).toContain('remaining_published_noninspectable_evidence')
    expect(auditMigration).toContain('remaining_published_noninspectable_interactions')
  })
})
