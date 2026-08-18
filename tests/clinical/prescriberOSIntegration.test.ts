import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8')

const page = read('components/dashboard/pages/ClinicalEvidenceCommandPage.tsx')
const mobileClinical = read('components/dashboard/mobile-command/sections/ClinicalSection.tsx')
const migration = read('supabase/migrations/20260818154500_clinical_prescriber_operating_system.sql')
const skuLinkMigration = read('supabase/migrations/20260818161500_clinical_prescriber_sku_links.sql')
const pharmacovigilanceMigration = read('supabase/migrations/20260818162000_clinical_prescriber_pharmacovigilance.sql')
const askRoute = read('app/api/clinical/ask/route.ts')
const workspaceRoute = read('app/api/clinical/workspace/route.ts')
const workspaceQuery = read('lib/server/clinicalPrescriberWorkspaceQuery.ts')
const authorityRoute = read('app/api/clinical/authority/route.ts')
const authorityResolver = read('lib/server/clinicalProfessionalAuthority.ts')
const patientReadinessRoute = read('app/api/clinical/patients/[id]/readiness/route.ts')
const adverseEventRoute = read('app/api/clinical/adverse-events/route.ts')

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

  it('uses production evidence, formulary SKU, jurisdiction, authority, patient and governed workspace APIs', () => {
    expect(page).toContain('/api/clinical/evidence?')
    expect(page).toContain('/api/clinical/formulary?')
    expect(page).toContain('/api/clinical/jurisdiction?')
    expect(page).toContain('/api/clinical/workspace?')
    expect(page).toContain('/api/clinical/authority?')
    expect(page).toContain("fetch('/api/clinical/patients')")
    expect(page).toContain('/readiness?country=${encodeURIComponent(iso2)}')
    expect(page).toContain('/api/clinical/adverse-events')
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

  it('resolves professional authority from verified clinician identity and governed jurisdiction rows', () => {
    expect(authorityRoute).toContain('resolveClinicalProfessionalAuthority')
    expect(authorityResolver).toContain('requireVerifiedClinician()')
    expect(authorityResolver).toContain(".from('clinical_jurisdiction_authority')")
    expect(authorityResolver).toContain(".eq('clinical_role', professional.clinical_role)")
    expect(authorityResolver).toContain("state: 'unknown'")
    expect(authorityResolver).not.toContain('roleLabel')
    expect(page).toContain('authority?.capabilities.prescribe === true')
  })

  it('makes patient readiness a jurisdiction-bound read-only verified-clinician view of access, core consent and open encounter state', () => {
    expect(patientReadinessRoute).toContain('requireVerifiedClinician()')
    expect(patientReadinessRoute).toContain("country: request.nextUrl.searchParams.get('country')")
    expect(patientReadinessRoute).toContain(".from('clinical_patients')")
    expect(patientReadinessRoute).toContain('Patient jurisdiction does not match the active Clinical jurisdiction.')
    expect(patientReadinessRoute).toContain("p_consent_type: 'treatment'")
    expect(patientReadinessRoute).toContain("p_consent_type: 'data_processing'")
    expect(patientReadinessRoute).toContain(".from('clinical_encounters')")
    expect(patientReadinessRoute).toContain(".eq('jurisdiction', expectedJurisdiction)")
    expect(patientReadinessRoute).toContain(".eq('status', 'open')")
    expect(patientReadinessRoute).not.toMatch(/\.insert\(|\.update\(|\.delete\(/)
    expect(page).toContain('patient.jurisdiction.toUpperCase() === iso2')
    expect(page).toContain('/readiness?country=${encodeURIComponent(iso2)}')
    expect(page).toContain("consentConfirmed: patientReadiness?.consent?.core === true")
    expect(page).toContain("hasClinicalContext: Boolean(patientReadiness?.state === 'loaded' && patientReadiness.openEncounter)")
  })

  it('requires an inspectable exact SKU before product readiness can clear', () => {
    expect(page).toContain('productResolved: Boolean(selectedSku)')
    expect(page).toContain('Select an inspectable exact SKU in Products')
    expect(page).toContain('Use in decision')
    expect(page).not.toContain('productResolved: inspectableProducts.length > 0 || inspectableSkus.length > 0')
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

  it('records adverse events without inferring or auto-submitting regulatory reports', () => {
    expect(adverseEventRoute).toContain('requireVerifiedClinician()')
    expect(adverseEventRoute).toContain(".from('clinical_adverse_events')")
    expect(adverseEventRoute).toContain('Recorded in Harbourview only. No external regulator submission was performed.')
    expect(page).toContain('Harbourview does not infer reporting obligations or submit regulator reports')
    expect(pharmacovigilanceMigration).toContain('public.clinical_adverse_events')
    expect(pharmacovigilanceMigration).toContain("public.clinical_has_active_consent(patient_id, 'treatment')")
    expect(pharmacovigilanceMigration).toContain("public.clinical_has_active_consent(patient_id, 'data_processing')")
    expect(pharmacovigilanceMigration).toContain('public.clinical_care_team')
    expect(pharmacovigilanceMigration).toContain('clinical_adverse_event_encounter_patient_mismatch')
    expect(pharmacovigilanceMigration).toContain('clinical_adverse_event_ownership_immutable')
    expect(pharmacovigilanceMigration).toContain('public.clinical_audit_write')
    expect(pharmacovigilanceMigration).not.toMatch(/http_post|net\.http|pg_net|fetch\s*\(/i)
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
