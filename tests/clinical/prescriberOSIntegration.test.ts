import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8')

const page = read('components/dashboard/pages/ClinicalEvidenceCommandPage.tsx')
const mobileClinical = read('components/dashboard/mobile-command/sections/ClinicalSection.tsx')
const migration = read('supabase/migrations/20260818154500_clinical_prescriber_operating_system.sql')
const skuLinkMigration = read('supabase/migrations/20260818161500_clinical_prescriber_sku_links.sql')
const askRoute = read('app/api/clinical/ask/route.ts')
const workspaceRoute = read('app/api/clinical/workspace/route.ts')
const workspaceQuery = read('lib/server/clinicalPrescriberWorkspaceQuery.ts')

describe('Clinical Prescriber OS integration contract', () => {
  it('exposes one compact command surface and the complete workspace tab contract', () => {
    expect(page).toContain('Prescriber command')
    for (const label of [
      'Decision',
      'Evidence',
      'Safety',
      'Products',
      'Regimen',
      'Monitoring',
      'Guidelines',
      'Documentation',
      'History',
    ]) {
      expect(page).toContain(`label: '${label}'`)
    }
  })

  it('uses the same Prescriber OS component on mobile instead of the legacy Clinical split', () => {
    expect(mobileClinical).toContain("import ClinicalEvidenceCommandPage from '@/components/dashboard/pages/ClinicalEvidenceCommandPage'")
    expect(mobileClinical).toContain('data-clinical-surface="prescriber-os"')
    expect(mobileClinical).toContain('<ClinicalEvidenceCommandPage')
    expect(mobileClinical).not.toContain('ClinicalEvidenceExplorer')
    expect(mobileClinical).not.toContain('getClinicalAuthoritiesForCountry')
    expect(mobileClinical).not.toContain('fetch(`/api/clinical/formulary')
  })

  it('removes the generic weight-based helper from the prescriber-facing surface', () => {
    expect(page).not.toContain('computeWeightBasedCannabinoidDose')
    expect(page).not.toContain('DOSING_ALGORITHM_VERSION')
    expect(page).not.toContain('CAUTION_MG_PER_KG_PER_DAY')
    expect(page).toContain('legacy generic mg/kg helper is excluded')
  })

  it('uses production evidence, formulary SKU, jurisdiction and governed workspace APIs', () => {
    expect(page).toContain('/api/clinical/evidence?')
    expect(page).toContain('/api/clinical/formulary?')
    expect(page).toContain('/api/clinical/jurisdiction?')
    expect(page).toContain('/api/clinical/workspace?')
    expect(page).toContain('/api/clinical/ask?')
    expect(page).toContain('setSkus')
    expect(page).toContain('setJurisdiction')
  })

  it('keeps Ask Clinical deterministic and traceable to governed evidence', () => {
    expect(askRoute).toContain('searchClinicalEvidence')
    expect(askRoute).toContain('buildAskClinicalResponse')
    expect(askRoute).not.toMatch(/openai|anthropic|generateText|chat\.completions/i)
  })

  it('queries only governed current/published workspace rows and exposes permission state', () => {
    expect(workspaceRoute).toContain("result.state === 'permission' ? 403")
    expect(workspaceQuery).toContain(".from('clinical_safety_rules')")
    expect(workspaceQuery).toContain(".from('clinical_regimen_protocols')")
    expect(workspaceQuery).toContain(".from('clinical_monitoring_protocols')")
    expect(workspaceQuery).toContain(".from('clinical_guideline_recommendations')")
    expect(workspaceQuery).toContain(".eq('review_status', 'published')")
    expect(workspaceQuery).toContain(".eq('status', 'current')")
    expect(workspaceQuery).toContain(".overlaps('jurisdictions', [jurisdiction, 'global'])")
  })

  it('adds the governed concept, claim, safety, regimen, monitoring, guideline and longitudinal patient schema', () => {
    for (const table of [
      'clinical_concepts',
      'clinical_concept_aliases',
      'clinical_evidence_claims',
      'clinical_safety_rules',
      'clinical_regimen_protocols',
      'clinical_monitoring_protocols',
      'clinical_guideline_recommendations',
      'clinical_patient_contexts',
      'clinical_therapeutic_objectives',
      'clinical_decision_records',
      'clinical_change_events',
      'clinical_patient_impact_reviews',
    ]) {
      expect(migration).toContain(`public.${table}`)
    }
  })

  it('preserves verified clinician, care-team and active consent gates for patient-derived data', () => {
    expect(migration).toContain('public.is_verified_clinician()')
    expect(migration).toContain('public.clinical_care_team')
    expect(migration).toContain("public.clinical_has_active_consent(patient_id, 'treatment')")
    expect(migration).toContain("public.clinical_has_active_consent(patient_id, 'data_processing')")
    expect(migration).toContain('revoke all on public.clinical_patient_contexts from anon')
    expect(migration).toContain('revoke all on public.clinical_decision_records from anon')
  })

  it('fails generic PubMed-root clinical material closed without deleting evidence', () => {
    expect(migration).toContain('update public.clinical_evidence_records')
    expect(migration).toContain('update public.clinical_medication_interactions')
    expect(migration).toContain("set review_status = 'under-review'")
    expect(migration).toContain('https://pubmed.ncbi.nlm.nih.gov/')
    expect(migration).not.toMatch(/delete\s+from\s+public\.clinical_(evidence_records|medication_interactions)/i)
  })

  it('links regimen and monitoring protocols to exact governed SKUs after the SKU bootstrap', () => {
    expect(skuLinkMigration).toContain('formulary_sku_id uuid')
    expect(skuLinkMigration).toContain('references public.clinical_formulary_skus(id)')
    expect(skuLinkMigration).toContain('clinical_regimen_requires_product_reference')
    expect(skuLinkMigration).toContain('formulary_sku_ids uuid[]')
  })
})
