import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const migration = readFileSync('supabase/migrations/20260808190000_decision_intel_stage0_first_slice.sql', 'utf8')
const hardening = readFileSync('supabase/migrations/20260808203000_decision_intel_stage0_review_fixes.sql', 'utf8')
const intelUi = readFileSync('components/dashboard/mobile-command/sections/IntelligenceSections.tsx', 'utf8')
const desktopBridge = readFileSync('components/dashboard/DesktopDecisionIntelBridge.tsx', 'utf8')
const dossierPage = readFileSync('app/dashboard/intel/events/[id]/page.tsx', 'utf8')
const dossierLoader = readFileSync('lib/intelligence-os/decisionDossier.ts', 'utf8')
const dashboardMapper = readFileSync('lib/dashboard/mapPublicToDashboardSignal.ts', 'utf8')
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
    for (const table of ['intel_evidence_refs','intel_assertions','intel_assertion_evidence','intel_events','intel_event_assertions','intel_assessments','intel_assessment_versions','intel_recommendations']) {
      expect(migration).toContain(`public.${table}`)
    }
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
  })

  it('counts distinct source references rather than raw clustered rows', () => {
    expect(migration).toContain("count(distinct coalesce(nullif(url,''), nullif(source,''), id))")
    expect(migration).toContain('distinct source references are associated with this event candidate')
  })

  it('keeps customer reads behind gated RPCs while staff RLS retains DML', () => {
    expect(hardening).toContain('create or replace function api.get_intel_event_dossier')
    expect(hardening).toContain('create or replace function api.resolve_intel_event_route')
    expect(hardening).toContain('security definer')
    expect(hardening).toContain('revoke all on api.intel_event_dossiers from authenticated, anon')
    expect(hardening).toContain('drop policy if exists intel_events_tier_read')
    expect(hardening).toContain('grant select, insert, update, delete on')
    expect(dossierLoader).toContain("db.rpc('get_intel_event_dossier'")
    expect(dossierLoader).toContain("db.rpc('resolve_intel_event_route'")
    expect(dossierLoader).not.toContain(".from('intel_event_dossiers')")
    expect(dossierLoader).not.toContain(".from('intel_event_route_map')")
  })

  it('makes assessment history immutable and confidence a probability', () => {
    expect(hardening).toContain('intel_assessment_versions is append-only')
    expect(hardening).toContain('before update or delete on public.intel_assessment_versions')
    expect(hardening).toContain('confidence >= 0 and confidence <= 1')
    expect(hardening).toContain("alter table public.intel_events alter column review_status set default 'needs_review'")
  })

  it('preserves evidence relationships and canonical ownership for suppressed rows', () => {
    expect(hardening).toContain("'relationship', ae.relationship")
    expect(hardening).toContain("where e.review_status in ('migrated_reviewed','verified')")
    expect(hardening).toContain('create or replace view public.intel_event_route_map')
    expect(hardening).toContain('where ia.source_signal_id is not null')
    expect(dossierLoader).toContain('Canonical ownership exists but the allowlisted dossier did not return a row')
    expect(dossierLoader).toContain('return null')
  })

  it('preserves native reviewed-signal ids and resolves regulatory mirror ids server-side', () => {
    expect(dashboardMapper).toContain('decisionIntelEventId: `event:${s.id}`')
    expect(dashboardMapper).not.toContain('`event:rs-${s.id}`')
    expect(hardening).toContain("m.signal_id = 'rs-' || p_signal_id")
  })

  it('recovers canonical jurisdiction ids without fabricating registry rows', () => {
    expect(hardening).toContain("column_name = 'country_iso2'")
    expect(hardening).toContain("upper(j.jurisdiction_id) = upper(nullif(s.country_iso2, ''))")
    expect(hardening).toContain('count(distinct a.jurisdiction_id) = 1')
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
  })

  it('exposes the full first-slice dossier hierarchy', () => {
    for (const label of ['What happened','What changed','Why it matters','Commercial implications','Regulatory implications','Confidence rationale','Unknowns','Contradictions','Evidence','Recommended posture']) {
      expect(dossierPage).toContain(label)
    }
  })

  it('filters known classifier rejects during backfill and legacy fallback', () => {
    for (const label of ['spam', 'boilerplate', 'nav', 'duplicate']) {
      expect(migration).toContain(label)
      expect(dossierLoader).toContain(label)
    }
    expect(migration).toContain("s.action <> 'rejected'")
  })
})
