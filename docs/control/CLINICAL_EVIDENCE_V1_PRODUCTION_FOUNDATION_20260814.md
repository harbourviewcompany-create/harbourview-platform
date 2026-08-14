# Clinical Evidence V1 Production Foundation — 2026-08-14

## Scope

This tranche hardens the Clinical Evidence V1 architecture. It does not activate medication/cannabinoid interaction advice, dosing advice, province/profession authorization rules, patient-specific recommendations, or unreviewed clinical efficacy synthesis.

## Public evidence boundary

Public Clinical evidence remains a reviewed projection. Browser-facing users can read published evidence records, published controlled condition terms, safe published condition/evidence and outcome relationships, grading-method metadata, and published change events. Private normalized sources, source snapshots, extraction provenance, reviewer credentials, review decisions, grading assessments, contradiction work and publication history remain behind review-role/service-role controls.

## Reviewer authority

Qualified clinical or methodology approval is no longer satisfied by a declared `reviewer_type`. An approved clinical/methodology review must bind the reviewer user identity to a currently verified `clinical_reviewer_credentials` record for the matching clinician/pharmacist profession. Clinical-synthesis or graded publication requires that credential-bound approved review.

Credential verification is its own governed state (`pending`, `verified`, `expired`, `revoked`, `rejected`). This migration defines the contract; it does not claim that Harbourview currently operates an external licence-verification service.

## Evidence snapshots and extraction

`clinical_evidence_source_snapshots` is append-only. Each snapshot declares whether its SHA-256 covers source bytes or a canonical normalized reviewed extract. Verified structured extractions are also immutable; a later correction is represented by a new extraction rather than mutation of the reviewed record.

Structured extraction supports population, intervention/exposure, comparator, outcomes, study design, sample size, follow-up, effect estimates, uncertainty, limitations and a precise source locator.

## Outcome graph

`clinical_evidence_outcome_links` moves the durable relationship model beyond condition→record. It can bind condition, intervention/formulation, population/context and a named outcome to a reviewed evidence record/source snapshot.

`direction=not-assessed` is a first-class value. This is critical for regulatory/product-monograph metadata where Harbourview has verified an authorized indication but has not produced a reviewed efficacy synthesis.

## Evidence grading

`clinical_evidence_grade_assessments` records the reproducible assessment domains behind any future certainty grade: starting certainty, risk of bias, inconsistency, indirectness, imprecision, publication bias, upgrade factors, downgrade rationale and final certainty. The assessment must be bound to an approved credentialed review for the same evidence record.

No new clinical efficacy grade is assigned by this tranche.

## Contradiction and supersession

The contradiction workbench now records claim/outcome scope, partial-supersession scope, public impact and the review that resolved/contextualized the conflict. Resolved/contextualized/superseded conflict states require an approved review.

Source currentness changes fail closed. A primary source changing to `superseded`, `withdrawn` or `unknown` marks dependent evidence `review-required` or `source-degraded`, removes an existing published record from the current public projection by returning it to review, and retains its history.

## Publication history

`clinical_evidence_publication_versions` stores append-only snapshots of the public evidence projection. Updates/depublication/supersession/staleness append a version; existing publication-version rows cannot be updated or deleted.

## SATIVEX current-source reconciliation

The current reviewed source is the Canadian SATIVEX Product Monograph revision dated 2024-12-17, Submission Control No. 291740, at `https://pdf.hres.ca/dpd_pm/00078089.PDF`.

The reviewed source location for the authorized indication is PDF page 3, section `1 INDICATIONS`. The normalized reviewed extract states that SATIVEX is indicated as adjunctive treatment for symptomatic relief of spasticity in patients with multiple sclerosis who have not responded adequately to other therapy and who demonstrate meaningful improvement during an initial trial.

The snapshot key is `ca-sativex-pm-2024-12-17-indications-extract-v1`. Its SHA-256 is `fe36495ec4adf482f95e0a72fa22a651e19599bc8414d34b22cc848248e731ae` with `hash_scope=normalized-reviewed-extract`. This is explicitly not represented as a hash of the source PDF bytes.

The SATIVEX evidence record is republished only as current Canadian authorized-indication metadata. It remains:

- `regulated-cannabinoid-drug`
- `product-monograph`
- `ungraded`
- `source-metadata`
- outcome relationship `authorized-indication`
- outcome direction `not-assessed`

It does not assert comparative efficacy, independent treatment recommendation, dosing advice, or applicability to general cannabis, marketplace products or genetics/cultivars.

## Corpus coverage ledger

### Published condition-level regulated-drug source metadata

- EPIDIOLEX — Lennox-Gastaut syndrome.
- EPIDIOLEX — Dravet syndrome.
- EPIDIOLEX — tuberous sclerosis complex.
- SATIVEX — multiple-sclerosis spasticity, current 2024-12-17 product-monograph provenance.

### Published non-condition federal/regulatory/pharmacovigilance records

The pre-existing Clinical P0 spine retains current Canadian federal regulatory/professional/pharmacovigilance source records. They are source authority records, not condition efficacy conclusions.

### Private under-review synthesis sources

- PMID 36417631 — cannabidiol for LGS/Dravet/TSC; no public Harbourview clinical grade/synthesis.
- PMID 39502271 — cannabinoids for multiple-sclerosis spasticity; no public Harbourview clinical grade/synthesis.

### Explicitly not covered as production evidence yet

- comprehensive condition universe;
- medication/cannabinoid interaction corpus;
- province/territory × profession authorization rules;
- reviewed dosing/titration corpus;
- patient-specific recommendations;
- structured monitoring/follow-up evidence;
- operational pharmacovigilance intake;
- qualified clinical review of the staged systematic reviews.

Absence from this corpus must be represented as missing/unreviewed coverage, not negative clinical evidence.

## Operational metrics

The private `clinical_evidence_corpus_metrics()` contract reports published conditions/records, records under review, stale/review-required/degraded records, unresolved high-materiality conflicts, ungraded published records, current sources lacking snapshots and oldest/newest evidence verification timestamps.

## Release boundary

This change does not merge PR #1415, deploy the application, or apply any production database migration. Production activation requires exact-final-head migration replay, RLS/leakage verification, Clinical lifecycle/grading/supersession tests, typecheck/build/CI, authenticated mobile evidence for all required evidence states, and reconciliation of any legitimate review feedback.
