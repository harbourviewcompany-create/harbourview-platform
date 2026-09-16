import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const migration = readFileSync('supabase/migrations/20260911225008_decision_intel_stage0_first_slice.sql', 'utf8')
const hardening = readFileSync('supabase/migrations/20260911225106_decision_intel_stage0_review_fixes.sql', 'utf8')
const completion = readFileSync('supabase/migrations/20260911225151_decision_intel_stage0_completion_hardening.sql', 'utf8')
const firstSliceWorkflow = readFileSync('.github/workflows/decision-intel-first-slice-verify.yml', 'utf8')
const reviewFixWorkflow = readFileSync('.github/workflows/decision-intel-stage0-review-fixes-verify.yml', 'utf8')
const completionWorkflow = readFileSync('.github/workflows/decision-intel-completion-hardening-verify.yml', 'utf8')
const dossierLoader = readFileSync('lib/intelligence-os/decisionDossier.ts', 'utf8')
const dashboardMapper = readFileSync('lib/dashboard/mapPublicToDashboardSignal.ts', 'utf8')
const dashboardServerData = readFileSync('lib/dashboard/dashboardServerData.ts', 'utf8')
const dashboardRoutes = readFileSync('lib/intelligence-os/dashboardRoutes.ts', 'utf8')
const tierResolver = readFileSync('lib/stripe/tier.ts', 'utf8')
const dashboardPage = readFileSync('app/dashboard/page.tsx', 'utf8')
const dossierPage = readFileSync('app/dashboard/intel/events/[id]/page.tsx', 'utf8')
const intelUi = readFileSync('components/dashboard/mobile-command/sections/DecisionSignalsSection.tsx', 'utf8')
const desktopBridge = readFileSync('components/dashboard/DesktopDecisionIntelBridge.tsx', 'utf8')
const controlDoc = readFileSync('docs/control/INTEL_DECISION_OS_EXISTING_TARGET.md', 'utf8')
const databaseControl = readFileSync('docs/control/DATABASE_CONTROL.md', 'utf8')

