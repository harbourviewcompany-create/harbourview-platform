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

  it('uses exact signal lineage instead of publisher/url joins for legacy evidence', () => {
    expect(migration).toContain('source_signal_id text references public.signals(id)')
    expect(migration).toContain('intel_evidence_refs_signal_uq')
    expect(migration).toContain('join public.intel_evidence_refs e on e.source_signal_id = a.source_signal_id')
    expect(migration).not.toContain("e.source_label = nullif(s.source,'') and e.source_url is not distinct from nullif(s.url,'')")
  })

  it('counts distinct source references rather than raw clustered rows', () => {
    expect(migration).toContain("count(distinct coalesce(nullif(url,''), nullif(source,''), id))")
    expect(migration).toContain('distinct source references are associated with this event candidate')
    expect(migration).not.toContain('independent observations are associated with this event candidate')
  })

  it('preserves private evidence boundaries and excludes anonymous dossier access', () => {
    expect(migration).toContain('public.hv_evidence')
    expect(migration).toContain("access_classification = 'intel'")
    expect(migration).toContain('revoke all on public.intel_event_dossiers from anon')
    expect(migration).toContain('revoke all on api.intel_event_dossiers from anon')
    expect(dossierPage).toContain("requireAuth('signals')")
  })

  it('publishes only the allowlisted dossier through the production api schema', () => {
    expect(migration).toContain('create or replace view api.intel_event_dossiers')
    expect(migration).toContain('as select * from public.intel_event_dossiers')
    expect(migration).toContain('grant select on api.intel_event_dossiers to authenticated')
    expect(migration).not.toContain('api.intel_evidence_refs')
    expect(migration).not.toContain('api.intel_assertions')
    expect(migration).not.toContain('api.intel_events')
  })

  it('grants authenticated readers the RLS-protected base relations required by security_invoker', () => {
    expect(migration).toContain('public.intel_recommendations to authenticated')
    expect(migration).toContain('create policy intel_events_tier_read')
    expect(migration).toContain('create policy intel_evidence_refs_tier_read')
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
