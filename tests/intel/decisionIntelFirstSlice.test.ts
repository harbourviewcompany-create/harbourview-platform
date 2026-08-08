import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const migration = readFileSync('supabase/migrations/20260808190000_decision_intel_stage0_first_slice.sql', 'utf8')
const hardening = readFileSync('supabase/migrations/20260808203000_decision_intel_stage0_review_fixes.sql', 'utf8')
const intelUi = readFileSync('components/dashboard/mobile-command/sections/IntelligenceSections.tsx', 'utf8')
const desktopBridge = readFileSync('components/dashboard/DesktopDecisionIntelBridge.tsx', 'utf8')
const dossierPage = readFileSync('app/dashboard/intel/events/[id]/page.tsx', 'utf8')
const dossierLoader = readFileSync('lib/intelligence-os/decisionDossier.ts', 'utf8')
const complianceCopy = readFileSync('lib/intelligence-os/complianceCopy.ts', 'utf8')
const controlDoc = readFileSync('docs/control/INTEL_DECISION_OS_EXISTING_TARGET.md', 'utf8')

describe('Decision Intelligence Stage 0 first slice', () => {
  it('keeps the existing acquisition and Pipeline B estate upstream', () => {
    expect(controlDoc).toContain('`public.source_registry`')
    expect(controlDoc).toContain('Existing `public.signals` and Pipeline B remain upstream')
    expect(migration).toContain('from public.signals s')
    expect(migration).toContain('coalesce(nullif(s.cluster_rep_id')
  })

  it('establishes only the first-slice evidence → assertion → event → assessment → recommendation chain', () => {
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
    expect(hardening).not.toContain('intel_hypotheses')
    expect(hardening).not.toContain('intel_scenarios')
    expect(hardening).not.toContain('intel_market_access')
  })

  it('does not infer verified intelligence from legacy review', () => {
    expect(migration).toContain("'migrated_reviewed'")
    expect(migration).toContain("'needs_review'")
    expect(dossierLoader).not.toContain("reviewStatus: 'verified'")
    expect(dossierLoader).toContain('lastVerifiedAt: null')
    expect(complianceCopy).toContain('Legacy reviewed state is not treated as verified intelligence.')
  })

  it('keeps exact signal lineage while allowing one snapshot to support multiple signals', () => {
    expect(migration).toContain('intel_evidence_refs_signal_uq')
    expect(migration).toContain('join public.intel_evidence_refs e on e.source_signal_id = a.source_signal_id')
    expect(hardening).toContain('drop index if exists public.intel_evidence_refs_snapshot_uq')
    expect(hardening).toContain('drop constraint if exists intel_evidence_refs_source_signal_id_fkey')
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
    expect(hardening).toContain('revoke all on api.intel_event_dossiers from anon')
    expect(hardening).toContain('revoke all on api.intel_event_route_map from anon')
    expect(dossierPage).toContain("requireAuth('signals')")
  })

  it('keeps security-invoker base grants while filtering rejected product states', () => {
    expect(migration).toContain('public.intel_recommendations to authenticated')
    expect(migration).toContain('create policy intel_events_tier_read')
    expect(migration).toContain('create policy intel_evidence_refs_tier_read')
    expect(hardening).toContain("r.review_status in ('needs_review','migrated_reviewed','verified')")
    expect(hardening).toContain("ia.review_status in ('migrated_reviewed','verified')")
  })

  it('makes assessment history immutable and confidence a probability', () => {
    expect(hardening).toContain('intel_assessment_versions is append-only')
    expect(hardening).toContain('before update or delete on public.intel_assessment_versions')
    expect(hardening).toContain('confidence >= 0 and confidence <= 1')
    expect(hardening).toContain("alter table public.intel_events alter column review_status set default 'needs_review'")
  })

  it('preserves evidence relationship semantics and clustered event aliases', () => {
    expect(hardening).toContain("'relationship', ae.relationship")
    expect(hardening).toContain('create or replace view public.intel_event_route_map')
    expect(dossierLoader).toContain("item.relationship === 'contradicts'")
    expect(dossierLoader).toContain(".from('intel_event_route_map')")
  })

  it('uses only api.signals-compatible columns for the legacy public signal fallback', () => {
    const fallbackSelect = dossierLoader.match(/\.from\('signals'\)[\s\S]*?\.select\('([^']+)'\)/)?.[1] ?? ''
    expect(fallbackSelect).not.toContain('analysis')
    expect(fallbackSelect).not.toContain('snapshot_id')
    expect(fallbackSelect).toContain('cluster_rep_id')
    expect(dossierLoader).toContain('loadIaFallback')
  })

  it('makes mobile and desktop intelligence reach the dossier without losing dashboard context', () => {
    expect(intelUi).toContain('/dashboard/intel/events/')
    expect(intelUi).toContain('returnTo=')
    expect(intelUi).toContain("style={{ display: 'block'")
    expect(desktopBridge).toContain('/dashboard/intel/events/')
    expect(desktopBridge).toContain('Evidence-backed dossiers')
    expect(dossierPage).toContain('safeReturnTo')
    expect(dossierPage).toContain('href={backHref}')
  })

  it('centralizes the customer-facing verification semantics', () => {
    expect(complianceCopy).toContain('INTEL_DECISION_OS_EXISTING_TARGET.md')
    expect(complianceCopy).toContain('Legacy reviewed state is not treated as verified intelligence.')
    expect(dossierPage).toContain('LEGACY_REVIEW_VERIFICATION_NOTICE')
    expect(dossierPage).not.toContain('Legacy reviewed state is not treated as verified intelligence.</p>')
  })

  it('exposes the full first-slice dossier hierarchy', () => {
    for (const label of [
      'What happened', 'What changed', 'Why it matters', 'Commercial implications',
      'Regulatory implications', 'Confidence rationale', 'Unknowns', 'Contradictions',
      'Evidence', 'Recommended posture',
    ]) expect(dossierPage).toContain(label)
  })

  it('filters known classifier rejects during backfill and legacy fallback', () => {
    for (const label of ['spam', 'boilerplate', 'nav', 'duplicate']) {
      expect(migration).toContain(label)
      expect(dossierLoader).toContain(label)
    }
    expect(migration).toContain("s.action <> 'rejected'")
  })
})
