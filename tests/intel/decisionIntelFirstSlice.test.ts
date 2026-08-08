import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const migration = readFileSync('supabase/migrations/20260808190000_decision_intel_stage0_first_slice.sql', 'utf8')
const intelUi = readFileSync('components/dashboard/mobile-command/sections/IntelligenceSections.tsx', 'utf8')
const dossierPage = readFileSync('app/dashboard/intel/events/[id]/page.tsx', 'utf8')
const dossierLoader = readFileSync('lib/intelligence-os/decisionDossier.ts', 'utf8')
const controlDoc = readFileSync('docs/control/INTEL_DECISION_OS_EXISTING_TARGET.md', 'utf8')

describe('Decision Intelligence Stage 0 first slice', () => {
  it('keeps the existing acquisition and Pipeline B estate upstream', () => {
    expect(controlDoc).toContain('`public.source_registry`')
    expect(controlDoc).toContain('Existing `public.signals` and Pipeline B remain upstream')
    expect(migration).toContain('from public.signals s')
    expect(migration).toContain('coalesce(nullif(s.cluster_rep_id')
  })

  it('establishes the evidence → assertion → event → assessment → recommendation chain', () => {
    for (const table of [
      'intel_evidence_refs',
      'intel_assertions',
      'intel_assertion_evidence',
      'intel_events',
      'intel_event_assertions',
      'intel_assessments',
      'intel_assessment_versions',
      'intel_recommendations',
    ]) expect(migration).toContain(`public.${table}`)
  })

  it('does not infer verified intelligence from legacy reviewed signals', () => {
    expect(migration).toContain("'migrated_reviewed'")
    expect(migration).toContain("'needs_review'")
    expect(dossierLoader).toContain('legacy reviewed signal')
    expect(dossierLoader).not.toContain("reviewStatus: 'verified'")
  })

  it('preserves private evidence boundaries and excludes anonymous dossier access', () => {
    expect(migration).toContain('public.hv_evidence')
    expect(migration).toContain("access_classification = 'intel'")
    expect(migration).toContain('revoke all on public.intel_event_dossiers from anon')
    expect(dossierPage).toContain("requireAuth('signals')")
  })

  it('makes mobile intelligence tappable and exposes a decision dossier', () => {
    expect(intelUi).toContain('/dashboard/intel/events/')
    expect(intelUi).toContain('Open dossier')
    expect(dossierPage).toContain('What happened')
    expect(dossierPage).toContain('What changed')
    expect(dossierPage).toContain('Why it matters')
    expect(dossierPage).toContain('Commercial implications')
    expect(dossierPage).toContain('Regulatory implications')
    expect(dossierPage).toContain('Confidence rationale')
    expect(dossierPage).toContain('Unknowns')
    expect(dossierPage).toContain('Contradictions')
    expect(dossierPage).toContain('Evidence')
    expect(dossierPage).toContain('Recommended posture')
  })

  it('filters known classifier rejects during backfill and legacy fallback', () => {
    for (const label of ['spam', 'boilerplate', 'nav', 'duplicate']) {
      expect(migration).toContain(label)
      expect(dossierLoader).toContain(label)
    }
    expect(migration).toContain("s.action <> 'rejected'")
  })
})
