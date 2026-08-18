# Clinical Evidence — Production Readiness Checklist

Use this before any production push that touches clinical surfaces.

## Governance (hard blockers)

- [ ] Named primary clinical reviewer (D4) appointed and recorded in FLAGSHIP_ENHANCEMENT_SPEC or HANDOFF
- [ ] Backup clinical reviewer identified
- [ ] No clinical-synthesis record marked `published` without reviewer sign-off
- [ ] All marketing / empty-state copy remains cannabinoid-scope-honest

## Data & schema

- [ ] Migration `20260818_clinical_evidence_spine.sql` applied to production Supabase
- [ ] RLS policies verified: published readable by authenticated; under-review hidden from clinicians
- [ ] `clinical_view_audit` restricted to own rows
- [ ] At least the Wave-1 records loaded with complete required fields

## Query & API

- [ ] `productionQuery.ts` (or equivalent) wired as the primary search path
- [ ] Fixture fallback only activates when live spine is unreachable
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

- [ ] Authenticated search for “Dravet” → loaded with graded record
- [ ] Authenticated search for a non-cannabinoid primary-care condition → honest no-match / out-of-scope
- [ ] Anonymous / public Clinical surface shows marketing teaser only
- [ ] Verified clinician can open dosing calculator; unverified cannot
- [ ] Authority panel for DE shows German authorities only

Only after every box above is checked should the surface be considered production-ready for clinician use.
