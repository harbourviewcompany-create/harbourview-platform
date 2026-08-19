# Clinical Evidence — Production Readiness Checklist

Use this before any production push that touches clinical surfaces.

## Governance (hard blockers)

- [ ] Named primary clinical reviewer (D4) appointed and recorded in FLAGSHIP_ENHANCEMENT_SPEC or HANDOFF
- [ ] Backup clinical reviewer identified
- [ ] No clinical-synthesis record marked `published` without approved provenance plus a current credential-bound clinician/pharmacist review
- [ ] All marketing / empty-state copy remains cannabinoid-scope-honest

## Data & schema

- [ ] Migration `20260818224000_clinical_evidence_spine_reconcile.sql` applied to production Supabase
- [ ] Migration preserves all pre-existing Clinical evidence rows
- [ ] Existing graded/claim-bearing rows without credential-bound approval are `publication_scope = 'clinical-synthesis'` and `review_status = 'under-review'`
- [ ] RLS policies verified: published evidence readable by authenticated users only; under-review hidden; anon has no evidence-table SELECT
- [ ] `clinical_view_audit` restricted to own rows
- [ ] Currentness change events accept `currentness_lock` and `source_currentness_check`
- [ ] At least the Wave-1 records have complete record-specific primary-source and review provenance before publication

## Query & API

- [ ] `productionQuery.ts` (or equivalent) wired as the primary search path
- [ ] Live query uses canonical production fields: `condition_label`, `cannabinoids`, `jurisdictions`
- [ ] Fixture fallback only activates when live spine is unreachable; a successful live zero-result response remains authoritative
- [ ] Search never returns `review_status = 'under-review'`
- [ ] Jurisdiction filter works; no Canada content appears for DE/AU/GB when those countries are selected

## Authority & pathways

- [ ] Tier-1 authority packs (CA/DE/AU/GB) live and complete
- [ ] Switching Command country updates authority panel immediately
- [ ] Missing authority country shows limited-coverage state (never falls back)

## Safety surfaces

- [ ] Dosing calculator remains behind `requireVerifiedClinician`
- [ ] Hard ceiling (15 mg/kg/day) still enforced server-side
- [ ] Algorithm version persisted on every calculation
- [ ] Interaction surface (when enabled) shows certainty + primary source + uncertainty

## UX & states

- [ ] All ClinicalEvidenceState values render correctly (loaded, empty, no-evidence, no-match, stale, conflicted, degraded-source, permission, error)
- [ ] Primary source links + verifiedAt visible on every detail view
- [ ] Mobile evidence-first surface matches desktop state machine

## Observability & ops

- [ ] Freshness queue receives rows from link/currentness checks
- [ ] Ops metrics (published count, under-review, stale, conflicts, oldest/newest verified) visible to internal staff
- [ ] View audit writes succeed for verified clinicians

## Final smoke (production)

- [ ] Authenticated search for “Dravet” returns a graded record only after credential-bound publication review is complete
- [ ] Authenticated search for a non-cannabinoid primary-care condition → honest no-match / out-of-scope
- [ ] Anonymous / public Clinical surface shows marketing teaser only
- [ ] Verified clinician can open dosing calculator; unverified cannot
- [ ] Authority panel for DE shows German authorities only

Only after every box above is checked should the surface be considered production-ready for clinician use.