describe('Decision Intelligence Stage 0 first slice', () => {
  it('uses the current migration identities and never resurrects retired filenames', () => {
    for (const source of [migration, hardening, completion, firstSliceWorkflow, reviewFixWorkflow, completionWorkflow]) {
      expect(source).not.toContain('20260808190000_decision_intel_stage0_first_slice.sql')
      expect(source).not.toContain('20260808203000_decision_intel_stage0_review_fixes.sql')
      expect(source).not.toContain('20260810202000_decision_intel_stage0_completion_hardening.sql')
    }
    expect(firstSliceWorkflow).toContain('20260911225008_decision_intel_stage0_first_slice.sql')
    expect(firstSliceWorkflow).toContain('20260911225106_decision_intel_stage0_review_fixes.sql')
    expect(firstSliceWorkflow).toContain('20260911225151_decision_intel_stage0_completion_hardening.sql')
  })

  it('keeps the existing acquisition estate upstream and builds only the first-slice chain', () => {
    expect(controlDoc).toContain('`public.source_registry`')
    expect(controlDoc).toContain('Existing `public.signals` and Pipeline B remain upstream')
    expect(migration).toContain('from public.signals s')
    expect(migration).toContain('coalesce(nullif(s.cluster_rep_id')
    for (const table of ['intel_evidence_refs','intel_assertions','intel_assertion_evidence','intel_events','intel_event_assertions','intel_assessments','intel_assessment_versions','intel_recommendations']) {
      expect(migration).toContain(`public.${table}`)
    }
    for (const source of [hardening, completion]) {
      expect(source).not.toContain('intel_hypotheses')
      expect(source).not.toContain('intel_scenarios')
      expect(source).not.toContain('intel_market_access')
    }
  })

  it('preserves exact lineage while allowing one snapshot to support multiple signals', () => {
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

  it('does not promote migrated review into verified intelligence', () => {
    expect(migration).toContain("'migrated_reviewed'")
    expect(migration).toContain("'needs_review'")
    expect(dossierLoader).not.toContain("reviewStatus: 'verified'")
    expect(dossierLoader).toContain('lastVerifiedAt: null')
  })

  it('keeps customer reads behind gated RPCs and preserves controlled staff DML', () => {
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
    expect(databaseControl).toContain('api.get_intel_event_dossier')
    expect(controlDoc).toContain('tier-gated `SECURITY DEFINER` RPCs')
  })

  it('separates verification from customer publication and requires accepted factual assertions', () => {
    expect(completion).toContain("customer_visibility text not null default 'internal'")
    expect(completion).toContain("customer_visibility in ('internal','intel')")
    expect(completion).toContain('public.intel_customer_event_dossiers')
    expect(completion).toContain("where e.customer_visibility = 'intel'")
    expect(completion).toContain("ia.review_status in ('migrated_reviewed','verified')")
    expect(controlDoc).toContain('Verification and publication are separate controls.')
    expect(completionWorkflow).toContain('verified internal dossier leaked to customer projection')
  })

  it('makes assessment history append-only and trigger-controlled', () => {
    expect(hardening).toContain('intel_assessment_versions is append-only')
    expect(hardening).toContain('before update or delete on public.intel_assessment_versions')
    expect(hardening).toContain('append_intel_assessment_version_on_write')
    expect(hardening).toContain('after insert or update on public.intel_assessments')
    expect(hardening).toContain('prevent_intel_canonical_delete')
    expect(completion).toContain('create or replace function public.append_intel_assessment_version_on_write()')
    expect(completion).toContain('revoke insert, update, delete on public.intel_assessment_versions from authenticated')
    for (const field of ['regulatory_implications','affected_products','contradictions']) {
      expect(completion).toContain(`'${field}'`)
      expect(completionWorkflow).toContain(`v1 missing ${field}`)
    }
  })

  it('stamps every transition into verified, including re-verification', () => {
    expect(hardening).toContain('stamp_intel_event_verification')
    expect(hardening).toContain("new.review_status = 'verified'")
    expect(hardening).toContain("old.review_status is distinct from 'verified'")
    expect(hardening).toContain('new.last_verified_at is not distinct from old.last_verified_at')
    expect(hardening).toContain('new.last_verified_at := now()')
    expect(hardening).toContain("review_status <> 'verified' or last_verified_at is not null")
  })

  it('propagates upstream withdrawal into a non-customer-visible canonical chain', () => {
    expect(completion).toContain('suppress_intel_chain_for_withdrawn_signal')
    expect(completion).toContain("after update of reviewed, action, quality_label, content_type on public.signals")
    expect(completion).toContain('after delete on public.signals')
    expect(completion).toContain("set review_status = 'needs_review'")
    expect(completion).toContain("customer_visibility = 'internal'")
    expect(completionWorkflow).toContain('withdrawn dossier still customer-visible')
    expect(completionWorkflow).toContain('withdrawal destroyed canonical ownership')
  })

  it('derives dossier trust from the least-reviewed canonical layer', () => {
    expect(hardening).toContain("e.review_status = 'needs_review' or a.review_status = 'needs_review' or r.review_status = 'needs_review'")
    expect(hardening).toContain("e.review_status = 'migrated_reviewed' or a.review_status = 'migrated_reviewed' or r.review_status = 'migrated_reviewed'")
    expect(hardening).toContain("e.review_status = 'verified' and a.review_status = 'verified' and r.review_status = 'verified'")
  })

  it('preserves native signal identity and server-side regulatory mirror resolution', () => {
    expect(dashboardMapper).toContain('decisionIntelEventId: `event:${s.id}`')
    expect(dashboardMapper).not.toContain('`event:rs-${s.id}`')
    expect(hardening).toContain("m.signal_id = 'rs-' || p_signal_id")
    expect(dossierLoader).toContain("[signalId, `rs-${signalId}`]")
    expect(dossierLoader).toContain('loadLegacyPublicSignal')
  })

  it('repairs and consumes jurisdiction crossrefs without fabricating identity', () => {
    expect(hardening).toContain("to_regclass('public.countries')")
    expect(hardening).toContain('upper(j.iso_alpha3) = upper(c.iso_alpha3)')
    expect(hardening).toContain('xref.countries_iso2 = c.iso_alpha2')
    expect(hardening).toContain('set jurisdictions_id = j.jurisdiction_id')
    expect(hardening).toContain('join public.jurisdiction_crossref xref')
    expect(hardening).toContain("upper(xref.canonical_iso2) = upper(nullif(s.country_iso2, ''))")
    expect(hardening).toContain('j.jurisdiction_id = xref.jurisdictions_id')
    expect(hardening).toContain('count(distinct a.jurisdiction_id) = 1')
    expect(reviewFixWorkflow).toContain('crossref repair missing')
  })

  it('keeps the legacy public signal fallback on supported columns', () => {
    const fallbackSelect = dossierLoader.match(/\.from\('signals'\)[\s\S]*?\.select\('([^']+)'\)/)?.[1] ?? ''
    expect(fallbackSelect).not.toContain('analysis')
    expect(fallbackSelect).not.toContain('snapshot_id')
    expect(fallbackSelect).toContain('cluster_rep_id')
    expect(dossierLoader).toContain('loadIaFallback')
  })

  it('uses user_profiles.tier as the Decision Intel entitlement authority', () => {
    expect(dashboardPage).toContain("import { getUserTier } from '@/lib/stripe/tier'")
    expect(dashboardPage).toContain('userTier = await getUserTier()')
    expect(dashboardPage).toContain("canAccess('signals', normalizeSubscriptionTier(userTier))")
    expect(tierResolver).toContain(".from('user_profiles')")
    expect(tierResolver).toContain(".select('tier')")
    expect(tierResolver).toContain(".eq('id', user.id)")
    expect(dashboardPage).toContain('decisionIntelAccess={decisionIntelAccess}')
    expect(dossierPage).toContain(".from('user_profiles')")
    expect(dossierPage).toContain("canAccess('signals', normalizeSubscriptionTier(profile?.tier))")
    expect(dossierPage).not.toContain("requireAuth('signals')")
    expect(intelUi).toContain('const canOpenDossiers = access?.granted === true')
    expect(intelUi).toContain("'/account/upgrade'")
    expect(desktopBridge).toContain("'/account/upgrade'")
  })

  it('keeps non-eligible story/research/editorial rows out of synthetic dossier routes', () => {
    expect(intelUi).toContain("const isEditorial = signal.contentType === 'editorial'")
    expect(intelUi).toContain("const isPublishedDigest = signal.sourceLabel === 'Harbourview Daily'")
    expect(intelUi).toContain("signal.signalContentType === 'story' || signal.signalContentType === 'research'")
    expect(intelUi).toContain('const canSynthesizeLegacyRoute = !isEditorial && !isPublishedDigest && !isLegacyStory')
    expect(dashboardServerData).toContain('digestDossierEligibleIds')
    expect(dashboardRoutes).toContain("signal.signalContentType === 'story' || signal.signalContentType === 'research'")
    expect(dashboardRoutes).toContain("if (signal.sourceLabel === 'Harbourview Daily') return Boolean(signal.decisionIntelEventId)")
    expect(desktopBridge).toContain('signals.filter(canRouteToDossier)')
    expect(intelUi).toContain('/dashboard/intel/events/')
    expect(intelUi).toContain('Open dossier →')
    expect(intelUi).not.toContain('href={signal.sourceUrl}')
  })
})
