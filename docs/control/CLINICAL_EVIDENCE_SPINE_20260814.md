# Clinical evidence spine — 2026-08-14

Recheck baseline: `main` advanced to `04e306d520d69d746a5099bf778dc253296710a3`. The one main-only commit after PR #1415's original base changes source-discovery-engine country context and does not overlap the Clinical evidence files changed here. PR #1415 remains one commit behind main until it is rebased/merged; this document records the content reconciliation finding rather than claiming ancestry is current.

## P0 evidence spine implemented

### Canonical public evidence DTO

`lib/clinical/evidence.ts` defines `ClinicalEvidenceRecordDTO` with:

- condition + aliases;
- population;
- intervention and formulation;
- cannabinoid list;
- explicit intervention class separating `regulated-cannabinoid-drug`, `general-cannabis`, `cannabinoid-isolate`, `cannabis-derived-formulation`, `non-cannabis`, and `not-applicable`;
- comparator and outcome;
- evidence type;
- evidence strength/certainty plus grading method;
- uncertainty and conflict status;
- jurisdiction and profession relevance metadata;
- primary-source identity/URL;
- publication, effective and verification dates;
- current/superseded/partially-superseded state and successor reference;
- public review state.

It also defines `ClinicalEvidenceChangeEventDTO` and deterministic `loaded`, `empty`, `no-evidence`, `no-match`, `stale`, `conflicted`, and `error` evidence states.

### Storage

Migration `supabase/migrations/20260814121500_clinical_evidence_spine.sql` creates:

- `public.clinical_condition_terms`;
- `public.clinical_evidence_records`;
- `public.clinical_evidence_change_events`.

These tables are public reviewed evidence metadata only. They do not reference patient, marketplace, listing, cultivar, or genetics storage. Browser-facing roles have SELECT only through RLS where review state is published; service-role writes remain server-side. Change events have their own publication gate and cannot become public merely because they have no linked evidence record.

### Query contract

`public.search_clinical_evidence_records(query, jurisdiction, limit)` is SECURITY INVOKER and searches the complete published evidence set before limiting results. It covers condition/aliases, title/summary, population, intervention, formulation, cannabinoid, and outcome. `public.clinical_condition_term_known(query)` distinguishes a recognized condition with no reviewed evidence from a true no-match.

`lib/server/clinicalEvidenceQuery.ts` calls those RPCs through the anon public projection and loads published evidence-change events. Command role is deliberately not used as a query filter yet: `profession_relevance` remains metadata until the Command role taxonomy is explicitly reconciled with a sourced clinical profession vocabulary.

`GET /api/clinical/evidence` exposes the read-only query with bounded input validation and an explicit 503 error state.

### Mobile Command integration

`ClinicalEvidenceExplorer.tsx` is wired into the existing Clinical Command surface. It exposes:

- evidence state;
- deterministic condition/clinical-question search;
- recent evidence/regulatory changes;
- evidence records with evidence type, certainty, intervention class, uncertainty, verified date and primary-source link;
- accessible labelled search and live state announcement.

The existing What changed / What requires attention / What can I do next hierarchy and Command / Market / Intel / Actions global navigation remain intact.

## Authoritative Canadian seed/source map

The P0 seed is intentionally narrow. It contains current primary legal/regulatory/pharmacovigilance authority only and does not invent condition efficacy, drug interactions, product appropriateness or profession-specific authorization rules.

1. Justice Laws Website — Cannabis Regulations §272: federal health-care-practitioner authorization authority used in the Clinical source cards.
2. Justice Laws Website — Cannabis Regulations §273: federal medical-document contents/validity; represented as a published evidence record and evidence-change event.
3. Health Canada — Information for Health Care Practitioners: federal professional orientation and explicit reminder to consult applicable provincial/territorial professional authority; represented as regulatory guidance, ungraded.
4. Health Canada — Cannabis for medical purposes: current safety/interaction orientation; linked from the Clinical action surface but not converted into a fabricated interaction database.
5. Health Canada — Report a side effect to cannabis: Health care professionals: current pharmacovigilance reporting guidance; represented as regulatory guidance and linked from Clinical.

No condition-specific evidence records or condition taxonomy terms are seeded in this P0 because no reviewed repository-backed condition evidence dataset was verified. The resulting `no-match`/`no-evidence` behavior is intentional rather than synthetic content.

## Existing repository contracts preserved

- Existing authenticated Clinical APIs for clinician identity/verification, patients, consent, calculations, recommendations and prescriptions remain separate from this public evidence spine.
- Existing `clinical_education_modules` / `clinical_education_country_readiness` retain their own professional review and audience-boundary model.
- Existing `hv_evidence_documents` remains a general evidence/provenance foundation and is not repurposed as a clinical efficacy model.
- Marketplace product/listing projections and genetics/cultivar passports are not joined into the Clinical evidence tables or query.
- The repository's existing cannabinoid dosing calculator remains fail-closed unless its explicit clinical-review gate is approved.

## Next contracts defined but not falsely enabled

`lib/clinical/evidence.ts` defines type-level next contracts for:

- medication/cannabinoid interactions;
- province × profession authorization/documentation rules;
- monitoring/follow-up;
- pharmacovigilance capture.

They are definitions only. No UI claims a structured interaction checker, province-specific professional authority engine, patient monitoring engine, or Harbourview adverse-event reporting workflow exists until authoritative reviewed records and persistence/RLS contracts are added.

## Remaining gaps

### Remaining P0

- Apply/replay-test the new migration in an isolated Supabase environment; repository migration drift alone does not prove fresh replay.
- Populate a reviewed controlled condition vocabulary before `no-evidence` can be distinguished from `no-match` for real condition queries at scale.
- Ingest reviewed condition-level evidence records with explicit grading methodology; the current P0 seed is regulatory authority only.
- Reconcile Command role IDs to a sourced profession vocabulary before profession-specific filtering.
- Add exact authenticated visual evidence for the Clinical surface at 375×812, 390×844 and 430×932 against a fixture that contains the evidence tables.

### P1

- Reviewed medication/cannabinoid interaction knowledge base and change history.
- Province/territory × profession authorization/documentation authority records.
- Structured safety assessment.
- Monitoring/outcomes workflow.
- Structured pharmacovigilance capture/reporting workflow.
- Contextual wiring of reviewed clinical-education modules.
- Clinical evidence ingestion/review/admin workflow and source-snapshot lineage.

### P2

- Comparative evidence synthesis by condition/population/formulation/route.
- Evidence watchlists and professional alerts.
- Guideline/trial/pharmacovigilance convergence.
- Cross-jurisdiction professional-rule comparisons with supersession history.
- Audit-ready evidence packets and governed interoperability/export.

## Verification gate

GO for the evidence-spine PR requires exact-head typecheck, focused Clinical tests, security/leakage checks, migration controls, production build, and authenticated screenshots at 375×812, 390×844 and 430×932. Until all are present, release status is HOLD even if individual checks are green.
