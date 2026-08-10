import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const migration = readFileSync('supabase/migrations/20260808190000_decision_intel_stage0_first_slice.sql', 'utf8')
const hardening = readFileSync('supabase/migrations/20260808203000_decision_intel_stage0_review_fixes.sql', 'utf8')
const intelUi = readFileSync('components/dashboard/mobile-command/sections/IntelligenceSections.tsx', 'utf8')
const mobileShell = readFileSync('components/dashboard/MobileCommandCentreRebuild.tsx', 'utf8')
const responsiveShell = readFileSync('components/dashboard/DashboardResponsiveShell.tsx', 'utf8')
const dashboardPage = readFileSync('app/dashboard/page.tsx', 'utf8')
const desktopBridge = readFileSync('components/dashboard/DesktopDecisionIntelBridge.tsx', 'utf8')
const dossierPage = readFileSync('app/dashboard/intel/events/[id]/page.tsx', 'utf8')
const dossierLoader = readFileSync('lib/intelligence-os/decisionDossier.ts', 'utf8')
const dashboardMapper = readFileSync('lib/dashboard/mapPublicToDashboardSignal.ts', 'utf8')
const dashboardServerData = readFileSync('lib/dashboard/dashboardServerData.ts', 'utf8')
const complianceCopy = readFileSync('lib/intelligence-os/complianceCopy.ts', 'utf8')
const controlDoc = readFileSync('docs/control/INTEL_DECISION_OS_EXISTING_TARGET.md', 'utf8')
const databaseControl = readFileSync('docs/control/DATABASE_CONTROL.md', 'utf8')
const firstSliceWorkflow = readFileSync('.github/workflows/decision-intel-first-slice-verify.yml', 'utf8')
const reviewFixWorkflow = readFileSync('.github/workflows/decision-intel-stage0-review-fixes-verify.yml', 'utf8')

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
    expect(migration).not.toContain('intel_evidence_refs_snapshot_uq')
    expect(migration).toContain('join public.intel_evidence_refs e on e.source_signal_id = a.source_signal_id')
    expect(migration).toContain('source_snapshot_id uuid references public.source_snapshots(id) on delete restrict')
    expect(migration).toContain('hv_evidence_id uuid references public.hv_evidence(id) on delete restrict')
    expect(hardening).toContain('drop index if exists public.intel_evidence_refs_snapshot_uq')
    expect(hardening).toContain('drop constraint if exists intel_evidence_refs_source_signal_id_fkey')
    expect(hardening).toContain('drop constraint if exists intel_assertions_source_signal_id_fkey')
    expect(firstSliceWorkflow).toContain("('sig-b','20000000-0000-0000-0000-000000000001','sig-a'")
    expect(firstSliceWorkflow).toContain('shared snapshot cardinality')
  })

  it('counts distinct source references rather than raw clustered rows', () => {
    expect(migration).toContain("count(distinct coalesce(nullif(url,''), nullif(source,''), id))")
    expect(migration).toContain('distinct source references are associated with this event candidate')
  })

  it('keeps customer reads behind gated RPCs while staff RLS retains controlled DML', () => {
    expect(hardening).toContain('create or replace function api.get_intel_event_dossier')
    expect(hardening).toContain('create or replace function api.resolve_intel_event_route')
    expect(hardening).toContain('security definer')
    expect(hardening).toContain('revoke all on api.intel_event_dossiers from authenticated, anon')
    expect(hardening).toContain('drop policy if exists intel_events_tier_read')
    expect(hardening).toContain('grant select, insert, update on')
    expect(hardening).toContain('revoke delete on public.intel_events, public.intel_assessments from authenticated')
    expect(dossierLoader).toContain("db.rpc('get_intel_event_dossier'")
    expect(dossierLoader).toContain("db.rpc('resolve_intel_event_route'")
    expect(dossierLoader).not.toContain(".from('intel_event_dossiers')")
    expect(dossierLoader).not.toContain(".from('intel_event_route_map')")
    expect(databaseControl).toContain('SECURITY DEFINER RPC')
    expect(databaseControl).toContain('api.get_intel_event_dossier')
    expect(controlDoc).toContain('tier-gated `SECURITY DEFINER` RPCs')
  })

  it('makes assessment history immutable and complete from creation onward', () => {
    expect(hardening).toContain('intel_assessment_versions is append-only')
    expect(hardening).toContain('before update or delete on public.intel_assessment_versions')
    expect(hardening).toContain('append_intel_assessment_version_on_write')
    expect(hardening).toContain('after insert or update on public.intel_assessments')
    expect(hardening).toContain("'Canonical assessment created'")
    expect(hardening).toContain("'Canonical assessment update'")
    expect(hardening).toContain('prevent_intel_canonical_delete')
    expect(hardening).toContain('on delete restrict')
    expect(hardening).toContain('confidence >= 0 and confidence <= 1')
    expect(hardening).toContain("alter table public.intel_events alter column review_status set default 'needs_review'")
  })

  it('stamps every transition into verified, including re-verification', () => {
    expect(hardening).toContain('stamp_intel_event_verification')
    expect(hardening).toContain("new.review_status = 'verified'")
    expect(hardening).toContain("old.review_status is distinct from 'verified'")
    expect(hardening).toContain('new.last_verified_at is not distinct from old.last_verified_at')
    expect(hardening).toContain('new.last_verified_at := now()')
    expect(hardening).toContain("review_status <> 'verified' or last_verified_at is not null")
  })

  it('preserves evidence relationships, including event-level contradictions, and canonical ownership for suppressed rows', () => {
    expect(hardening).toContain("case when ea.role = 'contradicting' then 'contradicts' else ae.relationship end")
    expect(hardening).toContain("where e.review_status in ('migrated_reviewed','verified')")
    expect(hardening).toContain("and e.consolidation_status <> 'superseded'")
    expect(hardening).toContain('create or replace view public.intel_event_route_map')
    expect(hardening).toContain('where ia.source_signal_id is not null')
    expect(dossierLoader).toContain('Canonical ownership exists but the allowlisted dossier did not return a row')
    expect(dossierLoader).toContain('The cluster representative owns a canonical event')
    expect(dossierLoader).toContain('return null')
  })

  it('derives dossier trust from the least-reviewed event, assessment, and recommendation layer', () => {
    expect(hardening).toContain("e.review_status = 'needs_review' or a.review_status = 'needs_review' or r.review_status = 'needs_review'")
    expect(hardening).toContain("e.review_status = 'migrated_reviewed' or a.review_status = 'migrated_reviewed' or r.review_status = 'migrated_reviewed'")
    expect(hardening).toContain("e.review_status = 'verified' and a.review_status = 'verified' and r.review_status = 'verified'")
  })

  it('preserves native reviewed-signal ids and resolves regulatory mirror ids server-side and in legacy fallback', () => {
    expect(dashboardMapper).toContain('decisionIntelEventId: `event:${s.id}`')
    expect(dashboardMapper).not.toContain('`event:rs-${s.id}`')
    expect(hardening).toContain("m.signal_id = 'rs-' || p_signal_id")
    expect(dossierLoader).toContain("[signalId, `rs-${signalId}`]")
    expect(dossierLoader).toContain('loadLegacyPublicSignal')
  })

  it('repairs and consumes canonical jurisdiction crossrefs without fabricating identity', () => {
    expect(hardening).toContain("to_regclass('public.countries')")
    expect(hardening).toContain('upper(j.iso_alpha3) = upper(c.iso_alpha3)')
    expect(hardening).toContain('xref.countries_iso2 = c.iso_alpha2')
    expect(hardening).toContain('set jurisdictions_id = j.jurisdiction_id')
    expect(hardening).toContain("column_name = 'country_iso2'")
    expect(hardening).toContain('join public.jurisdiction_crossref xref')
    expect(hardening).toContain("upper(xref.canonical_iso2) = upper(nullif(s.country_iso2, ''))")
    expect(hardening).toContain('j.jurisdiction_id = xref.jurisdictions_id')
    expect(hardening).toContain('count(distinct a.jurisdiction_id) = 1')
    expect(reviewFixWorkflow).toContain("insert into public.countries (country_name,iso_alpha2,iso_alpha3)")
    expect(reviewFixWorkflow).toContain("('CA','CA','Canada')")
    expect(reviewFixWorkflow).toContain('crossref repair missing')
  })

  it('uses only api.signals-compatible columns for the legacy public signal fallback', () => {
    const fallbackSelect = dossierLoader.match(/\.from\('signals'\)[\s\S]*?\.select\('([^']+)'\)/)?.[1] ?? ''
    expect(fallbackSelect).not.toContain('analysis')
    expect(fallbackSelect).not.toContain('snapshot_id')
    expect(fallbackSelect).toContain('cluster_rep_id')
    expect(dossierLoader).toContain('loadIaFallback')
  })

  it('passes the signals entitlement through desktop and mobile dossier entry points', () => {
    expect(dashboardPage).toContain("checkFeatureAccess({ app_metadata: userAppMetadata }, 'signals')")
    expect(dashboardPage).toContain('decisionIntelAccess={decisionIntelAccess}')
    expect(responsiveShell).toContain('access={decisionIntelAccess}')
    expect(responsiveShell).toContain('decisionIntelAccess={decisionIntelAccess}')
    expect(mobileShell).toContain('access={props.decisionIntelAccess}')
    expect(intelUi).toContain("const canOpenDossiers = access?.granted === true")
    expect(intelUi).toContain("'/account/upgrade'")
    expect(desktopBridge).toContain("'/account/upgrade'")
  })

  it('keeps editorial, digest, story and research rows out of synthetic dossier routes while preserving eligible digest routes', () => {
    expect(intelUi).toContain("const isEditorial = signal.contentType === 'editorial'")
    expect(intelUi).toContain("const isPublishedDigest = signal.sourceLabel === 'Harbourview Daily'")
    expect(intelUi).toContain("signal.signalContentType === 'story' || signal.signalContentType === 'research'")
    expect(intelUi).toContain('const canSynthesizeLegacyRoute = !isEditorial && !isPublishedDigest && !isLegacyStory')
    expect(intelUi).toContain("signal.decisionIntelEventId ?? (canSynthesizeLegacyRoute && signal.id ? `event:${signal.id}` : undefined)")
    expect(dashboardServerData).toContain('digestDossierEligibleIds')
    expect(dashboardServerData).toContain("!['story','research','noise'].includes(contentType)")
    expect(dashboardServerData).toContain("decisionIntelEventId: h.signal_id && digestDossierEligibleIds.has(h.signal_id) ? `event:${h.signal_id}` : undefined")
    expect(desktopBridge).toContain('function canRouteToDossier')
    expect(desktopBridge).toContain("signal.signalContentType === 'story' || signal.signalContentType === 'research'")
    expect(desktopBridge).toContain('signals.filter(canRouteToDossier)')
    expect(intelUi).toContain('href={signal.sourceUrl}')
    expect(intelUi).toContain('Open source →')
  })

  it('defines the updated-at prerequisite in every production-shaped Stage 0 fixture', () => {
    const prerequisite = 'create function public.set_updated_at() returns trigger'
    expect(firstSliceWorkflow).toContain(prerequisite)
    expect(reviewFixWorkflow).toContain(prerequisite)
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
